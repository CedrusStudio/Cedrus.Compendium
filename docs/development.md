# Compendium development

Use [AGENTS.md](../AGENTS.md) as the developer task router. [README](../README.md) owns
setup and [ROADMAP.md](../ROADMAP.md) owns product status. Maintain new developer guidance
in English; existing Polish product instructions, UI and domain assets keep their language.

## Architecture and local conventions

Use the project's existing strict TypeScript configuration and `@/` aliases (including
the existing `@/ui` alias). Follow nearby React/TypeScript code and the owning feature's
tests; Fronted's formatting conventions and C# rules are not imported here.

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
npm run verify:ai-guidance
node node_modules/vitest/vitest.mjs run src/domain/ai-character-generation/__tests__ src/infrastructure/ai-character-generation/__tests__/LocalFileCharacterGenerationProvider.test.ts src/infrastructure/ai-character-generation/__tests__/openAiCharacterProposalResponseFormat.test.ts
npm run typecheck:scoped
```

The first command needs only Node and works before dependency installation, offline and
without sibling sources or a .NET SDK. It is the guidance-only check. Select relevant
existing Vitest tests for a changed application boundary; the AI command above exercises
local prompt/proposal/provider contracts without a paid provider or live database.
`npm test` is the existing interactive Vitest entry; use explicit `run` for a bounded check.
Scoped typecheck covers only its declared configuration. Full `npm run typecheck`, build,
coverage and [E2E](../e2e/README.md) retain their separate scope/prerequisites. The existing
`lint` script calls `next lint`; check actual compatibility before using it as a gate.
No lint/framework migration is included in developer-guidance adoption.

## Runtime AI boundary

[characterGenerationInstructions.ts](../src/domain/ai-character-generation/characterGenerationInstructions.ts)
owns the recipient prompt; [aiCharacterProposalSchema.ts](../src/domain/ai-character-generation/aiCharacterProposalSchema.ts)
owns the proposal validation contract. Provider/context/export/draft acceptance code
remains under its existing domain, infrastructure, persistence and scripts owners.
[ai-workspace/README.md](../ai-workspace/README.md) owns the local draft procedure.
Generated contexts, requests, drafts, backups and secrets remain ignored local state.
Refreshing/exporting them is a selected product operation, not a developer-guidance check.

## Guidance provenance and updates

Only the general Meta AI working policy is adopted; [ai/adoption.json](../ai/adoption.json)
pins the local snapshot and managed AGENTS/Copilot summaries. The Node checker is an exact
controlled copy of `Cedrus.Templates/eng/ai/verify-ai-guidance.mjs` at source
`1429fd5061b4782732c6abb3fd2fcf07b2d29342`; normalized SHA-256: `b84a0c43379a27b796afd2e8d7c5fc02e28450ef092b68742e4d4bdfc1725210`.
Maintain its implementation at Templates and compare against the pinned source.
Local checks establish integrity, not upstream authenticity. Exact source audit and
prepare/review/apply/validate/audit updates are external Meta maintainer operations; they
do not add a .NET prerequisite to this application. Preserve local extensions and keep
previews outside source. Revert adopted content and manifest together. Native client
loading remains META-M7.

Recorded checks, preservation and rollback: [M5b receipt](history/m5b-guidance-20261103.md).
The receipt records the existing scoped-typecheck baseline failure; guidance adoption does not close that application issue.
