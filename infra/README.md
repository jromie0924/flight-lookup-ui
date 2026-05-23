# Infra — AWS static hosting for flight-lookup-ui

CloudFormation stack: private S3 bucket + CloudFront (OAC) + ACM cert, fronting
the Vite build at `https://flightlookup.tolfman.com`.

DNS stays on **NameCheap** — you add two CNAME records there by hand. Nothing
else in this stack needs Route 53.

## What it costs

Effectively **$0/month** at the expected ~few-thousand-requests/month scale:

| Resource | Cost |
| --- | --- |
| S3 storage of `dist/` (a few hundred KB) | fractions of a cent |
| CloudFront (1 TB/mo + 10M req/mo permanent free tier) | $0 |
| ACM public cert (DNS-validated, auto-renews) | $0 |
| Route 53 hosted zone | **not used** (DNS stays at NameCheap) |

## Files

- `template.yaml` — the CloudFormation stack.
- `deploy.sh` — `npm run build`, sync to S3, invalidate CloudFront.

## One-time setup

You only do these steps once. The stack name `flight-lookup-ui` is used below;
override with `STACK_NAME=...` if you want something different.

### 1. Deploy the stack (us-east-1)

CloudFront requires the cert in `us-east-1`, so deploy the whole stack there:

```sh
aws cloudformation deploy \
  --region us-east-1 \
  --stack-name flight-lookup-ui \
  --template-file infra/template.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides DomainName=flightlookup.tolfman.com
```

The deploy will **pause** at the ACM certificate resource — it sits in
`CREATE_IN_PROGRESS` waiting for DNS validation. That's normal; go to step 2 in
another terminal/browser tab.

### 2. Add the ACM validation CNAME at NameCheap

1. Open the ACM console in **us-east-1** → pick the pending certificate.
2. Copy the one CNAME record it shows (a long random-looking `Name` and
   `Value`).
3. In NameCheap → Domain List → `tolfman.com` → **Advanced DNS** → add a new
   record:
   - Type: `CNAME Record`
   - Host: the `Name` from ACM, **with the `.tolfman.com.` part stripped off**
     (NameCheap appends the domain itself)
   - Value: the `Value` from ACM (keep the trailing `.`)
   - TTL: Automatic
4. Wait a few minutes. ACM picks it up, marks the cert `Issued`, and the
   CloudFormation deploy resumes on its own.

> Leave that CNAME in place forever. ACM uses it to auto-renew the cert.

### 3. Point the app subdomain at CloudFront

Once the stack finishes, grab the CloudFront domain it printed:

```sh
aws cloudformation describe-stacks \
  --region us-east-1 \
  --stack-name flight-lookup-ui \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue" \
  --output text
# -> dabc123xyz.cloudfront.net
```

Add one more CNAME on NameCheap:

- Type: `CNAME Record`
- Host: `flightlookup`
- Value: `dabc123xyz.cloudfront.net` (whatever the command above printed)
- TTL: Automatic

DNS propagates in a minute or two, and `https://flightlookup.tolfman.com` will
serve the (still empty) bucket.

## Every deploy after that

```sh
./infra/deploy.sh
```

It builds, syncs `dist/` to S3 with sensible cache headers (long TTL for the
content-hashed files in `assets/`, short TTL for `index.html` and the PWA
files), and invalidates `index.html` / `sw.js` / friends at the CloudFront
edge so a refresh sees the new build within seconds.

Set `STACK_NAME` / `AWS_REGION` / `AWS_PROFILE` env vars if you used non-default
values for any of them.

## Build-time config

Before the first deploy, set the env file the Vite build reads:

```sh
cp .env.example .env
# edit .env and set VITE_API_BASE_URL (and VITE_API_KEY once the backend has
# auth — see ../flight-lookup-ui-guidelines.md §6)
```

These are baked into the bundle at build time, so changing them means
re-running `./infra/deploy.sh`.

## Tearing it down

```sh
# Empty the bucket first — CloudFormation won't delete a non-empty bucket,
# and the bucket has DeletionPolicy: Retain anyway.
aws s3 rm s3://<bucket-name> --recursive

aws cloudformation delete-stack \
  --region us-east-1 \
  --stack-name flight-lookup-ui
```

The bucket itself is retained on stack deletion (so an accidental
`delete-stack` can't nuke your hosted files). Delete it manually when you're
sure.
