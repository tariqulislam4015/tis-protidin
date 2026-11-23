/* TIS প্রতিদিন+ — main app (vanilla JS, no build step) */
(() => {
'use strict';
const OWNER = 'tariqulislam4015', REPO = 'tis-protidin';
const PAGES = `https://${OWNER}.github.io/${REPO}/`;
const APK_URL = `https://github.com/${OWNER}/${REPO}/releases/download/apk/TIS-Protidin.apk`;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');

const CATS = {
  national: { bn: 'জাতীয়', e: '🇧🇩', col: 'var(--c-national)' },
  international: { bn: 'আন্তর্জাতিক', e: '🌍', col: 'var(--c-international)' },
  business: { bn: 'অর্থনীতি ও ব্যবসা', e: '💹', col: 'var(--c-business)' },
  editorial: { bn: 'সম্পাদকীয় ও মতামত', e: '✍️', col: 'var(--c-editorial)' },
  tech: { bn: 'বিজ্ঞান ও প্রযুক্তি', e: '🔬', col: 'var(--c-tech)' },
  sports: { bn: 'খেলা', e: '🏏', col: 'var(--c-sports)' },
  video: { bn: 'ভিডিও', e: '▶️', col: 'var(--c-video)' },
};

// ---------- utils ----------
const BN = '০১২৩৪৫৬৭৮৯';
const bn = (x) => String(x).replace(/\d/g, (d) => BN[d]);
const en = (x) => String(x).replace(/[০-৯]/g, (d) => BN.indexOf(d));
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayDhaka = () => new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
const fmtDate = (d, opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
  try { return new Intl.DateTimeFormat('bn-BD', { ...opt, timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch { return bn(d); }
};
const shortDate = (d) => fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso) => { try { return new Intl.DateTimeFormat('bn-BD', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' }).format(new Date(iso)); } catch { return ''; } };
const mmss = (s) => bn(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`);
const addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
function rng(seed) { let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const shuffle = (a, r = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
const loadbar = (p) => { const b = $('#loadbar'); b.style.width = p + '%'; if (p >= 100) setTimeout(() => (b.style.width = 0), 400); };

// ---------- data ----------
const S = { index: null, date: null, items: [], ai: null, live: false };
async function getJSON(rel) {
  const bust = `?t=${Math.floor(Date.now() / 6e5)}`;
  for (const base of ['', PAGES]) {
    try { const r = await fetch(base + rel + bust, { cache: 'no-cache' }); if (r.ok) return await r.json(); } catch {}
    if (location.href.startsWith(PAGES)) break;
  }
  return null;
}
async function loadIndex() {
  S.index = (await getJSON('data/index.json')) || { dates: [] };
  return S.index;
}
async function loadDate(d) {
  loadbar(30);
  S.date = d; S.live = false;
  const meta = S.index.dates.find((x) => x.date === d);
  const [news, ai] = await Promise.all([meta ? getJSON(`data/news/${d}.json`) : null, meta?.ai ? getJSON(`data/ai/${d}.json`) : null]);
  S.items = news?.items || [];
  S.ai = ai;
  loadbar(100);
  updateDateUI();
}
const byCat = (c) => S.items.filter((x) => x.c === c);

// Live fallback (when the scheduled collector hasn't produced today's file yet)
const LIVE = [
  ['https://feeds.bbci.co.uk/bengali/rss.xml', 'বিবিসি বাংলা', 'auto'],
  ['https://www.prothomalo.com/feed/', 'প্রথম আলো', 'auto'],
  ['https://www.thedailystar.net/frontpage/rss.xml', 'The Daily Star', 'auto'],
  ['https://www.thedailystar.net/business/rss.xml', 'The Daily Star', 'business'],
  ['https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC News', 'international'],
  ['https://www.aljazeera.com/xml/rss/all.xml', 'Al Jazeera', 'international'],
  ['https://feeds.bbci.co.uk/news/technology/rss.xml', 'BBC News', 'tech'],
];
const KW = {
  editorial: /সম্পাদকীয়|মতামত|editorial|opinion/i,
  sports: /ক্রিকেট|ফুটবল|ম্যাচ|বিশ্বকাপ|cricket|football|match|world cup/i,
  business: /অর্থনীতি|ব্যাংক|বাজেট|রিজার্ভ|ডলার|রপ্তানি|মূল্যস্ফীতি|economy|bank|inflation|budget|trade|market/i,
  tech: /প্রযুক্তি|এআই|বিজ্ঞান|technology|\bai\b|science/i,
  international: /যুক্তরাষ্ট্র|ভারত|চীন|রাশিয়া|ইউক্রেন|গাজা|ইসরায়েল|ইরান|জাতিসংঘ|trump|china|india|russia|gaza|israel/i,
};
async function liveFetch() {
  toast('লাইভ খবর আনা হচ্ছে…'); loadbar(20);
  const out = [];
  await Promise.all(LIVE.map(async ([u, name, cat]) => {
    try {
      const r = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u));
      const j = await r.json();
      (j.items || []).slice(0, 25).forEach((it) => {
        const t = it.title?.trim(); if (!t) return;
        const d = (it.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 380);
        let c = cat;
        if (c === 'auto') c = Object.keys(KW).find((k) => KW[k].test(t + ' ' + d)) || 'national';
        out.push({ id: 'L' + btoa(unescape(encodeURIComponent(t))).slice(0, 14), t, d: d.startsWith(t) ? '' : d, u: it.link, s: name, sn: name, c, p: (() => { const t = new Date((it.pubDate || '').replace(' ', 'T') + 'Z'); return isNaN(t) ? new Date().toISOString() : t.toISOString(); })(), img: it.thumbnail || it.enclosure?.link });
      });
    } catch {}
  }));
  loadbar(100);
  if (!out.length) { toast('লাইভ খবর আনা যায়নি। একটু পরে চেষ্টা করুন।'); return; }
  S.items = out.sort((a, b) => b.p.localeCompare(a.p)); S.live = true; S.date = todayDhaka(); S.ai = null;
  updateDateUI(); route();
}

// ---------- header: date ----------
function updateDateUI() {
  $('#dateLabel').textContent = S.date ? fmtDate(S.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : 'তারিখ';
  $('#datePick').value = S.date || '';
  const ds = S.index?.dates.map((x) => x.date) || [];
  const i = ds.indexOf(S.date);
  $('#prevDay').disabled = !(ds.length && (i === -1 ? ds.some((x) => x < S.date) : i < ds.length - 1));
  $('#nextDay').disabled = !(ds.length && (i === -1 ? ds.some((x) => x > S.date) : i > 0));
}
async function setDate(d) {
  await loadDate(d);
  const h = location.hash.split('?')[0] || '#/';
  history.replaceState(null, '', `${h}?d=${d}`);
  route();
}
$('#datePick').addEventListener('change', (e) => e.target.value && setDate(e.target.value));
$('#prevDay').onclick = () => { const ds = S.index.dates.map((x) => x.date); const p = ds.find((x) => x < S.date); if (p) setDate(p); };
$('#nextDay').onclick = () => { const ds = [...S.index.dates.map((x) => x.date)].reverse(); const n = ds.find((x) => x > S.date); if (n) setDate(n); };
$('#searchBtn').onclick = () => { const b = $('#searchBar'); b.hidden = !b.hidden; if (!b.hidden) $('#searchInput').focus(); };
$('#searchInput').addEventListener('input', (e) => { clearTimeout(window._sq); window._sq = setTimeout(() => { location.hash = `#/search?q=${encodeURIComponent(e.target.value)}&d=${S.date}`; }, 300); });
const theme = store.get('tis_theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = theme;
$('#themeBtn').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.set('tis_theme', t); };
const apk = $('#apkBtn'); apk.href = APK_URL;
if (window.Capacitor) apk.style.display = 'none';
$('#yr').textContent = bn(new Date().getFullYear());

// ---------- rendering helpers ----------
const saved = () => store.get('tis_saved', {});
function card(it, i = 0) {
  const c = CATS[it.c] || CATS.national;
  const isSaved = !!saved()[it.id];
  const img = it.img ? `<div class="card-img ${it.v ? 'yt' : ''}" style="background-image:url('${esc(it.img)}')" data-open="${it.id}"></div>` : '';
  return `<article class="card" style="--cc:${c.col};--i:${i % 12}">
    ${img}
    <div class="card-body">
      <div class="meta"><span class="badge">${c.e} ${c.bn}</span><span>${esc(it.sn)}</span>${it.p ? `<span>• ${fmtTime(it.p)}</span>` : ''}</div>
      <h3 data-open="${it.id}">${esc(it.t)}</h3>
      ${it.d ? `<p>${esc(it.d)}</p>` : ''}
      <div class="card-foot">
        <button data-open="${it.id}">📖 বিস্তারিত</button>
        <button data-save="${it.id}" class="${isSaved ? 'saved' : ''}">${isSaved ? '★ সংরক্ষিত' : '☆ সংরক্ষণ'}</button>
        <a href="${esc(it.u)}" target="_blank" rel="noopener">↗ মূল খবর</a>
      </div>
    </div>
  </article>`;
}
const findItem = (id) => S.items.find((x) => x.id === id) || saved()[id];
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openItem(o.dataset.open); return; }
  const s = e.target.closest('[data-save]');
  if (s) {
    const id = s.dataset.save, all = saved();
    if (all[id]) { delete all[id]; toast('সংরক্ষণ থেকে সরানো হয়েছে'); } else { all[id] = { ...findItem(id), savedOn: S.date }; toast('সংরক্ষিত হয়েছে ★'); }
    store.set('tis_saved', all);
    $$(`[data-save="${id}"]`).forEach((b) => { b.classList.toggle('saved', !!all[id]); b.textContent = all[id] ? '★ সংরক্ষিত' : '☆ সংরক্ষণ'; });
  }
  if (e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// --- exam helpers: extract facts, glossary links, written draft ---
const NUM_RE = /(?:[^\s,।]+\s)?[$৳]?[০-৯0-9][০-৯0-9,.]*\s?(?:%|শতাংশ|কোটি|লাখ|হাজার|বিলিয়ন|মিলিয়ন|ডলার|টাকা|জন|বছর|দিন|মেগাওয়াট|টন|percent|billion|million|crore|lakh|tk|taka|people|years?)?/gi;
const GLOSS_KEYS = [
  [/নীতি সুদ|policy rate|সুদহার|interest rate/i, 0], [/রেপো|repo/i, 1], [/CRR|SLR/i, 2], [/মূল্যস্ফীতি|inflation/i, 3],
  [/রিজার্ভ|reserve/i, 4], [/খেলাপি|NPL|non-performing|default loan/i, 5], [/মূলধন|capital adequacy|basel/i, 6],
  [/চলতি হিসাব|current account|রেমিট্যান্স|remittance/i, 7], [/বাজেট|budget|deficit/i, 8], [/ফিনটেক|fintech|digital bank|MFS|বিকাশ|নগদ/i, 9],
  [/গ্রিন|green financ|জলবায়ু অর্থায়ন/i, 10], [/আর্থিক অন্তর্ভুক্তি|financial inclusion/i, 11],
];
function facts(it) {
  const text = `${it.t}. ${it.d || ''}`;
  const nums = [...new Set((text.match(NUM_RE) || []).map((x) => x.trim()).filter((x) => /[০-৯0-9]/.test(x) && x.length > 1))].slice(0, 5);
  const names = [...new Set((text.match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\b/g) || []).filter((w) => w.length > 3 && !/^(The|This|That|With|From|After|Over|What|When|How|Why)$/.test(w)))].slice(0, 6);
  const gl = GLOSS_KEYS.filter(([re]) => re.test(text)).map(([, i]) => window.TIS_GLOSSARY[i]).slice(0, 3);
  return { nums, names, gl };
}
const CLOSING = {
  national: 'বিষয়টি দেশের অভ্যন্তরীণ প্রশাসন ও জনজীবনের সাথে সরাসরি সম্পর্কিত।',
  international: 'ঘটনাটি আন্তর্জাতিক সম্পর্ক ও বাংলাদেশের পররাষ্ট্রনীতির দৃষ্টিকোণ থেকে গুরুত্বপূর্ণ।',
  business: 'বিষয়টি দেশের সামষ্টিক অর্থনীতি ও ব্যাংকিং খাতের জন্য তাৎপর্যপূর্ণ।',
  editorial: 'সম্পাদকীয়তে উত্থাপিত যুক্তিগুলো নিজের মতামতসহ বিশ্লেষণ করে লেখা যেতে পারে।',
  tech: 'বিষয়টি বিজ্ঞান-প্রযুক্তির অগ্রগতি ও ডিজিটাল অর্থনীতির সাথে সম্পর্কিত।',
  sports: 'খেলাধুলার এ ঘটনাটি সাম্প্রতিক বিষয়াবলির অংশ হিসেবে জেনে রাখা দরকার।',
  video: '',
};
const aiPoint = (id) => S.ai?.points?.find((p) => p.id === id);

function openItem(id) {
  const it = findItem(id); if (!it) return;
  const c = CATS[it.c] || CATS.national, f = facts(it), ap = aiPoint(id);
  const words = new Set(it.t.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  const related = S.items.filter((x) => x.id !== id && x.t.toLowerCase().split(/\s+/).filter((w) => words.has(w)).length >= 2).slice(0, 5);
  const day = it.p ? fmtDate(new Date(Date.parse(it.p) + 6 * 3600e3).toISOString().slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const yt = it.v ? `<div style="position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;margin:12px 0"><iframe src="https://www.youtube-nocookie.com/embed/${esc(it.v)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen loading="lazy"></iframe></div>` : (it.img ? `<img class="modal-img" src="${esc(it.img)}" alt="" onerror="this.remove()">` : '');
  $('#modalBody').innerHTML = `
    <div class="meta" style="--cc:${c.col}"><span class="badge">${c.e} ${c.bn}</span><span>${esc(it.sn)}</span><span>• ${day} ${it.p ? fmtTime(it.p) : ''}</span></div>
    <h2>${esc(it.t)}</h2>
    ${yt}
    ${it.d ? `<p style="font-size:17px">${esc(it.d)}</p>` : ''}
    ${ap ? `<div class="box"><h4>🤖 সংক্ষেপে</h4><p style="margin:0">${esc(ap.bn)}</p></div>` : ''}
    <div class="box exam"><h4>🎯 পরীক্ষার জন্য মূল পয়েন্ট</h4><ul>
      <li><b>বিষয়:</b> ${esc(it.t)}</li>
      <li><b>উৎস ও তারিখ:</b> ${esc(it.sn)}, ${day}</li>
      ${f.nums.length ? `<li><b>সংখ্যা/তথ্য:</b> ${f.nums.map(esc).join(' • ')}</li>` : ''}
      ${f.names.length ? `<li><b>গুরুত্বপূর্ণ নাম:</b> ${f.names.map(esc).join(', ')}</li>` : ''}
      ${ap?.exam ? `<li><b>এক লাইনে:</b> ${esc(ap.exam)}</li>` : ''}
      <li><b>বিভাগ:</b> ${c.bn}</li>
    </ul></div>
    ${f.gl.length ? `<div class="box"><h4>📚 সংশ্লিষ্ট টার্ম (লিখিত পরীক্ষায় কাজে লাগবে)</h4><ul>${f.gl.map(([k, v]) => `<li><b>${k}:</b> ${v}</li>`).join('')}</ul></div>` : ''}
    <div class="box write"><h4>🏦 লিখিত উত্তরের খসড়া <small class="muted">(নিজের ভাষায় সাজিয়ে লিখুন)</small></h4>
      <p style="margin:0" id="draft">${esc(`${day} তারিখে ${it.sn}-এ প্রকাশিত প্রতিবেদন অনুযায়ী, ${it.t.replace(/[।.!?]$/, '')}। ${ap?.bn || it.d || ''} ${CLOSING[it.c] || ''}`)}</p></div>
    ${related.length ? `<div class="box"><h4>🔗 সম্পর্কিত খবর</h4><ul>${related.map((r) => `<li><a href="#" data-open="${r.id}">${esc(r.t)}</a> <small class="muted">— ${esc(r.sn)}</small></li>`).join('')}</ul></div>` : ''}
    <div class="row-btns">
      <a class="btn" href="${esc(it.u)}" target="_blank" rel="noopener">↗ পুরো খবর পড়ুন</a>
      <button class="btn ghost" data-save="${it.id}">${saved()[it.id] ? '★ সংরক্ষিত' : '☆ সংরক্ষণ'}</button>
      <button class="btn ghost" id="copyDraft">📋 খসড়া কপি</button>
      <button class="btn ghost" id="shareIt">📤 শেয়ার</button>
    </div>`;
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
  $('#copyDraft').onclick = () => navigator.clipboard?.writeText($('#draft').textContent).then(() => toast('খসড়া কপি হয়েছে'));
  $('#shareIt').onclick = () => {
    const data = { title: it.t, text: `${it.t} — TIS প্রতিদিন+`, url: it.u };
    navigator.share ? navigator.share(data).catch(() => {}) : navigator.clipboard?.writeText(`${it.t}\n${it.u}`).then(() => toast('লিংক কপি হয়েছে'));
  };
}
function closeModal() { $('#modal').hidden = true; document.body.style.overflow = ''; }

function emptyView(title = 'এই তারিখের কোনো খবর পাওয়া যায়নি') {
  const ds = S.index?.dates || [];
  const latest = ds[0]?.date;
  return `<div class="empty view"><b>🗞️</b><h3>${title}</h3>
    <p>${ds.length ? `সর্বশেষ সংরক্ষিত তারিখ: <b>${fmtDate(latest)}</b>` : 'স্বয়ংক্রিয় সংগ্রাহক প্রথমবার চলার পর এখানে খবর দেখা যাবে (প্রতি ৩ ঘণ্টায় হালনাগাদ)।'}</p>
    <div class="row-btns" style="justify-content:center">
      ${latest && latest !== S.date ? `<button class="btn" onclick="TIS.setDate('${latest}')">সর্বশেষ দিনে যান</button>` : ''}
      <button class="btn gold" onclick="TIS.live()">⚡ এখনই লাইভ খবর আনুন</button>
      <a class="btn ghost" href="#/archive">🗓️ আর্কাইভ</a>
    </div></div>`;
}

// ---------- views ----------
function viewHome() {
  if (!S.items.length) return emptyView();
  const pool = S.items.filter((x) => x.c !== 'video');
  const lead = pool.find((x) => x.img && (x.c === 'national' || x.c === 'international')) || pool.find((x) => x.img) || pool[0];
  const side = pool.filter((x) => x !== lead).slice(0, 5);
  const counts = Object.keys(CATS).map((k) => [k, byCat(k).length]);
  const sections = Object.keys(CATS).map((k) => {
    const list = byCat(k).slice(0, k === 'video' ? 6 : 6);
    if (!list.length) return '';
    return `<div class="h-sec" style="--cc:${CATS[k].col}"><h2>${CATS[k].e} ${CATS[k].bn}</h2><a href="#/c/${k}?d=${S.date}">সব দেখুন (${bn(byCat(k).length)}) →</a></div>
      <div class="grid">${list.map(card).join('')}</div>`;
  }).join('');
  return `<div class="view">
    ${S.live ? '<div class="box" style="margin-top:0">⚡ লাইভ মোড: সরাসরি RSS থেকে আনা খবর দেখানো হচ্ছে।</div>' : ''}
    <section class="hero">
      <div class="hero-main" data-open="${lead.id}">
        ${lead.img ? `<div class="hero-img" style="background-image:url('${esc(lead.img)}')"></div>` : ''}
        <span class="hero-tag"><i class="live-dot"></i> আজকের প্রধান খবর • ${esc(lead.sn)}</span>
        <h1>${esc(lead.t)}</h1>
        ${lead.d ? `<p>${esc(lead.d.slice(0, 180))}${lead.d.length > 180 ? '…' : ''}</p>` : ''}
      </div>
      <div class="hero-side">
        ${side.map((x, i) => `<div class="hl" data-open="${x.id}"><span class="num">${bn(i + 1)}</span><div><h3>${esc(x.t)}</h3><small>${esc(x.sn)} • ${CATS[x.c]?.bn || ''}</small></div></div>`).join('')}
      </div>
    </section>
    <div class="stats">
      ${counts.map(([k, n]) => `<a class="stat" href="#/c/${k}?d=${S.date}" style="--cc:${CATS[k].col}"><b>${bn(n)}</b><span>${CATS[k].e} ${CATS[k].bn}</span></a>`).join('')}
    </div>
    <div class="cta-band">
      <div class="cta q" data-e="🧠"><h3>আজকের কুইজ</h3><p>${fmtDate(S.date, { day: 'numeric', month: 'long' })}-এর খবর থেকে MCQ — সময় ও মার্কসহ।</p><a class="btn sm" href="#/quiz?d=${S.date}">পরীক্ষা দিন →</a></div>
      <div class="cta w" data-e="🏦"><h3>ব্যাংক লিখিত প্রস্তুতি</h3><p>খাতায় লেখার মতো করে সাজানো আজকের গুরুত্বপূর্ণ পয়েন্ট।</p><a class="btn sm" href="#/written?d=${S.date}">খাতা খুলুন →</a></div>
      <div class="cta s" data-e="📋"><h3>এক পাতায় সারসংক্ষেপ</h3><p>সব বিভাগের মূল শিরোনাম — PDF হিসেবে সেভ করুন।</p><a class="btn sm" href="#/summary?d=${S.date}">সারসংক্ষেপ →</a></div>
    </div>
    ${sections}
  </div>`;
}

function viewCat(cat, params) {
  const C = CATS[cat]; if (!C) return viewHome();
  let list = byCat(cat);
  const sources = [...new Set(list.map((x) => x.sn))];
  const src = params.get('s');
  if (src) list = list.filter((x) => x.sn === src);
  const page = +(params.get('p') || 1), per = 24;
  const head = `<h1 class="page-title">${C.e} ${C.bn}</h1><p class="page-sub">${fmtDate(S.date)} • ${bn(byCat(cat).length)}টি খবর</p>`;
  if (!byCat(cat).length) return `<div class="view">${head}${emptyView(`এই তারিখে ${C.bn} বিভাগে কোনো খবর নেই`)}</div>`;
  return `<div class="view" style="--cc:${C.col}">${head}
    <div class="chips"><a class="chip ${!src ? 'on' : ''}" href="#/c/${cat}?d=${S.date}">সব উৎস</a>${sources.map((s) => `<a class="chip ${s === src ? 'on' : ''}" href="#/c/${cat}?d=${S.date}&s=${encodeURIComponent(s)}">${esc(s)}</a>`).join('')}</div>
    <div class="grid">${list.slice(0, page * per).map(card).join('')}</div>
    ${list.length > page * per ? `<div style="text-align:center;margin-top:20px"><a class="btn ghost" href="#/c/${cat}?d=${S.date}${src ? '&s=' + encodeURIComponent(src) : ''}&p=${page + 1}">আরও দেখুন ↓</a></div>` : ''}
  </div>`;
}

function viewSearch(params) {
  const q = (params.get('q') || '').trim().toLowerCase();
  const pool = [...S.items, ...Object.values(saved()).filter((x) => !S.items.some((y) => y.id === x.id))];
  const list = q ? pool.filter((x) => (x.t + ' ' + (x.d || '') + ' ' + x.sn).toLowerCase().includes(q)) : [];
  return `<div class="view"><h1 class="page-title">⌕ অনুসন্ধান: “${esc(q)}”</h1><p class="page-sub">${bn(list.length)}টি ফলাফল (${fmtDate(S.date)} ও সংরক্ষিত খবর)</p>
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><b>🔍</b>কিছু পাওয়া যায়নি</div>'}</div>`;
}

function viewSaved() {
  const list = Object.values(saved()).reverse();
  return `<div class="view"><h1 class="page-title">🔖 সংরক্ষিত খবর</h1><p class="page-sub">এই ডিভাইসে সংরক্ষিত — ${bn(list.length)}টি</p>
    ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><b>☆</b>কোনো খবর সংরক্ষণ করা হয়নি। খবরের কার্ডে “☆ সংরক্ষণ” চাপুন।</div>'}</div>`;
}

function viewWritten() {
  if (!S.items.length) return `<div class="view"><h1 class="page-title">🏦 লিখিত প্রস্তুতি</h1>${emptyView()}</div>`;
  const order = ['national', 'international', 'business', 'editorial', 'tech', 'sports'];
  const per = { national: 8, international: 8, business: 10, editorial: 5, tech: 4, sports: 3 };
  let n = 0;
  const blocks = order.map((k) => {
    const list = byCat(k).slice(0, per[k]); if (!list.length) return '';
    return `<h3 style="margin:18px 0 6px;color:${CATS[k].col}">${CATS[k].e} ${CATS[k].bn}</h3><ol start="${n + 1}">${list.map((it) => {
      n++; const f = facts(it), ap = aiPoint(it.id);
      return `<li><b>${esc(it.t)}</b>${ap ? ` — ${esc(ap.exam || ap.bn)}` : ''}${f.nums.length ? ` <span class="muted">[তথ্য: ${f.nums.slice(0, 3).map(esc).join(', ')}]</span>` : ''} <span class="src">(${esc(it.sn)})</span></li>`;
    }).join('')}</ol>`;
  }).join('');
  return `<div class="view">
    <h1 class="page-title">🏦 ব্যাংক লিখিত প্রস্তুতি</h1>
    <p class="page-sub">${fmtDate(S.date)} — খাতায় লেখার মতো করে সাজানো। যেকোনো লাইনে ক্লিক করে বিস্তারিত দেখতে মূল বিভাগে যান।</p>
    <div class="row-btns no-print" style="margin:0 0 14px"><button class="btn" onclick="print()">🖨️ PDF/প্রিন্ট</button><button class="btn ghost" id="copyNotes">📋 সব কপি</button><a class="btn gold" href="#/quiz?d=${S.date}">🧠 এই বিষয়ে পরীক্ষা দিন</a></div>
    ${S.ai?.summary ? `<div class="ai-box"><h3 style="margin-top:0">🤖 আজকের সারকথা</h3><p style="margin:0">${esc(S.ai.summary)}</p></div>` : ''}
    <div class="notebook" id="notes">${blocks}</div>
    <div class="h-sec" style="--cc:var(--c-business)"><h2>📚 ব্যাংকিং ও অর্থনীতির গুরুত্বপূর্ণ টার্ম</h2></div>
    <div class="gloss">${window.TIS_GLOSSARY.map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join('')}</div>
    <div class="box write" style="margin-top:18px"><h4>✍️ লিখিত উত্তর লেখার কাঠামো (Bank Written)</h4><ul>
      <li><b>ভূমিকা (২-৩ লাইন):</b> বিষয়টি কী, কবে ও কোথায় — তারিখ ও উৎসসহ।</li>
      <li><b>মূল তথ্য (৩-৪ পয়েন্ট):</b> সংখ্যা, শতাংশ, প্রতিষ্ঠান ও ব্যক্তির নাম উল্লেখ করুন।</li>
      <li><b>প্রভাব/বিশ্লেষণ:</b> অর্থনীতি, ব্যাংকিং খাত বা সাধারণ মানুষের উপর প্রভাব।</li>
      <li><b>সুপারিশ ও উপসংহার:</b> ২-৩টি বাস্তবসম্মত সুপারিশ, এক লাইনে উপসংহার।</li>
    </ul></div>
  </div>`;
}

function viewSummary() {
  if (!S.items.length) return `<div class="view"><h1 class="page-title">📋 সারসংক্ষেপ</h1>${emptyView()}</div>`;
  const order = ['national', 'international', 'business', 'editorial', 'tech', 'sports', 'video'];
  return `<div class="view">
    <h1 class="page-title">📋 দৈনিক সারসংক্ষেপ</h1>
    <p class="page-sub">${fmtDate(S.date)} • মোট ${bn(S.items.length)}টি খবর • ${bn(new Set(S.items.map((x) => x.sn)).size)}টি উৎস</p>
    <div class="row-btns no-print" style="margin:0 0 14px"><button class="btn" onclick="print()">🖨️ PDF হিসেবে সেভ</button></div>
    ${S.ai?.summary ? `<div class="ai-box"><h3 style="margin-top:0">🤖 এক নজরে আজকের দিন</h3><p style="margin:0">${esc(S.ai.summary)}</p></div>` : ''}
    ${order.map((k) => {
      const list = byCat(k).slice(0, 8); if (!list.length) return '';
      return `<section class="sum-sec" style="--cc:${CATS[k].col}"><h3>${CATS[k].e} ${CATS[k].bn} <small class="muted">(${bn(byCat(k).length)})</small></h3>
      <ul>${list.map((x) => `<li><a href="#" data-open="${x.id}">${esc(x.t)}</a> <small class="muted">— ${esc(x.sn)}</small></li>`).join('')}</ul></section>`;
    }).join('')}
  </div>`;
}

function viewArchive() {
  const ds = S.index?.dates || [];
  if (!ds.length) return `<div class="view"><h1 class="page-title">🗓️ আর্কাইভ</h1>${emptyView('এখনও কোনো আর্কাইভ তৈরি হয়নি')}</div>`;
  const max = Math.max(...ds.map((x) => x.count));
  const months = {};
  ds.forEach((x) => (months[x.date.slice(0, 7)] ||= {})[x.date] = x);
  const wd = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  return `<div class="view"><h1 class="page-title">🗓️ তারিখভিত্তিক আর্কাইভ</h1><p class="page-sub">মোট ${bn(ds.length)} দিনের খবর সংরক্ষিত। যেকোনো তারিখে ক্লিক করুন।</p>
  ${Object.keys(months).sort().reverse().map((m) => {
    const first = new Date(m + '-01T00:00:00Z'), days = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    let cells = wd.map((w) => `<div class="dh">${w}</div>`).join('') + '<span></span>'.repeat(first.getUTCDay());
    for (let d = 1; d <= days; d++) {
      const key = `${m}-${String(d).padStart(2, '0')}`, x = months[m][key];
      cells += x ? `<a href="#/?d=${key}" class="${key === S.date ? 'cur' : ''}" style="--h:${Math.round(10 + 40 * x.count / max)}">${bn(d)}<small>${bn(x.count)}টি</small></a>` : `<span class="d">${bn(d)}</span>`;
    }
    return `<div class="month panel"><h3>${fmtDate(m + '-01', { month: 'long', year: 'numeric' })}</h3><div class="cal">${cells}</div></div>`;
  }).join('')}</div>`;
}

function viewAbout() {
  return `<div class="view">
    <div class="about-hero" id="aboutProfile"></div>
    <h2 style="margin-top:28px">TIS প্রতিদিন+ কী?</h2>
    <p>চাকরি পরীক্ষা (ব্যাংক, বিসিএস) ও সচেতন পাঠকের জন্য একটি সম্পূর্ণ ফ্রি, লগইনবিহীন কারেন্ট অ্যাফেয়ার্স প্ল্যাটফর্ম। প্রথম আলো, দ্য ডেইলি স্টার, বিবিসি বাংলা, বিবিসি নিউজ, আল জাজিরা, দ্য বিজনেস স্ট্যান্ডার্ড, ঢাকা ট্রিবিউন, bdnews24, যুগান্তর, কালের কণ্ঠ, সমকাল, ইত্তেফাক, বণিক বার্তা, ফিন্যান্সিয়াল এক্সপ্রেস, জাতিসংঘ নিউজ ও ইউটিউব চ্যানেল থেকে প্রতি ৩ ঘণ্টায় স্বয়ংক্রিয়ভাবে খবর সংগ্রহ করে তারিখ অনুযায়ী সাজানো হয়।</p>
    <div class="feature-list">
      <div><b>🗓️ তারিখভিত্তিক</b>যেকোনো দিনের খবর, সারসংক্ষেপ ও কুইজ — আর্কাইভসহ।</div>
      <div><b>🧠 কুইজ ও পরীক্ষা</b>টাইমার, মার্ক, নেগেটিভ মার্কিং, উত্তরপত্র ও ফলাফলের ইতিহাস।</div>
      <div><b>🏦 লিখিত প্রস্তুতি</b>খাতায় লেখার মতো পয়েন্ট, টার্ম ও উত্তরের কাঠামো।</div>
      <div><b>📱 অ্যাপ</b>Android APK ও ব্রাউজার থেকে ইনস্টলযোগ্য (PWA)।</div>
    </div>
    <div class="row-btns"><a class="btn" href="${APK_URL}">⬇️ Android APK ডাউনলোড</a><a class="btn ghost" href="https://github.com/${OWNER}/${REPO}" target="_blank" rel="noopener">GitHub সোর্স কোড</a></div>
  </div>`;
}

// ---------- quiz / exam ----------
const OPT = ['ক', 'খ', 'গ', 'ঘ'];
function newsQuestions(items, n, seed) {
  const r = rng(seed), qs = [];
  const pool = shuffle(items.filter((x) => x.c !== 'video' && x.t.length > 20), r);
  const sources = [...new Set(items.map((x) => x.sn))];
  // 1) AI-made MCQs
  (S.ai?.mcq || []).forEach((m) => qs.push({ q: m.q, o: m.o, a: m.a, e: m.e, tag: 'আজকের খবর (AI)', ref: m.id }));
  for (const it of pool) {
    if (qs.length >= n * 2) break;
    const kind = r();
    // number cloze
    const nm = it.t.match(/[০-৯0-9][০-৯0-9,.]*/);
    if (nm && kind < 0.55) {
      const raw = nm[0].replace(/[.,]$/, ''), val = parseFloat(en(raw).replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        const isBn = /[০-৯]/.test(raw), dec = /\./.test(raw) ? 1 : 0;
        const vars = new Set([raw]);
        let guard = 0;
        while (vars.size < 4 && guard++ < 40) {
          const f = [0.5, 0.75, 1.25, 1.5, 2, 0.8, 1.2][Math.floor(r() * 7)];
          let v = val * f; v = dec ? v.toFixed(1) : String(Math.max(1, Math.round(v)));
          if (val < 15 && !dec) v = String(Math.max(1, Math.round(val + (Math.floor(r() * 7) - 3))));
          if (v !== en(raw).replace(/,/g, '')) vars.add(isBn ? bn(v) : v);
        }
        if (vars.size === 4) {
          const o = shuffle([...vars], r);
          qs.push({ q: `শূন্যস্থান পূরণ করুন: “${it.t.replace(nm[0], '_____')}”`, o, a: o.indexOf(raw), e: `সঠিক শিরোনাম: “${it.t}” — ${it.sn}`, tag: CATS[it.c]?.bn, ref: it.id });
          continue;
        }
      }
    }
    if (kind < 0.8 && sources.length >= 4) {
      const o = shuffle([it.sn, ...shuffle(sources.filter((s) => s !== it.sn), r).slice(0, 3)], r);
      qs.push({ q: `“${it.t}” — এই খবরটি কোন সংবাদমাধ্যমে প্রকাশিত হয়েছে?`, o, a: o.indexOf(it.sn), e: `খবরটি ${it.sn}-এ প্রকাশিত (${CATS[it.c]?.bn})।`, tag: 'উৎস', ref: it.id });
      continue;
    }
    const cats = ['national', 'international', 'business', 'editorial', 'tech', 'sports'];
    if (cats.includes(it.c)) {
      const o = shuffle([it.c, ...shuffle(cats.filter((c) => c !== it.c), r).slice(0, 3)], r);
      qs.push({ q: `“${it.t}” — খবরটি কোন বিভাগের অন্তর্ভুক্ত?`, o: o.map((c) => CATS[c].bn), a: o.indexOf(it.c), e: `এটি ${CATS[it.c].bn} বিভাগের খবর (${it.sn})।`, tag: 'বিভাগ', ref: it.id });
    }
  }
  return qs;
}
function bankQuestions(seed) {
  return shuffle(window.TIS_BANK, rng(seed)).map(([q, o, a, e, tag]) => ({ q, o, a, e, tag }));
}
let Q = null, timerId = null;
function viewQuiz() {
  const hist = store.get('tis_hist', []);
  const avail = newsQuestions(S.items, 50, S.date).length;
  return `<div class="view">
    <h1 class="page-title">🧠 কুইজ ও মডেল টেস্ট</h1>
    <p class="page-sub">${fmtDate(S.date)} • আজকের খবর থেকে ${bn(avail)}টি এবং প্রশ্নব্যাংকে ${bn(window.TIS_BANK.length)}টি প্রশ্ন${S.ai?.mcq?.length ? ` (AI প্রশ্ন ${bn(S.ai.mcq.length)}টি)` : ''}</p>
    <div class="quiz-setup">
      <form class="panel" id="qform">
        <h3>⚙️ পরীক্ষা সাজান</h3>
        <b>প্রশ্নের উৎস</b>
        <div class="opt-group">
          <label><input type="radio" name="src" value="mix" checked><span>🔀 মিশ্র</span></label>
          <label><input type="radio" name="src" value="news" ${avail ? '' : 'disabled'}><span>🗞️ আজকের খবর</span></label>
          <label><input type="radio" name="src" value="bank"><span>🏦 ব্যাংক ও সাধারণ জ্ঞান</span></label>
        </div>
        <b>প্রশ্ন সংখ্যা</b>
        <div class="opt-group">${[10, 20, 30, 50].map((n, i) => `<label><input type="radio" name="n" value="${n}" ${i === 0 ? 'checked' : ''}><span>${bn(n)}টি</span></label>`).join('')}</div>
        <b>প্রতি প্রশ্নে সময়</b>
        <div class="opt-group">${[[30, '৩০ সেকেন্ড'], [36, '৩৬ সেকেন্ড (ব্যাংক)'], [60, '১ মিনিট']].map(([v, l], i) => `<label><input type="radio" name="t" value="${v}" ${i === 1 ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
        <label class="switch"><input type="checkbox" name="neg" checked> প্রতিটি ভুলে ০.২৫ নম্বর কাটা (নেগেটিভ মার্কিং)</label>
        <label class="switch"><input type="checkbox" name="instant"> অনুশীলন মোড — সাথে সাথে সঠিক উত্তর দেখাও</label>
        <button class="btn gold" style="width:100%;justify-content:center;font-size:18px">▶ পরীক্ষা শুরু করুন</button>
      </form>
      <div class="panel">
        <h3>📊 আপনার সাম্প্রতিক ফলাফল</h3>
        ${hist.length ? `<table class="hist"><tr><th>তারিখ</th><th>মার্ক</th><th>সময়</th></tr>${hist.slice(0, 8).map((h) => `<tr><td>${shortDate(h.d)}</td><td><b>${bn(h.s)}</b>/${bn(h.n)}</td><td>${mmss(h.t)}</td></tr>`).join('')}</table>` : '<p class="muted">এখনও কোনো পরীক্ষা দেননি। প্রথম পরীক্ষা দিয়ে শুরু করুন! 🚀</p>'}
        <div class="box" style="margin-bottom:0"><b>নিয়ম:</b> প্রতিটি সঠিক উত্তরে ১ নম্বর। সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে। শেষে উত্তরপত্র ও ব্যাখ্যা দেখতে পাবেন।</div>
      </div>
    </div></div>`;
}
function bindQuiz() {
  const f = $('#qform'); if (!f) return;
  f.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(f), src = fd.get('src'), n = +fd.get('n');
    const seed = S.date + ':' + Date.now();
    let qs = src === 'bank' ? bankQuestions(seed) : src === 'news' ? newsQuestions(S.items, n, seed) : [];
    if (src === 'mix') {
      const nq = shuffle(newsQuestions(S.items, n, seed)), bq = bankQuestions(seed);
      const half = Math.min(nq.length, Math.ceil(n * 0.6));
      qs = shuffle([...nq.slice(0, half), ...bq.slice(0, n - half)]);
    }
    qs = qs.slice(0, n);
    if (!qs.length) return toast('প্রশ্ন পাওয়া যায়নি');
    Q = { qs, ans: Array(qs.length).fill(null), i: 0, per: +fd.get('t'), neg: !!fd.get('neg'), instant: !!fd.get('instant'), start: Date.now(), total: qs.length * +fd.get('t') };
    renderQ(); clearInterval(timerId); timerId = setInterval(tick, 500);
  };
}
function tick() {
  if (!Q) return clearInterval(timerId);
  const left = Math.max(0, Q.total - (Date.now() - Q.start) / 1000), t = $('#qtimer');
  if (!t) return clearInterval(timerId);
  t.innerHTML = `⏱ ${mmss(left)}`;
  t.classList.toggle('warn', left < 30);
  if (left <= 0) finishQuiz();
}
function renderQ() {
  const q = Q.qs[Q.i], a = Q.ans[Q.i], show = Q.instant && a !== null;
  app.innerHTML = `<div class="view">
    <div class="qhead"><h2 style="margin:0">প্রশ্ন ${bn(Q.i + 1)} / ${bn(Q.qs.length)}</h2><span class="timer" id="qtimer">⏱ …</span></div>
    <div class="qprogress"><i style="width:${(Q.ans.filter((x) => x !== null).length / Q.qs.length) * 100}%"></i></div>
    <div class="qcard">
      ${q.tag ? `<span class="badge" style="--cc:var(--brand)">${esc(q.tag)}</span>` : ''}
      <div class="qtext">${esc(q.q)}</div>
      <div class="qopts">${q.o.map((o, i) => `<button class="qopt ${a === i ? 'sel' : ''} ${show && i === q.a ? 'right' : ''} ${show && a === i && i !== q.a ? 'wrong' : ''}" data-opt="${i}" ${show ? 'disabled' : ''}><b>${OPT[i]}</b>${esc(o)}</button>`).join('')}</div>
      ${show && q.e ? `<div class="explain">💡 ${esc(q.e)}</div>` : ''}
    </div>
    <div class="qnav">
      <button class="btn ghost" id="qprev" ${Q.i === 0 ? 'disabled' : ''}>← আগের</button>
      ${Q.i < Q.qs.length - 1 ? '<button class="btn" id="qnext">পরের →</button>' : ''}
      <button class="btn gold" id="qsubmit">✔ জমা দিন</button>
    </div>
    <div class="qdots">${Q.qs.map((_, i) => `<button data-go="${i}" class="${Q.ans[i] !== null ? 'ans' : ''} ${i === Q.i ? 'cur' : ''}">${bn(i + 1)}</button>`).join('')}</div>
  </div>`;
  tick();
  $$('[data-opt]').forEach((b) => b.onclick = () => {
    Q.ans[Q.i] = +b.dataset.opt;
    if (Q.instant) return renderQ();
    renderQ(); if (Q.i < Q.qs.length - 1) setTimeout(() => { Q.i++; renderQ(); }, 250);
  });
  $$('[data-go]').forEach((b) => b.onclick = () => { Q.i = +b.dataset.go; renderQ(); });
  $('#qprev').onclick = () => { Q.i--; renderQ(); };
  $('#qnext') && ($('#qnext').onclick = () => { Q.i++; renderQ(); });
  $('#qsubmit').onclick = () => {
    const un = Q.ans.filter((x) => x === null).length;
    if (un && !confirmSubmit(un)) return;
    finishQuiz();
  };
}
function confirmSubmit(un) {
  const b = $('#qsubmit');
  if (b.dataset.ok) return true;
  b.dataset.ok = 1; b.textContent = `${bn(un)}টি বাকি — আবার চাপলে জমা হবে`;
  return false;
}
function finishQuiz() {
  clearInterval(timerId);
  const used = Math.min(Q.total, Math.round((Date.now() - Q.start) / 1000));
  let right = 0, wrong = 0;
  Q.qs.forEach((q, i) => { if (Q.ans[i] === null) return; Q.ans[i] === q.a ? right++ : wrong++; });
  const skip = Q.qs.length - right - wrong, score = Math.max(0, right - (Q.neg ? wrong * 0.25 : 0));
  const pct = Math.round((score / Q.qs.length) * 100);
  const grade = pct >= 80 ? '🏆 অসাধারণ!' : pct >= 60 ? '🎉 খুব ভালো!' : pct >= 40 ? '👍 ভালো, আরও অনুশীলন করুন' : '📚 আরও পড়তে হবে';
  const hist = store.get('tis_hist', []); hist.unshift({ d: S.date, s: score, n: Q.qs.length, t: used, at: Date.now() }); store.set('tis_hist', hist.slice(0, 30));
  app.innerHTML = `<div class="view">
    <div class="result" id="result">
      <h2 style="margin:0">${grade}</h2>
      <div class="score-ring" style="--p:${pct}"><div>${bn(+score.toFixed(2))}<small>/${bn(Q.qs.length)} নম্বর</small></div></div>
      <div class="rstats">
        <div><b>${bn(right)}</b>সঠিক ✅</div><div><b>${bn(wrong)}</b>ভুল ❌</div><div><b>${bn(skip)}</b>উত্তর দেননি</div>
        <div><b>${bn(pct)}%</b>শতকরা</div><div><b>${mmss(used)}</b>সময় লেগেছে</div><div><b>${mmss(Q.total)}</b>মোট সময়</div>
      </div>
      ${Q.neg ? `<p style="opacity:.85;margin:12px 0 0">নেগেটিভ মার্কিং: ${bn(wrong)} × ০.২৫ = ${bn((wrong * 0.25).toFixed(2))} নম্বর কাটা হয়েছে</p>` : ''}
    </div>
    <div class="row-btns" style="justify-content:center"><a class="btn" href="#/quiz?d=${S.date}">🔁 আবার পরীক্ষা দিন</a><button class="btn ghost" onclick="print()">🖨️ ফলাফল প্রিন্ট</button></div>
    <div class="h-sec"><h2>📝 উত্তরপত্র ও ব্যাখ্যা</h2></div>
    <div class="review">${Q.qs.map((q, i) => {
      const a = Q.ans[i];
      return `<div class="qcard"><div class="meta">${bn(i + 1)}. ${a === null ? '⚪ উত্তর দেননি' : a === q.a ? '✅ সঠিক' : '❌ ভুল'}</div>
      <div class="qtext" style="font-size:17px">${esc(q.q)}</div>
      <div class="qopts">${q.o.map((o, j) => `<div class="qopt ${j === q.a ? 'right' : ''} ${a === j && j !== q.a ? 'wrong' : ''}"><b>${OPT[j]}</b>${esc(o)}</div>`).join('')}</div>
      ${q.e ? `<div class="explain">💡 ${esc(q.e)} ${q.ref && findItem(q.ref) ? `<a href="#" data-open="${q.ref}" style="color:var(--brand);font-weight:700">খবরটি পড়ুন →</a>` : ''}</div>` : ''}</div>`;
    }).join('')}</div></div>`;
  if (pct >= 60) confetti();
  Q = null; scrollTo({ top: 0, behavior: 'smooth' });
}
function confetti() {
  const r = $('#result'); if (!r) return;
  const cols = ['#f59e0b', '#4ade80', '#60a5fa', '#f472b6', '#fff'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 5]};animation-delay:${Math.random() * 1.2}s;transform:rotate(${Math.random() * 360}deg)`;
    r.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}

// ---------- router ----------
function route() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const d = params.get('d');
  if (d && d !== S.date && /^\d{4}-\d{2}-\d{2}$/.test(d) && !S.live) { loadDate(d).then(route); return; }
  if (Q && path !== '/quiz') { clearInterval(timerId); Q = null; }
  const parts = path.split('/').filter(Boolean);
  const key = parts[0] === 'c' ? parts[1] : parts[0] || 'home';
  $$('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.r === key));
  const on = $(`#tabs a[data-r="${key}"]`); on?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  let html;
  switch (parts[0]) {
    case 'c': html = viewCat(parts[1], params); break;
    case 'quiz': html = viewQuiz(); break;
    case 'written': html = viewWritten(); break;
    case 'summary': html = viewSummary(); break;
    case 'archive': html = viewArchive(); break;
    case 'saved': html = viewSaved(); break;
    case 'about': html = viewAbout(); break;
    case 'search': html = viewSearch(params); break;
    default: html = viewHome();
  }
  app.innerHTML = html;
  if (parts[0] === 'quiz') bindQuiz();
  if (parts[0] === 'about') window.renderProfile($('#aboutProfile'));
  $('#footerProfile').style.display = parts[0] === 'about' ? 'none' : '';
  $('#copyNotes') && ($('#copyNotes').onclick = () => navigator.clipboard?.writeText($('#notes').innerText).then(() => toast('সব পয়েন্ট কপি হয়েছে')));
  if (!params.get('p')) scrollTo({ top: 0 });
}
window.addEventListener('hashchange', route);
window.TIS = { setDate, live: liveFetch };

// ---------- boot ----------
(async function boot() {
  window.renderProfile($('#footerProfile'));
  app.innerHTML = `<div class="grid">${'<div class="skel"></div>'.repeat(6)}</div>`;
  loadbar(15);
  await loadIndex();
  const want = new URLSearchParams(location.hash.split('?')[1] || '').get('d');
  const ds = S.index.dates.map((x) => x.date);
  await loadDate(want || ds[0] || todayDhaka());
  route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
