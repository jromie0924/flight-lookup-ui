#!/usr/bin/env bash
# Build the site and push it to the CloudFormation-managed S3 bucket,
# then invalidate the index/HTML at the CloudFront edge.
#
# Usage: STACK_NAME=flight-lookup-ui ./infra/deploy.sh
#
# Required env / defaults:
#   STACK_NAME   CloudFormation stack name (default: flight-lookup-ui)
#   AWS_REGION   Region the stack is deployed in (default: us-east-1)
#   AWS_PROFILE  Optional named profile passed through to the AWS CLI.

set -euo pipefail

STACK_NAME="${STACK_NAME:-flight-lookup-ui}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Resolve repo root so this works whether you run it from infra/ or the root.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

echo "==> Fetching API key from SSM (/plane-tracker/api/key in us-east-2)"
export VITE_API_KEY="$(
  aws ssm get-parameter \
    --region us-east-2 \
    --name /plane-tracker/api/key \
    --with-decryption \
    --query Parameter.Value \
    --output text
)"

echo "==> Building site"
npm run build

echo "==> Looking up stack outputs (${STACK_NAME} in ${AWS_REGION})"
read -r BUCKET DIST_ID < <(
  aws cloudformation describe-stacks \
    --region "${AWS_REGION}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='BucketName' || OutputKey=='DistributionId'].[OutputKey,OutputValue]" \
    --output text \
  | sort \
  | awk '{print $2}' \
  | paste -sd ' ' -
)

if [[ -z "${BUCKET:-}" || -z "${DIST_ID:-}" ]]; then
  echo "Could not read BucketName / DistributionId from stack outputs." >&2
  exit 1
fi

echo "    bucket=${BUCKET}"
echo "    distribution=${DIST_ID}"

# Hashed assets are immutable — push them first with a year-long cache header.
# `--delete` is applied on the second sync so the assets aren't briefly missing.
echo "==> Uploading hashed assets (long cache)"
aws s3 sync dist/ "s3://${BUCKET}/" \
  --region "${AWS_REGION}" \
  --exclude "*" \
  --include "assets/*" \
  --cache-control "public, max-age=31536000, immutable" \
  --only-show-errors

echo "==> Uploading HTML / manifest / SW (short cache) and pruning stale files"
aws s3 sync dist/ "s3://${BUCKET}/" \
  --region "${AWS_REGION}" \
  --exclude "assets/*" \
  --cache-control "public, max-age=60, must-revalidate" \
  --delete \
  --only-show-errors

echo "==> Invalidating CloudFront cache for HTML entrypoints"
aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths "/" "/index.html" "/manifest.webmanifest" "/sw.js" "/registerSW.js" \
  --output text >/dev/null

echo "==> Done."
