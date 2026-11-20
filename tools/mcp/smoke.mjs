import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const live = process.argv.includes('--live');
const env = live ? process.env : { ...process.env, COMPENDIUM_URL: 'http://127.0.0.1:1', COMPENDIUM_API_KEY: 'offline-test' };
const client = new Client({ name: 'compendium-stdio-test', version: '1.0' });
const transport = new StdioClientTransport({ command: process.execPath,
  args: [fileURLToPath(new URL('../../dist/mcp/tools/mcp/server.js', import.meta.url))], env });
try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(t => t.name).sort(),
    ['get_status', 'search', 'get_entry', 'get_creation_context', 'preview_create', 'preview_edit', 'get_change', 'apply_change', 'audit_character'].sort());
  const status = await client.callTool({ name: 'get_status', arguments: {} });
  if (live) {
    assert.ok(!status.isError, JSON.stringify(status.content));
    const capabilities = JSON.parse(status.content[0].text).result;
    assert.deepEqual([...capabilities.tools].sort(), tools.map(tool => tool.name).sort(), 'Build and run the same MCP revision in the app and adapter.');
    const result = await client.callTool({ name: 'search', arguments: { kind: 'rulebook', limit: 1 } });
    assert.ok(!result.isError, JSON.stringify(result.content));
    const hit = JSON.parse(result.content[0].text).result[0];
    const detail = await client.callTool({ name: 'get_entry', arguments: { kind: 'rulebook', id: hit.id } });
    assert.ok(!detail.isError, JSON.stringify(detail.content));
  } else {
    assert.equal(status.isError, true);
    assert.match(status.content[0].text, /Cannot reach Compendium/);
  }
  console.log(live ? 'PASS: stdio, live status and rulebook lookup.' : 'PASS: stdio, nine tools and stopped-app error.');
} finally { await client.close(); }
