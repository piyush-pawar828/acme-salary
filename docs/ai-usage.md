# AI tool usage

The assessment asked for AI tools to be used and for the prompts and instructions to be shared. This is a short, factual account.

## Tool

Claude Code (Anthropic's CLI agent), used throughout in a single working session.

## How the work was split

- **Scope and decisions were mine.** Stack choice (Rails + React), what to include and exclude, the clarification questions sent to ACME, dropping bulk import/export, dropping job levels and employee numbers to keep the model simple, treating country as immutable, rejecting future-dated salaries, and how to handle the free-tier hosting trade-off.
- **The agent drafted the documents and code against those decisions**, task by task from the plan in `docs/plan.md`, writing the failing tests for each task before the implementation.
- **I reviewed each step** and sent corrections where the output drifted from the brief (for example, extra fields that were not in the problem statement, and a filter component that rendered raw values instead of labels).

## Instructions given

The working instructions, in order:

1. Build employee salary management software per the assessment brief; Rails backend, React frontend.
2. Draft clarification questions for ACME before building; fold the answers into a one-page requirements document.
3. No bulk import/export. No part-time/contractor types, levels or employee numbers: keep the model to what the problem states.
4. Write a technical design, then a task-by-task implementation plan with the tests named up front, before any code.
5. Execute the plan with one commit per task, tests first, keeping each task independently green.
6. Verify in a real browser against the seeded data before deployment work.

## What was checked by hand

- Every analytics figure in the request specs was hand-computed from a five-employee fixture.
- The seed was inspected for date sanity (no future-dated salaries, no salary before hire date).
- The production container was built and smoke-tested locally before the Render blueprint was committed.
