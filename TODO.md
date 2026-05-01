# TODO

This file is a planning brief for implementation agents.

General rules:

- Prefer root-cause fixes over UI-only patches.
- Reuse existing shared components and hooks before creating new abstractions.
- Keep data-shape changes explicit. Do not silently widen scope.
- Add focused tests for each feature/fix.
- When a requirement conflicts with the current schema, stop and resolve the scope before coding.

Recommended execution order:

1. Fix power specification tag reuse and complete the tag audit.
2. Reorder compendium landing categories.
3. Add existing-requirement selection.
4. Build personalization in phases.
5. Implement tag management after the tag/requirement flows are stable.

## 1. Power specifications: enable selecting existing tags and finish the tag-input audit

Status: done

### Power tag selection: current state

- `FormTagsInput` only shows `ExistingTagDropdown` when `entityType` is provided.
- `src/application/common/combat/PowerSpecificationEditableFields.tsx` currently renders `FormTagsInput` without `entityType`, so power specification create/update forms do not offer existing-tag selection.
- Existing infrastructure already supports power specification tags:
  - `useEntityTags('powerSpecifications')`
  - `GET /api/tags/[entity]`
  - `PowersSpecificationsList` tag filtering
- Current compendium audit result:
  - races: already pass `entityType`
  - perks/spells/maneuvers/stances/states: already pass `entityType` through shared forms
  - equipment entities: already pass `entityType`
  - power specifications: confirmed missing `entityType`

### Power tag selection: completion note

- The power specification form now passes `entityType="powerSpecifications"`.
- A focused regression test covers the prop wiring.
- A follow-up audit confirmed no other compendium `FormTagsInput` call site is missing `entityType`.

### Power tag selection: goal

- Power specification add/edit forms must allow selecting existing tags from a dropdown/autocomplete.
- Manual tag entry must keep working.
- The implementation must include a final audit of compendium tag inputs so this bug does not reappear elsewhere.

### Power tag selection: root cause

- The bug is local, not infrastructural: the dropdown exists, the hook exists, the API exists, and the list page already knows about `powerSpecifications` tags.
- The missing behavior is caused by one form not passing the correct `entityType` into `FormTagsInput`.

### Power tag selection: implementation plan

1. Update `src/application/common/combat/PowerSpecificationEditableFields.tsx`.
   - Pass `entityType="powerSpecifications"` to `FormTagsInput`.
2. Run a targeted audit of every compendium create/edit form that uses `FormTagsInput`.
   - Confirm each compendium entity passes the correct `EntityType`.
   - Do not widen scope into character-only forms unless explicitly requested.
3. If any other compendium gap is discovered during the audit, fix it in the same change set.
4. Preserve current `FormTagsInput` behavior.
   - manual typing still works
   - duplicate prevention still works
   - max tag limit still works
5. Add or update tests.
   - power specification form renders the existing-tag dropdown
   - selecting an existing tag appends it to the form value
   - manual tag entry still works
   - duplicate selection is rejected

### Power tag selection: primary files

- `src/application/common/combat/PowerSpecificationEditableFields.tsx`
- `src/common/components/inputs/FormTagsInput.tsx`
- `src/common/components/inputs/ExistingTagDropdown.tsx`
- `src/common/hooks/useEntityTags.ts`
- `src/app/api/tags/[entity]/route.ts`
- `src/application/compendium/powers/PowersSpecificationsList.tsx`

### Power tag selection: validation

- Open add/edit power specification form and confirm the existing-tag dropdown is visible.
- Select an existing power specification tag and save successfully.
- Add a new manual tag and save successfully.
- Confirm no regression in maneuvers, stances, perks, races, and equipment forms.

### Power tag selection: definition of done

- Power specifications behave the same as other compendium entities for tag reuse.
- The audit result is reflected in either tests or implementation notes.

## 2. Properly sort the categories in compendium

Status: done

### Compendium sort: current state

- The `/compendium` landing page hardcodes category order in `src/app/(compendium)/compendium/page.tsx`.
- Current order is:
  - perks
  - races
  - stances
  - states
  - maneuvers
  - spells
  - powers
  - equipment
- Requested order is:
  - maneuvers
  - stances
  - states
  - perks
  - powers
  - spells
  - races
  - inventory
- Ambiguity: the current top-level card is `equipment`, while the request says `inventory`.

### Compendium sort: goal

- Reorder the visible compendium landing cards to match the desired information architecture.

### Compendium sort: decision to resolve before coding

- Default recommendation: treat `inventory` as the existing top-level `equipment` card unless the requirement explicitly means "replace the equipment hub with a direct inventory card".

