# Performance notes

Measured on the 10,000-employee seed (18,199 salary rows) on an Apple Silicon laptop, SQLite, single process, after one warm-up call. Times are for the Ruby query layer, excluding HTTP.

| Operation | Time |
|---|---|
| Seed 10,000 employees + salary history | 1.2–1.4 s |
| `GET /api/analytics/overview` | 13 ms |
| `GET /api/analytics/groups?by=country` | 19 ms |
| `GET /api/analytics/groups?by=department` | 20 ms |
| `GET /api/analytics/extremes` | 16 ms |
| Directory, first page, no filter | 3 ms |
| Directory, `q=smith`, sorted by USD salary | 5 ms |
| Directory, country + department filter | 2 ms |

## What makes it fast

- **`employees.current_salary_id`** is a cached pointer maintained on every salary insert, so the directory and every analytic join one salary row per employee instead of running a correlated "latest row" subquery.
- **Currency conversion happens in SQL** (`salaries.amount * countries.usd_rate`), so sorting by USD salary and fetching analytics are single statements.
- **Analytics fetch once, reduce in Ruby.** Each endpoint runs exactly one SQL statement (asserted in the specs) and computes mean/median/min/max over at most 10,000 numbers in memory. That keeps the median logic database-independent and unit-testable.
- **Indexes** on `employees(country_id)`, `employees(department_id)`, `employees(last_name, first_name)`, `employees(email)` and `salaries(employee_id, effective_on)`.
- **Pagination** is capped at 100 rows per page.

## Where it would need to change

- **Search** uses `LIKE` on name and email. Fine to roughly 100k rows; beyond that, SQLite FTS5 or a Postgres trigram index.
- **Medians in Ruby** scale linearly with headcount. At 1M+ employees the same queries should move to SQL window functions, or the per-group stats should be materialised.
- **SQLite** is appropriate for a single HR Manager. Multiple concurrent writers would call for Postgres; the schema and queries carry over unchanged.
