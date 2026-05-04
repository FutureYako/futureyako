# SaveWise — Django / DRF Backend Blueprint

> Stack: Python 3.12 · Django 5.x · Django REST Framework · PostgreSQL · Redis · Celery · Simple JWT

---

## 1. Project Structure

```
savewise_backend/
├── config/                        # Django project config
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py                    # root URL config
│   ├── celery.py                  # Celery app setup
│   └── wsgi.py
│
├── apps/
│   ├── accounts/                  # auth, user profile, settings, sessions
│   ├── wallets/                   # wallet, funding sources
│   ├── goals/                     # savings goals, emergency, group goals
│   ├── investments/               # funds, holdings, portfolio
│   ├── autosave/                  # saving preferences, deduction scheduler
│   ├── transactions/              # transaction ledger, withdrawals
│   ├── notifications/             # in-app notifs, broadcast, preferences
│   └── admin_panel/               # admin-only API views & platform settings
│
├── common/                        # shared utilities
│   ├── models.py                  # BaseModel (uuid pk, timestamps)
│   ├── permissions.py             # IsAdmin, IsOwner, IsGroupMember
│   ├── pagination.py              # standard page-number pagination
│   ├── exceptions.py              # custom DRF exceptions
│   └── utils.py                   # ref# generators, fee calculator, etc.
│
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
│
└── manage.py
```

---

## 2. Common Base

```python
# common/models.py
import uuid
from django.db import models

class BaseModel(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

All models inherit from `BaseModel`.

---

## 3. App: `accounts`

### 3.1 Models

#### `User` (custom auth user)
```
Field               Type                Notes
─────────────────────────────────────────────────────────────────────
email               EmailField          unique, used as USERNAME_FIELD
phone_number        CharField(20)        unique, E.164 format
full_name           CharField(100)
date_of_birth       DateField           nullable
location            CharField(100)      nullable
bio                 TextField(500)      nullable
avatar_color        CharField(20)       choices: 8 preset hex values
member_status       CharField           choices: active | suspended | pending | deleted
is_staff            BooleanField        Django default
is_superuser        BooleanField        Django default
password            (hashed)
```

AUTH_USER_MODEL = 'accounts.User'

#### `UserSettings`
```
Field                       Type            Default
──────────────────────────────────────────────────────────────────────
user                        OneToOneField   → User
currency                    CharField       'USD'
language                    CharField       'en-us'
theme                       CharField       'System'   choices: Light | Dark | System
dashboard_show_stats        BooleanField    True
dashboard_show_activity     BooleanField    True
dashboard_show_goals        BooleanField    True
analytics_enabled           BooleanField    True
personalized_tips_enabled   BooleanField    True
marketing_enabled           BooleanField    False
```

#### `NotificationPreference`
```
Field               Type            Default
────────────────────────────────────────────
user                OneToOneField   → User
autosave_ok         BooleanField    True
autosave_fail       BooleanField    True
wallet_updates      BooleanField    True
goal_milestone      BooleanField    True
goal_deadline       BooleanField    True
weekly_report       BooleanField    False
newsletter          BooleanField    False
product_updates     BooleanField    True
```

#### `TwoFactorAuth`
```
Field           Type            Notes
───────────────────────────────────────────────────────
user            OneToOneField   → User
is_enabled      BooleanField    False
secret_key      CharField       encrypted (django-encrypted-model-fields)
backup_codes    JSONField       list[str], each code single-use
setup_verified  BooleanField    False (set True on first successful verify)
```

#### `LoginSession`
```
Field           Type            Notes
──────────────────────────────────────────────────────
user            ForeignKey      → User
session_key     CharField       unique token reference
device_name     CharField(100)
location        CharField(100)  IP-resolved geo
last_active     DateTimeField
is_current      BooleanField
```

#### `LoginHistory`
```
Field           Type
──────────────────────────────
user            ForeignKey      → User
device          CharField(100)
location        CharField(100)
is_successful   BooleanField
failure_reason  CharField       nullable
login_at        DateTimeField   auto_now_add
```

---

### 3.2 API Endpoints

Base prefix: `/api/auth/` and `/api/users/`

| Method | Endpoint                                    | Auth | Description                        |
|--------|---------------------------------------------|------|------------------------------------|
| POST   | /api/auth/signup/                           | No   | Create account                     |
| POST   | /api/auth/login/                            | No   | Login, returns JWT pair            |
| POST   | /api/auth/token/refresh/                    | No   | Refresh access token               |
| POST   | /api/auth/logout/                           | Yes  | Blacklist refresh token            |
| POST   | /api/auth/forgot-password/                  | No   | Send reset email                   |
| POST   | /api/auth/reset-password/                   | No   | Confirm reset with token           |
| GET    | /api/users/me/                              | Yes  | Get own profile                    |
| PATCH  | /api/users/me/                              | Yes  | Update profile fields              |
| POST   | /api/users/me/avatar/                       | Yes  | Upload avatar image                |
| GET    | /api/users/me/settings/                     | Yes  | Get user settings                  |
| PATCH  | /api/users/me/settings/                     | Yes  | Update user settings               |
| GET    | /api/users/me/notification-prefs/           | Yes  | Get notification preferences       |
| PATCH  | /api/users/me/notification-prefs/           | Yes  | Update notification preferences    |
| POST   | /api/users/me/change-password/              | Yes  | Change password                    |
| GET    | /api/users/me/2fa/                          | Yes  | Get 2FA status                     |
| POST   | /api/users/me/2fa/setup/                    | Yes  | Generate TOTP secret + QR URI      |
| POST   | /api/users/me/2fa/verify/                   | Yes  | Verify code, enable 2FA            |
| POST   | /api/users/me/2fa/disable/                  | Yes  | Disable 2FA (requires code)        |
| GET    | /api/users/me/2fa/backup-codes/             | Yes  | Get backup codes                   |
| GET    | /api/users/me/sessions/                     | Yes  | List active sessions               |
| DELETE | /api/users/me/sessions/{id}/                | Yes  | Logout a session                   |
| GET    | /api/users/me/login-history/                | Yes  | Paginated login history            |
| POST   | /api/users/me/export-data/                  | Yes  | Request async data export          |
| POST   | /api/users/me/close-account/                | Yes  | Soft-close account                 |
| DELETE | /api/users/me/delete-account/               | Yes  | Hard delete (requires "DELETE")    |

---

### 3.3 Signup Flow

```
POST /api/auth/signup/
Body: { full_name, email, phone_number, password, confirm_password }

