/**
 * Minimal robots.txt fetcher + matcher (no external dependency).
 *
 * We respect Disallow rules for our User-Agent (falling back to the `*` group).
 * Only path prefixes are supported (the common case); `Allow` overrides that are
 * more specific than a matching `Disallow` are honoured. Unknown/absent robots
 * files default to "allowed".
 *
 * This is a politeness layer, not a security boundary — combined with the
 * throttling in the crawler it keeps us well-behaved on government servers.
 */
import axios from 'axios';
import { USER_AGENT } from '../services/pageDownloader';
import { logger } from '../utils/logger';

interface Rule {
  allow: boolean;
  path: string;
}

export class RobotsChecker {
  private rules: Rule[] = [];
  private loaded = false;

  private constructor(private readonly origin: string) {}

  /** Fetch and parse robots.txt for a host origin (e.g. https://example.gov.au). */
  static async forOrigin(origin: string): Promise<RobotsChecker> {
    const checker = new RobotsChecker(origin);
    await checker.load();
    return checker;
  }

  private async load(): Promise<void> {
    try {
      const res = await axios.get<string>(`${this.origin}/robots.txt`, {
        timeout: 15_000,
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/plain' },
        responseType: 'text',
        validateStatus: () => true,
        maxRedirects: 3,
      });
      if (res.status >= 400 || typeof res.data !== 'string') {
        this.loaded = true;
        return;
      }
      this.parse(res.data);
    } catch (err) {
      logger.debug(`robots.txt fetch failed for ${this.origin}: ${(err as Error).message}`);
    } finally {
      this.loaded = true;
    }
  }

  /**
   * Parse robots.txt, collecting rules from the most specific matching
   * user-agent group. We prefer a group naming our bot; else the `*` group.
   */
  private parse(text: string): void {
    const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim());
    const uaLower = USER_AGENT.toLowerCase();

    // Group lines by their User-agent header(s).
    const groups: { agents: string[]; rules: Rule[] }[] = [];
    let current: { agents: string[]; rules: Rule[] } | null = null;
    let expectingAgents = false;

    for (const line of lines) {
      if (!line) continue;
      const [rawKey, ...rest] = line.split(':');
      const key = rawKey.toLowerCase().trim();
      const value = rest.join(':').trim();
      if (key === 'user-agent') {
        if (!expectingAgents || !current) {
          current = { agents: [], rules: [] };
          groups.push(current);
          expectingAgents = true;
        }
        current.agents.push(value.toLowerCase());
      } else if (key === 'disallow' || key === 'allow') {
        expectingAgents = false;
        if (current) current.rules.push({ allow: key === 'allow', path: value });
      }
    }

    const matchAgent = (agents: string[]) =>
      agents.some((a) => a === '*' || (a && uaLower.includes(a)));
    const named = groups.find((g) => g.agents.some((a) => a !== '*' && uaLower.includes(a)));
    const star = groups.find((g) => g.agents.includes('*'));
    const chosen = named || star || groups.find((g) => matchAgent(g.agents));
    this.rules = chosen ? chosen.rules.filter((r) => r.path !== '' || r.allow) : [];
  }

  /** Is the given path allowed? Longest matching rule wins; Allow beats Disallow. */
  isAllowed(pathname: string): boolean {
    if (!this.loaded || this.rules.length === 0) return true;
    let best: Rule | null = null;
    for (const rule of this.rules) {
      if (rule.path && pathname.startsWith(rule.path)) {
        if (!best || rule.path.length > best.path.length) best = rule;
      }
    }
    // Empty Disallow ("Disallow:") means allow-all and is ignored above.
    return best ? best.allow : true;
  }
}