### Compendium sort: implementation plan

1. Update the `categories` array in `src/app/(compendium)/compendium/page.tsx`.
2. Apply the requested order.
   - row 1: maneuvers, stances, states
   - row 2: perks, powers, spells
   - row 3: races, equipment
3. If the real intent is a direct inventory card instead of equipment:
   - change the card destination and labeling
   - review `src/app/(compendium)/compendium/equipment/page.tsx`
   - confirm whether the equipment hub remains discoverable elsewhere
4. Keep this change local unless another surface is found to depend on the same ordering.
   - Extract a shared config only if a second consumer appears during implementation.

### Compendium sort: primary files

- `src/app/(compendium)/compendium/page.tsx`
- optional follow-up: `src/app/(compendium)/compendium/equipment/page.tsx`

### Compendium sort: validation

- Visual check on `/compendium` for desktop and mobile layouts.
- Confirm links still navigate to the expected pages.

### Compendium sort: definition of done

- The card order matches the agreed target order.
- No navigation regression is introduced.

### Compendium sort: completion note

- The `/compendium` landing cards now render in the agreed order.
- A focused page test locks the visible category sequence.

## 3. Enable selecting existing requirements similar to tags

Status: done

### Requirements selection: current state

- Requirement editing currently uses free-text array input through `FormStringsInput`.
- There is no existing requirement discovery API, no client hook, and no dropdown/autocomplete component.
- Current domain objects that already persist `requirements: string[]` are:
  - `Perk`
  - `Spell`
  - `Maneuver`
  - `Stance`
  - `State`
- `Weapon` and `Armor` do not currently have generic `requirements: string[]`.
  - They only have numeric `strengthRequirement`.
  - That means "requirements for weapons/armors" is a schema expansion, not just a UI enhancement.

### Requirements selection: goal

- Allow users to pick existing requirements in forms while keeping manual requirement entry.

### Requirements selection: scope recommendation

- First iteration should only cover entities that already persist `requirements: string[]`.
- Do not add generic requirements to weapons, armors, shields, mounts, or inventory in the same task unless scope is explicitly expanded.

### Requirements selection: recommended design

- Mirror the current tag flow:
  - server endpoint to list distinct existing requirements for one entity type
  - client hook to fetch them
  - reusable dropdown/autocomplete for selecting existing values
  - form component that combines manual entry and existing-value selection

### Requirements selection: implementation plan

1. Create a new API route modeled after the tag route.
   - `GET /api/requirements/[entity]`
   - Use Prisma Mongo aggregation to flatten `requirements` arrays and return unique sorted values.
2. Create a new client + hook pair.
   - `requirementsClient.getEntityRequirements(entity)`
   - `useEntityRequirements(entity)`
3. Add reusable UI.
   - preferred: `ExistingRequirementDropdown`
   - alternative: a generic `ExistingValuesDropdown` reusable for tags and requirements
4. Add a reusable form component.
   - preferred: `FormRequirementsInput`
   - alternative: extend `FormStringsInput` with optional selector support
5. Wire the new requirement input into shared compendium forms.
   - `src/application/common/PerkEditableFields.tsx`
   - `src/application/common/PerkableAddSheet.tsx`
   - This should cover perks, spells, maneuvers, stances, and states through shared usage.
6. Preserve current manual-entry behavior.
   - free text stays allowed
   - duplicates stay blocked
   - empty values stay blocked
7. Decide normalization rules before coding.
   - trim whitespace on add
   - keep stored display text unchanged
   - reuse exact stored values from the dropdown
8. Add tests.
   - API returns unique requirements
   - dropdown appears for requirement-bearing entities
   - selecting an existing requirement appends it
   - manual entry still works
   - duplicate prevention still works

### Requirements selection: primary files

- `src/common/components/inputs/FormStringsInput.tsx`
- `src/application/common/PerkEditableFields.tsx`
- `src/application/common/PerkableAddSheet.tsx`
- `src/persistence/schemas/characters/perkSchema.ts`
- `src/persistence/schemas/characters/combat/powerSchema.ts`
- `src/app/api/tags/[entity]/route.ts` as the reference implementation
- new: `src/app/api/requirements/[entity]/route.ts`
- new: `src/common/hooks/useEntityRequirements.ts`
- new: `src/infrastructure/clients/requirementsClient.ts`

### Requirements selection: validation

- Add/edit perk, spell, maneuver, stance, and state forms show both manual entry and existing-requirement selection.
- Selecting an existing requirement saves correctly.
- Existing detail views and search flows remain unaffected because the persisted shape does not change.