1. Validate unique email + phone
2. Validate password strength (min 8, uppercase, number, special char)
3. Create User (member_status=pending)
4. Create UserSettings, NotificationPreference (defaults)
5. Create Wallet (generates wallet_number: "SV XXXX XXXX XXXX")
6. Return: { access, refresh, user: {...}, wallet_number }
```

---

### 3.4 Onboarding State

Track which setup steps the user has completed:

```python
class OnboardingProgress(BaseModel):
    user                  = OneToOneField(User)
    funding_source_added  = BooleanField(default=False)
    goals_created         = BooleanField(default=False)
    autosave_configured   = BooleanField(default=False)
    completed             = BooleanField(default=False)
    completed_at          = DateTimeField(nullable=True)
```

The `/api/users/me/onboarding/` endpoint returns current step state. Frontend redirects accordingly on login.

---

## 4. App: `wallets`

### 4.1 Models

#### `Wallet`
```
Field               Type            Notes
──────────────────────────────────────────────────────────
user                OneToOneField   → User
wallet_number       CharField(20)   unique, format: SV XXXX XXXX XXXX
total_balance       DecimalField    computed property
available_balance   DecimalField    total - locked funds
status              CharField       choices: active | frozen | closed
```

> `total_balance` and `available_balance` are computed by aggregating transactions, not stored directly. Or use a cached field updated via signals.

#### `FundingSource`
```
Field               Type            Notes
──────────────────────────────────────────────────────────
wallet              ForeignKey      → Wallet
source_type         CharField       choices: bank | mobile
name                CharField(100)  bank name or provider name
account_identifier  CharField(50)   account number or phone (masked in responses)
account_holder_name CharField(100)
is_primary          BooleanField    only one can be primary per wallet
status              CharField       choices: active | inactive | verification_pending
verified_at         DateTimeField   nullable
```

---

### 4.2 API Endpoints

| Method | Endpoint                                  | Auth | Description                     |
|--------|-------------------------------------------|------|---------------------------------|
| GET    | /api/wallets/me/                          | Yes  | Get wallet info + balance       |
| GET    | /api/funding-sources/                     | Yes  | List funding sources            |
| POST   | /api/funding-sources/                     | Yes  | Add bank or mobile source       |
| PATCH  | /api/funding-sources/{id}/                | Yes  | Update source details           |
| DELETE | /api/funding-sources/{id}/                | Yes  | Remove source                   |
| POST   | /api/funding-sources/{id}/set-primary/    | Yes  | Set as primary source           |

---

### 4.3 Wallet Number Generation

```python
import random, string

