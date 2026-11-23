// TIS প্রতিদিন+ — news collector (Node 20+, no dependencies)
// Runs on GitHub Actions every few hours. Reads RSS/Atom feeds from newspapers,
// Google News and YouTube, groups items by Bangladesh date and writes
// data/news/YYYY-MM-DD.json + data/index.json. Optional: GEMINI_API_KEY → AI digest.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(ROOT, 'data');
const NEWS = path.join(DATA, 'news');
const AI = path.join(DATA, 'ai');
const SRC = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts', 'sources.json'), 'utf8'));
const UA = 'Mozilla/5.0 (compatible; TIS-Protidin/1.0; +https://github.com/tariqulislam4015/tis-protidin)';
const MAX_AGE_DAYS = 6;

// ---------- helpers ----------
const dhakaDate = (d) => new Date(d.getTime() + 6 * 3600e3).toISOString().slice(0, 10);
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
function decode(s = '') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
const strip = (s = '') => decode(decode(s)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}
function attr(block, name, a) {
  const m = block.match(new RegExp(`<${name}\\s[^>]*${a}=["']([^"']+)["'][^>]*>`, 'i'));
  return m ? decode(m[1]) : '';
}
async function get(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 20000);
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'bn,en;q=0.8' }, signal: ctl.signal, redirect: 'follow' });
      clearTimeout(t);
      if (r.ok) return await r.text();
      console.log(`  ! ${r.status} ${url}`);
    } catch (e) { console.log(`  ! ${e.name} ${url}`); }
  }
  return '';
}

// ---------- parse RSS / Atom ----------
function parseFeed(xml) {
  const out = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    const title = strip(tag(b, 'title'));
    let link = isAtom ? (attr(b, 'link', 'href') || strip(tag(b, 'link'))) : strip(tag(b, 'link'));
    if (!link) link = strip(tag(b, 'guid'));
    const desc = strip(tag(b, 'description') || tag(b, 'summary') || tag(b, 'media:description') || tag(b, 'content:encoded') || tag(b, 'content'));
    const when = strip(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    let img = attr(b, 'media:content', 'url') || attr(b, 'media:thumbnail', 'url') || attr(b, 'enclosure', 'url');
    if (!img) { const m = decode(b).match(/<img[^>]+src=["']([^"']+)["']/i); if (m) img = m[1]; }
    const vid = strip(tag(b, 'yt:videoId'));
    const src = strip(tag(b, 'source'));
    if (title && link) out.push({ title, link, desc, when, img, vid, src });
  }
  return out;
}

// ---------- categorise ----------
const KW = {
  business: /অর্থনীতি|অর্থনৈতিক|ব্যাংক|বাজেট|শেয়ার|পুঁজিবাজার|রপ্তানি|আমদানি|রেমিট্যান্স|প্রবাসী আয়|মূল্যস্ফীতি|ডলার|রিজার্ভ|রাজস্ব|বিনিয়োগ|ঋণ|জিডিপি|বাণিজ্য|economy|economic|bank|budget|inflation|export|import|remittance|reserve|stock|market|trade|tariff|imf|world bank|gdp|investment|revenue|loan|dollar|taka|oil price|business/i,
  sports: /ক্রিকেট|ফুটবল|টেস্ট|ওয়ানডে|টি-টোয়েন্টি|বিশ্বকাপ|অলিম্পিক|ম্যাচ|গোল|সাকিব|cricket|football|fifa|olympic|tennis|match|world cup|t20|odi|premier league|goal/i,
  tech: /প্রযুক্তি|কৃত্রিম বুদ্ধিমত্তা|এআই|ইন্টারনেট|মোবাইল|স্মার্টফোন|মহাকাশ|বিজ্ঞান|গবেষণা|স্যাটেলাইট|সাইবার|technology|tech|\bai\b|artificial intelligence|internet|smartphone|space|nasa|science|research|satellite|cyber|climate/i,
  editorial: /সম্পাদকীয়|মতামত|উপসম্পাদকীয়|কলাম|editorial|opinion|op-ed|column/i,
  international: /যুক্তরাষ্ট্র|আমেরিকা|ভারত|চীন|রাশিয়া|ইউক্রেন|গাজা|ইসরায়েল|ফিলিস্তিন|ইরান|পাকিস্তান|মিয়ানমার|জাতিসংঘ|ইউরোপ|জাপান|সৌদি|ট্রাম্প|মোদি|বিশ্ব|united states|\bus\b|usa|india|china|russia|ukraine|gaza|israel|iran|pakistan|myanmar|\bun\b|united nations|europe|japan|trump|global|world/i,
};
const BD = /বাংলাদেশ|ঢাকা|চট্টগ্রাম|রোহিঙ্গা|সরকার|উপদেষ্টা|নির্বাচন|সংসদ|bangladesh|dhaka|chattogram|rohingya/i;
function categorise(feedCat, text) {
  if (!feedCat.startsWith('auto')) return feedCat;
  for (const c of ['editorial', 'sports', 'business', 'tech']) if (KW[c].test(text)) return c;
  if (KW.international.test(text) && !BD.test(text)) return 'international';
  return feedCat === 'auto-intl' && !BD.test(text) ? 'international' : 'national';
}

