import type { FlightRecord } from '../types/flight';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '';
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * Base for API requests. In dev, requests route through the Vite proxy
 * (`/api`, configured in vite.config.ts) so the browser makes a same-origin
 * request — this sidesteps the backend's missing CORS headers (guidelines
 * section 6). A production build calls the API directly and still needs the
 * backend CORS fix to land.
 */
const API_BASE_URL =
  import.meta.env.DEV && RAW_API_BASE_URL ? '/api' : RAW_API_BASE_URL;

export interface FlightQuery {
  /** Aircraft callsign to search for. */
  callsign: string;
  /**
   * Optional local timestamp (`YYYY-MM-DDThh:mm`). The backend centers a
   * +/-15 min window on it. Without it, the API returns up to 50 recent rows
   * for the callsign.
   */
  timestamp?: string;
}

/** Error type carrying an HTTP status when the failure came from the API. */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Calls `GET /flights` on the flight-query API and returns the matching rows.
 *
 * The backend is read-only and constrained to callsign lookups (guidelines
 * sections 5-6). Pass `signal` to cancel an in-flight request.
 */
export async function fetchFlights(
  query: FlightQuery,
  signal?: AbortSignal,
): Promise<FlightRecord[]> {
  if (!API_BASE_URL) {
    throw new ApiError(
      'API URL is not configured. Copy .env.example to .env and set VITE_API_BASE_URL.',
    );
  }

  const url = new URL(`${API_BASE_URL}/flights`, window.location.origin);
  url.searchParams.set('callsign', query.callsign);
  if (query.timestamp) {
    url.searchParams.set('timestamp', query.timestamp);
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) {
    // API Gateway API keys use the `x-api-key` header. If the backend lands on
    // a shared bearer token instead, change this to:
    //   headers.Authorization = `Bearer ${API_KEY}`;
    headers['x-api-key'] = API_KEY;
  }

  let response: Response;
  try {
    response = await fetch(url, { headers, signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(
      'Could not reach the flight API. It may be offline, or the request ' +
        'was blocked by CORS — check the browser console for details.',
    );
  }

  if (!response.ok) {
    throw new ApiError(messageForStatus(response.status), response.status);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('The flight API returned an unexpected response.');
  }

  return extractFlights(data);
}

function messageForStatus(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return 'Not authorized - check the API key in your .env file.';
    case 404:
      return 'Flight endpoint not found - check VITE_API_BASE_URL.';
    case 429:
      return 'Too many requests. Wait a moment and try again.';
    default:
      return status >= 500
        ? 'The flight API had a server error. Try again shortly.'
        : `Request failed (HTTP ${status}).`;
  }
}

/**
 * The API may return a bare array or wrap the rows under a key. Accept the
 * common shapes so the UI does not break on a minor backend response change.
 */
function extractFlights(data: unknown): FlightRecord[] {
  if (Array.isArray(data)) return data as FlightRecord[];
  if (data && typeof data === 'object') {
    for (const key of ['flights', 'items', 'Items', 'data', 'results']) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value as FlightRecord[];
    }
  }
  return [];
}
