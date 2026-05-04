# SaveWise — Production Blueprint

> **Checked = done. Unchecked = still to do.**
> Work through this file phase by phase. Do not skip to a later phase until the current one is complete.
> Last updated: 2026-05-02

---

## Where We Are Right Now

| Area | Status | Notes |
|------|--------|-------|
| Frontend pages | ~70% | Real API calls on most pages; onboarding flow incomplete |
| Backend models & endpoints | ~65% | All major models exist; payment gateway is a stub |
| Celery / scheduled tasks | ~30% | Config exists; deduction logic not verified running |
| Email / SMS | 0% | SMTP template in .env only; no service wired |
| Payment processing | 0% | Models defined; no real gateway |
| DevOps / infrastructure | 10% | No Docker, no CI/CD, no monitoring |
| Tests | 0% | Zero tests across frontend and backend |

---

## Phase 0 — Fix What's Already Built (Current Sprint)

These are features that exist in the UI but are broken or not wired to the backend.

### 0.1 Onboarding Flow

- [x] **Link Funding Sources page** (`app/link-sources/page.tsx`) — step indicators aligned to 8-step flow; routes to link-details
- [x] **Link Details page** (`app/link-details/page.tsx`) — wires `POST /api/funding-sources/` for bank + mobile; step indicators fixed; bank/provider list updated to Africa-focused
- [x] **Saving Preferences page** (`app/saving-preferences/page.tsx`) — fetches existing prefs on mount to pre-fill form; uses `POST` for first-time setup and `PATCH` for updates; funding_sources array fixed
- [x] **Saving Routing page** (`app/saving-routing/page.tsx`) — already wired to `PATCH /api/saving-preferences/preferences/`
- [x] **Saving Review page** (`app/saving-review/page.tsx`) — confirm button calls `PATCH /api/users/me/onboarding/` with loading state; Tailwind classes cleaned up
- [x] **Wallet Created page** (`app/wallet-created/page.tsx`) — already fetches wallet number from API with fallback
- [ ] Onboarding progress persisted via `PATCH /api/users/me/onboarding/` at each step so the user can resume if they close the tab

### 0.2 Funding Sources Management

- [x] **Funding Sources page** (`app/funding-sources/page.tsx`) — list, add, delete, set-primary all wired to API; Africa bank/provider lists; status badge from API
- [x] **Link Details page** (`app/link-details/page.tsx`) — wired to `POST /api/funding-sources/`; Africa bank list (same as funding sources page)

### 0.3 Admin Dashboard

- [x] **Admin overview** — `GET /api/admin/overview/` wired to KPI cards; 30-second polling
- [x] **Admin user list** — `GET /api/admin/users/` with search, status filter, pagination; phone/is_staff fields added to serializer
- [x] **Admin user detail** — suspend / activate / make-admin / revoke-admin / delete all wired; `make-admin` and `revoke-admin` backend endpoints added
- [x] **Admin funds** — list, create, edit, delete via `GET/POST/PATCH/DELETE /api/admin/funds/`; image upload via FormData
- [x] **Admin goals** — `GET /api/admin/goals/` endpoint added; list with type/status filter and search
- [x] **Admin transactions** — `GET /api/admin/transactions/` endpoint added; list with type/status filter and search, pagination
- [x] **Admin withdrawals** — list pending, approve / reject via API
- [x] **Admin broadcast** — `POST /api/admin/broadcast/` via `BroadcastMessage.send_broadcast()`; `GET` returns history
- [x] **Admin platform settings** — `GET/PATCH /api/admin/settings/` wired
- [x] **Admin charts** — `GET /api/admin/charts/` returns `{months, users, savings}` flat arrays for bar/area charts
- [x] **Payment providers** — `GET/POST/PATCH/DELETE /api/admin/payment-providers/banks|mobile/` wired; `PaymentProvider` model + migration created

### 0.4 Profile & Settings Pages

- [ ] Avatar upload wired to `POST /api/users/me/avatar/` (currently broken — S3 not configured; use local storage for now and flag for Phase 5)
- [ ] Change password calls `POST /api/users/me/change-password/` and shows inline success/error
- [ ] Active sessions list (`GET /api/users/me/sessions/`) displayed and each session revocable
- [ ] Login history (`GET /api/users/me/login-history/`) displayed in security tab
- [ ] 2FA setup flow (`/login/2fa/page.tsx`) — TOTP QR code display, backup codes download, disable 2FA all wired