def generate_wallet_number():
    digits = ''.join(random.choices(string.digits, k=12))
    return f"SV {digits[:4]} {digits[4:8]} {digits[8:12]}"
```

Called once on User creation. Must be unique — retry on collision.

---

## 5. App: `goals`

### 5.1 Models

#### `Goal` (unified model for all goal types)
```
Field                   Type            Notes
──────────────────────────────────────────────────────────────────────────
user                    ForeignKey      → User
goal_type               CharField       choices: savings | emergency | group
name                    CharField(100)
description             TextField(500)  nullable
target_amount           DecimalField
current_amount          DecimalField    default 0, updated via transactions
deadline                DateField       nullable (required for savings, forbidden for emergency)
is_locked               BooleanField    savings only — prevents early withdrawal
weight_type             CharField       choices: Percentage | Fixed Amount  (savings only)
weight_value            DecimalField    nullable (savings only)
status                  CharField       choices: active | completed | cancelled
─── Group-only fields ────────────────────────────────────────────────────
group_subtype           CharField       choices: loop | wedding | community | coinvest | custom
visibility              CharField       choices: public | invite
contribution_model      CharField       choices: open | split
withdrawal_control      CharField       choices: admin | consensus
invitation_code         CharField(8)    unique, auto-generated
```

#### `GroupParticipant`
```
Field                   Type            Notes
──────────────────────────────────────────────────────────────────
goal                    ForeignKey      → Goal (group only)
user                    ForeignKey      → User
amount_contributed      DecimalField    default 0
is_creator              BooleanField    default False
joined_at               DateTimeField   auto_now_add
```

#### `WithdrawalRequest` (group consensus requests)
```
Field               Type            Notes
───────────────────────────────────────────────────────────
goal                ForeignKey      → Goal
requested_by        ForeignKey      → User
amount              DecimalField
justification       TextField       nullable
status              CharField       choices: pending | approved | rejected
resolved_at         DateTimeField   nullable
```

#### `WithdrawalVote`
```
Field           Type
──────────────────────────────────
withdrawal_req  ForeignKey      → WithdrawalRequest
participant     ForeignKey      → User
vote            CharField       choices: approve | reject
voted_at        DateTimeField   auto_now_add
```

---

### 5.2 API Endpoints

| Method | Endpoint                                          | Auth | Description                            |
|--------|---------------------------------------------------|------|----------------------------------------|
| GET    | /api/goals/                                       | Yes  | List own goals (filter: ?type=savings) |
| POST   | /api/goals/                                       | Yes  | Create goal (any type)                 |
| GET    | /api/goals/{id}/                                  | Yes  | Goal detail                            |
| PATCH  | /api/goals/{id}/                                  | Yes  | Update goal                            |
| DELETE | /api/goals/{id}/                                  | Yes  | Cancel/delete goal                     |
| GET    | /api/goals/{id}/participants/                     | Yes  | List group participants                |
| POST   | /api/goals/join/                                  | Yes  | Join group via invitation_code         |
| POST   | /api/goals/{id}/invite/                           | Yes  | Generate/send invite link              |
| DELETE | /api/goals/{id}/participants/{user_id}/           | Yes  | Remove participant (creator only)      |
| POST   | /api/goals/{id}/contribute/                       | Yes  | Contribute to group goal               |
| POST   | /api/goals/{id}/withdrawal-requests/              | Yes  | Request group withdrawal               |
| GET    | /api/goals/{id}/withdrawal-requests/              | Yes  | List withdrawal requests               |
| POST   | /api/goals/{id}/withdrawal-requests/{rid}/vote/   | Yes  | Vote approve/reject (consensus)        |

---

### 5.3 Business Rules

```
SAVINGS GOAL
  - deadline >= today + 4 months  (enforced in serializer)
  - is_locked = True → withdrawal blocked until deadline passes
  - weight_type + weight_value determine auto-save allocation
  - Status auto-transitions to "completed" when current_amount >= target_amount