### Requirements selection: out of scope unless explicitly approved

- Adding generic `requirements: string[]` to equipment entities.
- Migrating requirements into a fully structured entity model.

### Requirements selection: definition of done

- Requirement-bearing compendium forms support both manual and existing-value entry.
- No regression is introduced in current requirement validation or persistence.

### Requirements selection: completion note

- Added `GET /api/requirements/[entity]` for the existing requirement-bearing entity types only: perks, spells, maneuvers, stances, and states.
- `FormStringsInput` now supports existing-value selection while preserving manual entry and duplicate prevention.
- Shared add/edit perk-like forms now pass the entity type through to the requirements input.

## 4. User personalization and personalization panel

Status: done

### Personalization: current state

- The repo currently has:
  - a single API key stored in localStorage via `useApiKey`
  - Redux-based global client state
  - manual localStorage/sessionStorage persistence in some slices
  - no Zustand store today
- Auth currently accepts exactly one server-side key via `NEXT_API_KEY` in `src/proxy.ts`.
- The top bar currently exposes the home button + theme toggle in `NavbarDefaultButton`.
- The home page still renders `FeaturesSection`, which is a placeholder candidate for replacement.
- Filters in compendium, bestiary, and characters are local component state built around `TagFilter` and `ListHeader`.
- Favorite-character fetching already has backend support via:
  - `charactersClient.getByIds()`
  - `POST /api/characters/by-ids`

### Personalization: goal

- Add a dedicated personalization page and a navbar entry next to the home button.
- Store user-specific preferences locally, separated by API key.
- Support:
  - quick tags for filters (max 5 per context)
  - favorite characters
  - quick links shown on the home page
  - optional main character shortcut
- Allow four admin API keys instead of one.

### Personalization: recommended architectural decision

- Introduce a new dedicated persisted Zustand store for personalization only.
- Keep the existing Redux store unchanged.
- Reason:
  - personalization is client-only, local, and keyed by the active API key
  - it does not need server caching semantics
  - it should not add more boilerplate to the existing Redux store
- Fallback option if Zustand must not be introduced:
  - a Redux slice with manual localStorage persistence
  - this is more boilerplate for a feature that is effectively per-browser preferences

### Personalization: proposed data model

- `PersonalizationStore`
  - `profilesByApiKey: Record<string, PersonalizationProfile>`
  - `activeApiKey?: string`
- `PersonalizationProfile`
  - `quickTagsByContext: Partial<Record<PersonalizationContext, string[]>>`
  - `favoriteCharacterIds: string[]`
  - `quickLinks: QuickLink[]`
  - `mainCharacterId?: string`
- `PersonalizationContext`
  - recommended starting set:
    - `characters`
    - `bestiary`
    - `maneuvers`
    - `stances`
    - `states`
    - `perks`
    - `powers`
    - `spells`
    - `races`
    - `weapons`
    - `armors`
    - `shields`
    - `inventory`
    - `mounts`
- `QuickLink`
  - `id`
  - `label`
  - `href`
  - `includedTags?: string[]`

### Personalization: server-side auth changes

1. Replace single-key auth with multi-key auth.
2. Recommended env shape:
   - `NEXT_API_KEYS=key1,key2,key3,key4`
3. Add a parser/helper in env code or near the proxy.
4. Update `src/proxy.ts` to accept any configured key.
5. All configured keys remain admins, so no role/permission model is needed in this iteration.

### Personalization: UI plan

1. Add a navbar button next to the home button.
   - likely change `src/common/components/navbars/NavbarDefaultButton.tsx`
2. Add a new page.
   - `src/app/personalization/page.tsx`
3. The personalization page should show:
   - current API key status
   - active profile summary
   - editor for quick tags by context
   - editor for favorite characters
   - editor for quick links
   - selector for main character
4. Replace `FeaturesSection` on the home page with a personalized quick access section.
   - `src/app/page.tsx`
5. Add a favorites page or filtered characters view.
   - recommended route: `src/app/(chracters)/characters/favorites/page.tsx`
   - use `charactersClient.getByIds()` to load stored favorites

### Personalization: quick-tag integration plan

1. Build a small reusable UI component, for example `PersonalizedQuickTags`.
2. Inject it near existing `TagFilter` controls.
   - `src/common/components/lists/ListHeader.tsx`
   - `src/application/bestiary/BestiaryTable.tsx`
   - `src/application/characters/list/CharactersHeadersList.tsx`
3. Each quick-tag button should toggle the corresponding included tag in local page state.
4. Enforce the max-5 rule in the store, not only in the UI.

### Personalization: favorite-character integration plan

