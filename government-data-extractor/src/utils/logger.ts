/**
 * Lightweight logger: writes coloured lines to the console and appends a plain
 * copy to a timestamped file under /logs. No external dependencies.
 */
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(__dirname, '../../logs');

function ensureLogDir(): void {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `extract-${RUN_STAMP}.log`);

type Level = 'INFO' | 'OK' | 'WARN' | 'FAIL' | 'DEBUG';

const COLORS: Record<Level, string> = {
  INFO: '\x1b[36m', // cyan
  OK: '\x1b[32m', // green
  WARN: '\x1b[33m', // yellow
  FAIL: '\x1b[31m', // red
  DEBUG: '\x1b[90m', // grey
};
const RESET = '\x1b[0m';

function write(level: Level, msg: string): void {
  ensureLogDir();
  const time = new Date().toISOString();
  const line = `[${time}] ${level.padEnd(5)} ${msg}`;
  const symbol =
    level === 'OK' ? '✓' : level === 'FAIL' ? '✗' : level === 'WARN' ? '!' : '·';
  // eslint-disable-next-line no-console
  console.log(`${COLORS[level]}${symbol}${RESET} ${msg}`);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {
    /* logging must never crash the run */
  }
}

export const logger = {
  info: (msg: string) => write('INFO', msg),
  ok: (msg: string) => write('OK', msg),
  warn: (msg: string) => write('WARN', msg),
  fail: (msg: string) => write('FAIL', msg),
  debug: (msg: string) => {
    if (process.env.DEBUG) write('DEBUG', msg);
  },
  logFile: LOG_FILE,
};