EMERGENCY FUND
  - deadline must be null
  - is_locked must be False
  - Always accessible for withdrawal

GROUP GOAL
  - Creator auto-joined as participant (is_creator=True)
  - invitation_code = random 8-char alphanumeric, unique
  - split model: each participant's share_target = target_amount / participant_count
  - consensus withdrawal: all active participants must vote approve
  - admin withdrawal: creator can withdraw immediately
  - Participant join blocked if goal status != active
```

---

### 5.4 Invitation Code Generation

```python
import secrets, string

def generate_invitation_code():
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))
```

---

## 6. App: `investments`

### 6.1 Models

#### `InvestmentFund`
```
Field           Type            Notes
──────────────────────────────────────────────────────────────────
name            CharField(100)
category        CharField       choices: Real Estate | Agriculture | Technology | Energy
annual_roi      DecimalField    e.g. 12.50
min_investment  DecimalField
risk_level      CharField       choices: Low | Medium | High
duration        CharField(50)   e.g. "12–36 months"
description     TextField
highlights      JSONField       list[str]
is_active       BooleanField    default True
```

Created by admin only. Visible to all authenticated users.

#### `Investment` (holding)
```
Field               Type            Notes
──────────────────────────────────────────────────────────────────
user                ForeignKey      → User
fund                ForeignKey      → InvestmentFund
funding_source      ForeignKey      → FundingSource
amount_invested     DecimalField
projected_return    DecimalField    computed: amount * roi / 100
projected_value     DecimalField    computed: amount + projected_return
current_value       DecimalField    updated by admin/scheduler
reference_number    CharField(12)   INV-XXXXXX, unique
invested_at         DateTimeField   auto_now_add
status              CharField       choices: active | matured | withdrawn
```

---

### 6.2 API Endpoints

| Method | Endpoint                            | Auth | Description                           |
|--------|-------------------------------------|------|---------------------------------------|
| GET    | /api/investment-funds/              | Yes  | List active funds                     |
| GET    | /api/investment-funds/{id}/         | Yes  | Fund detail                           |
| POST   | /api/investments/review/            | Yes  | Preview: return projections (no save) |
| POST   | /api/investments/                   | Yes  | Confirm and create investment         |
| GET    | /api/investments/                   | Yes  | List own holdings                     |
| GET    | /api/investments/{id}/              | Yes  | Holding detail                        |
| GET    | /api/portfolio/                     | Yes  | Aggregated portfolio summary          |
| GET    | /api/portfolio/allocation/          | Yes  | Allocation breakdown by category      |
| GET    | /api/portfolio/returns/             | Yes  | Monthly return series (?period=1Y)    |

---

### 6.3 Reference Number Generation

```python
import random, string

