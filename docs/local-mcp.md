# Local character tools for chat

Start Compendium on your Windows PC, then open a local desktop chat with the `cedrus-compendium` MCP server enabled. The app supplies the catalog, rulebook, character drafts and transactional writes. The conversation supplies proposed content. Its model sees the data returned by your tools. The app continues using the MongoDB deployment in its own environment.

## Start the application and adapter

1. Follow the normal Compendium setup, including Node, MongoDB and the configured application keys. Use a transaction-capable MongoDB replica set for saving. Add `COMPENDIUM_MCP_ENABLED=true` to the application's local environment and restart it. The application AI provider can stay disabled.
2. At the repository root run `npm ci` and `npm run build:mcp`. Start the application with the normal `npm run dev`. The default address for the adapter is `http://127.0.0.1:3000`.
3. Set the local client environment variable `COMPENDIUM_API_KEY` to one existing Compendium key. Restart the desktop client after changing its environment. To select a different loopback port set `COMPENDIUM_URL`. Keep credentials outside the repository and the conversation.
4. In the local desktop client open Settings → MCP servers → Add server → STDIO. Set the command to the absolute path to Node (use `(Get-Command node).Source` in PowerShell). Set its single argument to the absolute path to `dist/mcp/tools/mcp/server.js` under this checkout. Alternatively configure the local Codex host as below, substituting the two paths.

```toml
[mcp_servers.cedrus-compendium]
command = 'C:\Program Files\nodejs\node.exe'
args = ['C:\path\to\Cedrus.Compendium\dist\mcp\tools\mcp\server.js']
env_vars = ['COMPENDIUM_API_KEY', 'COMPENDIUM_URL']
```

In a fresh local chat check `/mcp`, then ask “Sprawdź połączenie z Compendium”. Ask for a rulebook section and one actual character. A browser-hosted session has a different connection model.

If the desktop client does not inherit the shell environment, use a dedicated Node env file, for example `C:\Users\Marek\.cedrus\compendium\mcp.env`. Give it a line named `COMPENDIUM_API_KEY` with the key as its value, and optionally `COMPENDIUM_URL=http://127.0.0.1:3000`. Keep it outside Git. In the client's STDIO settings use the Node executable as the command and enter these **two separate arguments**, one per row.

```text
--env-file=C:\Users\Marek\.cedrus\compendium\mcp.env
C:\workspace\compendium-character-mcp\dist\mcp\tools\mcp\server.js
```

Use the actual retained checkout for the second path. Build and run the application from that same revision. Restart the adapter after rebuilding or changing its environment. A variable set in one PowerShell process belongs to that process and its children.

## Create and edit

- “Znajdź manewry pasujące do mojej postaci, pokaż wymagania i podaj źródła”. Use the ID and the kind from a search hit to open its details. Catalog links lead to their category in the app.
- “Przygotuj strażniczkę brodu na podstawie tych dwóch postaci”. The chat loads generation instructions, the proposal schema, visible references and scoped balance data. It can revise the draft after your feedback. New characters default to the calling key's visibility. Ask explicitly for a public card if desired.
- "Dodaj jej ten manewr, podnieś wartość zręczności o jeden i skróć opis". Combine the repertoire change with the two sheet edits. The preview shows the affected fields. Saving applies one reviewed revision. A conflict requires a fresh preview.
- “Zapisz” applies the preview. The result includes a path to the character relative to the reported application URL. Retry the same ID and revision after an interrupted save. To resume a preview use `get_change`.

Use one stable request ID per draft. Supply `expectedRevision` when revising it. Recheck a conflict before asking to save again. The API returns a missing-entry response for hidden characters. If the app is stopped, tool discovery still works. A data call will ask you to start the app. A disabled service, invalid key, expired preview and unavailable rulebook have distinct error responses.

## Detailed character operations

