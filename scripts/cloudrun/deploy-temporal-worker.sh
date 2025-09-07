#!/usr/bin/env bash
set -euo pipefail

# Deploys the Temporal worker to Cloud Run using the correct Dockerfile and context.
#
# Required env vars:
# - GCP_PROJECT_ID
# - REGION (e.g., us-east4)
# - TEMPORAL_ADDRESS (e.g., host:7233)
# - TEMPORAL_NAMESPACE (default)
# - TEMPORAL_TLS (true|false)
# Optional:
# - SERVICE_NAME (defaults to temporal-worker)

SERVICE_NAME=${SERVICE_NAME:-temporal-worker}
IMAGE="gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME}:$(date +%Y%m%d-%H%M%S)"

echo "Building image with Dockerfile temporal/worker.Dockerfile..."
gcloud builds submit --project "${GCP_PROJECT_ID}" \
  --tag "${IMAGE}" \
  --gcs-log-dir="gs://artifacts-${GCP_PROJECT_ID}/cloud-build-logs" \
  --file temporal/worker.Dockerfile .

echo "Deploying to Cloud Run service ${SERVICE_NAME} in ${REGION}..."
gcloud run deploy "${SERVICE_NAME}" \
  --project "${GCP_PROJECT_ID}" \
  --region "${REGION}" \
  --image "${IMAGE}" \
  --platform managed \
  --cpu 1 \
  --memory 1Gi \
  --max-instances 3 \
  --no-allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS},TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE},TEMPORAL_TLS=${TEMPORAL_TLS}"

echo "Done. View service details:"
gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --project "${GCP_PROJECT_ID}" --format='value(status.url)'