def generate_investment_ref():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"INV-{suffix}"
```

---

### 6.4 Portfolio Endpoint Response

```json
{
  "total_value":        2450.00,
  "change_pct":         12.9,
  "breakdown": [
    { "label": "Goals",      "amount": 1500.00, "pct": 61.2 },
    { "label": "Emergency",  "amount": 600.00,  "pct": 24.5 },
    { "label": "Investment", "amount": 350.00,  "pct": 14.3 }
  ],
  "holdings": [...],
  "monthly_returns": [
    { "month": "Jun", "value": 1900 },
    { "month": "Jul", "value": 2100 }
  ]
}
```

---

## 7. App: `autosave`

### 7.1 Models

#### `SavingPreference`
```
Field               Type            Notes
──────────────────────────────────────────────────────────────────
user                OneToOneField   → User
amount              DecimalField
amount_type         CharField       choices: Percentage | Fixed Amount
frequency           CharField       choices: Daily | Weekly | Monthly | Every 2 Months
duration_months     IntegerField    min=4
funding_sources     ManyToManyField → FundingSource
is_enabled          BooleanField    default True
next_deduction_at   DateTimeField   computed on save
commitment_end_at   DateTimeField   computed: created_at + duration_months
```

#### `DeductionLog`
```
Field               Type            Notes
──────────────────────────────────────────────────────────────────
user                ForeignKey      → User
preference          ForeignKey      → SavingPreference
scheduled_at        DateTimeField
executed_at         DateTimeField   nullable
amount              DecimalField
funding_source      ForeignKey      → FundingSource
status              CharField       choices: pending | completed | failed
failure_reason      CharField       nullable
retry_count         IntegerField    default 0, max 3
next_retry_at       DateTimeField   nullable
```

---

### 7.2 API Endpoints

| Method | Endpoint                          | Auth | Description                        |
|--------|-----------------------------------|------|------------------------------------|
| GET    | /api/saving-preferences/          | Yes  | Get own preferences                |
| POST   | /api/saving-preferences/          | Yes  | Create preferences                 |
| PATCH  | /api/saving-preferences/          | Yes  | Update preferences                 |
| PATCH  | /api/saving-preferences/toggle/   | Yes  | Enable / disable auto-save         |
| GET    | /api/saving-preferences/logs/     | Yes  | List deduction history             |

---

### 7.3 Deduction Scheduler (Celery Beat)

```python
# Runs on schedule based on each user's frequency
@app.task
def run_scheduled_deductions():
    prefs = SavingPreference.objects.filter(
        is_enabled=True,
        next_deduction_at__lte=timezone.now(),
        commitment_end_at__gt=timezone.now(),
    )
    for pref in prefs:
        process_deduction.delay(pref.id)

@app.task(bind=True, max_retries=3)
def process_deduction(self, pref_id):
    pref = SavingPreference.objects.get(id=pref_id)
    log = DeductionLog.objects.create(pref=pref, ...)
    try:
        # Charge funding source (payment gateway call)
        charge_funding_source(pref.funding_source, pref.amount)
        log.status = 'completed'
        # Distribute amount across weighted goals
        distribute_to_goals(pref.user, pref.amount)
        # Create Transaction record
        # Notify user if enabled
    except PaymentError as e:
        log.status = 'failed'
        log.retry_count += 1
        log.next_retry_at = compute_retry_time(log.retry_count)
        # Retry with exponential backoff: 1h, 3h, 24h
        raise self.retry(exc=e, countdown=RETRY_DELAYS[log.retry_count])
    finally:
        log.save()
    # Advance next_deduction_at by frequency
    pref.next_deduction_at = compute_next_deduction(pref)
    pref.save()
```

**Retry Delays:** `{1: 3600, 2: 10800, 3: 86400}` (seconds)

**Goal Distribution Logic:**

```python
def distribute_to_goals(user, total_amount):
    goals = Goal.objects.filter(user=user, status='active', goal_type='savings')
    # Sum all weights, handle Percentage vs Fixed Amount
    # Allocate proportionally; remainder goes to primary savings goal
    for goal in goals:
        allocated = compute_allocation(goal, total_amount, total_weight)
        goal.current_amount += allocated
        if goal.current_amount >= goal.target_amount:
            goal.status = 'completed'
        goal.save()
        Transaction.objects.create(type='Auto-Save', goal=goal, amount=allocated, ...)
