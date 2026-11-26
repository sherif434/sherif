# NOVA AI API

Serverless backend for the NOVA AI static frontend. Uses Hugging Face Inference Providers via the official JavaScript client.

## Deploy to Vercel
1. Import this GitHub repository as a new Vercel project.
2. Set **Root Directory** to `nova-ai-api`.
3. Add `HF_TOKEN` as a Vercel environment variable. Create a fine-grained Hugging Face token with Inference Providers permission. Never commit a real token.
4. Set `ALLOWED_ORIGINS` to the exact deployed frontend origin (no trailing path), for example `https://username.github.io`. During local development, add the local origin you use.
5. Deploy and open `/api/health`. A successful health check confirms only that the API route responds; it does not verify provider inference.
6. Configure the deployed API URL in the NOVA frontend settings and run a real chat and image request.

## Endpoints
- `GET /api/health` — reports service and token configuration state (never reveals the token).
- `POST /api/chat` — JSON: `{ "messages": [{"role":"user","content":"Hello"}], "model":"openai/gpt-oss-120b:fastest" }`.
- `POST /api/image` — JSON: `{ "prompt":"A quiet mountain lake", "model":"black-forest-labs/FLUX.1-schnell" }`.

## Security notes
- Secrets are read only from server environment variables.
- CORS is an origin allowlist, not user authentication. Anyone who can reach the public endpoint may attempt to use its inference quota. Add authentication, rate limiting, and quota monitoring before public production use.
- This prototype does not execute user-provided code or browser actions.
- Request and response bodies are bounded at the application layer; also configure platform limits and monitoring.
- Check model availability, licensing, provider policy, and pricing before production deployment.
