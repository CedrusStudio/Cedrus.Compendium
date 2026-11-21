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

- `src/domain/` owns pure character/combat/rules logic and domain AI contracts.
- `src/application/` owns feature UI and application interactions.
- `src/persistence/` owns repositories, domain/Prisma mapping and persistence schemas.
- `src/infrastructure/` owns external clients and character-generation providers.
- `src/app/` owns Next.js pages/API routes; `src/common/` owns shared UI/hooks.

Keep schema/mapping/API changes coordinated with their existing tests. Generate the Prisma
client after an actual schema change; database writes, data migration and backfills follow
the backup/dry-run/explicit-apply rules in [scripts/README.md](../scripts/README.md).

## Verification

Follow [application setup](../README.md#uruchomienie) for Node, npm, dependencies and environment configuration.

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
