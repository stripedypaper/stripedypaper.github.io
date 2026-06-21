import { copyFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const sourceIndexPath = path.join(projectRoot, 'index.src.html');
const publishIndexPath = path.join(projectRoot, 'index.html');
const backupIndexPath = path.join(projectRoot, '.index.publish.backup.html');

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

await copyFile(publishIndexPath, backupIndexPath);

try {
  await copyFile(sourceIndexPath, publishIndexPath);
  await run('vite', ['build']);
} finally {
  await copyFile(backupIndexPath, publishIndexPath);
  await rm(backupIndexPath, { force: true });
}