```

---

## 8. App: `transactions`

### 8.1 Models

#### `Transaction`
```
Field                   Type            Notes
──────────────────────────────────────────────────────────────────────────
user                    ForeignKey      → User
transaction_type        CharField       choices: Auto-Save | Investment | Withdrawal | Deposit | Return
category                CharField       choices: Savings | Investment | Expense
amount                  DecimalField    always positive; direction inferred from type
description             CharField(200)
funding_source          ForeignKey      → FundingSource   nullable
destination_goal        ForeignKey      → Goal            nullable
destination_fund        ForeignKey      → InvestmentFund  nullable
status                  CharField       choices: completed | pending | failed
reference_number        CharField(20)   auto-generated, unique
platform_fee            DecimalField    default 0
net_amount              DecimalField    amount - platform_fee
```

#### `WithdrawalRequest` (user → platform)
```
Field               Type            Notes
──────────────────────────────────────────────────────────────────
user                ForeignKey      → User
amount              DecimalField
withdrawal_method   CharField       choices: Bank Transfer | Mobile Money
destination_source  ForeignKey      → FundingSource
status              CharField       choices: pending | approved | rejected | completed
admin_notes         TextField       nullable
approved_by         ForeignKey      → User (admin)   nullable
approved_at         DateTimeField   nullable
```

---

### 8.2 API Endpoints

| Method | Endpoint                                          | Auth | Description                           |
|--------|---------------------------------------------------|------|---------------------------------------|
| GET    | /api/transactions/                                | Yes  | List own transactions (with filters)  |
| GET    | /api/transactions/{id}/                           | Yes  | Transaction detail                    |
| GET    | /api/transactions/export/                         | Yes  | Download CSV/JSON export              |
| POST   | /api/withdrawals/                                 | Yes  | Request withdrawal                    |
| GET    | /api/withdrawals/                                 | Yes  | List own withdrawal requests          |
| GET    | /api/withdrawals/{id}/                            | Yes  | Withdrawal detail                     |

**Filters for /api/transactions/:**
- `?type=Auto-Save|Investment|Withdrawal|Deposit|Return`
- `?status=completed|pending|failed`
- `?category=Savings|Investment|Expense`
- `?from=YYYY-MM-DD&to=YYYY-MM-DD`

---

### 8.3 Platform Fee Calculation

```python
def apply_platform_fee(amount: Decimal, settings: PlatformSettings) -> tuple:
    fee = (amount * settings.platform_fee_percentage / 100).quantize(Decimal('0.01'))
    net = amount - fee
    return fee, net
```

---

## 9. App: `notifications`

### 9.1 Models

#### `Notification`
```
Field           Type            Notes
──────────────────────────────────────────────────────
user            ForeignKey      → User
title           CharField(200)
message         TextField
notif_type      CharField       choices: info | warning | success | error
is_read         BooleanField    default False
action_url      CharField       nullable (deep link)
```

#### `BroadcastMessage`
```
Field               Type            Notes
──────────────────────────────────────────────────────────
title               CharField(200)
message             TextField(2000)
target_audience     CharField       choices: all | active_investors | new_users | failed_deductions
notif_type          CharField       choices: info | warning | announcement | maintenance
sent_at             DateTimeField   auto_now_add
reach_count         IntegerField    computed after send
created_by          ForeignKey      → User (admin)
```

---

### 9.2 API Endpoints

| Method | Endpoint                             | Auth | Description                    |
|--------|--------------------------------------|------|--------------------------------|
| GET    | /api/notifications/                  | Yes  | List own notifications         |
| PATCH  | /api/notifications/{id}/read/        | Yes  | Mark as read                   |
| POST   | /api/notifications/read-all/         | Yes  | Mark all as read               |
| DELETE | /api/notifications/{id}/             | Yes  | Delete notification            |

---

### 9.3 Notification Triggers

| Event                         | Trigger                                        | Check Pref Field      |
|-------------------------------|------------------------------------------------|-----------------------|
| Auto-save succeeded           | After successful deduction                     | autosave_ok           |
| Auto-save failed              | After failed deduction (each attempt)          | autosave_fail         |
| Wallet deposit                | After deposit transaction                      | wallet_updates        |
| Withdrawal approved           | After admin approval                           | wallet_updates        |
| Goal milestone (25/50/75/100) | After current_amount crosses threshold         | goal_milestone        |
| Goal deadline reminder        | Celery beat: 30 days + 7 days before deadline  | goal_deadline         |
| Weekly savings report         | Every Monday 08:00                             | weekly_report         |

---

## 10. App: `admin_panel`

All endpoints require `IsAdminUser` permission.

### 10.1 Models

#### `PlatformSettings` (singleton)
```
Field                       Type            Default
──────────────────────────────────────────────────────────────────
min_saving_duration_months  IntegerField    4
max_goals_per_user          IntegerField    10
platform_fee_percentage     DecimalField    3.00
maintenance_mode_enabled    BooleanField    False
bank_linking_enabled        BooleanField    True
mobile_money_enabled        BooleanField    True
```

Singleton pattern — only one row. Use `get_or_create` with fixed pk.

---

### 10.2 API Endpoints

| Method | Endpoint                                    | Description                              |
|--------|---------------------------------------------|------------------------------------------|
| GET    | /api/admin/overview/                        | KPIs: users, savings, investments, fees  |
| GET    | /api/admin/users/                           | List users (search, filter by status)    |
| GET    | /api/admin/users/{id}/                      | User detail + activity                   |
| POST   | /api/admin/users/{id}/suspend/              | Suspend user account                     |
| POST   | /api/admin/users/{id}/activate/             | Reactivate user account                  |
| DELETE | /api/admin/users/{id}/                      | Delete user                              |
| GET    | /api/admin/funds/                           | List all investment funds                |
| POST   | /api/admin/funds/                           | Create new fund                          |
| PATCH  | /api/admin/funds/{id}/                      | Edit fund                                |
| DELETE | /api/admin/funds/{id}/                      | Delete fund                              |
| GET    | /api/admin/transactions/                    | All transactions (type + status filter)  |
| GET    | /api/admin/withdrawals/                     | All withdrawal requests (status filter)  |
| POST   | /api/admin/withdrawals/{id}/approve/        | Approve withdrawal                       |
| POST   | /api/admin/withdrawals/{id}/reject/         | Reject withdrawal (requires reason)      |
| POST   | /api/admin/broadcast/                       | Send broadcast notification              |
| GET    | /api/admin/broadcast/                       | List broadcast history                   |
| GET    | /api/admin/settings/                        | Get platform settings                    |
| PATCH  | /api/admin/settings/                        | Update platform settings                 |
| GET    | /api/admin/chart/users/                     | Monthly user signups (last 12 months)    |
| GET    | /api/admin/chart/savings/                   | Monthly savings volume (last 12 months)  |

---

### 10.3 Overview KPI Response

```json
{
  "total_users":         1284,
  "active_users":        1102,
  "new_users_this_month": 87,
  "total_savings":       284500.00,
  "total_invested":      142300.00,
  "pending_withdrawals": 3,
  "platform_revenue":    8530.00,
  "system_alerts": [
    { "level": "warning", "message": "3 withdrawal requests pending review" },
    { "level": "info",    "message": "Maintenance window scheduled in 2 days" }
  ]
}
```

---

### 10.4 Broadcast Logic

```python
TARGET_QUERYSETS = {
    'all':               lambda: User.objects.filter(member_status='active'),
    'active_investors':  lambda: User.objects.filter(investments__status='active').distinct(),
    'new_users':         lambda: User.objects.filter(created_at__gte=timezone.now()-timedelta(days=30)),
    'failed_deductions': lambda: User.objects.filter(deductionlog__status='failed').distinct(),
}

