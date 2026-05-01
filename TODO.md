# TODO

## Enable selecting existing tags for powers

In "moce" so powers in compendium, there is no option to select from existing tags (create/update). Fix this, so make it like in other compendium objects (like maneuvers, items, stances)

Examine all other objects in compendium to check if selecting existing tags capability is present.

## Proper sort the categories in compendium

Now it is:
perks, races, stances
states, maneuvers, spells
powers, inventory

but it should be:
maneuvers, stances, states
perks, powers, spells,
races, inventory

## Enable Selecting existing requirements similar to how it is done for tags

Goal:
Allow users to select from existing requirements when creating or updating compendium objects (e.g., maneuvers, stances, weapons, armors). This should be done similar to the existing capability of adding existing tags.

Relevant files:

src/application/compendium/*/ (entity forms)
Requirement input components (check)
Requirements fetching logic (probably not existing)
Acceptance Criteria:

Requirement fields provide a dropdown or autocomplete of existing requirements.
Users can select one or more requirements from the list.
Manual entry is still possible.

Goal:
Allow users to select from existing tags (used for filtering) when creating or updating compendium objects (e.g., maneuvers, stances, weapons, armors).

Relevant files:

src/application/compendium/*/ (entity forms)
Tag input components (e.g., FormTagsInput)
Tag fetching logic (e.g., useEntityTags hook)
Acceptance Criteria:

Tag fields provide a dropdown or autocomplete of existing tags.
Users can select one or more tags from the list.
Manual entry is still possible.

## User personalization and its panel

I want to create a separate page and the button (near home button on top bar) to navigate to it

## Tag Management Panel

Topic to investigate. Ai agent should investigate and write down here the possible options nad trade-offs.

Goal:
Implement a tag management view to allow:

Renaming a tag (e.g., "miecz" to "miecze") across all objects of a given type.
Deleting a tag from all objects of a given type.
Viewing all tags by type (maneuver, stance, weapon, etc.).
Relevant files:

Tag management UI (new or existing panel)
Tag update logic (batch update across entities)
Tag storage (consider making tags a separate entity if not already)
Acceptance Criteria:

Users can select a tag type and see all tags.
Users can rename or delete a tag, and the change is reflected across all relevant objects.
Tag management is efficient and consistent.
