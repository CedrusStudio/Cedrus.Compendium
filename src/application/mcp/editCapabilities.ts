import { editOperation } from '@/domain/mcp/writeContracts';

const legacy = ['description', 'tags', 'statistic', 'membership'];
export function editCapabilities() {
  const legacyWrites = process.env.COMPENDIUM_MCP_LEGACY_WRITES === 'true';
  return {
    draftFormat: legacyWrites ? 1 : 2,
    editOperations: legacyWrites ? legacy : editOperation.options.map((schema) => schema.shape.op.value),
  };
}