### 0.5 Goals

- [ ] Group goal invite — generate/copy invite link calls `POST /api/goals/{id}/invite/` and copies code to clipboard
- [ ] Join goal page (`/invite/page.tsx`) — calls `POST /api/goals/join/` with the invite code from the URL
- [ ] Group goal withdrawal request flow — request modal calls `POST /api/goals/{id}/withdrawal-requests/`; participant vote calls the vote endpoint
- [ ] Goal progress updates — after any contribution or auto-save, goal cards reflect updated `current_amount` without full page reload

### 0.6 Investments

- [ ] Confirm investment confirmation modal calls `POST /api/investments/` (not just review)
- [ ] Portfolio page pulls real data from `GET /api/portfolio/` and renders the chart with actual `monthly_returns`
- [ ] Individual fund detail modal shows real `highlights` from the backend (not hardcoded)

### 0.7 Transactions

- [ ] Export button calls `GET /api/transactions/export/` and triggers a file download
- [ ] Pagination working — "load more" or page numbers wired to `?page=N` query param

### 0.8 Notifications

- [ ] Topbar bell icon fetches `GET /api/notifications/` and shows unread count badge
- [ ] Mark as read on click calls `PATCH /api/notifications/{id}/read/`
- [ ] "Mark all read" button calls `POST /api/notifications/read-all/`
- [ ] Notification preferences tab in settings wired to `GET/PATCH /api/users/me/notification-prefs/`

---

## Phase 1 — Security & Stability Hardening

Do this before any real users touch the app.

### 1.1 API Rate Limiting

- [ ] Install `django-ratelimit` or configure DRF throttling
- [ ] Throttle auth endpoints: signup (5/hour/IP), login (10/hour/IP), password-reset (3/hour/IP)
- [ ] Throttle general API: 200 requests/minute per authenticated user
- [ ] Return `429 Too Many Requests` with a `Retry-After` header
- [ ] Add rate-limit exceeded error message on the frontend

### 1.2 Input Validation Hardening

- [ ] All DRF serializers validate min/max lengths, allowed characters, and formats — audit each serializer
- [ ] `amount` fields: reject negative values and enforce decimal precision
- [ ] `email` fields: normalize to lowercase before saving
- [ ] `phone_number` field: validate E.164 format
- [ ] File uploads: validate MIME type and file size (avatar max 5 MB, allowed: jpeg/png)
- [ ] Goal `deadline`: enforce >= 4 months from today in the serializer (not just frontend)
- [ ] Invitation codes: validate exact format server-side

### 1.3 Security Headers

- [ ] `SECURE_SSL_REDIRECT = True` in production settings
- [ ] `SECURE_HSTS_SECONDS = 31536000` with `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`
- [ ] `X_FRAME_OPTIONS = 'DENY'`
- [ ] `SECURE_CONTENT_TYPE_NOSNIFF = True`
- [ ] `SECURE_BROWSER_XSS_FILTER = True`
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] Configure `Content-Security-Policy` header (via `django-csp`)

### 1.4 Error Logging & Monitoring

- [ ] Create a Sentry account and project
- [ ] Install `sentry-sdk` and configure in `base.py` with DSN from env
- [ ] Configure Sentry on the frontend (`@sentry/nextjs`) — capture uncaught exceptions and API errors
- [ ] Set up Sentry alerts for: unhandled exceptions, P95 response time > 2s, error rate > 1%
- [ ] Add structured logging in Django (`LOGGING` config) — JSON format, log to stdout for cloud ingestion

### 1.5 CORS & ALLOWED_HOSTS

- [ ] `ALLOWED_HOSTS` set to production domain only (not `*`)
- [ ] `CORS_ALLOWED_ORIGINS` set to production frontend domain only
- [ ] Remove `CORS_ALLOW_ALL_ORIGINS = True` if it exists

### 1.6 Secrets Management

- [ ] All secrets in environment variables — no hardcoded keys in codebase
- [ ] `SECRET_KEY` rotated to a new 50+ character random string for production
- [ ] `.env` file in `.gitignore` — confirm it is not committed
- [ ] Encryption key for TOTP secrets stored in env (`ENCRYPTION_KEY`)

