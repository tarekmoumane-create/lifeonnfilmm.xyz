/* /api/tweets — recent posts for the X sticker on the wall.
   Reads the public profile page at x.com (it ships the latest posts inline, no login needed)
   and returns a small JSON list. Cached at the edge for 10 min, stale copy served for a day
   if X is slow or down. No keys, no X API. */

const HANDLE = 'tarekmou333';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const unesc = s => {
  try { s = JSON.parse('"' + s + '"'); } catch { s = s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'); }
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
};

function parse(html, handle) {
  // t.co -> readable link text, from every url entity on the page
  const links = {};
  for (const m of html.matchAll(/display_url:"([^"]*)",expanded_url:"([^"]*)",indices:\$R\[\d+\]=\[\d+,\d+\],url:"(https:\/\/t\.co\/[^"]+)"/g)) links[m[3]] = { display: unesc(m[1]), href: unesc(m[2]) };
  const mediaLinks = new Set([...html.matchAll(/media_url_https:"[^"]*"[^]*?url:"(https:\/\/t\.co\/[^"]+)"/g)].map(m => m[1]));

  // every tweet wrapper, in document order
  const wraps = [...html.matchAll(/rest_id:"(\d{15,})",result:\$R\[\d+\]=\{__isTweetResult/g)].map(m => ({ id: m[1], start: m.index, end: m.index + m[0].length }));
  for (const w of wraps) {
    // the body's own rest_id marks the end of this tweet's data (nested tweets sit before it)
    const own = html.indexOf(`rest_id:"${w.id}"`, w.end);
    w.bodyEnd = own > -1 ? own : Math.min(html.length, w.end + 12000);
    const seg = html.slice(w.end, w.bodyEnd);
    const ft = seg.match(/full_text:"((?:[^"\\]|\\.)*)"/), ca = seg.match(/created_at_ms:(\d+)/), sn = seg.match(/screen_name:"([^"]+)"/), nm = seg.match(/name:"((?:[^"\\]|\\.)*)",screen_name:/);
    const likes = seg.match(/favorite_count:(\d+)/), replies = seg.match(/reply_count:(\d+)/);
    w.text = ft ? unesc(ft[1]) : ''; w.ms = ca ? +ca[1] : 0; w.author = sn ? sn[1] : ''; w.name = nm ? unesc(nm[1]) : '';
    w.likes = likes ? +likes[1] : 0; w.replies = replies ? +replies[1] : 0;
    w.hasMedia = /media_url_https/.test(seg.slice(0, seg.search(/rest_id:"\d{15,}",result:\$R/) > -1 ? seg.search(/rest_id:"\d{15,}",result:\$R/) : seg.length));
  }
  const pretty = t => {
    let s = t;
    for (const [tco, l] of Object.entries(links)) s = s.split(tco).join(l.display);
    s = s.replace(/https?:\/\/t\.co\/\w+/g, '').replace(/[ \t]+\n/g, '\n').replace(/\s{2,}/g, ' ').trim();
    return s;
  };
  const out = [], seen = new Set();
  for (let i = 0; i < wraps.length; i++) {
    const w = wraps[i];
    const parent = wraps.slice(0, i).find(p => w.start > p.start && w.start < p.bodyEnd);
    if (parent) continue; // nested (quoted / reposted) tweet, handled by its parent
    if (w.author.toLowerCase() !== handle.toLowerCase() || seen.has(w.id)) continue;
    seen.add(w.id);
    const child = wraps.slice(i + 1).find(c => c.start > w.start && c.start < w.bodyEnd);
    const isRT = /^RT @/.test(w.text);
    const item = { id: w.id, url: `https://x.com/${handle}/status/${w.id}`, ms: w.ms, date: new Date(w.ms).toISOString(), text: pretty(w.text), likes: w.likes, replies: w.replies, media: w.hasMedia, kind: 'post' };
    if (child) {
      item.kind = isRT ? 'repost' : 'quote';
      item.ref = { handle: child.author, name: child.name, text: pretty(child.text), url: `https://x.com/${child.author}/status/${child.id}` };
      if (isRT) { item.text = ''; item.url = item.ref.url; }
    }
    out.push(item);
  }
  out.sort((a, b) => b.ms - a.ms);
  const name = (html.match(/name:"((?:[^"\\]|\\.)*)",screen_name:"tarekmou333"/i) || [])[1];
  const avatar = (html.match(/image_url:"(https:\/\/pbs\.twimg\.com\/profile_images\/[^"]+)"/) || [])[1];
  return { handle, name: name ? unesc(name) : handle, avatar: avatar ? avatar.replace('_normal', '_200x200') : null, url: `https://x.com/${handle}`, tweets: out };
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
