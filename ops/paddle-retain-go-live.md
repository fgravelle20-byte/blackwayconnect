# BlackWayConnect Paddle Retain go-live

The public homepage initializes Paddle.js with the browser-safe live client token. The portal uses the same token and sets `pwCustomer` only after a verified email sign-in and a server-side Paddle `ctm_` lookup.

## Production dependencies

- `blackway-pipe`: set `PADDLE_API_KEY` with customer read access, `PADDLE_WEBHOOK_SECRET` for the existing Paddle webhook, `PADDLE_CLIENT_TOKEN` (the same browser-safe `live_` token as checkout), `BW_PORTAL_SECRET`, and `RESEND_API_KEY` as Worker secrets.
- Resend: verify `blackwayconnect.com` and permit sending from `noreply@blackwayconnect.com`. The sign-in link expires after 10 minutes; portal email requests are throttled for 60 seconds per email at the Worker edge.
- Rotate the committed `BW_PADDLE_FULFILL_KEY` together with Vorixa's relay and remove it from tracked config and lock metadata before exposing the portal. Do not invalidate it on only one side: the relay is the active fulfillment route while direct Paddle webhook secrets are absent.
- Deploy the pipe Worker and site Worker, then verify `GET /health` reports `paddle_api_key`, `paddle_webhook_secret`, `paddle_client_token`, `portal_email_login`, and `portal_secret` as true. Confirm the Paddle webhook and Vorixa relay each process a real test payment only once.
- Verify an active customer receives the sign-in link, `/portal/me` returns that customer's `ctm_` ID, Retain loads on the live portal, and a different or unsigned link gets 401.

The payment lock requires the documented owner unlock, review, and reseal for changes to `pipe/index.js`. This PR must remain draft until the secret rotation and deployment dependencies above are complete.