1. Add favorite/unfavorite actions where they are easy to discover.
   - characters list cards
   - character detail header
2. Store only character IDs in personalization.
3. Build a favorites page backed by `charactersClient.getByIds()`.
4. Add quick navigation to favorites.
   - from the personalization page
   - from the home page quick access section
   - optional navbar follow-up if needed later

### Personalization: main character and quick links plan

1. Allow the user to mark one favorite as `mainCharacterId`.
2. On the home page, render a quick tile to that character if present.
3. Quick links should be structured data, not arbitrary raw URLs, to avoid invalid routes.
4. Start with these supported quick-link types.
   - route to favorites
   - route to a single character
   - route to a list page with preconfigured included tags

### Personalization: state and hydration plan

1. The personalization page must gracefully handle "no API key set".
2. Profiles must be isolated by API key.
3. This is local-browser personalization, not shared server-side personalization.
4. If API keys are rotated, the local profile will not automatically follow unless a migration rule is added.

### Personalization: primary files

- `src/common/hooks/useApiKey.ts`
- `src/common/components/ApiKeySettings.tsx`
- `src/common/components/navbars/NavbarDefaultButton.tsx`
- `src/app/page.tsx`
- `src/proxy.ts`
- `src/common/components/lists/ListHeader.tsx`
- `src/application/bestiary/BestiaryTable.tsx`
- `src/application/characters/list/CharactersHeadersList.tsx`
- `src/infrastructure/clients/charactersClient.ts`
- new personalization route, components, and store files

### Personalization: validation

- Two different API keys produce two different local personalization profiles.
- All four configured API keys can perform write operations.
- Favorite character IDs persist across reloads and can be loaded via `getByIds`.
- Quick-tag buttons inject tags into existing filter state without breaking manual filtering.
- Home page quick links render only for the active profile.
- No API key set results in an actionable empty state, not a crash.

### Personalization: open questions to resolve before implementation

- Does "character" quick filtering mean the characters list, the single-character page, or both?
- Should favorites be editable only on the character page, or also in the list view?
- Should quick links support only internal routes defined by the app, or arbitrary internal URLs?

### Personalization: definition of done

- Personalization page exists and is reachable from the navbar.
- Preferences are isolated per API key.
- Quick tags, favorites, and home quick links all work end-to-end.

### Personalization: completion note

- Implemented personalization with the existing Redux store, not Zustand.
- Added multi-key admin auth support via `NEXT_API_KEYS` while keeping `NEXT_API_KEY` as a backward-compatible fallback.
- Added a personalization page, navbar entry, favorite-character flow, favorites page, API-key-scoped quick tags, and home-page quick access.

## 5. Tag management panel

Status: done

### Tag management: current state

- Tags are currently stored as denormalized `String[]` arrays directly on each entity model in `prisma/schema.prisma`.
- Distinct tags are currently derived on demand via `GET /api/tags/[entity]` using `aggregateRaw`.
- Search filtering relies directly on embedded `tags` arrays through `hasEvery` / `hasSome`, so tags are part of the current search contract.
- The repository layer only supports per-entity CRUD. There is no batch rename/delete workflow today.

### Tag management: goal

- Build an admin-facing tag management view that can:
  - list tags by entity type
  - rename a tag across all objects of that type
  - delete a tag from all objects of that type

### Tag management: recommended rollout strategy

- Start with the lowest-risk option that matches the current storage model.
- Do not introduce a normalized tag system in the first implementation unless batch updates prove insufficient.

### Tag management: options and trade-offs

#### Option A - Keep denormalized `tags` arrays and add batch management APIs

- Summary:
  - keep the current schema unchanged
  - add admin API routes for list, rename, and delete
  - update all affected entities of a selected type
- Pros:
  - smallest schema and search impact
  - current filters and `/api/tags/[entity]` continue to work
  - easiest incremental delivery
- Cons:
  - rename/delete is a fan-out update across many records
  - large datasets may require chunked updates and progress reporting
- Recommendation:
  - use this first

#### Option B - Add a tag catalog collection but keep denormalized tags on entities

- Summary:
  - add a separate tag catalog for metadata, counts, aliases, or admin UI
  - entities still keep raw `tags` arrays for filtering/search
- Pros:
  - better admin metadata and reporting
  - can power a richer management UI
- Cons:
  - introduces dual-write and sync problems
  - rename/delete still needs fan-out updates on entity documents
- Recommendation:
  - only if Option A needs richer metadata later

#### Option C - Fully normalize tags into dedicated entities/relations

- Summary:
  - replace raw string arrays with structured tag references
