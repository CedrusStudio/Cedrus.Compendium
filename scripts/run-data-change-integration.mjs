/** Disposable local replica-set acceptance. Only its generated test URL is passed to Prisma/Vitest; .env is not modified. */
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ownerLabel = 'cedrus-compendium-test-run';

function isLocalDockerEndpoint(endpoint) {
  return typeof endpoint === 'string' && (/^npipe:\/{4}\.\/pipe\/[^/]+$/.test(endpoint) || /^unix:\/\/\//.test(endpoint));
}

/** @typedef {{ code: number | null, stdout: string, stderr: string }} CommandResult */
/** @typedef {{ cwd?: string, env?: Record<string, string | undefined>, timeout?: number }} CommandOptions */
/** @typedef {(file: string, args: string[], options?: CommandOptions) => Promise<CommandResult>} Executor */
/** @typedef {{ status: string, stage: string, runId: string, database: string, port: number, image: string, containerName: string, startedAt: string, reportPath: string, containerId?: string, imageId?: string, passedTests?: number, cleanedUp?: boolean, cleanupFailed?: boolean, finishedAt?: string }} Receipt */

/** @param {number} [port] @param {string} [runId] */
export function integrationConfiguration(port = 27027, runId = randomUUID()) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(runId)) throw new Error('Invalid isolated test configuration.');
  const database = `cedrus_data_change_test_${runId.replaceAll('-', '')}`;
  return {
    port, runId, database, image: 'mongo:7.0', name: `cedrus-compendium-test-${runId}`,
    url: `mongodb://127.0.0.1:${port}/${database}?replicaSet=rs0&directConnection=true&serverSelectionTimeoutMS=5000&connectTimeoutMS=5000`,
  };
}

