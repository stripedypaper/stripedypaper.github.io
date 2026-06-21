import { cp, copyFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child =
      process.platform === 'win32'
        ? spawn(
            process.env.ComSpec ?? 'cmd.exe',
            ['/d', '/s', '/c', `${command} ${args.join(' ')}`],
            {
              cwd: projectRoot,
              stdio: 'inherit'
            }
          )
        : spawn(command, args, {
            cwd: projectRoot,
            stdio: 'inherit'
          });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${command} ${args.join(' ')} failed with code ${code}`)
      );
    });
    child.on('error', reject);
  });

await run('npm', ['run', 'build']);

await rm(path.join(projectRoot, 'assets'), { force: true, recursive: true });
await cp(
  path.join(projectRoot, 'dist', 'assets'),
  path.join(projectRoot, 'assets'),
  {
    recursive: true
  }
);
await copyFile(
  path.join(projectRoot, 'dist', 'index.html'),
  path.join(projectRoot, 'index.html')
);
await copyFile(
  path.join(projectRoot, 'dist', 'config.json'),
  path.join(projectRoot, 'config.json')
);
