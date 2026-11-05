# Salary Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed Rails + React app in which an HR Manager manages 10,000 employees' salaries across countries and answers pay questions from a dashboard.

**Architecture:** Rails 8 API (SQLite) with thin controllers over services and query objects; append-only salary history with a cached `current_salary_id`; analytics fetched in one SQL round-trip and reduced in Ruby. Vite/React SPA built into `backend/public` and served by Rails in production.

**Tech Stack:** Ruby 3.3.4, Rails 8.0, SQLite, RSpec, Faker, bcrypt. Node 22, Vite, React 18, TypeScript, Tailwind v4, shadcn/ui, react-router, TanStack Query, Recharts, Vitest, React Testing Library. Docker, Render.

**Spec:** `docs/superpowers/specs/2026-11-04-salary-manager-design.md` (and `docs/requirements.md`).

## Global Constraints

- Ruby `3.3.4` (`rbenv local 3.3.4` in `backend/`), Node `22` (`.nvmrc` = `22` in `frontend/`).
- All API routes under `/api`, JSON only, 401 when unauthenticated, 422 with `{ errors: { field: [msg] } }` on validation failure.
- Amounts are `decimal(14,2)`; USD conversion is `amount * countries.usd_rate`; every USD figure in the UI is labelled "USD (converted)".
- `effective_on` must be `<= Date.current`. `country_id` cannot change after creation. Hard delete.
- Pagination: default `per_page` 25, max 100, `page` ≥ 1.
- Tests touch no network and no wall clock (`travel_to` where dates matter).
- Commits: one per task, authored as the repo's configured user, no co-author trailers.
- Nothing from the seed is referenced by tests.

## Review Focus

1. Search input containing `%` or `_` must match literally, not as LIKE wildcards. Test in Task 7.
2. `page=0`, `page=-1`, `per_page=1000`, `per_page=abc` must clamp to valid values, never 500. Test in Task 7.
3. Deleting an employee must succeed despite the circular FK (`employees.current_salary_id` ↔ `salaries.employee_id`). Test in Task 8.
4. Creating an employee with an email that already exists must return 422, not a `RecordNotUnique` 500. Test in Task 8.
5. A group with one employee must report median = mean = that value; a department with zero employees must not appear. Test in Task 9.

---

### Task 1: Rails API skeleton

**Files:**
- Create: `backend/` via generator, `backend/.rbenv-version` (`rbenv local`), `backend/spec/rails_helper.rb`, `backend/spec/requests/health_spec.rb`, `backend/app/controllers/api/health_controller.rb`
- Modify: `backend/Gemfile`, `backend/config/routes.rb`, `backend/config/application.rb`

**Interfaces:**
- Produces: `Api::BaseController < ActionController::API` (empty for now; Task 6 adds auth). Route namespace `/api`.

- [ ] **Step 1: Generate the app**

Run from repo root:
```bash
rbenv shell 3.3.4 && gem install rails -v '~> 8.0' --no-document
rails new backend --api --database=sqlite3 --skip-test --skip-jbuilder --skip-action-mailer --skip-action-mailbox --skip-action-text --skip-active-storage --skip-action-cable --skip-solid --skip-kamal --skip-thruster --skip-git
cd backend && rbenv local 3.3.4
```

- [ ] **Step 2: Add gems**

In `Gemfile`: `bcrypt`, `faker` (all groups, needed by seed in production); group `:development, :test`: `rspec-rails`. Run `bundle install && bin/rails generate rspec:install`.

- [ ] **Step 3: Write the failing request spec**

```ruby
# spec/requests/health_spec.rb
RSpec.describe "GET /api/health" do
  it "returns ok" do
    get "/api/health"
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("status" => "ok")
  end
end
```

- [ ] **Step 4: Run it, expect routing error**

Run: `bundle exec rspec spec/requests/health_spec.rb` — Expected: FAIL, no route matches.

- [ ] **Step 5: Implement**

`Api::BaseController < ActionController::API`; `Api::HealthController#show` renders `{ status: "ok" }`; `namespace :api { get "health", to: "health#show" }` in routes.

- [ ] **Step 6: Run, expect pass**

