# Veriforge agent instructions

Read `idea.md` for product intent and `IMPLEMENTATION_GUIDE.md` for tasks. For UI work, read `DESIGN.md` when it exists. Preserve the dashboard-first order and the M6 frontend stopping point.

## Required frontend skills

For frontend tasks in M1–M6 and UI changes in M10, invoke these skills at the stated step. If the host has no skill-invocation tool, read the exact `SKILL.md` and follow it. Naming a skill in a report is not invocation. Reuse a skill already loaded in the current session unless it changed.

| When | Skill file | Required result |
|---|---|---|
| Before visual decisions | `/Users/sourabhkapure/.agents/skills/frontend-design/SKILL.md` | A product-specific composition using the references and choices in `DESIGN.md`. |
| Before component/layout/state changes | `/Users/sourabhkapure/.agents/skills/frontend-ui-engineering/SKILL.md` | Focused components, shared data access, semantic controls, responsive layouts, and specified states. |
| After the screen works | `/Users/sourabhkapure/.agents/skills/frontend-design-review/SKILL.md` | Review task completion, visual craft, and trust; fix blocking/major findings and record remaining minor findings. |
| Before claiming the task complete | `/Users/sourabhkapure/.agents/skills/frontend-ui-excellence/SKILL.md` | Run the plan's checks, inspect the rendered screen, and record evidence. Target its 4/5 standard; a score alone is not proof. |

For new layouts or major redesigns, also read `/Users/sourabhkapure/.agents/skills/refero-design/SKILL.md`. Use its research method to select references; use `frontend-design` to execute the chosen direction. If Refero tools are unavailable, use Exa and Firecrawl with official references. Keep one coherent design rather than combining conflicting skill defaults.

For browser checks, use `/Users/sourabhkapure/.agents/skills/playwright-skill/SKILL.md`. Keep reusable tests in `frontend/tests/`; exploratory skill scripts belong in `/tmp`. For keyboard, contrast, or screen-reader issues, invoke `/Users/sourabhkapure/.agents/skills/alireza-a11y-audit/SKILL.md` and verify its findings in the browser.

Use the current Context7 docs when adding or changing library APIs. Use the existing Next.js/Tailwind/shadcn stack; Watermelon supplies selected landing blocks. Check plugin tools are available before claiming their use. Do not install another design system to solve a local styling problem.

## Completion evidence

Follow the visual checklist in `IMPLEMENTATION_GUIDE.md`. Record invoked skills, changed routes, commands/results, screenshot paths, and unresolved findings in `PROGRESS.md`. If a build or browser check cannot run, leave that check incomplete and state why.

Project decisions and the user's instructions take precedence over generic skill examples. Use `DESIGN.md` as the design reference when no Figma file is supplied; do not invent Figma approval or add Storybook as a prerequisite.