- Pros:
  - strongest canonical data model
  - easier aliasing/governance in theory
- Cons:
  - highest migration cost
  - forces changes in Prisma schema, search queries, aggregation route, forms, mappings, and filters
  - awkward relative to the current Mongo + direct array-filter design
- Recommendation:
  - avoid for this milestone

### Tag management: recommended implementation plan for Option A

1. Build a management API surface.
   - `GET /api/tag-management/[entity]` -> list tags with usage counts
   - `POST /api/tag-management/rename` -> `{ entity, oldTag, newTag }`
   - `POST /api/tag-management/delete` -> `{ entity, tag }`
2. For listing:
   - reuse the current aggregate approach
   - return counts, not only unique names
3. For rename/delete execution:
   - fetch affected entities for the selected type
   - rewrite the `tags` array in application code
   - persist updates in batches
   - invalidate `entityTags` react-query cache and relevant list caches afterward
4. Add a dedicated admin page/panel.
   - pick entity type
   - view all tags + counts
   - preview affected object count before mutation
   - require explicit confirmation for rename/delete
5. Normalize mutation rules.
   - trim inputs
   - reject empty tags
   - reject invalid tag syntax using existing `isValidTag`
   - reject rename if the target tag is invalid
6. Decide merge behavior before coding.
   - recommended default: renaming `oldTag -> newTag` should dedupe per record so one entity does not end up with duplicate `newTag`
7. Add tests.
   - list endpoint returns tags + counts
   - rename updates all affected records
   - delete removes the tag from all affected records
   - filters and `/api/tags/[entity]` reflect the new state after cache invalidation

### Tag management: primary files

- `prisma/schema.prisma`
- `src/app/api/tags/[entity]/route.ts`
- `src/persistence/common/createCommonRepository.ts`
- `src/persistence/searchEntity.ts`
- `src/common/hooks/useEntityTags.ts`
- new admin page/API files for tag management

### Tag management: validation

- Rename `miecz -> miecze` for one entity type and confirm:
  - all affected objects are updated
  - tag list/counts update
  - list filtering by the new tag works
  - the old tag disappears
- Delete a tag and confirm:
  - it is removed from all affected objects of that type
  - it no longer appears in filter dropdowns
- Confirm no cross-entity-type spillover occurs.

### Tag management: open questions to resolve before implementation

- Should tag management include `characters`, or only compendium entities?
- Is merge-on-rename acceptable when `newTag` already exists on some records?
- Is audit/history required for destructive tag operations? Probably not in this iteration.

### Tag management: definition of done

- Admin can inspect tags by type, rename them, and delete them with predictable results.
- The chosen implementation matches Option A unless scope is explicitly expanded.

### Tag management: completion note

- Added `GET /api/tag-management/[entity]`, `POST /api/tag-management/rename`, and `POST /api/tag-management/delete` on top of the current denormalized `tags` arrays.
- Added a dedicated `/personalization/tags` admin page with entity selection, rename/delete confirmation, and react-query invalidation for tag lists.
- Kept the existing tag storage model and implemented deduping on rename when the target tag already exists on a record.

## 6. Requirements management panel

Status: planned

### Requirements management: current state

- The repo already has requirement discovery infrastructure for the requirement-bearing entity types only:
  - `GET /api/requirements/[entity]`
  - `src/infrastructure/clients/requirementsClient.ts`
  - `src/common/hooks/useEntityRequirements.ts`
- Supported requirement-bearing entities are currently limited to:
  - `perks`
  - `spells`
  - `maneuvers`
  - `stances`
  - `states`
- There is no requirement-management API for listing counts, renaming, or deleting requirement values across all affected records.
- There is no admin UI for requirements equivalent to `src/app/personalization/tags/page.tsx`.
- Requirements remain denormalized `string[]` arrays on the supported models, so management would need the same fan-out update approach as tag management.

### Requirements management: goal

- Build an admin-facing requirements management panel with the same core capabilities as tag management:
  - list requirement values by entity type
  - show usage counts
  - rename a requirement across all matching records of one entity type
  - delete a requirement across all matching records of one entity type

### Requirements management: scope constraints

- Keep the first iteration limited to entities that already persist generic `requirements: string[]`.
- Do not widen scope to equipment `strengthRequirement` fields in the same task unless explicitly approved.
- Reuse the current denormalized-string model instead of introducing a normalized requirement catalog.

### Requirements management: implementation plan

1. Add a requirements management API surface modeled after tag management.
   - `GET /api/requirements-management/[entity]` -> list requirements with usage counts
   - `POST /api/requirements-management/rename` -> `{ entity, oldRequirement, newRequirement }`
   - `POST /api/requirements-management/delete` -> `{ entity, requirement }`
