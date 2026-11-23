// TIS প্রতিদিন+ — daily insight builder (runs after fetch-news.mjs)
// For each date: ⭐ 7-star must-read ranking, English vocabulary (Bangla meaning,
// synonyms, antonyms, part of speech), long sentences with Bangla translation.
// Writes data/insight/YYYY-MM-DD.json. Network lookups are cached in data/lang-cache.json.
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(ROOT, 'data'), NEWS = path.join(DATA, 'news'), OUT = path.join(DATA, 'insight');
const CACHE_F = path.join(DATA, 'lang-cache.json');
const UA = 'Mozilla/5.0 (compatible; TIS-Protidin/1.0)';
const today = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
const yest = new Date(Date.now() + 6 * 3600e3 - 864e5).toISOString().slice(0, 10);
await fs.mkdir(OUT, { recursive: true });

const curatedSrc = await fs.readFile(path.join(ROOT, 'js', 'vocab-data.js'), 'utf8');
const CURATED = JSON.parse(curatedSrc.slice(curatedSrc.indexOf('{'), curatedSrc.lastIndexOf('}') + 1));
let cache = {};
try { cache = JSON.parse(await fs.readFile(CACHE_F, 'utf8')); } catch {}
if (cache.v !== 4) { cache = { v: 4, t: cache.t || {} }; }
cache.w ||= {}; cache.t ||= {};

// ---------------- network helpers ----------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let logged = 0;
async function getJSON(url) {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) { if (logged++ < 6) console.log(`  ! HTTP ${r.status} ${url.slice(0, 90)}`); return null; }
    const txt = await r.text();
    try { return JSON.parse(txt); } catch { if (logged++ < 6) console.log(`  ! non-JSON ${url.slice(0, 70)}: ${txt.slice(0, 120)}`); return null; }
  } catch (e) { if (logged++ < 6) console.log(`  ! ${e.name}: ${e.message} ${url.slice(0, 80)}`); return null; }
}
let netFails = 0, gtxBlocked = false, mmFails = 0;
async function translate(text, short = false) {
  if (!text) return '';
  if (cache.t[text]) return cache.t[text];
  let out = '';
  if (!gtxBlocked) {
    const j = await getJSON(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(text)}`);
    if (j) out = (j[0] || []).map((x) => x[0]).join('').trim(); else gtxBlocked = true;
  }
  if (!out && mmFails < 4) { // MyMemory free API
    const j = await getJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=en|bn`);
    const t = j?.responseData?.translatedText;
    if (t && j.responseStatus == 200 && !/MYMEMORY WARNING|QUERY LENGTH/i.test(t)) out = t.trim(); else mmFails++;
    await sleep(250);
  }
  if (out) cache.t[text] = out;
  return out;
}
async function lookupWord(w) {
  if (cache.w[w]?.bn) return cache.w[w];
  const res = { pos: '', bn: '', bnAlt: {}, def: '', syn: [], ant: [] };
  const g = gtxBlocked ? null : await getJSON(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&dt=bd&q=${encodeURIComponent(w)}`);
  if (g) {
    res.bn = (g[0] || []).map((x) => x[0]).join('').trim();
    (g[1] || []).forEach((b) => { if (b && b[0] && Array.isArray(b[1])) res.bnAlt[b[0]] = b[1].slice(0, 4); });
  } else { gtxBlocked = true; res.bn = await translate(w, true); }
  res.bn = (res.bn || '').replace(/\s*\([^)]*\)\s*:?/g, '').replace(/[:;।]+$/, '').trim();
  if (res.bn && (res.bn.toLowerCase() === w || res.bn.length > 32 || res.bn.split(/\s+/).length > 4)) res.bn = '';
  const forms = [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, ''), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'), w.replace(/ing$/, ''), w.replace(/ing$/, 'e')];
  for (const f of [...new Set(forms)]) {
    const d = await getJSON(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(f)}`);
    await sleep(120);
    if (!Array.isArray(d)) continue;
    const syn = new Set(), ant = new Set(), pos = [];
    let mi = 0;
    for (const e of d) for (const m of e.meanings || []) {
      if (m.partOfSpeech && !pos.includes(m.partOfSpeech)) pos.push(m.partOfSpeech);
      if (mi++ > 0) continue; // synonyms/antonyms only from the main (first) sense
      const d0 = (m.definitions || [])[0];
      if (d0) { res.def = d0.definition; (d0.synonyms || []).forEach((s) => syn.add(s)); (d0.antonyms || []).forEach((s) => ant.add(s)); }

    }
    res.pos = pos.join('/'); res.syn = [...syn].slice(0, 6); res.ant = [...ant].slice(0, 5);
    if (f !== w) res.base = f;
    break;
  }
  if (!res.pos && Object.keys(res.bnAlt).length) res.pos = Object.keys(res.bnAlt).join('/');
  if (res.bn || res.def) cache.w[w] = res;
  if (!res.def && !res.bn) netFails++;
  return res.bn || res.def ? res : null;
}