`get_status` reports the installed operations. `get_entry` with `kind: "character"` and `detail: "full"` returns all six gameplay sections unless `sections` narrows the selection. Statistics and combat expose base and effective values. Buffs include four independent active ID lists. Powers include their level, bonus, essence, specification and individual spells. Catalog links open the supported category page, while the ID identifies the exact entry and grade.

| Task | Operations |
| --- | --- |
| Edit header and statistics | `header` changes name, short name or race. Use `null` to clear race. `description`, `tags`, `statistic` and `health` change individual fields. |
| Edit equipment or repertoire | `gear` links or unlinks existing items. `replaceGear` takes the group, equipped `fromId` and catalog `toId`. `membership` handles maneuvers, perks, stances and states. |
| Edit embedded entries | `addItem`, `patchItem` and `removeItem` select an offense, defense, talent, power or profile by group and ID. For a new item provide an unused ULID, a name and its changed fields. New powers require a catalog `powerSpecificationId`. |
| Select defaults and profiles | `defaultSet` selects the ID or clears it with `null`. Select a replacement or clear the default when removing its set in the same preview. `activateProfile` activates or deactivates an ID in one category. Removing an active profile includes deactivation in the preview. |
| Change spells | `powerSpell` takes `powerId`, catalog `spellId` and `present`. Other powers keep their spells and specifications. |

The `fields` object accepts individual sheet paths such as `block`, `leadingWeapon.critical.power` and `defense.block`. Set optional fields such as `secondaryWeapon` to `null` to clear them. A linked stance or state profile uses `linkedEntityId` from the character's repertoire. The chat should ask which set to update if the relationship between equipment and a combat set is ambiguous.

Example operations for a single `preview_edit` request, after replacing the placeholders with IDs from the card and catalog and reading the actual shield block:

```json
[
  { "op": "replaceGear", "group": "shields", "fromId": "<small-shield>", "toId": "<medium-shield>" },
  { "op": "patchItem", "group": "defenses", "id": "<chosen-defense>", "fields": { "block": 9 } }
]
```

Review the base deltas, effective consequences and catalog parameters. New or resolved audit findings appear in the preview. `audit_character` also examines an existing visible card, optionally by section. Integrity findings include a repair operation when the sheet supports one. Requirements use base sheet values. Combat heuristics, ambiguous equipment and free text need player judgment. Send only the selected repair operations to `preview_edit`. Balancing comparisons use visible reference characters. Approval applies the named revision once. The response contains the saved deltas and a fresh read of affected sections. If that read fails, resume with `get_change` and repeat the returned lookup.

For a staged rollout set `COMPENDIUM_MCP_LEGACY_WRITES=true` on the new application while updating clients. Pending formats 1 and 2 remain readable and applicable. Unset the flag to enable new previews. For rollback, switch the flag back on and keep the compatible reader until outstanding format 2 previews have expired or been accepted.

## Acceptance

1. Run `npm run build:mcp` and `node tools/mcp/smoke.mjs`. The real SDK checks STDIO discovery and the stopped-app error. A handshake failure precedes any HTTP or database call. Check the Node executable and the two argument paths.
2. Run the application and use `node --env-file=C:\Users\Marek\.cedrus\compendium\mcp.env tools/mcp/smoke.mjs --live`. Authenticated status and the rulebook lookup check the adapter and application. A missing key points to adapter configuration. An unauthorized response points to the key supplied to the running application.
3. Run `npm run test:mcp:integration` with Docker Desktop available. The runner creates its own test replica set and reports executed tests. The normal unit suite skips these tests without an isolated database URL.
4. In a fresh local chat targeting a private fixture in a test database, read the equipped shield and default defense, replace the shield and preview the new block. Approve, reopen the card in the UI and compare base and effective numbers. Confirm the original maneuvers and attack dice.
5. Activate a +1 block profile, deactivate it in a second revision, then change a talent, a power and one spell on a caster fixture. Ask for an audit and select one correction. Test an overlapping UI edit before approval and retry an accepted revision after reconnecting. Record the checkout commit, client and results. The application AI provider can stay disabled throughout.
