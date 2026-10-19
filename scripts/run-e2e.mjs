import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Windows' cmd.exe truncates very long PATH values (also breaks child-process
// cleanup). Only this test process receives the normalized value.
const env = { ...process.env };
if (process.platform === 'win32') {
  const key = Object.keys(env).find(key => key.toLowerCase() === 'path') ?? 'Path';
  env[key] = [...new Set((env[key] ?? '').split(path.delimiter).filter(entry => entry && existsSync(entry)))].join(path.delimiter);
}
const child = spawn(process.execPath, ['node_modules/playwright/cli.js', 'test', ...process.argv.slice(2)], { stdio: 'inherit', env });
child.on('exit', code => { process.exitCode = code ?? 1; });