// ---------- collect ----------
const items = [];
const now = new Date();
const minTime = now.getTime() - MAX_AGE_DAYS * 864e5;
function push(raw, feed, extra = {}) {
  let t = new Date(raw.when);
  if (isNaN(t)) t = now;
  if (t.getTime() > now.getTime()) t = now; // never date items in the future
  if (t.getTime() < minTime) return;
  let title = raw.title, sn = feed.name;
  if (feed.aggregator || extra.gn) { // Google News: "Headline - Source"
    const m = title.match(/^(.*)\s[-–—]\s([^-–—]{2,60})$/);
    if (m) { title = m[1].trim(); sn = (raw.src || m[2]).trim(); }
  }
  let desc = raw.desc;
  if (feed.aggregator || extra.gn || desc.startsWith(title)) desc = '';
  desc = desc.length > 420 ? desc.slice(0, 400).replace(/\s\S*$/, '') + '…' : desc;
  items.push({
    id: sha(title.toLowerCase()), t: title, d: desc, u: raw.link, s: feed.id, sn,
    c: extra.cat || categorise(feed.cat, title + ' ' + desc), p: t.toISOString(),
    img: raw.img && /^https?:/.test(raw.img) ? raw.img : undefined, l: feed.lang, v: raw.vid || undefined,
    f: extra.feat ? 1 : undefined, x: extra.hl ? 1 : undefined,
  });
}
const gnUrl = (site, lang) => `https://news.google.com/rss/search?q=site:${encodeURIComponent(site)}+when:1d&hl=${lang === 'bn' ? 'bn' : 'en-BD'}&gl=BD&ceid=BD:${lang === 'bn' ? 'bn' : 'en'}`;

const stats = {};
await Promise.all(SRC.feeds.map(async (f) => {
  let got = [];
  if (!f.gnOnly && f.url) got = parseFeed(await get(f.url));
  let viaGN = false;
  if (!got.length && f.gn) { got = parseFeed(await get(gnUrl(f.gn, f.lang))); viaGN = true; }
  got.slice(0, 60).forEach((r) => push(r, f, { gn: viaGN }));
  stats[f.id] = `${got.length}${viaGN ? ' (via Google News)' : ''}`;
}));

// YouTube channels → resolve handle to channel id, then Atom feed
await Promise.all(SRC.youtube.map(async (y) => {
  const page = await get(`https://www.youtube.com/@${y.handle}`, 1);
  const id = (page.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/) || page.match(/channel\/(UC[\w-]{22})/) || [])[1];
  if (!id) { stats['yt:' + y.handle] = 'no id'; return; }
  const got = parseFeed(await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`));
  const hl = y.highlight ? new RegExp(y.highlight, 'i') : null;
  got.slice(0, y.max || 8).forEach((r) => push({ ...r, img: r.vid ? `https://i.ytimg.com/vi/${r.vid}/hqdefault.jpg` : r.img, desc: r.desc.slice(0, 300) }, { id: 'yt-' + y.handle.toLowerCase(), name: y.name, lang: 'bn', cat: 'video' }, { cat: 'video', feat: y.featured, hl: hl && hl.test(r.title) }));
  stats['yt:' + y.handle] = got.length;
  // daily program search (e.g. Jamuna i-Desk) — the channel feed holds only the latest 15 videos
  if (y.search) {
    const html = await get(`https://www.youtube.com/@${y.handle}/search?query=${encodeURIComponent(y.search)}`, 1);
    const seen = new Set(); let n = 0;
    for (const m of html.matchAll(/"videoRenderer":\{"videoId":"([\w-]{11})"[\s\S]{0,1500}?"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/g)) {
      const [, vid, rawT] = m; if (seen.has(vid)) continue; seen.add(vid);
      const title = JSON.parse(`"${rawT}"`);
      if (hl && !hl.test(title)) continue;
      const dm = title.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
      const when = dm ? new Date(`${dm[1]} ${dm[2]} ${dm[3]} 12:00 GMT+0600`).toUTCString() : '';
      if (!when) continue;
      push({ title, link: `https://www.youtube.com/watch?v=${vid}`, desc: '', when, img: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, vid }, { id: 'yt-' + y.handle.toLowerCase(), name: y.name, lang: 'bn', cat: 'video' }, { cat: 'video', feat: y.featured, hl: true });
      n++;
    }
    stats['yt-search:' + y.search] = n;
  }
}));
console.table(stats);

// pinned videos (always shown at the top of the Video section) — title via YouTube oEmbed
const pinned = [];
for (const v of SRC.pinVideos || []) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${v}&format=json`, { headers: { 'User-Agent': UA } });
    const j = r.ok ? await r.json() : {};
    pinned.push({ v, t: j.title || 'Jamuna TV', sn: j.author_name || 'Jamuna TV', u: `https://www.youtube.com/watch?v=${v}`, img: `https://i.ytimg.com/vi/${v}/hqdefault.jpg` });
  } catch { pinned.push({ v, t: 'Jamuna TV', sn: 'Jamuna TV', u: `https://www.youtube.com/watch?v=${v}`, img: `https://i.ytimg.com/vi/${v}/hqdefault.jpg` }); }
}
await fs.mkdir(DATA, { recursive: true });
await fs.writeFile(path.join(DATA, 'pinned.json'), JSON.stringify({ updated: now.toISOString(), channel: 'https://www.youtube.com/@JamunaTVbd', videos: pinned }));