2. Reuse the current Mongo aggregation strategy.
   - flatten `requirements`
   - group distinct values
   - return counts, not just unique strings
3. Implement rename/delete by rewriting affected `requirements` arrays in application code.
   - trim inputs
   - reject empty strings
   - dedupe per record when renaming to an already-existing requirement
4. Add a dedicated management page matching the current tag-management UX.
   - entity selector
   - value list with counts
   - explicit confirmation step for rename/delete
5. Invalidate relevant react-query caches on success.
   - `requirements-management`
   - `entityRequirements`
   - any page-level queries that surface requirement filters
6. Add focused tests.
   - list endpoint returns counts
   - rename updates all affected records
   - delete removes the value from all affected records
   - UI calls the correct mutation payloads

### Requirements management: primary files

- `src/app/api/requirements/[entity]/route.ts`
- `src/infrastructure/clients/requirementsClient.ts`
- `src/common/hooks/useEntityRequirements.ts`
- `src/app/personalization/tags/page.tsx` as the reference UI to split out and mirror
- new requirements-management API and page files

### Requirements management: validation

- Rename one requirement value for a single supported entity type and confirm:
  - all affected records update
  - the old requirement disappears from the management list
  - the new requirement appears in existing-value dropdowns
- Delete one requirement and confirm it no longer appears in forms or management results.
- Confirm unsupported entity types still reject the operation cleanly.

### Requirements management: definition of done

- Admin can inspect, rename, and delete requirement values for all existing requirement-bearing entity types.
- Existing requirement-selection forms reflect the updated values after cache invalidation.

## 7. Restrict theme switching to dark and light only

Status: done

### Theme toggle: current state

- `src/common/components/navbars/ThemeMode.tsx` currently renders a dropdown menu with explicit `light` and `dark` options.
- `src/infrastructure/providers/providers.tsx` configures `ThemeProvider` with `defaultTheme='dark'` but does not disable `system`, so `next-themes` still supports system mode internally.
- The requirement is stricter than a UI tweak: both the visible control and the provider configuration need to enforce a two-mode system.

### Theme toggle: goal

- Clicking the theme button should immediately toggle between `dark` and `light`.
- No dropdown menu should open.
- `system` mode should not be available as a runtime or persistence option.

### Theme toggle: implementation plan

1. Replace the dropdown-based control in `src/common/components/navbars/ThemeMode.tsx` with a single toggle button.
   - detect current resolved theme
   - switch `dark -> light` and `light -> dark`
2. Update the theme provider configuration.
   - set `enableSystem={false}`
   - keep a deterministic default theme
3. Decide how to handle any previously persisted `system` value.
   - recommended default: coerce it to `dark` or `light` on first render, preferably `dark` to match current default
4. Add focused tests.
   - button click toggles theme once per click
   - no dropdown/menu content is rendered
   - persisted `system` values do not survive as a valid state

### Theme toggle: primary files

- `src/common/components/navbars/ThemeMode.tsx`
- `src/infrastructure/providers/providers.tsx`
- optional: `src/infrastructure/providers/theme-provider.tsx`

### Theme toggle: validation

- Repeated clicks alternate only between dark and light.
- Refresh preserves either dark or light, never system.
- Navbar layout remains unchanged.

### Theme toggle: definition of done

- Theme switching is a simple two-state toggle with no mode list and no system mode.

### Theme toggle: completion note

- Replaced the dropdown-based theme selector with a single toggle button in `ThemeMode`.
- Disabled `system` mode at the root `ThemeProvider` level with `enableSystem={false}`.
- Added focused tests for dark/light toggling and for provider configuration.

## 8. Persist bestiary column preferences per user profile

Status: done

### Bestiary column preferences: current state

- `src/application/bestiary/BestiaryTable.tsx` initializes `columnVisibility` from `columns[].meta.initiallyHidden` on mount.
- `src/common/components/table/ColumnFilter.tsx` only mutates in-memory table state.
- There is no persistence for bestiary column visibility in Redux or local storage.
- Current personalization data does not store any table-column preferences.

### Bestiary column preferences: goal

- Allow each user profile to save a predefined bestiary column selection.
- If the user has not configured any preference, keep the current default column behavior unchanged.
- Keep this preference scoped to the active API-key-based personalization profile.

### Bestiary column preferences: recommended data model change

- Extend the personalization profile with a bestiary-specific column preset, for example:
  - `bestiaryColumnVisibility?: Record<string, boolean>`
- Keep it optional so the current default behavior remains the fallback.

