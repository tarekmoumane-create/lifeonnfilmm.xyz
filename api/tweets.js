/* /api/tweets — recent posts for the X sticker on the wall.
   Reads the public profile page at x.com (it ships the latest posts inline as JSON, no login needed)
   and returns a small JSON list. Cached at the edge for 10 min, stale copy served for a day
   if X is slow or down. No keys, no X API. */

const HANDLE = 'tarekmou333';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const unent = s => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// x.com inlines its GraphQL responses as escaped JSON strings: kind:"Result.Ok",value:"{\"data\":...}"
function payloads(html) {
  const out = [];
  for (const m of html.matchAll(/kind:"Result\.Ok",value:"((?:[^"\\]|\\.)*)"/g)) {
    try { out.push(JSON.parse(JSON.parse('"' + m[1] + '"'))); } catch {}
  }
  return out;
}
function* walk(o) {
  if (!o || typeof o !== 'object') return;
  yield o;
  for (const v of Array.isArray(o) ? o : Object.values(o)) yield* walk(v);
}
const unwrap = r => (r && r.__typename === 'TweetWithVisibilityResults' ? r.tweet : r) || null;
const firstKey = (o, re) => { for (const k of Object.keys(o || {})) if (re.test(k)) return o[k]; return null; };

function tweet(r) {
  r = unwrap(r); if (!r || !r.rest_id) return null;
  const u = (r.core && r.core.user_results && r.core.user_results.result) || {};
  const d = r.details || r.legacy || {};
  let text = unent(d.full_text || '');
  for (const e of r.url_entities || (r.legacy && r.legacy.entities && r.legacy.entities.urls) || []) if (e.url) text = text.split(e.url).join(e.display_url || e.expanded_url || '');
  text = text.replace(/https?:\/\/t\.co\/\w+/g, '').replace(/[ \t]+\n/g, '\n').replace(/\s{2,}/g, ' ').trim();
  const c = r.counts || r.legacy || {};
  return {
    id: r.rest_id,
    author: (u.core && u.core.screen_name) || u.screen_name || (u.legacy && u.legacy.screen_name) || '',
    name: unent((u.core && u.core.name) || (u.legacy && u.legacy.name) || ''),
    avatar: (u.avatar && u.avatar.image_url) || null,
    ms: +(d.created_at_ms || Date.parse(d.created_at) || 0),
    text, rawRT: /^RT @/.test(d.full_text || ''),
    likes: +(c.favorite_count || 0), replies: +(c.reply_count || 0),
    media: !!((r.media_entities2 && r.media_entities2.length) || (r.legacy && r.legacy.entities && r.legacy.entities.media)),
    quoted: unwrap(r.quoted_tweet_results && r.quoted_tweet_results.result),
    reposted: unwrap((firstKey(r, /^retweeted.*_results$/) || {}).result)
  };
}

function parse(html, handle) {
  const lower = handle.toLowerCase(), out = [], seen = new Set();
  let name = handle, avatar = null;
  for (const p of payloads(html)) {
    for (const o of walk(p)) {
      if (typeof o.entry_id !== 'string' || !/^(tweet|profile-conversation)-/.test(o.entry_id)) continue;
      const tr = [...walk(o)].find(x => x.tweet_results && x.tweet_results.result);
      const t = tr && tweet(tr.tweet_results.result);
      if (!t || seen.has(t.id) || t.author.toLowerCase() !== lower) continue;
      seen.add(t.id);
      if (t.name) name = t.name; if (t.avatar) avatar = t.avatar;
      const item = { id: t.id, url: `https://x.com/${handle}/status/${t.id}`, ms: t.ms, date: new Date(t.ms).toISOString(), text: t.text, likes: t.likes, replies: t.replies, media: t.media, kind: 'post' };
      const ref = tweet(t.reposted) || tweet(t.quoted);
      if (ref) {
        item.kind = t.reposted || t.rawRT ? 'repost' : 'quote';
        item.ref = { handle: ref.author, name: ref.name, text: ref.text, url: `https://x.com/${ref.author}/status/${ref.id}` };
        if (item.kind === 'repost') { item.text = ''; item.url = item.ref.url; }
      }
      out.push(item);
    }
  }
  out.sort((a, b) => b.ms - a.ms);
  return { handle, name, avatar: avatar ? avatar.replace('_normal', '_200x200') : null, url: `https://x.com/${handle}`, tweets: out };
}

let last = null; // last good result for this instance
async function load(handle) {
  const r = await fetch(`https://x.com/${handle}`, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'en-US,en;q=0.9' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`x.com ${r.status}`);
  const html = await r.text();
  const data = parse(html, handle);
  if (!data.tweets.length) throw new Error('no tweets found in page');
  data.fetched = new Date().toISOString();
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  try {
    const data = await load(HANDLE); last = data;
    res.setHeader('cache-control', 'public, s-maxage=600, stale-while-revalidate=86400, max-age=120');
    res.status(200).json(data);
  } catch (e) {
    if (last) { res.setHeader('cache-control', 'public, s-maxage=120, max-age=60'); return res.status(200).json({ ...last, stale: true }); }
    res.setHeader('cache-control', 'no-store');
    res.status(502).json({ error: String(e.message || e) });
  }
};
module.exports.parse = parse;