---

## Phase 2 — Third-Party Services (Non-Payment)

### 2.1 Email Service

- [ ] Create an account with SendGrid (or AWS SES)
- [ ] Add `django-anymail` or use `django-sendgrid-v5`; configure `EMAIL_BACKEND` in settings
- [ ] Store API key in env (`SENDGRID_API_KEY` or `AWS_SES_*`)
- [ ] Build transactional email templates for:
  - [ ] Welcome / verify email address
  - [ ] Password reset link
  - [ ] 2FA setup confirmation
  - [ ] Auto-save deduction success/failure
  - [ ] Goal milestone reached (25%, 50%, 75%, 100%)
  - [ ] Goal deadline reminder (30 days, 7 days)
  - [ ] Weekly savings report (Monday)
  - [ ] Withdrawal request submitted / approved / rejected
  - [ ] Group goal invite
- [ ] Wire the forgot-password flow (`POST /api/auth/forgot-password/`) to send a real email with a secure time-limited reset link
- [ ] Wire email-verification on signup (send link, verify via endpoint)

### 2.2 SMS Notifications (Optional for MVP, required for KYC)

- [ ] Create a Twilio account and obtain API keys
- [ ] Install `twilio` Python SDK; configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in env
- [ ] Send OTP SMS during 2FA login (alternative to TOTP for non-authenticator users)
- [ ] Send auto-save failure SMS if user has opted in
- [ ] Frontend notification preferences tab: add SMS toggle

### 2.3 File Storage (AWS S3 / Cloudflare R2)

- [ ] Create S3 bucket (or R2) for user-uploaded files
- [ ] Install `django-storages[s3]` and `boto3`; configure `DEFAULT_FILE_STORAGE` and `AWS_*` env vars in settings
- [ ] Avatar upload now saves to S3; return permanent URL in profile API response
- [ ] Set bucket policy: private (signed URLs) for user files
- [ ] Add an avatar URL field to the frontend profile page that displays the S3 image

### 2.4 Celery & Redis Verification

- [ ] Provision a Redis instance (local for dev, managed Redis for production)
- [ ] Set `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` to Redis URL in env
- [ ] Run `celery -A config worker --loglevel=info` and confirm tasks are picked up
- [ ] Run `celery -A config beat --loglevel=info` and confirm scheduled tasks fire on schedule
- [ ] Smoke-test the deduction scheduler: create a manual `DeductionLog` with `scheduled_at = now()` and verify the task processes it
- [ ] Confirm `goal-deadline-reminders` fires at 08:00 daily and sends notifications
- [ ] Confirm `weekly-savings-report` fires Monday 08:00

---

## Phase 3 — Frontend Polish & UX

### 3.1 Error States & Empty States

- [ ] Every page that fetches data has a proper error state (not just a console.error)
- [ ] Every list page has an empty state UI (no goals yet, no transactions yet, etc.)
- [ ] API errors surface as visible UI messages — not just logged to console
- [ ] Network offline: show a banner when the fetch fails with a "connection refused" type error

### 3.2 Toast Notifications

- [ ] Add a lightweight toast library (or build a small custom one)
- [ ] Show success toast on: profile update, settings save, goal created, investment made, funding source added
- [ ] Show error toast on: any API failure that doesn't have a dedicated error UI

### 3.3 Loading States

- [ ] All buttons that trigger API calls show a spinner and are disabled while loading
- [ ] Page-level skeleton loaders for dashboard, investments, goals, and transactions (instead of blank flashes)
- [ ] Optimistic UI where safe (mark notification as read, toggle settings)

### 3.4 Mobile Responsiveness

- [ ] Test all pages on 375px (iPhone SE), 390px (iPhone 14), and 414px (Android large) viewport widths
- [ ] Sidebar collapses to a bottom nav or hamburger on mobile
- [ ] Tables scroll horizontally on small screens (transactions, admin tables)
- [ ] Modals are full-screen on mobile

### 3.5 Accessibility (WCAG 2.1 AA)

- [ ] All interactive elements reachable via keyboard Tab; focus ring visible
- [ ] All images and icons have `alt` text or `aria-label`
- [ ] Form fields have associated `<label>` elements
- [ ] Color contrast ratios meet AA (4.5:1 for normal text)
- [ ] Error messages announced via `aria-live` regions

