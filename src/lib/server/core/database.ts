import fs from 'fs';
import path from 'path';

const storageDir = path.join(process.cwd(), 'data_fallback');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export function getStoragePath(filename: string): string {
  return path.join(storageDir, `${filename}.json`);
}

export function readStorage<T>(filename: string, defaultVal: T): T {
  const filePath = getStoragePath(filename);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    } catch (e) {
      console.error(`[DATABASE STORAGE] Error reading ${filename}:`, e);
    }
  }
  return defaultVal;
}

export function writeStorage<T>(filename: string, data: T): void {
  const filePath = getStoragePath(filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[DATABASE STORAGE] Error writing ${filename}:`, e);
  }
}