### Bestiary column preferences: implementation plan

1. Extend `PersonalizationProfile` in `src/persistence/slices/personalizationSlice.ts`.
2. Add actions/selectors/hooks for reading and updating bestiary column visibility.
3. Expose the setting in the personalization page.
   - recommended UX: checkbox list of bestiary columns based on `columnKeys`
   - optionally add a reset-to-default action
4. Update `src/application/bestiary/BestiaryTable.tsx` to hydrate `columnVisibility` from the saved profile when present.
5. Preserve current defaults when no saved preference exists.
6. Decide how to handle newly added columns.
   - recommended default: fall back to each column's `initiallyHidden` metadata for keys missing from the saved preference
7. Add focused tests.
   - saved preferences override defaults
   - missing preference keeps current defaults
   - reset restores default behavior

### Bestiary column preferences: primary files

- `src/application/bestiary/BestiaryTable.tsx`
- `src/application/bestiary/columns.tsx`
- `src/common/components/table/ColumnFilter.tsx`
- `src/app/personalization/page.tsx`
- `src/persistence/slices/personalizationSlice.ts`

### Bestiary column preferences: validation

- Save a custom column preset and confirm it persists across reloads.
- Switch API keys and confirm the preference is profile-specific.
- Clear the preference and confirm the table falls back to the current default column set.

### Bestiary column preferences: definition of done

- Bestiary column visibility can be configured in personalization and defaults remain unchanged when no preference exists.

### Bestiary column preferences: completion note

- Added persisted `bestiaryColumnVisibility` to the personalization profile.
- Added personalization UI for saving or clearing the preferred bestiary column set for the active API key.
- Bestiary now hydrates from the saved preference when present and falls back to the existing default visibility when absent.
- Added focused tests for default/merge logic, persistence, and personalization-page wiring.

## 9. Fix bestiary drawer accessibility titles

Status: done

### Bestiary drawer accessibility: current state

- `src/common/components/ui/drawer.tsx` wraps Vaul/Radix drawer content, which requires a title for accessible dialog semantics.
- In bestiary actions, `CharacterModesViewDrawer` and `CharacterManeuversViewDrawer` can render `<DrawerContent>` without any `DrawerTitle` when the relevant arrays are empty.
- `src/application/bestiary/columns.tsx` always exposes actions to open these drawers, so the missing-title path is reachable at runtime.
- This is a local consumer bug, not a generic drawer primitive bug.

### Bestiary drawer accessibility: goal

- Eliminate the runtime accessibility warning by ensuring the bestiary drawers always provide a valid title.

### Bestiary drawer accessibility: implementation plan

1. Update the affected bestiary drawers to always include one top-level `DrawerTitle`.
   - `src/application/bestiary/drawers/CharacterModesViewDrawer.tsx`
   - `src/application/bestiary/drawers/CharacterManeuversViewDrawer.tsx`
2. Keep section-specific titles if they still improve readability, but do not rely on conditional titles for the dialog contract.
3. Add graceful empty-state content when the corresponding list is empty.
4. Add focused regression tests for the empty-data path.
   - open drawer with empty modes/maneuvers
   - assert a title exists
   - assert no crash and useful empty state

### Bestiary drawer accessibility: primary files

- `src/application/bestiary/drawers/CharacterModesViewDrawer.tsx`
- `src/application/bestiary/drawers/CharacterManeuversViewDrawer.tsx`
- `src/application/bestiary/columns.tsx`
- `src/common/components/ui/drawer.tsx` as the underlying contract reference

### Bestiary drawer accessibility: validation

- Open the affected bestiary drawers for characters with empty modes or maneuvers.
- Confirm the Radix/DrawerTitle accessibility warning no longer appears.
- Confirm populated drawers still render the same content structure.

### Bestiary drawer accessibility: definition of done

- The bestiary drawers always satisfy the dialog title accessibility requirement.

### Bestiary drawer accessibility: completion note

- `CharacterModesViewDrawer` and `CharacterManeuversViewDrawer` now render an unconditional top-level `DrawerTitle`.
- Added explicit empty-state content for the no-data path that previously triggered the accessibility warning.
- Added a focused regression test covering empty modes and empty maneuvers drawer rendering.

## 10. Separate admin tools from personalization

Status: planned

### Admin/personalization separation: investigation result

- Admin tag management is currently nested under the personalization area:
  - `src/app/personalization/tags/page.tsx`
  - linked directly from `src/app/personalization/page.tsx`
- The current client state only knows whether some API key is present via `useApiKey()`.
  - it exposes `hasApiKey`
  - it does not expose `isAdmin`
  - it does not validate the current key against server-configured admin keys on the client