@app.task
def send_broadcast(broadcast_id):
    bc = BroadcastMessage.objects.get(id=broadcast_id)
    users = TARGET_QUERYSETS[bc.target_audience]()
    Notification.objects.bulk_create([
        Notification(user=u, title=bc.title, message=bc.message, notif_type=bc.notif_type)
        for u in users
    ])
    bc.reach_count = users.count()
    bc.save()
```

---

## 11. Authentication Strategy

### JWT via `djangorestframework-simplejwt`

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,  # requires simplejwt blacklist app
}
```

### 2FA Flow (TOTP via `pyotp`)

```
1. POST /api/users/me/2fa/setup/
   → Server generates secret, stores encrypted in TwoFactorAuth (setup_verified=False)
   → Returns: { qr_uri, secret } (QR URI for authenticator app scan)

2. POST /api/users/me/2fa/verify/  { code: "123456" }
   → Validate TOTP code against secret
   → On success: set is_enabled=True, setup_verified=True, generate 6 backup codes
   → Returns: { backup_codes: [...] }

3. On subsequent logins:
   POST /api/auth/login/ returns { requires_2fa: true, temp_token }
   POST /api/auth/2fa/complete/  { temp_token, code }
   → Returns full JWT pair on success
```

---

## 12. Permissions

```python
# common/permissions.py

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsGroupCreator(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return GroupParticipant.objects.filter(
            goal=obj, user=request.user, is_creator=True
        ).exists()

class IsGroupMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return GroupParticipant.objects.filter(
            goal=obj, user=request.user
        ).exists()
```

---

## 13. Maintenance Mode Middleware

```python
class MaintenanceModeMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        settings = PlatformSettings.get_solo()
        if settings.maintenance_mode_enabled:
            if not request.user.is_staff and not request.path.startswith('/api/auth/'):
                return JsonResponse({'detail': 'Platform under maintenance.'}, status=503)
        return self.get_response(request)
```

