/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the flight-query API, e.g. https://api.example.com */
  readonly VITE_API_BASE_URL?: string;
  /** Optional API key sent as the `x-api-key` header. */
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