- Server-side write protection is enforced in middleware/proxy via configured admin keys, but the UI structure still treats admin tooling as part of a user-personalization flow.
- This mixes two different concerns:
  - personalization is user-specific and keyed by the active API key profile
  - tag/requirements management is global admin tooling affecting shared compendium data

### Admin/personalization separation: goal

- Move tag and requirements management out of personalization into a dedicated admin panel.
- Show the admin-panel entry only when the current user/API key is recognized as admin.
- Keep personalization focused on per-user preferences only.

### Admin/personalization separation: architectural constraint

- The current client cannot reliably infer admin status from `useApiKey()` alone.
- A proper admin-only button likely requires one of these approaches:
  - a lightweight authenticated endpoint such as `GET /api/auth/me` or `GET /api/admin/capabilities` returning admin status for the current API key
  - or another trusted server-derived mechanism exposed to the client
- Do not hardcode admin keys into client code.

### Admin/personalization separation: implementation plan

1. Create a dedicated admin route tree, for example:
   - `src/app/admin/page.tsx`
   - `src/app/admin/tags/page.tsx`
   - `src/app/admin/requirements/page.tsx`
2. Remove management-page links from personalization.
3. Introduce an admin-capability check the client can trust.
   - recommended: server endpoint resolving admin status for the active API key
4. Add an admin-only navigation entry.
   - visible only when the capability check returns admin
5. Keep route-level protection in place.
   - hiding the button is not sufficient
   - reads and writes on admin pages should still require valid admin authorization where appropriate
6. Reuse the existing tag-management implementation after moving it.
7. Build the requirements-management panel under the same admin area instead of under personalization.
8. Add focused tests.
   - non-admin users do not see the admin button
   - admin users do see it
   - personalization page no longer exposes admin tooling links

### Admin/personalization separation: primary files

- `src/app/personalization/page.tsx`
- `src/app/personalization/tags/page.tsx` as the page to relocate or replace
- `src/common/components/navbars/NavbarDefaultButton.tsx`
- `src/common/hooks/useApiKey.ts`
- `src/lib/env.ts`
- `src/proxy.ts`
- new admin route and capability files

### Admin/personalization separation: validation

- A non-admin API key can still use personalization but cannot see or access admin tooling.
- An admin API key can navigate to the admin panel and manage global tags/requirements.
- Personalization remains scoped to the active API key profile and no longer contains shared admin actions.

### Admin/personalization separation: definition of done

- Personalization and admin tooling are separate navigation concepts, separate routes, and separate capability surfaces.

## 11. Bind a user name to each API-key personalization profile

Status: done

### Personalization profile naming: current state

- Personalization is already keyed by `activeApiKey` in `src/persistence/slices/personalizationSlice.ts`.
- The stored profile currently contains:
  - `quickTagsByContext`
  - `favoriteCharacterIds`
  - `quickLinks`
  - `mainCharacterId`
- There is no display name or user name associated with a profile.
- The personalization page currently shows the active API key string directly, which is functional but not user-friendly.

### Personalization profile naming: goal

- Allow the user to bind a human-readable user name to the active API key profile.
- Keep the binding local and profile-specific, alongside the rest of personalization data.

### Personalization profile naming: implementation plan

1. Extend `PersonalizationProfile` with an optional user-name field.
   - recommended: `userName?: string`
2. Update sanitization and persistence logic in the personalization slice.
3. Add slice actions and hook helpers for updating the name.
4. Expose the field in `src/app/personalization/page.tsx`.
   - editable text input
   - clear/save behavior
5. Use the saved name in the personalization summary UI where helpful.
   - keep the raw API key visible as secondary technical information
6. Add focused tests.
   - user name persists across reloads
   - user name is isolated per API key
   - empty value clears back to unnamed behavior

### Personalization profile naming: primary files

- `src/persistence/slices/personalizationSlice.ts`
- `src/common/hooks/usePersonalization.ts`
- `src/app/personalization/page.tsx`

### Personalization profile naming: validation

- Save different user names for two API keys and confirm each profile shows the correct name.
- Refresh and confirm the name persists.
- Clear the name and confirm the UI falls back gracefully.

### Personalization profile naming: definition of done

- Each API-key profile can store and display its own user-friendly name without affecting other profiles.

### Personalization profile naming: completion note

- Added optional `userName` storage to the persisted personalization profile.
- Extended the personalization page with save/clear controls for binding a readable user name to the active API key.
- Added focused slice and page tests covering persistence, API-key isolation, and clearing the stored name.
