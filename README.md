# CrashBet Tanzania — upgraded demo starter

A mobile-first Tanzania-focused Crash game **demonstration** interface using TZS. This repository is not a licensed gambling product. The animated multiplier is illustrative only; the BET controls do not accept wagers, debit balances, or settle winnings. Real-money wagering remains deliberately unavailable.

## Implemented
- Responsive dark/pink game UI, live demo multiplier feed, two stake controls and quick stake buttons.
- Registration/login with normalized email, Tanzania phone validation, bcrypt password hashing and signed JWT sessions.
- Authenticated `/api/auth/me` endpoint and explicit logout in the browser.
- Role-protected admin dashboard with user/payment totals and recent payment records.
- MongoDB user/payment schemas and owner-scoped payment status endpoint.
- OptimaPay Tanzania collection/status adapter with server-side credentials, timeout, sandbox default and multiple production safety gates.
- Deposit reference persisted before provider submission; status-based wallet credit uses an atomic one-time claim.
- Helmet security headers, strict CORS origin, JSON size limit, API/login/registration rate limits, generic error handling.

## Run locally
Requires Node.js 20+ and MongoDB.

```bash
cp .env.example .env
# Set MONGODB_URI, APP_URL and a unique random JWT_SECRET (32+ characters).
npm install
npm run check
npm run dev
```
Visit `http://localhost:3000`.

## Create the first administrator
Set `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `MONGODB_URI` in the private environment, then run:

```bash
npm run create-admin
```
The command creates the admin or promotes the matching account and resets its password. Use a unique password of at least 14 characters. Do not expose these environment variables in frontend code, commit them, or share them in chat. Remove the bootstrap credentials from the environment after provisioning if your host permits it.

## API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `POST /api/payments/deposit` (Bearer token; live collection remains gated)
- `GET /api/payments/status/:reference` (Bearer token; transaction owner only)
- `GET /api/admin/overview` (admin only)
- `GET /api/admin/users` (admin only)
- `GET /api/admin/payments` (admin only)
- `GET /api/health`

## OptimaPay integration
Collection: `POST https://global.optimapaybridge.co.ke/api/v2/godigital/tz/collect`

Status: `GET https://global.optimapaybridge.co.ke/api/v2/godigital/tz/status/{identifier}`

The adapter uses `X-API-KEY` and `X-API-SECRET`. Confirm the exact provider request/response schema, identifier returned, callback signature, and settlement behavior with OptimaPay before production use. The webhook intentionally does not credit accounts: callback signature verification has not been specified or implemented. The authenticated status route is the only current credit path.

## Before any real-money launch
1. Obtain applicable Tanzanian gaming, business, data-protection and tax approvals and written payment-provider merchant approval.
2. Commission independent review of game RNG/fairness, wallet ledger, transaction reconciliation, security, age/KYC, AML and responsible-gaming controls.
3. Implement verified provider callbacks, robust idempotent ledger entries, refunds/reversals, dispute handling and operational monitoring.
4. Use a certified game engine/RNG and independently audited crash-point generation. The included multiplier is a deterministic visual simulation, not a fair or monetizable game.
5. Have counsel and the payment provider approve all workflows before changing the safety flags. Do not switch flags simply to enable cash wagering.

The app intentionally does not provide real-money betting or payout settlement.
