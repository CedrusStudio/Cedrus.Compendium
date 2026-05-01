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