### 3.6 Performance

- [ ] Images (avatars, fund images) served via Next.js `<Image>` for automatic optimization
- [ ] Large list pages (transactions, admin users) use pagination — do not load all records
- [ ] `React.memo` or `useMemo` on heavy chart components to prevent unnecessary re-renders
- [ ] Lighthouse score >= 80 on Performance, Accessibility, Best Practices

---

## Phase 4 — Testing

### 4.1 Backend Unit Tests

- [ ] `accounts` app: signup, login, JWT refresh, 2FA setup/verify, change password, session management
- [ ] `wallets` app: wallet creation, funding source CRUD, set-primary
- [ ] `goals` app: goal CRUD, deadline validation, group invite/join, withdrawal request + vote
- [ ] `investments` app: fund list, create holding, portfolio aggregation
- [ ] `autosave` app: create preference, toggle, goal weight distribution
- [ ] `transactions` app: transaction creation, fee calculation, withdrawal request
- [ ] `notifications` app: mark read, mark all read, notification triggers
- [ ] `admin_panel` app: overview KPIs, user management, fund CRUD, platform settings
- [ ] `common` utils: reference number generation, fee calculation, permissions

### 4.2 Backend Integration Tests

- [ ] Full onboarding flow: signup → verify email → create wallet → add funding source → set preferences → create goal
- [ ] Auto-save deduction cycle: trigger scheduled task → charge funding source stub → distribute to goals → create transaction → send notification
- [ ] Investment flow: browse fund → review → confirm → holding created → portfolio updated
- [ ] Group goal flow: create → invite → join → contribute → request withdrawal → vote → approve

### 4.3 Frontend Tests

- [ ] Unit test `lib/api.ts` — token refresh logic, error extraction, multipart upload
- [ ] Unit test `lib/settings-context.tsx` — currency formatting, theme switching, language lookup
- [ ] Component snapshot tests for `Charts.tsx`, `Sidebar.tsx`, `Topbar.tsx`
- [ ] E2E test (Playwright or Cypress) for: login → dashboard → create goal → view transactions → logout

### 4.4 Security Testing

- [ ] Run OWASP ZAP against the staging API — fix any HIGH findings
- [ ] Test JWT expiry: expired token returns 401; refresh grants new token
- [ ] Test IDOR: user A cannot access user B's goals/wallet/transactions via ID guessing
- [ ] Test rate limits: 11th login attempt in an hour returns 429

---

## Phase 5 — DevOps & Infrastructure

### 5.1 Docker

- [ ] `Dockerfile` for Django backend (Python 3.12 slim, gunicorn, whitenoise)
- [ ] `Dockerfile` for Next.js frontend (node 20 slim, `next build`, `next start`)
- [ ] `docker-compose.yml` for local dev: backend + frontend + postgres + redis + celery worker + celery beat
- [ ] `docker-compose.prod.yml` or environment overrides for production
- [ ] `.dockerignore` excludes `node_modules`, `.env`, `__pycache__`, migrations bytecode

### 5.2 CI/CD Pipeline (GitHub Actions)

- [ ] On pull request to `master`: run linting (ESLint, Ruff/Flake8), type checks (tsc, mypy), all tests
- [ ] On merge to `master`: build Docker images, push to container registry (ECR, GHCR, or Docker Hub)
- [ ] On merge to `master`: auto-deploy to staging environment
- [ ] Manual step / approval gate for production deploy
- [ ] Pipeline runs in under 10 minutes

### 5.3 Cloud Infrastructure

- [ ] Choose provider: AWS, GCP, or Fly.io (recommend Fly.io or Railway for MVP speed)
- [ ] PostgreSQL: managed database (AWS RDS, Supabase, or Neon)
- [ ] Redis: managed instance (AWS ElastiCache, Upstash, or Railway Redis)
- [ ] Backend hosted behind HTTPS with a load balancer or reverse proxy (nginx)
- [ ] Frontend deployed to Vercel (recommended) or the same cloud provider
- [ ] Static files served from S3 or CDN (already configured in Phase 2.3)

### 5.4 Database

