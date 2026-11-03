# META-M5b Compendium guidance adoption

Date: 2026-11-03. Root AGENTS routes source maintenance, product status, tests, operations
and runtime AI to their existing owners. Claude/Copilot are thin local adapters. New
developer guidance is English; Polish product documentation, UI and domain assets retain
their language and content. ai-workspace/README.md, recipient prompts, proposal schemas,
provider/context/export/import/acceptance code and ignored local payloads are unchanged.

Local guidance check PASS. Existing AI regression selection: 14 files, 128 tests passed,
zero failures. Tests cover domain contracts, local file provider and wire response shape
without a paid model or live database.

The existing scoped typecheck fails with 67 TypeScript diagnostics, including missing
testing-library matcher types. The exact same 67 diagnostics were reproduced on unchanged
baseline ef05dd157a9a0cd9a73957ec25e88061d4a2b877 with the same installed dependencies.
This is a pre-existing application issue, owned by the Compendium maintainer. It remains
an explicit gate before claiming scoped typecheck success; no product/type-config change
or lint/framework migration is bundled into this guidance batch.

Both local guidance integrity and the external Meta pinned-source audit pass for three
entries at Meta 77cd7bfcfdfc4ee5909d92602a0f979e9380b4ad. Only general AI working rules
are adopted; application TypeScript conventions remain local. The checker is the exact
Templates source at 1429fd5061b4782732c6abb3fd2fcf07b2d29342, path
eng/ai/verify-ai-guidance.mjs, normalized SHA-256
b84a0c43379a27b796afd2e8d7c5fc02e28450ef092b68742e4d4bdfc1725210.
Its canonical regression suite has 28 passing cases; Templates verify/smoke pass.

Independent consumer copies pass with no node_modules, sibling source, .NET on PATH or
GitHub credential variables. Changed policy text, duplicate managed markers and broken
local links fail; unmanaged local extensions pass. Repeat adoption prepares zero changes.
Private execution artifacts retain the reviewed previews, audits and preservation hashes.

Package versions, dependency/lock files, application source and existing tests are unchanged.
Existing CI lanes call the same Node check before dependency installation. Publication,
deployment, database writes and paid model execution were not selected. Native instruction
loading remains META-M7. Revert guidance content, adoption records, entry scripts and CI
hooks together, preserving later/unrelated work. No global AI configuration or new skill
library was installed.
