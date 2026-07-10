/**
 * RSS/Atom collector: used FIRST when a source defines an `rss` feed.
 *
 * We parse the feed to find the item whose link best matches the program page,
 * returning its pubDate/updated as a freshness signal. The feed itself rarely
 * contains the full scheme detail, so the caller still fetches the linked page
 * for extraction — RSS is primarily a change-detection accelerator here.
 */
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import type { Source } from '../types';
import { USER_AGENT } from '../services/pageDownloader';
import { logger } from '../utils/logger';

export interface RssItem {
  title: string;
  link: string;
  updated?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function collectRss(source: Source): Promise<RssItem[]> {
  if (!source.rss) return [];
  try {
    const res = await axios.get<string>(source.rss, {
      timeout: 30_000,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/rss+xml, application/xml' },
      responseType: 'text',
      validateStatus: () => true,
    });
    if (res.status >= 400) {
      logger.warn(`RSS ${source.rss} returned HTTP ${res.status}`);
      return [];
    }
    const doc = parser.parse(res.data);

    // RSS 2.0
    const rssItems = doc?.rss?.channel?.item;
    if (rssItems) {
      const arr = Array.isArray(rssItems) ? rssItems : [rssItems];
      logger.ok(`RSS feed parsed: ${source.rss} — ${arr.length} item(s)`);
      return arr.map((it: any) => ({
        title: String(it.title ?? ''),
        link: String(it.link ?? ''),
        updated: String(it.pubDate ?? it['dc:date'] ?? ''),
      }));
    }

    // Atom
    const atomEntries = doc?.feed?.entry;
    if (atomEntries) {
      const arr = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
      logger.ok(`Atom feed parsed: ${source.rss} — ${arr.length} entry(ies)`);
      return arr.map((e: any) => ({
        title: String(e.title?.['#text'] ?? e.title ?? ''),
        link: String(e.link?.['@_href'] ?? e.link ?? ''),
        updated: String(e.updated ?? e.published ?? ''),
      }));
    }

    logger.warn(`RSS ${source.rss} had no recognizable items`);
    return [];
  } catch (err) {
    logger.warn(`RSS fetch failed for ${source.rss}: ${(err as Error).message}`);
    return [];
  }
}
