import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const envExamplePath = path.join(cwd, '.env.example');

if (!fs.existsSync(envExamplePath)) {
  console.error('Missing .env.example at project root.');
  process.exit(1);
}

const requiredKeys = fs
  .readFileSync(envExamplePath, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('=')[0]?.trim())
  .filter(Boolean);

const missing = requiredKeys.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required env vars:');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log('Environment check passed.');