// ---------- merge into date files ----------
await fs.mkdir(NEWS, { recursive: true });
const byDate = {};
for (const it of items) (byDate[dhakaDate(new Date(it.p))] ||= []).push(it);
for (const [date, list] of Object.entries(byDate)) {
  const file = path.join(NEWS, `${date}.json`);
  let old = [];
  try { old = JSON.parse(await fs.readFile(file, 'utf8')).items || []; } catch {}
  const map = new Map(old.map((x) => [x.id, x]));
  for (const it of list) if (!map.has(it.id)) map.set(it.id, it);
  const merged = [...map.values()].sort((a, b) => b.p.localeCompare(a.p)).slice(0, 700);
  await fs.writeFile(file, JSON.stringify({ date, updated: now.toISOString(), items: merged }));
}

// ---------- index ----------
const files = (await fs.readdir(NEWS)).filter((f) => f.endsWith('.json')).sort().reverse();
const dates = [];
for (const f of files) {
  const j = JSON.parse(await fs.readFile(path.join(NEWS, f), 'utf8'));
  const cats = {};
  for (const it of j.items) cats[it.c] = (cats[it.c] || 0) + 1;
  let ai = false; try { await fs.access(path.join(AI, f)); ai = true; } catch {}
  dates.push({ date: j.date, count: j.items.length, cats, ai });
}
await fs.writeFile(path.join(DATA, 'index.json'), JSON.stringify({ updated: now.toISOString(), dates }, null, 0));
console.log(`Saved ${items.length} fetched items → ${Object.keys(byDate).length} date files. Archive: ${dates.length} days.`);

// ---------- optional AI digest (Gemini) ----------
const KEY = process.env.GEMINI_API_KEY;
if (KEY) {
  const today = dhakaDate(now);
  const j = JSON.parse(await fs.readFile(path.join(NEWS, `${today}.json`), 'utf8'));
  const pick = [];
  const per = { national: 10, international: 8, business: 8, editorial: 5, tech: 4, sports: 3 };
  for (const [c, n] of Object.entries(per)) pick.push(...j.items.filter((x) => x.c === c).slice(0, n));
  const list = pick.map((x, i) => `${i + 1}. [${x.c}] ${x.t} — ${x.d || ''} (${x.sn})`).join('\n');
  const prompt = `তুমি বাংলাদেশের ব্যাংক/বিসিএস চাকরি পরীক্ষার কারেন্ট অ্যাফেয়ার্স শিক্ষক। নিচের আজকের (${today}) খবরের শিরোনাম থেকে শুধু যা দেওয়া আছে তার উপর ভিত্তি করে (কোনো তথ্য বানাবে না) একটি JSON দাও:
{"summary":"আজকের ৫-৬ বাক্যের বাংলা সারসংক্ষেপ","points":[{"n":খবরের নম্বর,"bn":"১-২ বাক্যে বাংলায় মূল তথ্য","exam":"পরীক্ষায় লেখার মতো এক লাইন"}],"mcq":[{"q":"প্রশ্ন","o":["ক","খ","গ","ঘ"],"a":সঠিক অপশনের index 0-3,"e":"ব্যাখ্যা","n":খবরের নম্বর}]}
points-এ সবগুলো গুরুত্বপূর্ণ খবর, mcq-তে ঠিক ১৫টি প্রশ্ন। শুধু JSON দাও।\n\n${list}`;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.3 } }),
    });
    const out = await r.json();
    const txt = out?.candidates?.[0]?.content?.parts?.[0]?.text;
    const ai = JSON.parse(txt);
    ai.points = (ai.points || []).map((p) => ({ ...p, id: pick[p.n - 1]?.id })).filter((p) => p.id);
    ai.mcq = (ai.mcq || []).filter((m) => Array.isArray(m.o) && m.o.length === 4 && m.a >= 0 && m.a < 4).map((m) => ({ ...m, id: pick[m.n - 1]?.id }));
    await fs.mkdir(AI, { recursive: true });
    await fs.writeFile(path.join(AI, `${today}.json`), JSON.stringify({ date: today, model, ...ai }));
    const idx = JSON.parse(await fs.readFile(path.join(DATA, 'index.json'), 'utf8'));
    idx.dates.forEach((d) => { if (d.date === today) d.ai = true; });
    await fs.writeFile(path.join(DATA, 'index.json'), JSON.stringify(idx));
    console.log(`AI digest saved: ${ai.points.length} points, ${ai.mcq.length} MCQ`);
  } catch (e) { console.log('AI digest skipped:', e.message); }
}
