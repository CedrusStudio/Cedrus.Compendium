import { applyInput, changeInput, contextInput, createInput, editInput } from '../../src/domain/mcp/writeContracts';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { entryInput, searchInput } from '../../src/domain/mcp/readContracts';

const app = new URL(process.env.COMPENDIUM_URL || 'http://127.0.0.1:3000');
if (!['http:', 'https:'].includes(app.protocol) || !['127.0.0.1', '[::1]', 'localhost'].includes(app.hostname)
    || app.username || app.password || app.pathname !== '/' || app.search || app.hash) {
  throw new Error('COMPENDIUM_URL must be a loopback origin, for example http://127.0.0.1:3000.');
}
const server = new McpServer({ name: 'cedrus-compendium', version: '1.0.0' });

async function call(tool: string, input: unknown) {
  try {
    const key = process.env.COMPENDIUM_API_KEY;
    if (!key) throw new Error('Set COMPENDIUM_API_KEY in the local client environment.');
    const response = await fetch(new URL('/api/mcp/' + tool, app), {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { 'content-type': 'application/json', 'x-api-key': key }, body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || 'Compendium returned HTTP ' + response.status);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ applicationUrl: app.origin, result: body }) }] };
  } catch (error) {
    const text = error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError')
      ? 'Cannot reach Compendium. Start the local app and check COMPENDIUM_URL. For a write, retry the same request.'
      : error instanceof Error ? error.message : 'Compendium request failed.';
    return { isError: true, content: [{ type: 'text' as const, text }] };
  }
}

server.registerTool('get_status', { description: 'Check the local Compendium connection and capabilities.', inputSchema: {}, annotations: { readOnlyHint: true } }, () => call('get_status', {}));
server.registerTool('search', { description: 'Search visible characters, catalog entries or the rulebook. Use offset for subsequent pages.', inputSchema: searchInput.shape, annotations: { readOnlyHint: true } }, input => call('search', input));
server.registerTool('get_entry', { description: 'Read a selected result. Use sections for game data on a character. Relative links resolve against applicationUrl.', inputSchema: entryInput.shape, annotations: { readOnlyHint: true } }, input => call('get_entry', input));

server.registerTool('get_creation_context', { description: 'Get canonical rules and proposal schema for a character brief. Uses visible reference characters.', inputSchema: contextInput.shape, annotations: { readOnlyHint: true } }, input => call('get_creation_context', input));
server.registerTool('preview_create', { description: 'Prepare or revise a draft. Show visibility, character and warnings before applying.', inputSchema: createInput.shape }, input => call('preview_create', input));
server.registerTool('preview_edit', { description: 'Prepare or revise a targeted edit. Show before and after values.', inputSchema: editInput.shape }, input => call('preview_edit', input));
server.registerTool('get_change', { description: 'Resume a preview or recover its saved character link.', inputSchema: changeInput.shape, annotations: { readOnlyHint: true } }, input => call('get_change', input));
server.registerTool('apply_change', { description: 'Commit the exact revision the user reviewed and asked to save. Return the character link.', inputSchema: applyInput.shape, annotations: { idempotentHint: true } }, input => call('apply_change', input));

server.connect(new StdioServerTransport()).catch(() => { console.error('Failed to start Compendium MCP.'); process.exitCode = 1; });
