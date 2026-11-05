# Salary Manager — Design

Companion to [requirements.md](requirements.md). This records the technical decisions, the reasoning, and what is left to implementation.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Ruby 3.3, Rails 8 (API mode), SQLite | Rails is the role's stack. SQLite keeps setup to zero and handles 10k rows and this read pattern comfortably. |
| Frontend | React 18, TypeScript, Vite | Fast dev loop, typed API client. |
| UI kit | shadcn/ui on Tailwind, Recharts for charts | Composable, accessible, small bundle. Charts limited to bar charts, which Recharts does well. |
| Tests | RSpec (models, services, requests); Vitest + React Testing Library | Standard, fast, deterministic. |
| Seed data | Faker with a fixed random seed | Reproducible 10k dataset. |
| Hosting | Render, single web service via Dockerfile | Rails serves the built React bundle from `public/`, so one deploy, no CORS. |

## Repository layout

```
acme-salary/
  backend/     Rails API (serves frontend build in production)
  frontend/    Vite + React app
  docs/        requirements, design, AI usage notes
  Dockerfile   multi-stage: build frontend, then Rails image with bundle copied in
```

In development, Vite runs on :5173 and proxies `/api/*` to Rails on :3000. In production the compiled frontend lives in `backend/public` and Rails serves `index.html` for any non-API route.

## Data model

```
users          id, name, email (uniq), password_digest
countries      id, code (uniq, ISO-2), name, currency_code, usd_rate (decimal 12,6), rate_as_of (date)
departments    id, name (uniq)
employees      id, first_name, last_name, email (uniq),
               country_id, department_id, job_title,
               hired_on, current_salary_id (FK -> salaries)
salaries       id, employee_id, amount (decimal 14,2), currency_code,
               effective_on, note, created_by_id (-> users), created_at
```

Decisions:

- **Salary history is append-only.** A salary change inserts a `salaries` row; nothing is updated in place. `employees.current_salary_id` points at the row with the latest `effective_on` (ties broken by `id`) and is maintained by the `SalaryChange` service on every insert. This denormalisation makes the directory and every analytic a single join instead of a correlated subquery, which matters at 10k rows with grouping.
- **No future-dated salaries.** `effective_on` must be on or before today, for the initial salary too. There is no scheduler to promote a scheduled raise to "current", and a lazily computed "current" would defeat the FK above. Scheduled raises are a documented exclusion. Consequence: every employee always has a `current_salary_id`, so headcount and payroll never have to handle NULL.
- **Country is immutable after creation.** Exchange rates are keyed by country, so changing an employee's country would re-rate their whole history. A relocation (new currency, new pay) is an offboarding/onboarding event, out of scope. `PATCH` rejects `country_id`.
- **Employees are identified by their record id**, shown in the UI as `#1234`. A separate HR-facing staff number is not needed in this scope.
- **Amounts are decimals, not integer cents.** Currencies differ in minor-unit precision (JPY has none). `decimal(14,2)` is exact and avoids per-currency scaling logic.
- **Currency is stored on the salary row,** copied from the country at creation time, so a history row stays correct if the country's currency ever changed.
- **Exchange rates live on `countries`.** One currency per country is an accepted simplification. `usd_rate` is "USD per 1 unit of local currency", dated by `rate_as_of`. Conversion is `amount * usd_rate`, done in SQL for analytics and in a `Money` helper for display.
- **Delete is hard** and cascades to salaries. Rationale is in the requirements doc.

Indexes: `employees(country_id)`, `employees(department_id)`, `employees(last_name, first_name)`, `employees(email)`, `salaries(employee_id, effective_on)`.

## Backend structure

```
app/controllers/api/   session, employees, salaries, analytics, meta
app/models/            User, Country, Department, Employee, Salary
app/services/          SalaryChange (insert + repoint current), EmployeeSearch (filters/sort/pagination)
app/queries/           Analytics::Overview, Analytics::GroupStats, Analytics::Extremes
app/lib/               Stats (mean, median, min, max over an array)
```

- Controllers are thin: parse params, call a service or query, render JSON via plain serializer methods (`as_api_json`). No serialization gem.
- `EmployeeSearch` builds one `ActiveRecord::Relation` from `q`, `country`, `department`, `sort`, `dir`, `page`, `per_page`. Search is `LIKE` on name/email; adequate for 10k rows and documented as the point you would move to FTS5.
- Analytics queries fetch converted amounts grouped by dimension in one SQL statement, then compute mean/median/min/max in Ruby via `Stats`. At 10k rows this is a few milliseconds and keeps the median logic unit-testable and database-independent. At 1M rows the same shape pushes into SQL window functions; noted in the performance section.

## API

All under `/api`, JSON, cookie session. Unauthenticated requests get 401.

