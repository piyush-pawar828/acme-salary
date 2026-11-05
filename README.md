# ACME Salary Manager

Web application for ACME's HR Manager to manage salary records for 10,000 employees across eight countries and answer questions about how the organisation pays people. Built as a take-home assessment.

**Live demo:** https://acme-salary-3woe.onrender.com · sign in with `hr@acme.example` / `acme-hr-2026` (demo data only). Hosted on Render's free tier, so the first request after a period of inactivity takes 30 to 60 seconds while the service wakes and reseeds.

## What it does

- **Employee directory**: search by name or email, filter by country and department, sort by name, salary (USD-converted) or hire date. State lives in the URL.
- **Employee record**: profile, current salary, full salary history with who recorded each change and when. Add, edit (country is immutable), delete with confirmation.
- **Salary changes**: append-only history with effective dates. The previous salary is never overwritten.
- **Multi-currency**: salaries are stored in local currency. A fixed, dated exchange rate table converts to USD for comparison; every converted figure is labelled "USD (converted)".
- **Dashboard**: headcount, total payroll, median and average pay; per-country and per-department breakdowns with a chart and table; highest and lowest paid.

The scope, the deliberate exclusions and the reasoning are in [docs/requirements.md](docs/requirements.md).

## Stack

| Layer | Choice |
|---|---|
| Backend | Ruby 3.3, Rails 8.1 (API mode), SQLite, RSpec |
| Frontend | React 19, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Recharts, Vitest |
| Deploy | Docker image serving the compiled frontend from Rails, Render blueprint |

## Running locally

Prerequisites: Ruby 3.3.4, Node 22, SQLite.

```bash
# Backend (port 3000)
cd backend
bundle install
bin/rails db:prepare db:seed      # 10,000 employees, ~1.5s
bin/rails server

# Frontend (port 5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with `hr@acme.example` / `acme-hr-2026` (override with `SEED_HR_PASSWORD` before seeding).

### Production build

```bash
docker build -t acme-salary .
docker run -p 3000:3000 -e SECRET_KEY_BASE=$(openssl rand -hex 64) acme-salary
```

The container prepares and seeds the database on first boot, then serves everything on port 3000.

## Tests

```bash
cd backend && bundle exec rspec      # models, services, queries, request specs
cd frontend && npm test              # components, pages, API client
```

Both suites run in a few seconds, use no network and no wall clock, and never depend on the seed data.

## Repository map

```
backend/
  app/controllers/api/   thin JSON controllers
  app/services/          SalaryChange, EmployeeCreate, EmployeeSearch
  app/queries/analytics/ Overview, GroupStats, Extremes (one SQL round-trip each)
  app/lib/stats.rb       mean / median / min / max
  db/seeds.rb            deterministic 10k-employee seed
  spec/                  RSpec suite
frontend/
  src/api/               typed fetch client, one module per resource
  src/pages/             Login, Employees, EmployeeDetail, EmployeeNew, Dashboard
  src/components/        tables, forms, dialogs, Money
docs/
  requirements.md        one-page requirements (written before building)
  design.md              architecture, data model, API, trade-offs
  plan.md                task-by-task implementation plan
  performance.md         measured timings on 10,000 rows
  ai-usage.md            how AI tools were used
  demo-script.md         walkthrough for the demo video
```
