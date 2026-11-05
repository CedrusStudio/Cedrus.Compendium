# Compendium working guide

This repository owns the Cedrus RPG companion application and its domain AI workflows.
Start with [development](docs/development.md); existing product docs and prompts retain
their local ownership and language.

| Task | Owner reference |
| --- | --- |
| Application setup and commands | [README](README.md) |
| Current product work and completed plans | [Roadmap](ROADMAP.md); selected files under `features-to-implement/` |
| Character-generation prompt and proposal contract | [Instructions source](src/domain/ai-character-generation/characterGenerationInstructions.ts), [proposal schema](src/domain/ai-character-generation/aiCharacterProposalSchema.ts) |
| Prepare/import a local character draft | [AI workspace](ai-workspace/README.md), [script guide](scripts/README.md) |
| Database/data operations | [Script boundaries](scripts/README.md#zasady), `prisma/schema.prisma` |
| Focused tests and TypeScript checks | [Development checks](docs/development.md#verification) |
| Mobile/browser acceptance | [E2E guide](e2e/README.md) |

Developer instructions govern source maintenance. Character-generation prompt text,
proposal schemas, provider selection and generated workspace payloads are application
contracts, not shared developer policy. Read them for a selected product task and preserve
their behavior. Local provider operation does not imply paid model execution.

## Cedrus shared profile

Repository: `compendium`. Before versioned edits, read `~/.agents/cedrus/profile.json`,
capture its active revision and read that snapshot's `policies/ai-working-rules.md`.
Read the C# and automation policies when relevant. If the profile is missing or
invalid, stop edits and follow [Meta setup](https://github.com/dr-marek-jaskula/Cedrus.Meta/blob/main/docs/shared-ai-profile.md).
Keep this repository's owner instructions for its domain.
