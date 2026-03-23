import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDataDir = path.join(__dirname, 'build', 'data');
const srcDataDir = path.join(__dirname, 'src', 'data');

// Create build/data directory if it doesn't exist
if (!fs.existsSync(buildDataDir)) {
  fs.mkdirSync(buildDataDir, { recursive: true });
}

// Copy all JSON files from src/data to build/data
const files = fs.readdirSync(srcDataDir);
files.forEach(file => {
  const srcFile = path.join(srcDataDir, file);
  const destFile = path.join(buildDataDir, file);
  fs.copyFileSync(srcFile, destFile);
  console.log(`Copied ${file}`);
});