---

## 14. Celery Beat Schedule

```python
CELERY_BEAT_SCHEDULE = {
    'run-scheduled-deductions': {
        'task':     'autosave.tasks.run_scheduled_deductions',
        'schedule': crontab(minute='*/15'),   # every 15 minutes
    },
    'goal-deadline-reminders': {
        'task':     'notifications.tasks.send_goal_deadline_reminders',
        'schedule': crontab(hour=8, minute=0),  # daily at 08:00
    },
    'weekly-savings-report': {
        'task':     'notifications.tasks.send_weekly_reports',
        'schedule': crontab(day_of_week=1, hour=8, minute=0),  # Monday 08:00
    },
    'update-investment-values': {
        'task':     'investments.tasks.update_current_values',
        'schedule': crontab(hour=0, minute=0),  # daily midnight
    },
}
```

---

## 15. Key Validation Rules (Serializer-Level)

| Rule                                         | Where Enforced                              |
|----------------------------------------------|---------------------------------------------|
| Savings deadline >= today + 4 months         | GoalSerializer.validate_deadline            |
| Investment amount >= fund.min_investment     | InvestmentSerializer.validate_amount        |
| Withdrawal amount <= available_balance       | WithdrawalSerializer.validate_amount        |
| Password: 8+ chars, upper, number, special   | UserSerializer.validate_password            |
| Delete account requires body `{"confirm":"DELETE"}` | DeleteAccountView              |
| Duration >= 4 months                         | SavingPreferenceSerializer.validate_duration|
| Max goals per user (from PlatformSettings)   | GoalSerializer.validate                     |
| Emergency fund: deadline must be null        | GoalSerializer.validate                     |
| Group invite code unique                     | auto-generated, collision-retried           |

---

## 16. Error Response Format

All errors follow DRF standard:

```json
{
  "detail": "Human-readable message.",
  "code":   "machine_readable_code",
  "field_errors": {
    "amount": ["Ensure this value is greater than or equal to 100."]
  }
}
```

---

## 17. Environment Variables

```env
# Django
SECRET_KEY=
DEBUG=False
ALLOWED_HOSTS=

# Database
DATABASE_URL=postgresql://user:pass@host:5432/savewise

# Redis (Celery broker + cache)
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_ACCESS_LIFETIME_MINUTES=60
JWT_REFRESH_LIFETIME_DAYS=30

# Email (reset, exports, reports)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Storage (avatar uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=

# Encryption key (for TOTP secrets)
FIELD_ENCRYPTION_KEY=

# Payment gateway (plug in your provider)
PAYMENT_API_KEY=
PAYMENT_API_SECRET=
```

---

## 18. Package Requirements (base.txt)

```
Django>=5.0
djangorestframework>=3.15
djangorestframework-simplejwt>=5.3
django-cors-headers
psycopg2-binary
celery[redis]
django-celery-beat
django-celery-results
redis
Pillow                          # avatar uploads
django-storages[s3]             # S3 for media
pyotp                           # TOTP 2FA
django-encrypted-model-fields   # TOTP secret encryption
django-filter                   # DRF filtering
whitenoise                      # static files
gunicorn                        # production server
python-decouple                 # env var management
```

---

## 19. URL Structure Summary

```python
# config/urls.py
urlpatterns = [
    path('api/auth/',            include('accounts.urls.auth')),
    path('api/users/',           include('accounts.urls.users')),
    path('api/wallets/',         include('wallets.urls')),
    path('api/funding-sources/', include('wallets.urls_funding')),
    path('api/goals/',           include('goals.urls')),
    path('api/investment-funds/',include('investments.urls_funds')),
    path('api/investments/',     include('investments.urls_holdings')),
    path('api/portfolio/',       include('investments.urls_portfolio')),
    path('api/saving-preferences/', include('autosave.urls')),
    path('api/transactions/',    include('transactions.urls')),
    path('api/withdrawals/',     include('transactions.urls_withdrawals')),
    path('api/notifications/',   include('notifications.urls')),
    path('api/admin/',           include('admin_panel.urls')),
]
```

---

*Blueprint version 1.0 — covers all features visible in the SaveWise frontend as of build date.*
