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

## Create and edit

- “Znajdź manewry pasujące do mojej postaci, pokaż wymagania i podaj źródła”. Use the ID and the kind from a search hit to open its details. Catalog links lead to their category in the app.
- “Przygotuj strażniczkę brodu na podstawie tych dwóch postaci”. The chat loads generation instructions, the proposal schema, visible references and scoped balance data. It can revise the draft after your feedback. New characters default to the calling key's visibility. Ask explicitly for a public card if desired.
- “Dodaj jej ten manewr, podnieś wartość zręczności o jeden i skróć opis”. Edits support description, tags, statistic components and membership in perks, maneuvers, stances and states. The preview shows the affected fields. Saving applies one reviewed revision. A conflict requires a fresh preview.
- “Zapisz” applies the preview. The result includes a path to the character relative to the reported application URL. Retry the same ID and revision after an interrupted save. To resume a preview use `get_change`.

Use one stable request ID per draft. Supply `expectedRevision` when revising it. Recheck a conflict before asking to save again. The API returns a missing-entry response for hidden characters. If the app is stopped, tool discovery still works. A data call will ask you to start the app. A disabled service, invalid key, expired preview and unavailable rulebook have distinct error responses.

## Acceptance

Run `npm run build:mcp`, then `node tools/mcp/smoke.mjs` to check real stdio discovery and the unavailable-app response. With the app and environment configured, `node tools/mcp/smoke.mjs --live` checks status and opens a rulebook section. Run `npm run test:mcp:integration` for the disposable Docker replica-set checks. Finally create a private test character and edit it from a fresh local conversation against a test database. Confirm the returned link, actual card values, conflict handling and repeat-save behavior.
