# Compendium development

Use [AGENTS.md](../AGENTS.md) as the developer task router. [README](../README.md) owns
setup and [ROADMAP.md](../ROADMAP.md) owns product status. Maintain new developer guidance
in English; existing Polish product instructions, UI and domain assets keep their language.

## Architecture and local conventions

Use the project's existing strict TypeScript configuration and `@/` aliases (including
the existing `@/ui` alias). Follow nearby React/TypeScript code and the owning feature's
tests; Fronted's formatting conventions and C# rules are not imported here.

TanStack Table v8's `useReactTable()` returns functions that React Compiler cannot safely
memoize. `BestiaryTable` opts out locally with the supported `"use no memo"` directive;
do not manually memoize its table object or disable compiler diagnostics globally.

Next runs React Compiler in annotation mode. The character summary card opts in with
`"use memo"`. In a local React Profiler comparison, twenty stable summaries received
forty parent updates after five warm-ups. The instrumented favorite button rendered
800 times with compilation disabled and zero times with compilation enabled. Median
list render time in jsdom was 2.93 ms and 0.82 ms respectively. This measures React
render work for unchanged summaries. Search latency and database time need separate
measurements.

Next's Cache Components and Partial Prefetching provide reusable shells for navigation.
Character, bestiary and compendium pages render their fallback before awaiting route
parameters and prefetching from Prisma. Bestiary pages without request parameters
wait for `connection()` inside that boundary. Tag facet administration and drift reports
also wait for a request before reading Prisma. Character links enable automatic prefetch on pointer hover or
keyboard focus. The character detail route has its own loading boundary. The list and
detail headings share a View Transition name derived from the character ID. A shared
animation requires both headings to change in one transition. A cold client query can
show the loading state before the detail heading arrives. Reduced-motion users get the
same navigation with the heading animation disabled.

- `src/domain/` owns pure character/combat/rules logic and domain AI contracts.
- `src/application/` owns feature UI and application interactions.
- `src/persistence/` owns repositories, domain/Prisma mapping and persistence schemas.
- `src/infrastructure/` owns external clients and character-generation providers.
- `src/app/` owns Next.js pages/API routes; `src/common/` owns shared UI/hooks.

Keep schema/mapping/API changes coordinated with their existing tests. Generate the Prisma
client after an actual schema change; database writes, data migration and backfills follow
the backup/dry-run/explicit-apply rules in [scripts/README.md](../scripts/README.md).

## Verification

Use Node/npm already required by this application. `npm ci` runs the existing Prisma
generation postinstall; it is not a database migration.

```sh
node node_modules/vitest/vitest.mjs run src/domain/ai-character-generation/__tests__ src/infrastructure/ai-character-generation/__tests__/LocalFileCharacterGenerationProvider.test.ts src/infrastructure/ai-character-generation/__tests__/openAiCharacterProposalResponseFormat.test.ts
npm run typecheck:scoped
```

Select relevant existing Vitest tests for a changed application boundary; the AI command above exercises
local prompt/proposal/provider contracts without a paid provider or live database.
`npm test` is the existing interactive Vitest entry; use explicit `run` for a bounded check.
Scoped typecheck covers only its declared configuration. Full `npm run typecheck`, build,
coverage and [E2E](../e2e/README.md) retain their separate scope/prerequisites. The existing
`lint` script runs ESLint directly (`npm run lint`); Next 16 does not provide `next lint`
or run lint during a build. The lint scope includes maintained source, tests, scripts and
configuration; generated builds, backups, coverage and browser reports are ignored.
The Next 16 ESLint presets are native flat configurations; import their arrays directly
rather than passing them through FlatCompat. The existing application rules remain
enabled. A preset update can introduce new diagnostics; review them before accepting
the updated dependency graph.

Framework/security update boundaries and required acceptance are recorded in the
[Next 16.4 update decision](history/next-security-update-20261116.md).

### Component stories

Run `npm run storybook` to open the character health editor in isolation. Its stories
use the application form, validation schema and Tailwind stylesheet. The browser checks
cover the two-, four- and seven-column panel layouts, disabled inputs, label focus, the Polish
validation message, and WCAG 2.0/2.1 A/AA rules in axe. The dark and light error states
also have visual references.

```sh
npx playwright install chromium
npm run build:storybook
npm run test:storybook
```

Application CI and the component stories use Node 22 from `.nvmrc`. Supported
developer runtimes are declared in `package.json` under `engines.node`.
The reference images use Chromium on Windows. To run the same checks on the hosted
Windows runner, open Actions, choose the Mobile UI workflow and select Run workflow.
On a different platform run `npm run test:storybook -- --ignore-snapshots` for the
layout, accessibility and interaction checks. After reviewing an intentional design
change on Windows, run `npm run test:storybook -- --update-snapshots` and review the
image diff. Story checks read the static build directly and can run without a database.

## Runtime AI boundary

[characterGenerationInstructions.ts](../src/domain/ai-character-generation/characterGenerationInstructions.ts)
owns the recipient prompt; [aiCharacterProposalSchema.ts](../src/domain/ai-character-generation/aiCharacterProposalSchema.ts)
owns the proposal validation contract. Provider/context/export/draft acceptance code
remains under its existing domain, infrastructure, persistence and scripts owners.
[ai-workspace/README.md](../ai-workspace/README.md) owns the local draft procedure.
The local workspace path is runtime data and is intentionally excluded from Turbopack
filesystem tracing; production local-provider use therefore requires a configured,
writable workspace available to the server at runtime.
Generated contexts, requests, drafts, backups and secrets remain ignored local state.
Refreshing/exporting them is a selected product operation, not a developer-guidance check.

## Guidance provenance and updates

Follow the [shared profile activation](../AGENTS.md#cedrus-shared-profile) and run
the Cedrus.Meta workspace tool with `ai check --repo <checkout>`. The
[shared guidance workflow](../.github/workflows/shared-guidance.yaml) runs that
check separately from the application jobs. TypeScript and Node conventions are
maintained in this repository.

Recorded checks, preservation and rollback: [M5b receipt](history/m5b-guidance-20261103.md).
The receipt records the existing scoped-typecheck baseline failure; guidance adoption does not close that application issue.

Open application fixes are tracked as COMP-Q1/COMP-Q2 in the [quality follow-up plan](../features-to-implement/developer-quality-followup-plan.md) and roadmap; recording them does not implement or close them.