```
POST   /api/session                  { email, password }
DELETE /api/session
GET    /api/session                  current user

GET    /api/meta                     countries, departments

GET    /api/employees                ?q=&country=&department=&sort=&dir=&page=&per_page=
POST   /api/employees                profile + initial salary
GET    /api/employees/:id            profile, current salary, salary history
PATCH  /api/employees/:id            profile fields only (not country, not salary)
DELETE /api/employees/:id

POST   /api/employees/:id/salaries   { amount, effective_on, note }

GET    /api/analytics/overview       headcount, total payroll USD, avg/median USD
GET    /api/analytics/groups?by=country|department
                                     per group: headcount, total, mean, median, min, max (USD)
GET    /api/analytics/extremes       top 10 and bottom 10 by USD salary
```

Validation errors return 422 with `{ errors: { field: [messages] } }`.

Auth: `has_secure_password`, Rails cookie session with `SameSite=Lax`, which blocks cross-site POSTs in current browsers. CSRF tokens are not added; this is documented as acceptable for a same-origin single-user tool.

## Frontend structure

```
src/api/        typed fetch client, one function per endpoint
src/pages/      Login, Employees, EmployeeDetail, EmployeeNew, Dashboard
src/components/ EmployeeTable, EmployeeForm, SalaryHistory, SalaryChangeDialog, StatCard, GroupTable, GroupBarChart
src/lib/        money formatting, query-string helpers
```

- Routing with react-router. Server state with TanStack Query (caching, invalidation after mutations).
- Every USD figure is rendered through one `Money` component that labels it "USD (converted)" and shows the local amount where available.
- Table state (filters, sort, page) lives in the URL so views are shareable and the back button works.

## Seed

`db/seeds.rb` with `Faker::Config.random = Random.new(42)`:

- 8 countries with currencies and fixed rates dated 2026-11-01: US (USD), IN (INR), GB (GBP), DE (EUR), CA (CAD), AU (AUD), SG (SGD), BR (BRL).
- 10 departments.
- 10,000 employees distributed unevenly across countries and departments to make analytics interesting.
- Salary = USD band for the job title's seniority (junior / mid / senior / lead, implied by the title) × country cost multiplier × random jitter, converted to local currency. Each employee gets 1–3 history rows with earlier, lower salaries.
- Inserted with `insert_all` in batches of 1,000; whole seed runs in a few seconds.
- One HR Manager user: `hr@acme.example` / password from `SEED_HR_PASSWORD` env (default documented).

## Testing

Backend (RSpec):
- Model validations and uniqueness.
- `SalaryChange`: appends history, repoints `current_salary_id` (including an older effective date that does not become current), rejects future effective dates, attributes to user.
- `Stats`: mean, median (odd/even), min, max, empty input.
- Analytics queries against a small fixture set with known answers, including currency conversion.
- Request specs for every endpoint: auth required, happy path, validation errors, pagination and filter combinations.

Frontend (Vitest + RTL):
- `Money` formatting and labelling.
- `EmployeeForm` validation and submit payload.
- `EmployeeTable` renders rows, filter changes update URL.
- API client error handling (401 redirects to login).

Tests use no network, no time dependence (`travel_to` where dates matter), no seed data.

## Performance

- 10k rows: every list and analytic endpoint targets < 100 ms on SQLite with the indexes above; measured and recorded in `docs/performance.md`.
- Pagination capped at 100 per page.
- Analytics do one SQL round-trip each; Ruby-side stats over ≤ 10k floats.
- Known scaling edge: `LIKE` search and Ruby-side medians are fine to ~100k employees; beyond that, FTS5 and SQL window functions. Documented, not built.

## Deployment

- Rails 8's generated Dockerfile, extended with a Node stage that builds the frontend and copies `dist/` into `backend/public`.
- Render free web service. The free tier has no persistent disk, no pre-deploy hook, and spins the container down after ~15 minutes idle. So the container entrypoint runs `db:prepare` and, if the employees table is empty, `db:seed` (a few seconds) before booting Puma. Edits survive while the instance is up and are lost on the next cold start. Stated plainly on the demo's login page. Upgrading to a paid instance with a disk removes this without code changes.
- Secrets: `SECRET_KEY_BASE`, `SEED_HR_PASSWORD` as Render env vars.

## Commit plan

1. docs: requirements and design
2. chore: Rails API skeleton, SQLite, RSpec
3. feat: schema and models with validations and tests
4. feat: seed script, 10k employees
5. feat: session auth
6. feat: employee search API with tests
7. feat: employee CRUD and salary change API with tests
8. feat: analytics queries and endpoints with tests
9. chore: Vite + React + shadcn skeleton, API client
10. feat: login and employee directory UI
11. feat: employee detail, edit, salary change UI
12. feat: dashboard UI
13. chore: Dockerfile, Render config, deploy
14. docs: AI usage notes, performance numbers, README, demo script

## Left to implementation

- Exact shadcn components and Tailwind theme.
- Tie-break when two salary rows share an `effective_on`: highest `id` wins.
- Salary input validation bounds (positive, ≤ 9,999,999,999.99).
