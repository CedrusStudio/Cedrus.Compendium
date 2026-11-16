# Next 16.4 security update boundary

Date: 2026-11-16. Owner: Cedrus.Compendium. Scope: SEC-01 framework and its CSS/image
dependency graph, after the separately accepted lint baseline repair.

## Selected inputs

Pin Next and eslint-config-next at 16.4.6 so the framework and its lint package share
the selected release. The previous framework version was 16.0.7 and the lint package
was 15.4.6. Keep the existing React/ReactDOM 19.2 line, ESLint 9 and the current
Turbopack configuration; verify actual installed peers rather than forcing them.

Next 16.4.6 declares PostCSS 8.5.23 and optional sharp ^0.35.5. Require sharp to be
installed and its native binding to load on the target platform; an omitted optional
image package is not image-stack acceptance. Apply compatible PostCSS-scoped floors
for nanoid ^3.3.18 and source-map-js ^1.2.2. These stay within the existing 3.x/1.x
dependency ranges, including the Next-selected PostCSS version. No incompatible major
override or global audit-force operation is introduced.

The Next 16 ESLint presets export flat-config arrays. Import core-web-vitals and
typescript directly; remove the obsolete FlatCompat adapter and its unused direct
@eslint/eslintrc dependency. Preserve the generated-file ignores. Do not disable new
diagnostics from the upgraded presets to obtain a passing lint result.

## Compatibility with the hooks preset

The native preset exposes 45 diagnostics in existing UI code. Reset local drafts
and selections through guarded state adjustments when their source inputs change,
before committing a stale render. Paginated lists retain their page boundaries,
merge order and existing deduplication. API-key and character changes keep their
selection isolation; session restoration still runs asynchronously and cannot
override a manual selection or clear action.

Subscribe to the tag-filter storage preference and carousel state with
useSyncExternalStore, including stable server snapshots and listener cleanup.
Keep requirement draft-cache writes in committed effects or change handlers. JSON
drafts keep their text and last-written fingerprint in state, preserving invalid
drafts and immediate validation while avoiding ref access during render. Keep
timers, notifications and external persistence in committed effects or callbacks.
No React hooks rule is disabled or downgraded.

Next 16.4 also writes a managed agent-rules block during detected AI-assisted
development. Set the supported agentRules option to false so next dev preserves
the repository-owned AGENTS.md and captured Cedrus profile. This changes developer
startup only; no generated framework instructions are adopted as Cedrus policy.

## Acceptance of the assembled installation

The manifest proposal alone is not an installed security repair. Generate the lock
with the selected published packages, review its diff, then install it with npm ci.
Require a valid npm dependency graph, matching React/ReactDOM versions, Next/config
16.4.6, and the resolved Next image/CSS subtree outside the audited ranges. Record
Node/npm/OS and integrity-backed lock inputs. Check current full and production audits;
baseline findings outside this stage remain explicitly tracked by SEC-02/03/04.

Run lint, full and scoped TypeScript, the full bounded unit/coverage suite at unchanged
thresholds, the configured production build and desktop/320px browser acceptance against
that build. The browser APIs are fixtures and do not establish real database writes.
Keep AI generation disabled and use an unreachable local test database for ordinary
verification. Prisma generation during installation is not a database migration.

The existing webpack-only Prisma plugin is not exercised by a Turbopack build. Preserve
the current bundler choice and inspect server Prisma packaging when accepting the
production build; changing bundlers is a separate compatibility decision.

Keep receipts in ignored task artifacts and attribute results to their exact checked
source tree and dependency lock. Baseline results on old dependencies are not a PASS
for this update. A registry/cache failure, missing native package, failed lint, failed
font download or unavailable browser is an incomplete acceptance gate.

No application schema, game rule, AI proposal contract or production content changes
belong to this stage. Roll back an unsuccessful candidate by restoring the prior
reviewed manifest/config/lock and reinstalling from that lock; no database restore is
needed for a package-only rollback.

## References

- [Next 16.4.6 release](https://github.com/vercel/next.js/releases/tag/v16.4.6)
- [Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next native ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
