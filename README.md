# Parslee Admin Dashboard

Internal admin dashboard for managing Parslee organizations, subscriptions, rate plans, billing, and entitlements.

## Local Development

```bash
npm install
npm run dev       # Starts Vite dev server on http://localhost:3000
```

The dev server proxies `/api` requests to `http://localhost:6789` (m365dotnet API). Override with `VITE_API_TARGET` env var.

## Production Build

```bash
npm run build     # Outputs static files to dist/
npm run preview   # Preview production build locally
```

## Docker

```bash
docker build -t admin-dashboard .
docker run -p 8080:80 admin-dashboard
# Visit http://localhost:8080
```

## Deployment

Automated via GitHub Actions on push to `main`. Builds Docker image, pushes to Azure ACR, and deploys to Azure Container Apps.

## Infrastructure

Azure resources are defined in `infra/main.bicep`. Provision with:

```bash
az deployment group create \
  --resource-group parslee-aie-prod-eastus2 \
  --template-file infra/main.bicep
```
