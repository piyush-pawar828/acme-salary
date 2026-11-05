# ACME Salary Manager — Requirements

**Persona:** the HR Manager of ACME, a 10,000-person organisation spread across multiple countries.
**Problem:** salary data lives in spreadsheets. Keeping it correct is tedious, and answering simple questions about how the organisation pays people ("what is the median engineering salary in India?", "how did this person's pay change?") takes manual work every time.

## Goal

A web application in which the HR Manager can keep every employee's salary record accurate with minimal effort, and can answer questions about pay across countries and departments in seconds instead of hours.

## In scope

| Area | What the HR Manager can do |
|---|---|
| Sign in | Log in as the single HR Manager account. Every write is attributed to that user. |
| Employee directory | Browse all 10,000 employees in a paginated table. Search by name or email. Filter by country and department. Sort by name, salary and hire date. |
| Employee record | View one employee's profile and full salary history. Add an employee, edit profile fields, delete an employee (with confirmation). |
| Salary changes | Record a new salary with an effective date. The previous salary is kept, not overwritten, so the record shows how pay changed over time and who changed it. |
| Multi-currency | Salaries are stored in the employee's local currency. A fixed exchange rate table converts to USD for cross-country comparison. Every converted figure is labelled "USD (converted)" and the local amount is shown alongside. |
| Pay analytics | Dashboard answering: headcount and total annual payroll (USD) overall and per country/department; average, median, minimum and maximum salary per country and per department; highest and lowest paid employees. |
| Seed data | A deterministic seed script generating 10,000 realistic employees across 8 countries and 10 departments, each with a salary history. |

## Deliberately out of scope

| Excluded | Why |
|---|---|
| Bonuses, equity, allowances | ACME defined salary as annual gross base pay. Adding other components would complicate every analytic without changing the core workflow. |
| Multiple users, roles, permissions | ACME confirmed a single HR Manager is sufficient. The schema attributes changes to a user, so adding users later is additive. |
| Generic audit log of every field | Salary history already records who changed pay and when, which is the change HR cares about most. A log of name/title edits adds tables and UI for little decision-making value in this scope. |
| Live exchange rates | Rates change daily and would make analytics non-reproducible. A fixed, dated rate table gives stable, explainable comparisons. One currency per country is assumed. |
| Employee self-service, payroll integration, approvals | Different personas and systems. This tool is the HR Manager's source of truth, not a payroll engine. |
| Soft delete / employee offboarding workflow | Deleting is rare and confirmed in the UI. An offboarding lifecycle (leaver dates, final pay) is its own feature. |

## Assumptions

- Salary is annual gross base pay, stored as a decimal in the employee's local currency.
- Exchange rates are fixed as of a stated date and documented in the seed.
- One currency per country.
- The public demo runs on seeded dummy data; data edited on the demo may be reset on redeploy.

## Success criteria

- The HR Manager can find any employee and change their salary in under 30 seconds.
- Every dashboard question above is answered from live data with a single page load, in well under a second for 10,000 employees.
- All core behaviour (salary history, currency conversion, analytics, validation) is covered by fast, deterministic automated tests.
