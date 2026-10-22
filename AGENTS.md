# Wavelength agent instructions

Read `idea.md` for product intent and `IMPLEMENTATION_GUIDE.md` for tasks. For UI work, read `DESIGN.md` when it exists. Preserve the dashboard-first order and the M6 frontend stopping point.

## Hackathon deadline: build and iterate fast

This is a small hackathon demo with about three hours remaining when this instruction was added. Optimize for a working, convincing demo and fast iteration. This is not a production or large-scale application.

- Work in the existing checkout on `main` and commit completed changes directly to `main`. Do not create worktrees, feature branches, or pull requests. Preserve unrelated work and commit only task changes; do not reset or discard others' changes. If the checkout is unexpectedly on another branch, inspect its state before switching; never force-switch over local work. Pushing is separate and requires a user request.
- Implement the smallest useful end-to-end change, try it, fix obvious breakage, and iterate. Make routine reversible decisions without stopping for approval.
- Reuse existing components, dependencies, samples, and design decisions. Avoid speculative abstractions, broad refactors, scaling infrastructure, production hardening, and features outside the demo path.
- Do not require test-first development, new test suites, exhaustive edge cases, load tests, full accessibility audits, or repeated full-suite runs. Add a focused test only when it is the quickest useful way to catch a concrete bug in the demo.
- Keep verification proportional: documentation-only changes need a diff review; code changes need the cheapest relevant check and a quick smoke check of the affected flow. Run a build when dependencies, configuration, routing, or final demo readiness make it useful, not after every edit. Do not install testing infrastructure just to satisfy a checklist.
- For UI changes, briefly inspect the affected screen at the demo viewport; check a narrow viewport only when the change affects responsiveness. Fix crashes, broken navigation/assets, unreadable content, and blocked primary actions first. Defer cosmetic nits and unlikely edge cases.
- Keep basic input handling, secrets protection, and honest sample/live labels. Speed does not justify fabricated compliance claims or claiming checks passed when they were not run.
- Keep planning, research, skill use, and progress notes short and directly useful. Do not turn reference research, scorecards, screenshots at every breakpoint, or detailed evidence logs into delivery gates.

These deadline rules override conflicting process requirements in `IMPLEMENTATION_GUIDE.md`, other project instructions, and generic skill workflows, including mandatory full test matrices, test-first steps, and exhaustive visual checklists. Use the implementation guide as a task map, not a requirement to finish every planned test or production feature. Keep the dashboard-first order and stop at M6 when time is short.

## Required frontend skills

For frontend tasks in M1–M6 and UI changes in M10, read the relevant skills below once and apply their useful guidance within the deadline rules above. Documentation-only edits do not require frontend skills. Reuse a skill already loaded in the current session unless it changed; do not expand the task into a full audit or ceremony.

| When | Skill file | Required result |
|---|---|---|
| Before visual decisions | `/Users/sourabhkapure/.agents/skills/frontend-design/SKILL.md` | A product-specific composition using the references and choices in `DESIGN.md`. |
| Before component/layout/state changes | `/Users/sourabhkapure/.agents/skills/frontend-ui-engineering/SKILL.md` | Focused components, shared data access, semantic controls, responsive layouts, and specified states. |
| After the screen works | `/Users/sourabhkapure/.agents/skills/frontend-design-review/SKILL.md` | Briefly review the demo flow and fix visible blockers. |
| Before claiming the task complete | `/Users/sourabhkapure/.agents/skills/frontend-ui-excellence/SKILL.md` | Inspect the affected screen and run only the relevant lightweight checks; no scorecard or full matrix required. |

Use `DESIGN.md` and existing screens first. For new layouts or major redesigns that actually need additional references, read `/Users/sourabhkapure/.agents/skills/refero-design/SKILL.md` and keep research brief. If reference tools are unavailable, continue with the existing design direction. Keep one coherent design rather than combining conflicting skill defaults.

For browser checks, use `/Users/sourabhkapure/.agents/skills/playwright-skill/SKILL.md`. Keep any useful reusable tests in `frontend/tests/`; exploratory scripts belong in `/tmp`. Address obvious keyboard or readability blockers directly; use `/Users/sourabhkapure/.agents/skills/alireza-a11y-audit/SKILL.md` only when a concrete issue needs it, without starting a broad audit.

Use current Context7 docs for unfamiliar or changed library APIs when needed to implement correctly; avoid redundant lookups for existing project patterns. Use the existing Next.js/Tailwind/shadcn stack; Watermelon supplies selected landing blocks. Check plugin tools are available before claiming their use. Do not install another design system to solve a local styling problem.

## Completion evidence

Use the visual checklist in `IMPLEMENTATION_GUIDE.md` as a reference, not a mandatory exhaustive gate. Add a short note to `PROGRESS.md` for implementation work: what changed, checks actually run, demo blockers, and the next task. Include screenshot paths only when screenshots were useful and captured. Clearly distinguish skipped or unavailable checks from passing checks; do not block a small iteration on unrelated checks.

Project decisions and the user's instructions take precedence over generic skill examples. Use `DESIGN.md` as the design reference when no Figma file is supplied; do not invent Figma approval or add Storybook as a prerequisite.