/** @type {Executor} */
function execute(file, args, { cwd, env, timeout = 120_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const timer = setTimeout(() => { child.kill(); reject(new Error('Acceptance command timed out.')); }, timeout);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
}

/**
 * executeCommand injection is for orchestration tests, not a database URL override.
 * @param {{ root?: string, port?: number, runId?: string, executeCommand?: Executor, environment?: Record<string, string | undefined>, log?: (message: string) => void }} [options]
 */
export async function runIntegrationAcceptance({ root = repositoryRoot, mcp = false, port = 27027, runId = randomUUID(), executeCommand = execute, environment = process.env, log = console.log } = {}) {
  const configuration = integrationConfiguration(port, runId);
  if (JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).name !== 'cedrus-compendium') throw new Error('Select the Compendium checkout.');
  if (environment.DOCKER_HOST && !isLocalDockerEndpoint(environment.DOCKER_HOST)) throw new Error('Use a local Docker Desktop/unix engine for acceptance.');
  const output = path.join(root, 'backup', mcp ? 'mcp-acceptance' : 'data-change-acceptance', runId);
  mkdirSync(output, { recursive: true });
  const reportPath = path.join(output, 'vitest.json');
  const env = { ...environment, NODE_ENV: 'test', AI_CHARACTER_GENERATION_ENABLED: 'false',
    DATABASE_CONNECTION_STRING: configuration.url, DATA_CHANGE_TEST_DATABASE_URL: configuration.url, ...(mcp && { MCP_TEST_DATABASE_URL: configuration.url }) };
  /** @type {Receipt} */
  const receipt = { status: 'NOT_COMPLETED', stage: 'docker-access', runId, database: configuration.database, port, image: configuration.image, containerName: configuration.name, startedAt: new Date().toISOString(), reportPath };
  let containerId;
  let failure;
  async function checked(file, args, label) {
    const result = await executeCommand(file, args, { cwd: root, env });
    if (result.code !== 0) throw new Error(`${label} failed (exit ${result.code}). ${result.stderr?.slice(0, 2000) ?? ''}`);
    return result.stdout.trim();
  }
  const docker = (args, label) => checked('docker', args, label);
  async function waitForMongo(expression) {
    const deadline = Date.now() + 45_000;
    while (Date.now() < deadline) {
      const result = await executeCommand('docker', ['exec', containerId, 'mongosh', '--quiet', '--eval', expression], { cwd: root, env, timeout: 5000 });
      if (result.code === 0) return;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error('The disposable MongoDB instance did not become ready.');
  }
  try {
    log('Checking the local Docker engine...');
    const engineHost = JSON.parse(await docker(['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}'], 'Docker context inspection'));
    if (!isLocalDockerEndpoint(engineHost)) throw new Error('Docker context is not a local Desktop/unix engine.');
    if (await docker(['info', '--format', '{{.OSType}}'], 'Docker access') !== 'linux') throw new Error('Use the Linux-container Docker engine.');
    receipt.stage = 'container-preparation';
    const image = await executeCommand('docker', ['image', 'inspect', configuration.image], { cwd: root, env });
    if (image.code !== 0) { log('Downloading the MongoDB test image...'); await docker(['pull', configuration.image], 'MongoDB image pull'); }
    log('Creating a disposable loopback-only MongoDB replica set...');
    containerId = await docker(['create', '--name', configuration.name, '--label', `${ownerLabel}=${runId}`, '-p', `127.0.0.1:${port}:27017`, configuration.image, '--replSet', 'rs0', '--bind_ip_all'], 'Test container creation');
    if (!/^[a-f0-9]{64}$/.test(containerId)) { containerId = undefined; throw new Error('Docker did not return an exact container ID.'); }
    receipt.containerId = containerId;
    writeFileSync(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
    receipt.imageId = await docker(['inspect', '--format', '{{.Image}}', containerId], 'Test image identity');
    await docker(['start', containerId], 'Test container startup');
    await waitForMongo('quit(db.adminCommand({ping:1}).ok === 1 ? 0 : 1)');
    await docker(['exec', containerId, 'mongosh', '--quiet', '--eval', 'quit(rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]}).ok === 1 ? 0 : 1)'], 'Replica-set initialization');
    await waitForMongo('quit(db.hello().isWritablePrimary ? 0 : 1)');
    const prismaCli = path.join(path.dirname(require.resolve('prisma/package.json')), 'build', 'index.js');
    const vitestCli = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
    receipt.stage = 'isolated-schema';
    log('Preparing only the generated cedrus_data_change_test database...');
    await checked(process.execPath, [prismaCli, 'db', 'push', '--schema', path.join(root, 'prisma/schema.prisma'), '--skip-generate'], 'Isolated schema preparation');
    log('Running the real MongoDB transaction/rollback/race tests...');
    receipt.stage = 'mongo-tests';
    await checked(process.execPath, [vitestCli, 'run', mcp ? 'src/application/mcp/mcp.integration.test.ts' : 'src/persistence/data-quality/__tests__/dataChangeSet.integration.test.ts', '--reporter=json', `--outputFile=${reportPath}`], 'MongoDB acceptance tests');
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    if (!report.success || report.numPassedTests < 3 || report.numPendingTests !== 0 || report.numFailedTests !== 0 || report.numPassedTests !== report.numTotalTests) throw new Error('Acceptance requires every real test to execute and pass; skipped tests are not a pass.');
    receipt.passedTests = report.numPassedTests;
    receipt.status = 'PASS';
  } catch (error) { failure = error; receipt.status = 'NOT_COMPLETED'; }
  finally {
    if (containerId) {
      try {
        const owner = await docker(['inspect', '--format', `{{ index .Config.Labels "${ownerLabel}" }}`, containerId], 'Cleanup ownership check');
        if (owner !== runId) throw new Error('Container ownership changed; refusing removal.');
        await docker(['rm', '--force', '--volumes', containerId], 'Owned test-container cleanup');
        receipt.cleanedUp = true;
      } catch (error) { receipt.cleanedUp = false; receipt.status = 'NOT_COMPLETED'; receipt.cleanupFailed = true; failure ??= error; }
    }
    receipt.finishedAt = new Date().toISOString();
    writeFileSync(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  }
  if (failure) { log(`NOT_COMPLETED: evidence: ${output}`); throw failure; }
  log(`PASS: ${receipt.passedTests} real MongoDB tests. Evidence: ${output}`);
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const mcp = process.argv[2] === '--mcp';
  const options = process.argv.slice(mcp ? 3 : 2);
  const portArgument = options[0];
  if (options.length > 1 || (portArgument && !/^--port=\d+$/.test(portArgument))) {
    console.error('Usage: node scripts/run-data-change-integration.mjs [--mcp] [--port=27027]'); process.exitCode = 1;
  } else {
    runIntegrationAcceptance({ mcp, port: portArgument ? Number(portArgument.slice(7)) : 27027 }).catch(error => { console.error(error.message); process.exitCode = 1; });
  }
}