Run: `bundle exec rspec` — Expected: 1 example, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add backend && git commit -m "chore: Rails 8 API skeleton with RSpec and health endpoint"
```

---

### Task 2: Schema and models

**Files:**
- Create: migrations for `users`, `countries`, `departments`, `employees`, `salaries`; `app/models/{user,country,department,employee,salary}.rb`; `spec/models/*_spec.rb`; `spec/support/factories.rb` (plain Ruby helpers, no FactoryBot)
- Modify: `spec/rails_helper.rb` (require support files)

**Interfaces:**
- Produces:
  - `User` with `has_secure_password`, `name`, `email` (unique, downcased).
  - `Country` with `code`, `name`, `currency_code`, `usd_rate` (decimal 12,6), `rate_as_of` (date); `has_many :employees`.
  - `Department` with `name` (unique).
  - `Employee` with `first_name`, `last_name`, `email`, `country_id`, `department_id`, `job_title`, `hired_on`, `current_salary_id` (nullable at DB level, set by Task 4 service). `belongs_to :country, :department, :current_salary (class Salary, optional)`; `has_many :salaries, dependent: :destroy`. Validates presence of all fields, email format and uniqueness (case-insensitive), `country_id` immutable on update. `def full_name`.
  - `Salary` with `employee_id`, `amount`, `currency_code`, `effective_on`, `note`, `created_by_id`; `belongs_to :employee`, `belongs_to :created_by, class_name: "User"`. Validates `amount > 0`, `amount <= 9_999_999_999.99`, `effective_on <= Date.current`.
  - `spec/support/factories.rb`: `create_user(**)`, `create_country(**)`, `create_department(**)`, `create_employee(**)` (creates country/department if not given, no salary), `create_salary(employee:, **)`.
- Schema indexes exactly as in the spec. `employees.current_salary_id` has an FK to `salaries` with `on_delete: :nullify`. `salaries.employee_id` FK with `on_delete: :cascade`.

- [ ] **Step 1: Write failing model specs**

Minimum assertions, one `it` each:
```ruby
# employee_spec.rb
it "requires first name, last name, job title and hire date"
it "rejects duplicate email ignoring case" # "A@x.com" then "a@x.com" → invalid
it "rejects changing country"              # update country_id → invalid, errors[:country_id] includes "cannot be changed"
# salary_spec.rb
it "rejects a future effective_on"         # travel_to Date.new(2026,11,5); effective_on 2026-11-06 → invalid
it "rejects zero and negative amounts"
# user_spec.rb
it "authenticates with the right password and not the wrong one"
```

- [ ] **Step 2: Run, expect failures (tables missing)**

Run: `bundle exec rspec spec/models` — Expected: errors, no such table.

- [ ] **Step 3: Write migrations and models**

Immutable country via `validate :country_unchanged, on: :update` using `country_id_changed?`.

- [ ] **Step 4: Run, expect pass**

Run: `bin/rails db:migrate && bundle exec rspec` — Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add backend && git commit -m "feat: schema and models for users, countries, departments, employees, salaries"
```

---

### Task 3: Stats module

**Files:**
- Create: `backend/app/lib/stats.rb`, `backend/spec/lib/stats_spec.rb`

**Interfaces:**
- Produces: `Stats.summarize(values : Array<Numeric>) -> { count:, total:, mean:, median:, min:, max: }` (all `BigDecimal` rounded to 2 places except count; `{ count: 0, total: 0, mean: nil, median: nil, min: nil, max: nil }` for empty).

- [ ] **Step 1: Failing specs**

```ruby
it "summarizes odd count"   { Stats.summarize([3, 1, 2]) median 2, mean 2, total 6, min 1, max 3 }
it "summarizes even count"  { Stats.summarize([1, 2, 3, 4]) median 2.5 }
it "handles empty"          { count 0, mean nil }
it "single value summary"   { [7] → mean 7, median 7 }
```

- [ ] **Step 2: Run, expect NameError** — `bundle exec rspec spec/lib/stats_spec.rb`

- [ ] **Step 3: Implement `Stats`** (pure module, no AR).

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit** — `git commit -m "feat: Stats module for mean, median, min and max"`

---

### Task 4: Salary change and employee creation services

**Files:**
- Create: `app/services/salary_change.rb`, `app/services/employee_create.rb`, `spec/services/salary_change_spec.rb`, `spec/services/employee_create_spec.rb`

**Interfaces:**
- Produces:
  - `SalaryChange.call(employee:, amount:, effective_on:, note: nil, by:) -> Salary` (raises `ActiveRecord::RecordInvalid` on invalid). Inside one transaction: insert `Salary` with `currency_code: employee.country.currency_code`, then set `employee.current_salary` to the salary with greatest `[effective_on, id]` among the employee's salaries.
  - `EmployeeCreate.call(attrs:, salary: { amount:, effective_on: }, by:) -> Employee` in one transaction: saves employee, calls `SalaryChange`. Raises `RecordInvalid` with errors merged so a bad salary surfaces as `salary.amount` / `salary.effective_on` keys.

- [ ] **Step 1: Failing specs**

```ruby
# salary_change_spec.rb (wrap in travel_to Date.new(2026, 11, 5))
it "appends a row and makes it current"
it "copies currency from the employee's country"      # country currency INR → salary.currency_code "INR"
it "keeps the newer row current when backdating"      # existing 2026-10-01, add 2026-06-01 → current unchanged
it "breaks same-day ties by id"                       # two rows same date → latest id is current
it "rejects future effective_on"                      # raises RecordInvalid, no row inserted
it "records who made the change"                      # created_by == user
# employee_create_spec.rb
it "creates employee with current salary"             # current_salary.amount == 50000, salaries.count == 1
it "rolls back employee when salary invalid"          # Employee.count stays 0, errors include "salary.amount"
```

- [ ] **Step 2: Run, expect NameError**

- [ ] **Step 3: Implement both services**

- [ ] **Step 4: Run, expect pass** — `bundle exec rspec spec/services`

- [ ] **Step 5: Commit** — `git commit -m "feat: SalaryChange and EmployeeCreate services with append-only history"`

---

### Task 5: Seed script

**Files:**
- Create: `backend/db/seeds.rb`, `backend/db/seeds/reference_data.rb` (countries, departments, titles, bands), `backend/spec/seeds/reference_data_spec.rb`

**Interfaces:**
- Produces: `bin/rails db:seed` creating 1 user (`hr@acme.example`, password `ENV.fetch("SEED_HR_PASSWORD", "acme-hr-2026")`), 8 countries, 10 departments, 10,000 employees, 1–3 salaries each, `current_salary_id` set. Idempotent: exits early if `Employee.count > 0`.
- `SeedData::COUNTRIES`: `[code, name, currency, usd_rate]` for US 1.0, IN 0.0120, GB 1.27, DE 1.08, CA 0.72, AU 0.65, SG 0.74, BR 0.17; `rate_as_of` 2026-11-01. `SeedData::COST_MULTIPLIER` per country (US 1.0, GB 0.85, DE 0.8, CA 0.8, AU 0.85, SG 0.8, BR 0.35, IN 0.25). `SeedData::DEPARTMENTS` (10), each with job titles as `[title, usd_band]` pairs (e.g. Engineering: `["Junior Software Engineer", 60_000], ["Software Engineer", 95_000], ["Senior Software Engineer", 135_000], ["Engineering Manager", 170_000]`). `SeedData.salary_for(usd_band:, country_code:, rng:) -> BigDecimal` = band × multiplier × jitter in 0.85..1.15 / usd_rate, rounded to 2 places.

- [ ] **Step 1: Failing spec for `SeedData.salary_for`**

```ruby
it "is deterministic for a given rng seed"          # same Random.new(1) twice → equal
it "scales by country and band"                     # band 135k in IN (local INR) > band 60k in IN; band 135k US > band 135k IN in USD terms
```

- [ ] **Step 2: Run, expect NameError**

- [ ] **Step 3: Implement `reference_data.rb` and `seeds.rb`**

Seed uses `Faker::Config.random = Random.new(42)`, builds employee hashes in memory, `Employee.insert_all` in 1,000-row batches, then salaries via `Salary.insert_all`, then one `UPDATE employees SET current_salary_id = (SELECT id FROM salaries s WHERE s.employee_id = employees.id ORDER BY effective_on DESC, id DESC LIMIT 1)`. Country weights: US 30%, IN 25%, GB 12%, DE 10%, CA 8%, AU 6%, SG 5%, BR 4%. Hire dates 2012-01-01..2026-10-31; salary history rows spaced 12–24 months apart, each earlier one 4–12% lower.

- [ ] **Step 4: Run seed and verify**

Run: `bin/rails db:seed && bin/rails runner 'puts Employee.count, Employee.where(current_salary_id: nil).count, Salary.count'`
Expected: `10000`, `0`, between 10000 and 30000. Note wall time in the commit message.

- [ ] **Step 5: Run spec, commit** — `git commit -m "feat: deterministic seed with 10,000 employees across 8 countries"`

---

### Task 6: Session authentication

**Files:**
- Create: `app/controllers/api/sessions_controller.rb`, `spec/requests/sessions_spec.rb`, `spec/support/auth_helpers.rb`
- Modify: `app/controllers/api/base_controller.rb`, `config/application.rb` (cookie + session middleware), `config/routes.rb`

**Interfaces:**
- Produces: `Api::BaseController` with `before_action :require_login`, `current_user`, `include ActionController::Cookies`. Session cookie store, `same_site: :lax`, `httponly: true`. Routes: `resource :session, only: [:show, :create, :destroy]`. `spec/support/auth_helpers.rb`: `sign_in(user)` performs `post "/api/session"`.
- JSON user shape: `{ id, name, email }`.

- [ ] **Step 1: Failing request specs**

```ruby
it "logs in with valid credentials and returns the user"     # 200, body id/name/email
it "rejects bad password"                                     # 401
it "GET /api/session returns 401 when logged out"
it "GET /api/session returns the user after login"
it "DELETE /api/session logs out"                             # subsequent GET → 401
it "protects other endpoints"                                 # GET /api/health stays public; add Task 7's index later
```

- [ ] **Step 2: Run, expect failures**

- [ ] **Step 3: Implement** — `skip_before_action :require_login` on `sessions#create` and `health#show`. Email lookup is case-insensitive.

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit** — `git commit -m "feat: cookie session authentication for the HR manager"`

---

### Task 7: Meta and employee search

**Files:**
- Create: `app/services/employee_search.rb`, `app/controllers/api/meta_controller.rb`, `app/controllers/api/employees_controller.rb` (index only), `app/serializers/employee_serializer.rb` (plain module), `spec/services/employee_search_spec.rb`, `spec/requests/meta_spec.rb`, `spec/requests/employees_index_spec.rb`

**Interfaces:**
- Produces:
  - `EmployeeSearch.new(params) -> #relation, #page, #per_page, #total`. Params: `q`, `country` (code), `department` (id), `sort` in `%w[name salary hired_on]` (default `name`), `dir` in `%w[asc desc]`, `page`, `per_page`. `relation` is `Employee.includes(:country, :department, :current_salary)` ordered; sort by `salary` orders by `salaries.amount * countries.usd_rate` via joins.
  - `EmployeeSerializer.summary(employee) -> Hash`: `{ id, first_name, last_name, full_name, email, country: {code, name, currency_code}, department: {id, name}, job_title, hired_on, salary: { amount, currency_code, effective_on, usd: amount*rate rounded 2 } }`.
  - `GET /api/employees` → `{ data: [summary...], meta: { page, per_page, total, total_pages } }`.
  - `GET /api/meta` → `{ countries: [{id, code, name, currency_code, usd_rate, rate_as_of}], departments: [{id, name}] }`.

- [ ] **Step 1: Failing specs**

```ruby
# employee_search_spec.rb
it "matches name and email case-insensitively"
it "treats % and _ in q literally"                     # employee "50% Off" exists; q "%" matches only it, not everyone
it "filters by country and department together"
it "sorts by USD salary desc across currencies"         # INR 8,000,000 (≈96k USD) sorts above USD 90,000
it "clamps page and per_page"                           # page "0" → 1; per_page "1000" → 100; per_page "abc" → 25
# employees_index_spec.rb
it "requires login"                                     # 401
it "returns paginated summaries with meta"
# meta_spec.rb
it "returns countries and departments"
```

- [ ] **Step 2: Run, expect failures**

- [ ] **Step 3: Implement** — use `Employee.sanitize_sql_like` for `q`.

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit** — `git commit -m "feat: employee search with filters, sorting and pagination"`

---

### Task 8: Employee CRUD and salary endpoints

**Files:**
- Create: `app/controllers/api/salaries_controller.rb`, `spec/requests/employees_crud_spec.rb`, `spec/requests/salaries_spec.rb`
- Modify: `app/controllers/api/employees_controller.rb` (show/create/update/destroy), `app/serializers/employee_serializer.rb` (`detail`), `config/routes.rb`

**Interfaces:**
- Produces:
  - `EmployeeSerializer.detail(employee)` = `summary` + `salary_history: [{ id, amount, currency_code, usd, effective_on, note, created_by: {id, name}, created_at }]` ordered newest first.
  - `GET /api/employees/:id` → detail. 404 `{ errors: { base: ["not found"] } }`.
  - `POST /api/employees` body `{ employee: { first_name, last_name, email, country_id, department_id, job_title, hired_on }, salary: { amount, effective_on, note } }` → 201 detail.
  - `PATCH /api/employees/:id` body `{ employee: {...} }`; `country_id` present → 422 `errors.country_id`.
  - `DELETE /api/employees/:id` → 204.
  - `POST /api/employees/:id/salaries` `{ salary: { amount, effective_on, note } }` → 201 detail.
  - Rescue `ActiveRecord::RecordInvalid` → 422, `ActiveRecord::RecordNotFound` → 404, `ActionController::ParameterMissing` → 400 in `BaseController`.

- [ ] **Step 1: Failing specs**

```ruby
it "creates an employee with initial salary"              # 201, salary_history size 1
it "returns 422 for duplicate email"                      # not 500
it "returns 422 for invalid salary on create"             # errors["salary.amount"]
it "updates profile fields"
it "rejects country change with 422"
it "deletes an employee and its salaries"                 # 204; Salary.where(employee_id:).count == 0
it "adds a salary and repoints current"
it "rejects future salary with 422"                       # errors.effective_on
it "shows history newest first with usd"
```

- [ ] **Step 2: Run, expect failures**

- [ ] **Step 3: Implement** — destroy: `employee.update_column(:current_salary_id, nil)` then `destroy` is unnecessary because the FK nullifies; verify the test passes with plain `destroy` and `dependent: :destroy`, otherwise null it first in a transaction.

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit** — `git commit -m "feat: employee CRUD and salary change endpoints"`

---

### Task 9: Analytics queries and endpoints

**Files:**
- Create: `app/queries/analytics/overview.rb`, `app/queries/analytics/group_stats.rb`, `app/queries/analytics/extremes.rb`, `app/controllers/api/analytics_controller.rb`, `spec/queries/analytics_spec.rb`, `spec/requests/analytics_spec.rb`

**Interfaces:**
- Produces (all USD, 2 dp, keyed as in the spec):
  - `Analytics::Overview.call -> { headcount:, total_payroll_usd:, mean_usd:, median_usd:, countries:, departments: }`.
  - `Analytics::GroupStats.call(by:) -> Array<{ key:, label:, headcount:, total_usd:, mean_usd:, median_usd:, min_usd:, max_usd: }>` sorted by `total_usd` desc; `by` in `%w[country department]`, otherwise `ArgumentError` → 400.
  - `Analytics::Extremes.call(limit: 10) -> { top: [summary...], bottom: [summary...] }`.
  - Each query runs exactly one SQL statement fetching `(group_key, amount * usd_rate)` pairs, then `Stats`.
  - Routes: `get "analytics/overview"`, `"analytics/groups"`, `"analytics/extremes"`.

- [ ] **Step 1: Failing specs** with a fixture of 5 employees across 2 countries (US rate 1.0, IN rate 0.01) and 2 departments, amounts chosen so answers are hand-checkable:

```ruby
it "overview converts to USD"                            # IN 5,000,000 → 50,000 USD counted in total
it "group by country gives per-country median"
it "single-member group has median == mean"
it "omits departments with no employees"
it "extremes returns top and bottom by USD"
it "groups rejects unknown dimension with 400"
it "runs one query per endpoint"                          # expect { ... }.to make_database_queries(count: 1) OR count via ActiveSupport::Notifications subscriber
```

- [ ] **Step 2: Run, expect failures**

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run, expect pass**; also `bin/rails runner` timing against the seed: each endpoint < 100 ms, record numbers for Task 15.

- [ ] **Step 5: Commit** — `git commit -m "feat: analytics overview, group stats and extremes"`

---

### Task 10: Frontend skeleton and API client

**Files:**
- Create: `frontend/` via `npm create vite@latest frontend -- --template react-ts`; `frontend/.nvmrc`; `frontend/src/api/client.ts`, `frontend/src/api/types.ts`, `frontend/src/api/employees.ts`, `frontend/src/api/analytics.ts`, `frontend/src/api/session.ts`, `frontend/src/lib/money.ts`, `frontend/src/components/Money.tsx`, `frontend/src/test/setup.ts`, `frontend/src/lib/money.test.ts`, `frontend/src/components/Money.test.tsx`
- Modify: `frontend/vite.config.ts` (proxy `/api` → `http://localhost:3000`, `build.outDir: "../backend/public"`, `emptyOutDir: true`, vitest config with jsdom), `frontend/package.json` scripts (`test`, `build`), `backend/.gitignore` (ignore `public/*` except `.keep`)

**Interfaces:**
- Produces:
  - Tailwind v4 + shadcn/ui initialised (`button card dialog input label select table badge alert pagination skeleton`).
  - `api<T>(path, init?) : Promise<T>` throws `ApiError { status, errors }`; on 401 dispatches `window.dispatchEvent(new Event("unauthorized"))`.
  - `types.ts` mirrors Task 7/8/9 JSON shapes (`EmployeeSummary`, `EmployeeDetail`, `SalaryRow`, `Meta`, `Page<T>`, `Overview`, `GroupStat`, `Extremes`).
  - `formatMoney(amount: string|number, currency: string) : string` via `Intl.NumberFormat("en-US", { style: "currency", currency })`.
  - `<Money amount currency usd? />` renders local amount and, when `usd` is given, a muted `"≈ $96,000.00 USD (converted)"` line.

- [ ] **Step 1: Scaffold, install** (`react-router-dom @tanstack/react-query recharts`; dev: `vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`).

- [ ] **Step 2: Failing tests**

```ts
test("formats INR with symbol and two decimals")       // formatMoney(8000000, "INR") → "₹8,000,000.00"
test("Money shows local and labelled USD")             // renders both strings, label contains "USD (converted)"
test("Money hides USD line when not provided")
test("api throws ApiError with errors on 422")         // mock fetch
test("api emits unauthorized on 401")
```

- [ ] **Step 3: Run, expect fail** — `npm test`

- [ ] **Step 4: Implement**

- [ ] **Step 5: Run tests and `npm run build`**, expect pass and `backend/public/index.html` produced.

- [ ] **Step 6: Commit** — `git commit -m "chore: Vite React TypeScript skeleton with shadcn, API client and Money"`

---

### Task 11: Login and employee directory UI

**Files:**
- Create: `src/App.tsx` (router, QueryClient, auth gate), `src/pages/Login.tsx`, `src/pages/Employees.tsx`, `src/components/EmployeeTable.tsx`, `src/components/EmployeeFilters.tsx`, `src/components/Layout.tsx` (nav: Employees, Dashboard, logout), `src/lib/query-string.ts`, `src/lib/query-string.test.ts`, `src/components/EmployeeTable.test.tsx`, `src/pages/Login.test.tsx`

**Interfaces:**
- Produces: routes `/login`, `/employees` (default), `/employees/new`, `/employees/:id`, `/dashboard`. Unauthenticated → redirect to `/login`. `useSearchState()` reads/writes `q, country, department, sort, dir, page` from URL. Table columns: id, name, country, department, title, salary (local + USD line), hired. Row click → detail.

- [ ] **Step 1: Failing tests**

```ts
test("parses and serialises search params with defaults")  // page defaults 1
test("EmployeeTable renders a row per employee with Money")
test("Login submits credentials and navigates on success")  // mocked api
test("Login shows error on 401")
```

- [ ] **Step 2: Run, fail** — **Step 3: Implement** — **Step 4: Run, pass** — manual check against `bin/rails s` + `npm run dev`.

- [ ] **Step 5: Commit** — `git commit -m "feat: login and employee directory with search, filters and pagination"`

---

### Task 12: Employee detail, create, edit, salary change UI

**Files:**
- Create: `src/pages/EmployeeDetail.tsx`, `src/pages/EmployeeNew.tsx`, `src/components/EmployeeForm.tsx`, `src/components/SalaryHistory.tsx`, `src/components/SalaryChangeDialog.tsx`, `src/components/ConfirmDelete.tsx`, tests `EmployeeForm.test.tsx`, `SalaryChangeDialog.test.tsx`

**Interfaces:**
- Produces: `EmployeeForm({ mode: "create" | "edit", initial?, meta, onSubmit })` — in edit mode the country field is disabled with hint "Country cannot be changed". Create mode includes initial salary amount + effective date (max = today). Server 422 errors render under fields. `SalaryChangeDialog` posts to `/api/employees/:id/salaries` and invalidates the employee query. `ConfirmDelete` navigates to `/employees` after 204.

- [ ] **Step 1: Failing tests**

```ts
test("create form submits employee and salary payload in the API shape")
test("edit form disables country")
test("shows server field errors")                          // 422 errors.email → text under email
test("salary dialog rejects empty amount client-side and submits valid payload")
```

- [ ] **Steps 2–4: fail, implement, pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: employee detail, create, edit and salary change"`

---

### Task 13: Dashboard UI

**Files:**
- Create: `src/pages/Dashboard.tsx`, `src/components/StatCard.tsx`, `src/components/GroupTable.tsx`, `src/components/GroupBarChart.tsx`, `src/components/ExtremesTable.tsx`, tests `GroupTable.test.tsx`, `Dashboard.test.tsx`

**Interfaces:**
- Produces: dashboard sections in order: overview cards (headcount, total payroll, mean, median — all "USD (converted)"), group stats with a `by` toggle (country / department) shown as a bar chart of median and a table, top/bottom 10 tables. Charts via Recharts `BarChart`. Loading via `Skeleton`, errors via `Alert`.

- [ ] **Step 1: Failing tests**

```ts
test("GroupTable renders one row per group with USD label")
test("Dashboard switches group dimension and refetches")   // mocked api called with by=department
```

- [ ] **Steps 2–4: fail, implement, pass.**

- [ ] **Step 5: Commit** — `git commit -m "feat: pay analytics dashboard"`

---

### Task 14: Production build, Docker, Render

**Files:**
- Create: `Dockerfile` (repo root), `render.yaml`, `backend/bin/docker-entrypoint` (modify generated), `backend/app/controllers/spa_controller.rb`, `backend/spec/requests/spa_spec.rb`
- Modify: `backend/config/routes.rb` (catch-all `get "*path", to: "spa#index", constraints: ->(r) { !r.path.start_with?("/api") }`), `backend/config/environments/production.rb` (`public_file_server.enabled = true`), `frontend/src/pages/Login.tsx` (notice: "Demo data resets when the server restarts.")

**Interfaces:**
- Produces: `docker build -t acme-salary .` then `docker run -p 3000:3000 -e SECRET_KEY_BASE=x acme-salary` serves the app at `/` and seeds on first boot. Entrypoint: `bin/rails db:prepare` then `bin/rails db:seed` (idempotent) then exec Puma. `render.yaml`: one `web` service, `env: docker`, `plan: free`, env vars `SECRET_KEY_BASE` (generate), `SEED_HR_PASSWORD` (sync false), `RAILS_ENV=production`.

- [ ] **Step 1: Failing spec** — `GET /employees/42` (no login) returns 200 with `text/html` when `public/index.html` exists (write a temp file in the spec); `GET /api/nope` returns 404 JSON.

- [ ] **Step 2–4: implement, pass, `docker build` succeeds locally, container answers `/api/health`.**

- [ ] **Step 5: Commit** — `git commit -m "chore: production Dockerfile, SPA fallback and Render config"`

- [ ] **Step 6: Deploy** — user creates the Render service from the repo (Blueprint). Record the URL in README.

---

### Task 15: README, AI usage notes, performance, demo script

**Files:**
- Create: `README.md`, `docs/ai-usage.md`, `docs/performance.md`, `docs/demo-script.md`, `CLAUDE.md` (project conventions used during the build)

**Interfaces:**
- README: what it is, live URL + login, local setup (`backend`: `bundle`, `db:prepare`, `db:seed`, `rails s`; `frontend`: `npm i`, `npm run dev`), test commands, repo map, links to the three docs.
- `ai-usage.md`: tools used, how the work was split (decisions by the author, generation and tests by the tool, review by the author), the prompts/instructions that shaped the build, and what was corrected.
- `performance.md`: seed time, endpoint timings from Task 9 against 10k rows, the scaling notes from the spec.
- `demo-script.md`: 3-minute walkthrough order for the video.

- [ ] **Step 1: Write all five.** — **Step 2: `bundle exec rspec` and `npm test` green; `git status` clean.**

- [ ] **Step 3: Commit** — `git commit -m "docs: README, AI usage, performance notes and demo script"`
