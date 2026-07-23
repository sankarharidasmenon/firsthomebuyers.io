/**
 * Structured logger that writes to both the console and logs/scrape.log.
 * Categories mirror the spec: visited, skipped, broken, pdf, rows, warn, error.
 */

import * as fs from 'fs';
import * as path from 'path';

const LOG_DIR = path.resolve(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'scrape.log');

type Level = 'INFO' | 'VISIT' | 'SKIP' | 'BROKEN' | 'PDF' | 'ROW' | 'WARN' | 'ERROR';

class Logger {
  private stream: fs.WriteStream;
  public counts: Record<string, number> = {
    visited: 0,
    skipped: 0,
    broken: 0,
    pdf: 0,
    rows: 0,
    warnings: 0,
    errors: 0,
  };

  constructor() {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    // fresh log each run
    this.stream = fs.createWriteStream(LOG_FILE, { flags: 'w', encoding: 'utf-8' });
    this.line('INFO', `Scrape log started ${new Date().toISOString()}`);
  }

  private write(level: Level, msg: string) {
    const ts = new Date().toISOString();
    const record = `[${ts}] [${level.padEnd(6)}] ${msg}`;
    this.stream.write(record + '\n');
  }

  private line(level: Level, msg: string) {
    this.write(level, msg);
    // console mirror (concise)
    const tag = level === 'ERROR' ? '✗' : level === 'WARN' ? '!' : '·';
    // eslint-disable-next-line no-console
    console.log(`${tag} ${msg}`);
  }

  info(msg: string) {
    this.write('INFO', msg);
  }
  visit(url: string, extra = '') {
    this.counts.visited++;
    this.write('VISIT', `${url}${extra ? ' — ' + extra : ''}`);
  }
  skip(url: string, reason: string) {
    this.counts.skipped++;
    this.write('SKIP', `${url} — ${reason}`);
  }
  broken(url: string, reason: string) {
    this.counts.broken++;
    this.line('BROKEN', `${url} — ${reason}`);
  }
  pdf(url: string, extra = '') {
    this.counts.pdf++;
    this.write('PDF', `${url}${extra ? ' — ' + extra : ''}`);
  }
  row(msg: string) {
    this.counts.rows++;
    this.line('ROW', msg);
  }
  warn(msg: string) {
    this.counts.warnings++;
    this.line('WARN', msg);
  }
  error(msg: string) {
    this.counts.errors++;
    this.line('ERROR', msg);
  }

  banner(msg: string) {
    // eslint-disable-next-line no-console
    console.log('\n' + msg);
    this.write('INFO', msg);
  }

  summary() {
    const c = this.counts;
    const s = [
      '──────────── SUMMARY ────────────',
      `Visited URLs : ${c.visited}`,
      `Skipped URLs : ${c.skipped}`,
      `Broken links : ${c.broken}`,
      `PDFs parsed  : ${c.pdf}`,
      `Rows extracted: ${c.rows}`,
      `Warnings     : ${c.warnings}`,
      `Errors       : ${c.errors}`,
      '─────────────────────────────────',
    ].join('\n');
    this.banner(s);
  }

  close(): Promise<void> {
    return new Promise((resolve) => this.stream.end(resolve));
  }
}

export const log = new Logger();