- [ ] Run all migrations on production database before first deploy
- [ ] Automated daily backups with 30-day retention
- [ ] Point-in-time recovery (PITR) enabled
- [ ] Staging database is a copy of production schema (never production data)
- [ ] `db_constraints` and indexes audited — add index on `Transaction.user`, `Goal.user`, `DeductionLog.scheduled_at`

### 5.5 Monitoring & Alerting

- [ ] Uptime monitor (Better Uptime, UptimeRobot, or AWS Route53 health checks) — alert if down > 1 min
- [ ] Sentry (configured in Phase 1.4) — PagerDuty or email on new issues
- [ ] Celery task failure alerts: if deduction task fails 3 times, alert admin by email
- [ ] Database connection pool monitored
- [ ] Redis memory usage monitored
- [ ] Alert if CPU or memory > 85% for 5 minutes

### 5.6 Logging

- [ ] Django logs: requests, errors, Celery task results — shipped to CloudWatch, Datadog, or Papertrail
- [ ] Next.js logs: server-side errors, slow page loads
- [ ] Log retention: 90 days minimum
- [ ] PII scrubbing in logs (no passwords, full card numbers, or full bank account numbers in plain text)

---

## Phase 6 — Compliance & Legal

### 6.1 KYC / Identity Verification

- [ ] Integrate a KYC provider (Smile Identity for African markets, or Persona, Jumio)
- [ ] On signup complete, trigger KYC flow: collect ID document + selfie
- [ ] Block access to funding/investing until KYC is approved
- [ ] KYC status stored on `User` model (`kyc_status`: pending / approved / rejected)
- [ ] Admin dashboard shows KYC queue — admin can manually approve/reject with notes
- [ ] Users notified by email/SMS of KYC decision

### 6.2 AML (Anti-Money Laundering)

- [ ] Flag transactions over a configurable threshold (default $10,000 / equivalent) for manual review
- [ ] Track cumulative deposits per user per rolling 30-day window
- [ ] Suspicious activity reports (SAR) — admin can mark a user for investigation
- [ ] Block withdrawals for flagged users until reviewed

### 6.3 Legal Documents

- [ ] Terms of Service finalized and reviewed by a lawyer (not a template)
- [ ] Privacy Policy finalized (GDPR + local regulations)
- [ ] Auto-Saving Terms & Conditions (already linked in the UI — finalize content)
- [ ] Cookie consent banner on the web app (if analytics are used)
- [ ] Data retention and deletion policy implemented (`DELETE /api/users/me/close-account/` actually deletes/anonymizes data)

### 6.4 GDPR / Data Rights

- [ ] Data export endpoint (`GET /api/users/me/export-data/`) returns a JSON/ZIP of all user data
- [ ] Account deletion permanently anonymizes PII within 30 days
- [ ] Users can view all their data in-app (goals, transactions, investments, notifications)

---

## Phase 7 — Payment Gateway Integration

> **This is the last phase.** Everything above must be checked before going live with real money.

### 7.1 Choose & Set Up Gateway

- [ ] Decision made on gateway:
  - **Flutterwave** — best for Africa (Nigeria, Kenya, Ghana, Tanzania, ZA, etc.)
  - **Stripe** — best if targeting users with international bank cards
  - **M-Pesa Daraja API** — direct integration if Tanzania / Kenya mobile money is primary
  - **Paystack** — Nigeria / Ghana focused, simpler than Flutterwave
  - *Recommend: Flutterwave + M-Pesa Daraja for African market coverage*
- [ ] Create business account and get production API keys from chosen gateway
- [ ] Store API keys in env (`FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY`, etc.)
- [ ] Install gateway SDK or configure direct HTTPS API calls in Django

### 7.2 Fund Wallet (Deposits)

- [ ] Bank card / card payment: user can add money via card using gateway payment modal
- [ ] Mobile money: user can deposit via M-Pesa / MTN / Airtel using phone number + PIN prompt
- [ ] Bank transfer: gateway generates virtual account number for user; user sends from their bank
- [ ] On successful payment: gateway webhook fires → Django verifies signature → creates `Transaction(type=Deposit)` → updates wallet balance
- [ ] Webhook endpoint: `POST /api/payments/webhook/` — verifies HMAC signature before processing
- [ ] Idempotency: deduplicate webhook events using gateway transaction ID
- [ ] Deposit reflected in wallet balance within 60 seconds of confirmation
- [ ] User receives in-app notification + email on deposit

