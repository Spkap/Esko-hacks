# Frontend hackathon instructions

Follow the root `../AGENTS.md`, especially its hackathon deadline rules. This is a small demo with about three hours remaining when these rules were added. Prioritize building and iterating quickly.

- Work in the existing checkout and commit task changes directly on `main`. Do not create worktrees, feature branches, or pull requests. Preserve unrelated changes; do not force-switch branches or discard work. Push only when requested.
- Build the smallest working demo flow using the current Next.js/Tailwind/shadcn stack and `../DESIGN.md`. Keep the dashboard-first order and M6 stopping point. Avoid speculative refactors, scaling work, and production infrastructure.
- Apply relevant frontend skill guidance pragmatically under the root deadline rules. Reuse loaded skills and existing design choices; do not start lengthy research or formal scorecards.
- Do not require TDD, new test infrastructure, exhaustive test suites, every breakpoint/state, or full accessibility audits. Use the cheapest relevant check and briefly smoke-test the affected flow. Inspect the changed screen at the demo viewport; check mobile when the layout change warrants it.
- Run a build when changes affect dependencies/configuration/routing or when preparing the final demo, not after every edit. Documentation-only edits need only diff review. Do not rerun passing checks unless something relevant changed.
- Fix demo blockers first: crashes, broken navigation or assets, unreadable content, and unusable primary actions. Keep basic labels, focus behavior, input handling, and honest sample/live status; defer minor polish and unlikely edge cases.
- Keep `../PROGRESS.md` updates brief and report only checks actually performed. The exhaustive checks and evidence requirements in `../IMPLEMENTATION_GUIDE.md` and generic skills are superseded by these deadline rules.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