// ---------------- text helpers ----------------
const isEn = (s) => { const a = (s.match(/[A-Za-z]/g) || []).length, b = (s.match(/[ঀ-৿]/g) || []).length; return a > b * 2 && a > 10; };
const STOP_BN = new Set('এবং ও করে করা হয় হয়েছে হবে থেকে জন্য নিয়ে সঙ্গে সাথে তার তাঁর এই একটি এক না বা আর পর বলে বলেন বলেছেন দিয়ে দিয়েছে কথা নতুন আজ মধ্যে যে কি কী এ সে তারা তাদের কোনো হলো হচ্ছে চায় দেখা গেছে আছে নেই সব বিভিন্ন এখন প্রতি দুই তিন হাজার কোটি লাখ জন'.split(' '));
const STOP_EN = new Set('that this with from have has had were been will would could should their there they them than then what when where which while about after before over into more most some such only also just said says amid says year years first last new news week today people other just like make made says told after against between under during because being these those many much very still back here since says'.split(' '));
const tokens = (s) => (s.normalize('NFC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []).filter((w) => (/[a-z]/.test(w) ? w.length >= 4 && !STOP_EN.has(w) : w.length >= 3 && !STOP_BN.has(w)));
// common long words that need no vocabulary card
const COMMON = new Set(('government governments minister ministers country countries president national international between because through against without percent million billion company companies business businesses people should another children students student officials official including according reported reports report police political politics members member economic economy minister market markets million billion thousand hundred development developing important announced announce support supported service services system systems process program programme programs project projects meeting meetings increase increased increasing decrease decreased decision decisions public private health hospital hospitals education school schools university universities country\'s nation nations world global region regional local central capital family families market prices price workers worker industry industries security secretary general director chairman chief leader leaders party parties election elections election\'s former second third fourth number numbers several during before around something everything nothing anything already however although whether toward towards within across another others yesterday tomorrow morning evening tonight second minutes minute hours percent january february march april june july august september october november december monday tuesday wednesday thursday friday saturday sunday english bangladesh bangladeshi dhaka india indian china chinese united states america american russia russian ukraine pakistan british europe european britain london washington israel israeli palestinian gaza iran iranian saudi japan japanese korea korean africa african australia canada germany france french turkey myanmar nepal bhutan sri lanka maldives afghanistan trump biden modi putin xi netanyahu started starting continue continued continues believe believed called calling likely become became becomes create created creating provide provided providing receive received according including following followed recent recently currently further really already almost always never often perhaps probably actually certain certainly possible possibly enough because cannot couldn\'t didn\'t doesn\'t wouldn\'t isn\'t aren\'t wasn\'t weren\'t haven\'t hasn\'t').split(' '));

// ---------------- ⭐ ranking ----------------
const EXAM = [
  [/\bCOP\d*\b|climate|জলবায়ু|UNFCCC|carbon|কার্বন|global warming|বৈশ্বিক উষ্ণতা/i, 6, 'জলবায়ু/পরিবেশ'],
  [/\bIMF\b|World Bank|\bADB\b|AIIB|বিশ্বব্যাংক|আইএমএফ|এডিবি/i, 6, 'আন্তর্জাতিক আর্থিক সংস্থা'],
  [/Bangladesh Bank|বাংলাদেশ ব্যাংক|policy rate|নীতি সুদ|\brepo\b|রেপো|\breserves?\b|রিজার্ভ|inflation|মূল্যস্ফীতি|remittance|রেমিট্যান্স|monetary|মুদ্রানীতি/i, 6, 'ব্যাংকিং ও মুদ্রানীতি'],
  [/\bbudget\b|বাজেট|\bGDP\b|জিডিপি|revenue|রাজস্ব|\bexports?\b|রপ্তানি|\bimports?\b|আমদানি|tariff|শুল্ক|\bLDC\b|এলডিসি|graduation|উত্তরণ/i, 5, 'অর্থনীতি'],
  [/election|নির্বাচন|referendum|গণভোট|parliament|সংসদ|constitution|সংবিধান|reform commission|সংস্কার কমিশন|July Charter|জুলাই সনদ/i, 5, 'রাষ্ট্র ও নির্বাচন'],
  [/summit|শীর্ষ সম্মেলন|সম্মেলন|conference|agreement|চুক্তি|treaty|\bMoU\b|সমঝোতা|accord/i, 5, 'সম্মেলন/চুক্তি'],
  [/\bG20\b|\bG7\b|BRICS|ব্রিকস|SAARC|সার্ক|ASEAN|আসিয়ান|BIMSTEC|বিমসটেক|\bOIC\b|NATO|ন্যাটো|\bEU\b|ইউরোপীয় ইউনিয়ন|\bWTO\b|\bWHO\b|UNESCO|ইউনেস্কো|\bUN\b|United Nations|জাতিসংঘ|Security Council|নিরাপত্তা পরিষদ|APEC|SCO/i, 5, 'আন্তর্জাতিক সংস্থা'],
  [/Nobel|নোবেল|\bawards?\b|পুরস্কার|prize|\brecords?\b|রেকর্ড|first ever|প্রথমবার|World Heritage|বিশ্ব ঐতিহ্য|ranking|সূচক|\bindex\b/i, 4, 'পুরস্কার/রেকর্ড/সূচক'],
  [/appointed|নিয়োগ|elected|নির্বাচিত|sworn|শপথ|new chief|new president|নতুন প্রধান|\bCEO\b|সিইও|governor|গভর্নর|chief adviser|প্রধান উপদেষ্টা/i, 4, 'নিয়োগ/পদ'],
  [/Rohingya|রোহিঙ্গা|Myanmar|মিয়ানমার|Rakhine|রাখাইন/i, 5, 'রোহিঙ্গা ইস্যু'],
  [/Gaza|গাজা|Israel|ইসরায়েল|Palestin|ফিলিস্তিন|Ukraine|ইউক্রেন|Russia|রাশিয়া|\bIran\b|ইরান|Yemen|ইয়েমেন|Sudan|সুদান/i, 3, 'বৈশ্বিক সংঘাত'],
  [/\bAI\b|artificial intelligence|কৃত্রিম বুদ্ধিমত্তা|এআই|satellite|স্যাটেলাইট|\bspace\b|মহাকাশ|semiconductor|\bchips?\b|চিপ|cyber|সাইবার/i, 4, 'বিজ্ঞান-প্রযুক্তি'],
  [/Padma Bridge|পদ্মা সেতু|\bmetro\b|মেট্রো|\bports?\b|বন্দর|Matarbari|মাতারবাড়ী|nuclear|পারমাণবিক|Rooppur|রূপপুর|power plant|বিদ্যুৎকেন্দ্র|\bLNG\b|এলএনজি|Teesta|তিস্তা|corridor|করিডর/i, 4, 'মেগাপ্রকল্প/জ্বালানি'],
  [/antibiotic|অ্যান্টিবায়োটিক|pandemic|মহামারি|vaccine|টিকা|dengue|ডেঙ্গু|outbreak|প্রাদুর্ভাব/i, 4, 'স্বাস্থ্য'],
  [/flood|বন্যা|cyclone|ঘূর্ণিঝড়|earthquake|ভূমিকম্প|disaster|দুর্যোগ/i, 3, 'দুর্যোগ'],
  [/trade war|বাণিজ্যযুদ্ধ|Trump|ট্রাম্প|Xi Jinping|শি জিনপিং|Modi|মোদি|White House|হোয়াইট হাউস/i, 3, 'বিশ্বরাজনীতি'],
  [/World Cup|বিশ্বকাপ|Olympic|অলিম্পিক|Asian Games|এশিয়ান গেমস|ICC|আইসিসি|FIFA|ফিফা/i, 2, 'খেলা'],
];
const NEG0 = /ছুরিকাঘাত|ধস্তাধস্তি|ধর্ষণ|খুন|সড়ক দুর্ঘটনা|গ্রেপ্তার|আটক|মরদেহ|লাশ|celebrity|gossip|horoscope|রাশিফল|recipe|রেসিপি|বিনোদন|নায়িকা|actor|actress/i;
const NF = (re) => new RegExp(re.source.normalize('NFC'), re.flags);
EXAM.forEach((e) => (e[0] = NF(e[0])));
const NEG = NF(NEG0);
const CATW = { international: 2, business: 2, editorial: 1, national: 1, tech: 1, sports: 0 };

function rank(items) {
  const list = items.filter((x) => x.c !== 'video');
  const toks = list.map((x) => new Set(tokens(x.t)));
  const inv = new Map();
  toks.forEach((s, i) => s.forEach((w) => { if (!inv.has(w)) inv.set(w, []); inv.get(w).push(i); }));
  const scored = list.map((it, i) => {
    const text = `${it.t} ${it.d || ''}`.normalize('NFC');
    let score = CATW[it.c] ?? 0; const why = [];
    for (const [re, w, label] of EXAM) if (re.test(text)) { score += w; why.push(label); }
    if (NEG.test(text)) score -= 4;
    // coverage: how many items (from other sources) share ≥2 key words
    const hits = new Map();
    toks[i].forEach((w) => { const l = inv.get(w); if (l && l.length < 40) l.forEach((j) => j !== i && hits.set(j, (hits.get(j) || 0) + 1)); });
    const same = [...hits].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([j]) => j);
    const rel = same.filter((j) => list[j].sn !== it.sn);
    const srcs = new Set(rel.map((j) => list[j].sn));
    score += Math.min(srcs.size, 6) * 1.5;
    if ((it.d || '').length > 120) score += 1;
    return { i, it, score, why: [...new Set(why)].slice(0, 3), rel: same, srcs: srcs.size };
  }).sort((a, b) => b.score - a.score);
  const picked = [], used = new Set(), labels = new Set();
  for (const pass of [1, 2]) for (const s of scored) {
    if (picked.length >= 7) break;
    if (used.has(s.i) || !s.why.length) continue;
    if (pass === 1 && labels.has(s.why[0])) continue; // one story per main topic first (catches same story in Bangla & English)
    picked.push(s); used.add(s.i); s.rel.forEach((j) => used.add(j)); labels.add(s.why[0]);
  }
  picked.sort((a, b) => b.score - a.score);
  return picked.map((s) => ({ id: s.it.id, score: +s.score.toFixed(1), why: s.why, cover: s.srcs + 1, rel: s.rel.slice(0, 5).map((j) => list[j].id) }));
}

// ---------------- vocabulary & sentences ----------------
function wordsOf(items) {
  const freq = new Map();
  for (const it of items) {
    const text = `${it.t} ${it.d || ''}`; if (!isEn(text)) continue;
    for (const w of text.match(/\b[a-z][a-z-]{5,}[a-z]\b/g) || []) {
      if (COMMON.has(w) || STOP_EN.has(w) || w.includes('--')) continue;
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }
  return [...freq].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(([w]) => w);
}
function sentencesOf(items, topIds) {
  const out = [], seen = new Set();
  const pri = (it) => (topIds.includes(it.id) ? 0 : { editorial: 1, business: 2, international: 2, national: 3 }[it.c] ?? 4);
  for (const it of [...items].sort((a, b) => pri(a) - pri(b))) {
    if (!isEn(`${it.t} ${it.d || ''}`) || seen.has(it.id)) continue;
    const parts = (it.d || '').replace(/…$/, '').split(/(?<=[.!?])\s+(?=[A-Z“"])/);
    for (const p of parts) {
      const n = p.split(/\s+/).length;
      if (n >= 16 && n <= 70 && /[.!?”"]$/.test(p.trim())) { out.push({ id: it.id, en: p.trim() }); seen.add(it.id); break; }
    }
    if (out.length >= 12) break;
  }
  if (out.length < 6) for (const it of items) { // fall back to long headlines
    if (out.length >= 10) break;
    if (isEn(it.t) && !seen.has(it.id) && it.t.split(/\s+/).length >= 10) { out.push({ id: it.id, en: it.t }); seen.add(it.id); }
  }
  return out;
}

// ---------------- run ----------------
const files = (await fs.readdir(NEWS)).filter((f) => f.endsWith('.json')).sort().reverse();
let netBudgetDates = 2;
for (const f of files) {
  const date = f.slice(0, 10);
  const outF = path.join(OUT, f);
  let exists = false; try { await fs.access(outF); exists = true; } catch {}
  const fresh = date === today || date === yest;
  if (exists && !fresh) continue;
  const { items } = JSON.parse(await fs.readFile(path.join(NEWS, f), 'utf8'));
  const top7 = rank(items);
  const sentences = sentencesOf(items, top7.map((x) => x.id));
  const words = {};
  const online = netBudgetDates-- > 0;
  const cand = wordsOf(items).filter((w) => !CURATED[w]).slice(0, online ? 80 : 0);
  if (online) {
    for (const t of top7) {
      const it = items.find((x) => x.id === t.id);
      if (it && isEn(it.t)) { t.tbn = await translate(it.t); if (it.d) t.dbn = await translate(it.d); }
    }
    for (const s of sentences) s.bn = await translate(s.en);
    for (const w of cand) { if (netFails > 12) break; const r = await lookupWord(w); if (r) words[w] = r; }
  } else for (const w of cand) if (cache.w[w]) words[w] = cache.w[w];
  const curatedHere = wordsOf(items).filter((w) => CURATED[w]);
  await fs.writeFile(outF, JSON.stringify({ date, updated: new Date().toISOString(), top7, sentences, words, curated: curatedHere }));
  console.log(`${date}: ⭐${top7.length} | words ${Object.keys(words).length}+${curatedHere.length} curated | sentences ${sentences.length} (${sentences.filter((s) => s.bn).length} translated)`);
}
// keep cache bounded
const wk = Object.keys(cache.w); if (wk.length > 6000) wk.slice(0, wk.length - 6000).forEach((k) => delete cache.w[k]);
const tk = Object.keys(cache.t); if (tk.length > 3000) tk.slice(0, tk.length - 3000).forEach((k) => delete cache.t[k]);
await fs.writeFile(CACHE_F, JSON.stringify(cache));
if (netFails > 12 || mmFails >= 4) console.log('⚠ lookups were throttled/unreachable this run; will retry next run.');