### 7.3 Auto-Save Deductions (Direct Debit / Tokenized Cards)

- [ ] On funding source addition: tokenize the card/account via gateway; store token (never raw card data)
- [ ] Celery deduction task calls gateway `charge token` API using stored token
- [ ] On success: create `Transaction(type=Auto-Save)`, distribute amount to goals per weights, update `next_deduction_at`
- [ ] On failure: log failure reason, schedule retry at +1h, +3h, +24h; notify user by email/SMS after first failure
- [ ] After 3 failures: disable autosave, notify user that their funding source needs attention
- [ ] Deduction logs visible in the autosave logs page

### 7.4 Withdrawals

- [ ] User submits withdrawal request → `POST /api/withdrawals/` with amount + destination source
- [ ] Backend creates `WithdrawalRequest(status=pending)`
- [ ] Admin reviews and approves via admin dashboard
- [ ] On admin approval: backend calls gateway payout API (bank transfer or mobile money)
- [ ] On gateway payout success: update `WithdrawalRequest(status=completed)`, create `Transaction(type=Withdrawal)`, notify user
- [ ] On gateway payout failure: update status to `failed`, notify admin and user
- [ ] Minimum withdrawal amount enforced (configurable in PlatformSettings)
- [ ] Withdrawal fee deducted (platform_fee_percentage from PlatformSettings)

### 7.5 Investment Contributions

- [ ] When user confirms investment: deduct from wallet balance (if funded) or trigger immediate card charge
- [ ] Create `Transaction(type=Investment)` with `destination_fund`
- [ ] On maturity date (or on admin action): credit user's wallet, create `Transaction(type=Return)`

### 7.6 Reconciliation & Reporting

- [ ] Daily reconciliation task: compare platform transaction totals against gateway dashboard totals
- [ ] Alert admin if discrepancy > $1 / equivalent
- [ ] Monthly statement generated per user (PDF or structured data)
- [ ] Admin can download full transaction export from admin dashboard

### 7.7 PCI DSS Compliance

- [ ] Raw card numbers NEVER touch SaveWise servers — all card entry via gateway-hosted fields or SDK
- [ ] Confirm with gateway that tokenization is PCI SAQ A or SAQ A-EP compliant
- [ ] Security audit of webhook handler: reject events with invalid signatures
- [ ] Test in gateway sandbox before going live with real money

---

## Cross-Cutting Checklist (Before Any Phase Goes Live)

- [ ] All API endpoints return consistent error format: `{ "error": "...", "detail": "..." }`
- [ ] All timestamps in API responses are ISO 8601 with UTC timezone (`2026-05-02T14:30:00Z`)
- [ ] All amounts in API responses are strings or properly typed decimals — no floating-point money
- [ ] API versioning in place (`/api/v1/`) so future breaking changes don't affect existing clients
- [ ] Pagination on all list endpoints (default page size 20, max 100)
- [ ] Admin-only endpoints protected by `IsAdmin` permission and only accessible over HTTPS
- [ ] Frontend `.env.local` / `.env.production` values set (`NEXT_PUBLIC_API_URL`, etc.)
- [ ] Production build passes TypeScript type check with zero errors (`tsc --noEmit`)
- [ ] Production build passes ESLint with zero errors
- [ ] All `console.log` statements removed from production builds
- [ ] `DEBUG = False` in production
- [ ] `ALLOWED_HOSTS` locked to production domain

---

## Feature Completion Tracker

| Feature | Backend | Frontend | Tests | Notes |
|---------|---------|---------|-------|-------|
| Signup | ✅ | ✅ | ⬜ | |
| Email verification | ⬜ | ⬜ | ⬜ | Phase 2.1 |
| Login (password) | ✅ | ✅ | ⬜ | |
| Login (2FA) | ✅ | ⬜ | ⬜ | Frontend flow incomplete |
| Forgot / reset password | ⬜ | ✅ | ⬜ | Backend email not wired |
| 2FA setup / disable | ✅ | ⬜ | ⬜ | Frontend not fully wired |
| User profile | ✅ | ✅ | ⬜ | Avatar upload broken |
| User settings | ✅ | ✅ | ⬜ | |
| Notification preferences | ✅ | ⬜ | ⬜ | Not wired on settings page |
| Active sessions | ✅ | ⬜ | ⬜ | Page not wired |
| Login history | ✅ | ⬜ | ⬜ | Page not wired |
| Wallet view | ✅ | ✅ | ⬜ | |
| Add funding source | ✅ | ⬜ | ⬜ | Link-sources page not wired |
| Remove funding source | ✅ | ⬜ | ⬜ | |
| Set primary source | ✅ | ⬜ | ⬜ | |
| Savings goal CRUD | ✅ | ✅ | ⬜ | |
| Emergency goal | ✅ | ✅ | ⬜ | |
| Group goal create | ✅ | ✅ | ⬜ | |
| Group goal invite | ✅ | ⬜ | ⬜ | Frontend not wired |
| Group goal join | ✅ | ⬜ | ⬜ | Invite page not wired |
| Group withdrawal vote | ✅ | ⬜ | ⬜ | |
| Browse investment funds | ✅ | ✅ | ⬜ | |
| Make investment | ✅ | ⬜ | ⬜ | Review works; confirm call unclear |
| Portfolio view | ✅ | ✅ | ⬜ | |
| Autosave preferences | ✅ | ⬜ | ⬜ | Onboarding flow broken |
| Autosave toggle | ✅ | ⬜ | ⬜ | |
| Goal weight routing | ✅ | ⬜ | ⬜ | |
| Deduction scheduler | ⬜ | — | ⬜ | Celery not verified |
| Transactions list | ✅ | ✅ | ⬜ | |
| Transaction export | ⬜ | ⬜ | ⬜ | Async processing unclear |
| Withdrawal request | ✅ | ⬜ | ⬜ | |
| In-app notifications | ✅ | ⬜ | ⬜ | Topbar bell not wired |
| Email notifications | ⬜ | — | ⬜ | Phase 2.1 |
| SMS notifications | ⬜ | — | ⬜ | Phase 2.2 |
| Admin overview | ✅ | ⬜ | ⬜ | |
| Admin user management | ✅ | ⬜ | ⬜ | |
| Admin fund management | ✅ | ⬜ | ⬜ | |
| Admin withdrawals | ✅ | ⬜ | ⬜ | |
| Admin broadcast | ✅ | ⬜ | ⬜ | |
| Admin platform settings | ✅ | ⬜ | ⬜ | |
| KYC verification | ⬜ | ⬜ | ⬜ | Phase 6.1 |
| Payment — deposits | ⬜ | ⬜ | ⬜ | Phase 7.2 |
| Payment — auto-deduct | ⬜ | ⬜ | ⬜ | Phase 7.3 |
| Payment — withdrawals | ⬜ | ⬜ | ⬜ | Phase 7.4 |
| Payment — investments | ⬜ | ⬜ | ⬜ | Phase 7.5 |
| Rate limiting | ⬜ | — | ⬜ | Phase 1.1 |
| Sentry error tracking | ⬜ | ⬜ | ⬜ | Phase 1.4 |
| Docker setup | ⬜ | ⬜ | — | Phase 5.1 |
| CI/CD pipeline | ⬜ | ⬜ | — | Phase 5.2 |
| Production database | ⬜ | — | — | Phase 5.3 |
| Backups | ⬜ | — | — | Phase 5.4 |

---

## Estimated Timeline

| Phase | Work | Estimated Time |
|-------|------|---------------|
| Phase 0 — Fix existing features | Backend wiring + frontend completion | 1–2 weeks |
| Phase 1 — Security hardening | Rate limits, headers, Sentry, secrets | 3–5 days |
| Phase 2 — Email, SMS, S3, Celery | Third-party service setup + templates | 4–6 days |
| Phase 3 — Frontend polish | Error states, toasts, mobile, a11y | 4–6 days |
| Phase 4 — Testing | Unit + integration + E2E | 1–2 weeks |
| Phase 5 — DevOps | Docker, CI/CD, cloud infra | 4–7 days |
| Phase 6 — Compliance & legal | KYC, AML, legal docs | 1–2 weeks |
| Phase 7 — Payment gateway | Real money flow end-to-end | 1–2 weeks |
| **Total** | | **~8–12 weeks** |

---

*This document is the source of truth for production readiness. Update checkboxes here as each item is completed.*
