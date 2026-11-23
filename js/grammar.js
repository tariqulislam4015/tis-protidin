/* TIS প্রতিদিন+ — English grammar helper
   Rule-based part-of-speech tagger, clickable vocabulary, sentence-structure analysis. */
(() => {
'use strict';
const T = {
  N: ['Noun', 'বিশেষ্য', '#2563eb'], NP: ['Proper Noun', 'নামবাচক বিশেষ্য', '#1e40af'],
  POSS: ['Possessive Noun', 'সম্বন্ধবাচক বিশেষ্য (’s)', '#7c3aed'], PDET: ['Possessive Pronoun', 'সম্বন্ধবাচক সর্বনাম', '#7c3aed'],
  PRON: ['Pronoun', 'সর্বনাম', '#0891b2'], REL: ['Relative Pronoun', 'সম্বন্ধসূচক সর্বনাম', '#0e7490'],
  V: ['Verb', 'ক্রিয়া', '#dc2626'], AUX: ['Auxiliary Verb', 'সাহায্যকারী ক্রিয়া', '#f97316'], MOD: ['Modal Verb', 'মোডাল ক্রিয়া', '#f97316'],
  INF: ['Infinitive (to + V1)', 'ইনফিনিটিভ', '#e11d48'], GER: ['Gerund (V + ing)', 'জেরান্ড — ক্রিয়াবাচক বিশেষ্য', '#db2777'],
  PPR: ['Present Participle (V + ing)', 'বর্তমান কৃদন্ত', '#ea580c'], PPA: ['Past Participle (V3)', 'অতীত কৃদন্ত (V3)', '#c2410c'],
  ADJ: ['Adjective', 'বিশেষণ', '#16a34a'], ADV: ['Adverb', 'ক্রিয়াবিশেষণ', '#65a30d'], NEG: ['Negative', 'নেতিবাচক', '#b91c1c'],
  PREP: ['Preposition', 'পদান্বয়ী অব্যয়', '#64748b'], CONJ: ['Coordinating Conjunction', 'সংযোজক অব্যয়', '#a16207'],
  SUB: ['Subordinating Conjunction', 'অধীন সংযোজক', '#a16207'], DET: ['Article / Determiner', 'আর্টিকেল/নির্দেশক', '#94a3b8'],
  NUM: ['Number', 'সংখ্যাবাচক', '#475569'], P: ['Punctuation', 'যতিচিহ্ন', '#cbd5e1'],
};
const set = (s) => new Set(s.split(' '));
const DET = set('a an the this these those each every some any no another such either neither all both half');
const PDET = set('my your his her its our their');
const PRON = set('i you he she it we they me him us them myself yourself himself herself itself ourselves themselves one someone something anyone anything everyone everything nothing nobody');
const PREP = set('in on at by for with about against between into through during before after above below from up down of off over under around among across along amid amidst despite within without toward towards upon via per than like beyond behind beside besides near inside outside onto throughout until till since except including following regarding concerning unlike');
const CONJ = set('and but or nor yet so');
const SUB = set('how why although though because unless while whereas if whether when whenever where wherever once as since until after before');
const REL = set('who whom whose which');
const BE = set('be is am are was were been being');
const HAVE = set('have has had having');
const DO = set('do does did');
const MOD = set('will would shall should can could may might must');
const NEGW = set('not never no n’t n\'t');
const ADVW = set('out away back also very too only just still even already now then here there however again often soon almost always never yet ever quite rather nearly mostly largely partly further instead perhaps once twice');
const NOUN_ING = set('meeting building funding spending training hearing warning ending opening ruling bombing shooting thing things king morning evening during nothing something anything everything ceiling earnings savings holdings proceedings findings beginning');
const NOT_LY = set('family only early daily weekly monthly yearly supply reply apply italy july rally ally holy belly fly july assembly anomaly');
const IRR_PPA = set('been done gone seen taken given made known shown grown written driven broken chosen spoken stolen fallen risen begun held kept left met paid sent built bought sold spent brought sought fought found told said won lost set put cut hit hurt let led fed felt heard laid meant read struck thrown torn worn drawn sworn shaken forgotten frozen hidden ridden withdrawn undertaken overtaken');
const VERBS = set('stop rise fall soar drop plunge slump surge collapse resume extend expand slash hike halt sign vote rule pass fail lead push block ban seize sue vow slam hail say tell ask make take give get go come see know show find hold keep leave meet pay run set put cut win lose send build buy sell spend stand bring begin seek fight rise fall grow drive write become face launch plan warn urge seek call help need want try use work move live play turn start end allow expect consider continue create provide include remain reach raise reduce increase cut return report approve reject accept announce agree claim deny demand discuss ensure establish improve introduce invest join protect release resolve respond secure support threaten visit avert curb boost tackle avoid address hit strike kill attack arrest restore');
const ADJW = set('high low new old big small large major key top final former senior junior main chief common foreign local global national public private early late recent current huge vast strong weak poor rich full free open hard long short good bad best worst great little few many much more most less least first second third last next own same other certain real true false possible likely unlikely ready clear sure safe dangerous serious fresh fierce deep wide heavy key toxic rare whole entire');
const NOUN_EXC = set('history deal story territory factory memory category victory inventory hospital capital signal journal animal official material rival proposal approval arrival trial festival terminal criminal original deal meal portal council cabinet interest forest protest request harvest contest arrest test rest west nest chest manifest');
const VERBS2 = set('stop rise fall soar drop plunge slump surge collapse resume extend expand slash hike cut halt sign vote rule pass fail lead push pull block ban back fund seize sue probe vow slam hail mark mull eye');
const NOUN_SUF = /(tion|sion|ment|ness|ity|ance|ence|ism|ist|ship|hood|age|ure|ery|acy|dom|logy|ics)s?$/;
const ADJ_SUF = /(ous|ful|ive|able|ible|al|ic|ish|less|ary|ory|ent|ant|ian|ese)$/;
const FUNC_BN = { the: 'নির্দিষ্ট আর্টিকেল', a: 'একটি', an: 'একটি', of: 'এর', in: 'মধ্যে/এ', on: 'উপর/এ', at: 'এ', to: 'প্রতি/তে', for: 'জন্য', with: 'সাথে', by: 'দ্বারা', from: 'থেকে', and: 'এবং', or: 'অথবা', but: 'কিন্তু', as: 'যেহেতু/হিসেবে', after: 'পরে', before: 'আগে', without: 'ছাড়া', into: 'মধ্যে', over: 'উপর/নিয়ে', under: 'অধীনে', is: 'হয়/আছে', are: 'হয়/আছে', was: 'ছিল', were: 'ছিল', has: 'আছে/করেছে', have: 'আছে/করেছে', had: 'ছিল/করেছিল', will: 'করবে', would: 'করত', could: 'পারত', can: 'পারে', may: 'হয়তো', must: 'অবশ্যই', not: 'না', that: 'যে/যা', which: 'যা', who: 'যিনি/যারা', this: 'এই', these: 'এগুলো', their: 'তাদের', its: 'এর', his: 'তার', her: 'তার', they: 'তারা', it: 'এটি', he: 'সে/তিনি', she: 'সে/তিনি', we: 'আমরা', more: 'আরও', than: 'চেয়ে', amid: 'মধ্যে', despite: 'সত্ত্বেও', about: 'সম্পর্কে', against: 'বিরুদ্ধে', between: 'মধ্যে', during: 'সময়ে', also: 'ও/এছাড়া', new: 'নতুন', first: 'প্রথম', says: 'বলে', said: 'বলেছে', no: 'কোনো…না', all: 'সব', most: 'সবচেয়ে', been: 'হয়েছে', being: 'হচ্ছে' };

let DAY = {}; // insight words for the selected date
const VOC = () => window.TIS_VOCAB || {};
function dictEntry(w) {
  const lw = w.toLowerCase(), c = VOC()[lw];
  if (c) return { w: lw, pos: c[0], bn: c[1], syn: c[2].split(/,\s*/).filter((x) => x && x !== '—'), ant: c[3].split(/,\s*/).filter((x) => x && x !== '—'), src: 'TIS' };
  const d = DAY[lw];
  if (d) return { w: lw, pos: d.pos, bn: d.bn, alt: d.bnAlt, def: d.def, syn: d.syn || [], ant: d.ant || [], base: d.base, src: 'auto' };
  return null;
}
const posOf = (w) => (dictEntry(w)?.pos || '').toLowerCase();

// ---------------- tagger ----------------
function tokenize(s) { return s.match(/[A-Za-z]+(?:[’'][A-Za-z]+)?(?:-[A-Za-z]+)*|\d[\d,.]*%?|[^\sA-Za-z\d]/g) || []; }
function tag(text) {
  const toks = tokenize(text), out = [];
  const lowerAt = (i) => (toks[i] || '').toLowerCase();
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i], lw = w.toLowerCase(), prev = out[i - 1], pt = prev?.t, plw = lowerAt(i - 1), nlw = lowerAt(i + 1);
    const start = i === 0 || /^[.!?:;“"‘(]$/.test(toks[i - 1]);
    // look back over adverbs/negatives to find the governing word
    let k = i - 1; while (k >= 0 && (out[k].t === 'ADV' || out[k].t === 'NEG')) k--;
    const gov = k >= 0 ? out[k] : null, glw = gov ? gov.w.toLowerCase() : '';
    const nRaw = toks[i + 1] || '';
    const nextOpen = /^[a-z]/.test(nRaw) && ![DET, PDET, PRON, PREP, CONJ, SUB, REL, BE, HAVE, DO, MOD, NEGW].some((S) => S.has(nlw));
    let t = 'N', why = '';
    const put = (tt, ww) => { t = tt; why = ww; };
    if (/^\d/.test(w)) put('NUM', 'সংখ্যা নির্দেশ করছে');
    else if (/^[^A-Za-z\d]$/.test(w)) put('P', '');
    else if (/[’']s$/i.test(w) && w.length > 2) put('POSS', '’s যুক্ত — মালিকানা/সম্বন্ধ বোঝাচ্ছে (Possessive case)');
    else if (/n[’']t$/i.test(w)) put('NEG', 'নেতিবাচক সংক্ষিপ্ত রূপ');
    else if (lw === 'to') {
      const nx = nlw;
      if (nx && (VERBS.has(nx) || /^verb/.test(posOf(nx)) || BE.has(nx) || HAVE.has(nx)) && !DET.has(nx)) put('INF', '“to” + ক্রিয়ার মূলরূপ (V1) = Infinitive');
      else put('PREP', 'বিশেষ্য/সর্বনামের আগে বসে সম্পর্ক বোঝাচ্ছে');
    }
    else if (pt === 'INF' && plw === 'to') put('INF', '“to”-এর পরে ক্রিয়ার মূলরূপ (V1) — Infinitive');
    else if (lw === 'that') {
      if (gov && (gov.t === 'N' || gov.t === 'NP')) put('REL', 'আগের বিশেষ্যকে ব্যাখ্যা করে Relative clause শুরু করছে');
      else if (gov && (gov.t === 'V' || gov.t === 'PPA')) put('SUB', 'ক্রিয়ার পরে Noun clause শুরু করছে (said that…)');
      else put('DET', 'নির্দিষ্ট কিছু নির্দেশ করছে');
    }
    else if (lw === 'as' || lw === 'since' || lw === 'after' || lw === 'before' || lw === 'until') {
      const nx = nlw;
      if (start || DET.has(nx) || PRON.has(nx) || PDET.has(nx) || /^[A-Z]/.test(toks[i + 1] || '')) put(start ? 'SUB' : 'PREP', start ? 'বাক্যের শুরুতে অধীন খণ্ডবাক্য (Adverbial clause) শুরু করছে' : 'পদান্বয়ী অব্যয় হিসেবে সম্পর্ক বোঝাচ্ছে');
      else put('PREP', 'পদান্বয়ী অব্যয়');
    }
    else if (DET.has(lw)) put('DET', 'বিশেষ্যের আগে বসে নির্দিষ্ট/অনির্দিষ্টতা বোঝাচ্ছে');
    else if (PDET.has(lw)) put('PDET', 'মালিকানা বোঝানো সর্বনাম (Possessive determiner)');
    else if (REL.has(lw)) put('REL', 'Relative clause শুরু করছে');
    else if (MOD.has(lw)) put('MOD', 'সম্ভাবনা/বাধ্যবাধকতা/ভবিষ্যৎ বোঝাতে মূল ক্রিয়ার আগে বসে');
    else if (BE.has(lw) || HAVE.has(lw) || DO.has(lw)) {
      const nx = nlw;
      const helper = /ing$|ed$/.test(nx) || IRR_PPA.has(nx) || NEGW.has(nx) || (DO.has(lw) && (VERBS.has(nx) || ADVW.has(nx)));
      put(helper ? 'AUX' : 'V', helper ? 'মূল ক্রিয়াকে কাল/বাচ্য গঠনে সাহায্য করছে' : 'মূল ক্রিয়া (Main verb / linking verb)');
    }
    else if (NEGW.has(lw)) put('NEG', 'নেতিবাচকতা বোঝাচ্ছে');
    else if (PRON.has(lw)) put('PRON', 'বিশেষ্যের পরিবর্তে বসেছে');
    else if (CONJ.has(lw)) put('CONJ', 'দুটি সমান শব্দ/বাক্যাংশকে যুক্ত করছে');
    else if (SUB.has(lw)) put('SUB', 'অধীন খণ্ডবাক্য (Subordinate clause) শুরু করছে');
    else if (PREP.has(lw)) put('PREP', 'পরের বিশেষ্য/সর্বনামের সাথে বাক্যের অন্য অংশের সম্পর্ক বোঝাচ্ছে');
    else if (ADVW.has(lw)) put('ADV', 'ক্রিয়া/বিশেষণ/পুরো বাক্যকে বিশেষিত করছে');
    else if (/^[A-Z][a-z]+(an|ese|ish|i)$/.test(w) && nextOpen && !VOC()[lw]) put('ADJ', 'জাতি/দেশবাচক বিশেষণ (Russian, Chinese…)');
    else if (start && /^[A-Z]/.test(w) && !dictEntry(lw) && !ADJW.has(lw) && (/^[A-Z]/.test(nRaw) || /[’']s$/.test(nRaw)) && !VERBS.has(lw)) put('NP', 'নাম (ব্যক্তি/প্রতিষ্ঠান) — বাক্যের শুরুতে');
    else if (ADJW.has(lw) || (/est$/.test(lw) && lw.length > 5 && !NOUN_EXC.has(lw))) put('ADJ', /est$/.test(lw) ? 'Superlative degree (-est) — বিশেষণ' : 'বিশেষ্যের গুণ/অবস্থা বোঝাচ্ছে');
    else if (!start && /^[A-Z]/.test(w)) put('NP', 'বড় হাতের অক্ষরে শুরু — ব্যক্তি/স্থান/প্রতিষ্ঠানের নাম');
    else if (/^[A-Z]{2,}$/.test(w)) put('NP', 'সংক্ষিপ্ত নাম (Acronym)');
    else if (/ing$/.test(lw) && lw.length > 4 && !NOUN_ING.has(lw)) {
      if (gov && (BE.has(glw))) put('PPR', 'be-verb + V-ing → Continuous tense (ক্রিয়া চলমান)');
      else if (gov && (gov.t === 'PREP' || gov.t === 'DET' || gov.t === 'PDET' || gov.t === 'POSS')) put('GER', `${gov.t === 'PREP' ? 'Preposition' : 'Determiner/Possessive'}-এর পরে V-ing বিশেষ্যের কাজ করছে → Gerund`);
      else if (start && (BE.has(nlw) || HAVE.has(nlw) || MOD.has(nlw) || /s$/.test(nlw))) put('GER', 'বাক্যের Subject হিসেবে V-ing → Gerund');
      else if (gov && (gov.t === 'V')) put('GER', 'ক্রিয়ার Object হিসেবে V-ing → Gerund');
      else if (gov && (gov.t === 'N' || gov.t === 'NP')) put('PPR', 'আগের বিশেষ্যকে বর্ণনা করছে → Participle phrase');
      else put('PPR', 'V-ing বিশেষণ/ক্রিয়ার কাজ করছে → Present Participle');
    }
    else if ((/ed$/.test(lw) && lw.length > 4) || IRR_PPA.has(lw)) {
      if (gov && HAVE.has(glw)) put('PPA', 'have/has/had + V3 → Perfect tense');
      else if (gov && (BE.has(glw) || glw === 'get' || glw === 'got')) put('PPA', 'be-verb + V3 → Passive voice (কর্মবাচ্য)');
      else if (gov && (gov.t === 'DET' || gov.t === 'PDET' || gov.t === 'ADJ') && nextOpen) put('ADJ', 'বিশেষ্যের আগে V3 বিশেষণের কাজ করছে (Participial adjective)');
      else if (gov && (gov.t === 'N' || gov.t === 'NP') && (nlw === 'by' || (out.some((x) => isVerbT(x.t)) && (PREP.has(nlw) || nlw === ',')))) put('PPA', 'বিশেষ্যের পরে V3 → সংক্ষিপ্ত Passive (which was …)');
      else if (/ed$/.test(lw) || /^(said|told|held|made|took|gave|found|won|lost|met|left|led|paid|sent|sold|built|brought|sought|fought|felt|heard)$/.test(lw)) put('V', 'অতীত কালের ক্রিয়া (Past simple)');
      else put('PPA', 'অতীত কৃদন্ত (V3)');
    }
    else if (gov && gov.t === 'MOD') put('V', 'Modal-এর পরে ক্রিয়ার মূলরূপ (V1)');
    else if (gov && DO.has(glw) && gov.t === 'AUX') put('V', 'do/does/did-এর পরে ক্রিয়ার মূলরূপ (V1)');
    else if (/ly$/.test(lw) && lw.length > 4 && !NOT_LY.has(lw)) put('ADV', '-ly যুক্ত — কীভাবে/কতটা তা বোঝাচ্ছে');
    else {
      const p = posOf(lw);
      const afterNounish = gov && ['N', 'NP', 'PRON', 'POSS'].includes(gov.t);
      const afterDet = gov && ['DET', 'PDET', 'ADJ', 'PREP', 'POSS', 'NUM'].includes(gov.t);
      if (p.startsWith('adjective')) put('ADJ', 'বিশেষ্যের গুণ/অবস্থা বোঝাচ্ছে');
      else if (p.startsWith('preposition')) put('PREP', 'পদান্বয়ী অব্যয়');
      else if (p.includes('verb') && afterNounish && !afterDet) put('V', 'Subject-এর পরে মূল ক্রিয়া');
      else if (p.startsWith('verb') && !afterDet) put('V', 'ক্রিয়া');
      else if (p.startsWith('noun')) put('N', 'ব্যক্তি/বস্তু/বিষয়ের নাম');
      else if (NOUN_SUF.test(lw) || NOUN_EXC.has(lw)) put('N', 'বিশেষ্যবাচক প্রত্যয় (-tion/-ment/-ity…) যুক্ত');
      else if (ADJ_SUF.test(lw) && !NOUN_EXC.has(lw) && (nextOpen || (gov && BE.has(glw))) && !afterNounish) put('ADJ', 'বিশেষণবাচক প্রত্যয় (-ous/-ive/-al…) যুক্ত');
      else if (VERBS.has(lw) && !afterDet) put('V', 'মূল ক্রিয়া');
      else if (/[^s]s$/.test(lw) && afterNounish && !afterDet && lw.length > 3) put('V', 'Subject-এর পরে -s যুক্ত ক্রিয়া → Present simple');
      else if (VERBS.has(lw.replace(/e?s$/, '')) && afterNounish) put('V', 'Subject-এর পরে ক্রিয়া (Present simple)');
      else put('N', afterDet ? 'Article/Preposition/বিশেষণের পরে বিশেষ্য' : 'বিশেষ্য');
    }
    out.push({ w, t, why });
  }
  // noun + noun → first works like adjective (noun adjunct)
  for (let i = 0; i < out.length - 1; i++) if (out[i].t === 'N' && out[i + 1].t === 'N' && i > 0 && ['DET', 'ADJ', 'PDET', 'PREP'].includes(out[i - 1].t)) out[i].why = 'পরের বিশেষ্যকে বিশেষিত করছে (Noun adjunct — বিশেষণের মতো কাজ)';
  return out;
}

// ---------------- structure ----------------
const SEG = {
  ADVL: ['Adverbial Clause/Phrase', 'ক্রিয়া বিশেষণীয় অংশ', '#a16207'], SUBJ: ['Subject', 'কর্তা', '#2563eb'],
  VERB: ['Verb Phrase', 'ক্রিয়া অংশ', '#dc2626'], OBJ: ['Object / Complement', 'কর্ম / পূরক', '#16a34a'],
  PP: ['Prepositional Phrase', 'পদান্বয়ী বাক্যাংশ', '#64748b'], RELC: ['Relative Clause', 'সম্বন্ধসূচক খণ্ডবাক্য', '#0e7490'],
  SUBC: ['Subordinate Clause', 'অধীন খণ্ডবাক্য', '#a16207'], COORD: ['Coordinate Part', 'সংযুক্ত অংশ', '#7c3aed'], INFP: ['Infinitive Phrase', 'ইনফিনিটিভ বাক্যাংশ', '#e11d48'], MODP: ['Appositive / Modifier', 'অতিরিক্ত বর্ণনা (সমার্থক অংশ)', '#0d9488'],
};
const isVerbT = (t) => ['V', 'AUX', 'MOD'].includes(t);
function structure(tg) {
  const segs = []; let i = 0;
  const push = (k, a, b) => { if (b > a) segs.push({ k, a, b }); };
  const first = tg[0]?.t;
  if (first === 'SUB' || first === 'PREP') {
    let j = tg.findIndex((x, n) => n > 0 && x.w === ',');
    if (j > 0 && j < tg.length - 3) { push('ADVL', 0, j + 1); i = j + 1; }
  }
  // main verb: first finite verb not inside a relative clause
  let v = -1, inRel = false;
  for (let n = i; n < tg.length; n++) {
    const t = tg[n].t;
    if (t === 'REL') inRel = true;
    else if (inRel && isVerbT(t)) { let m = n; while (m < tg.length && (isVerbT(tg[m].t) || ['ADV', 'NEG', 'PPA', 'PPR'].includes(tg[m].t))) m++; n = m - 1; inRel = false; continue; }
    else if (!inRel && isVerbT(t)) { v = n; break; }
  }
  if (v < 0) { segs.push({ k: 'SUBJ', a: i, b: tg.length, note: 'শিরোনাম/বাক্যাংশ — পূর্ণ ক্রিয়া নেই' }); return { segs, main: -1 }; }
  push('SUBJ', i, v);
  let e = v; while (e < tg.length && (isVerbT(tg[e].t) || ['ADV', 'NEG', 'PPA', 'PPR', 'INF'].includes(tg[e].t) && !(tg[e].t === 'INF' && tg[e].w.toLowerCase() === 'to'))) e++;
  push('VERB', v, e);
  let a = e, kind = 'OBJ';
  for (let n = e; n <= tg.length; n++) {
    const x = tg[n], boundary = !x || x.w === ',' || x.w === ';' || x.t === 'PREP' || x.t === 'SUB' || x.t === 'REL' || x.t === 'CONJ' || (x.t === 'INF' && x.w.toLowerCase() === 'to');
    if (boundary && n > a) { push(kind, a, x && (x.w === ',' || x.w === ';') ? n + 1 : n); a = x && (x.w === ',' || x.w === ';') ? n + 1 : n; }
    if (!x) break;
    if (boundary && x.w !== ',' && x.w !== ';') kind = x.t === 'PREP' ? 'PP' : x.t === 'REL' ? 'RELC' : x.t === 'SUB' ? 'SUBC' : x.t === 'CONJ' ? 'COORD' : 'INFP';
    if (x && (x.w === ',' || x.w === ';')) { const nt = tg[n + 1]?.t; kind = ['DET', 'PDET', 'ADJ', 'N', 'NP', 'NUM'].includes(nt) ? 'MODP' : kind; }
  }
  return { segs, main: v };
}
function sentenceInfo(tg, st) {
  const ws = tg.map((x) => x.w.toLowerCase());
  const hasSubClause = tg.some((x, i) => (x.t === 'SUB' || x.t === 'REL') && tg.slice(i + 1).some((y) => isVerbT(y.t) || y.t === 'PPA'));
  const coord = tg.some((x, i) => x.t === 'CONJ' && i > 2 && tg.slice(i + 1, i + 5).some((y) => isVerbT(y.t)) && ['PRON', 'NP', 'N', 'DET'].includes(tg[i + 1]?.t));
  const type = hasSubClause && coord ? 'Compound-Complex (যৌগিক-জটিল)' : hasSubClause ? 'Complex (জটিল বাক্য)' : coord ? 'Compound (যৌগিক বাক্য)' : 'Simple (সরল বাক্য)';
  let tense = 'Headline-রীতি (পূর্ণ ক্রিয়া নেই)', voice = 'Active (কর্তৃবাচ্য)';
  if (st.main >= 0) {
    const vp = tg.slice(st.main, st.main + 4).filter((x) => x.t !== 'ADV' && x.t !== 'NEG');
    const w0 = vp[0]?.w.toLowerCase(), t1 = vp[1]?.t, w1 = vp[1]?.w.toLowerCase();
    if (vp.some((x, i) => x.t === 'PPA' && i > 0 && BE.has(vp[i - 1].w.toLowerCase()))) voice = 'Passive (কর্মবাচ্য)';
    if (MOD.has(w0)) tense = w0 === 'will' || w0 === 'shall' ? (w1 === 'be' && vp[2]?.t === 'PPR' ? 'Future Continuous' : w1 === 'have' ? 'Future Perfect' : 'Future Simple (ভবিষ্যৎ)') : `Modal (${w0})`;
    else if (['has', 'have'].includes(w0) && (t1 === 'PPA' || w1 === 'been')) tense = vp[2]?.t === 'PPR' ? 'Present Perfect Continuous' : 'Present Perfect (পুরাঘটিত বর্তমান)';
    else if (w0 === 'had' && (t1 === 'PPA' || w1 === 'been')) tense = 'Past Perfect (পুরাঘটিত অতীত)';
    else if (['is', 'are', 'am'].includes(w0)) tense = t1 === 'PPR' ? 'Present Continuous (ঘটমান বর্তমান)' : t1 === 'PPA' ? 'Present Simple — Passive' : 'Present Simple (সাধারণ বর্তমান)';
    else if (['was', 'were'].includes(w0)) tense = t1 === 'PPR' ? 'Past Continuous (ঘটমান অতীত)' : t1 === 'PPA' ? 'Past Simple — Passive' : 'Past Simple (সাধারণ অতীত)';
    else if (/ed$/.test(w0) || IRR_PPA.has(w0) || ['said', 'did', 'went', 'came', 'saw', 'took', 'gave', 'rose', 'fell', 'grew', 'began', 'became'].includes(w0)) tense = 'Past Simple (সাধারণ অতীত)';
    else tense = 'Present Simple (সাধারণ বর্তমান)';
  }
  return { type, tense, voice };
}

// ---------------- rendering ----------------
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isEnglish = (s = '') => { const a = (s.match(/[A-Za-z]/g) || []).length, b = (s.match(/[ঀ-৿]/g) || []).length; return a > 8 && a > b * 2; };
function vocabify(text) {
  if (!text || !isEnglish(text)) return esc(text);
  return esc(text).replace(/\b([A-Za-z][a-z]+(?:-[a-z]+)*)\b/g, (m) => {
    const lw = m.toLowerCase();
    return (VOC()[lw] || DAY[lw]) ? `<span class="vw" data-w="${lw}" data-ctx="${esc(text)}">${m}</span>` : m;
  });
}
const glossOf = (w) => { const lw = w.toLowerCase(); const d = dictEntry(lw); return d?.bn || FUNC_BN[lw] || ''; };
function renderSentence(en, bnText) {
  const tg = tag(en), st = structure(tg), info = sentenceInfo(tg, st);
  const segHtml = st.segs.map((s, idx) => {
    const L = SEG[s.k];
    return `${idx ? '<span class="arrow">➜</span>' : ''}<span class="seg" style="--sc:${L[2]}"><small>${L[0]}<br><i>${L[1]}</i></small><b>${esc(tg.slice(s.a, s.b).map((x) => x.w).join(' ').replace(/ ([,.;:!?’'])/g, '$1'))}</b></span>`;
  }).join('');
  const words = tg.filter((x) => x.t !== 'P').map((x) => {
    const L = T[x.t], g = glossOf(x.w), hasCard = !!dictEntry(x.w);
    return `<span class="tok ${hasCard ? 'vw' : ''}" ${hasCard ? `data-w="${x.w.toLowerCase()}" data-ctx="${esc(en)}"` : ''} style="--tc:${L[2]}" title="${esc(L[0] + ' — ' + x.why)}"><b>${esc(x.w)}</b><i>↓</i><small>${L[0].split(' (')[0]}</small>${g ? `<em>${esc(g)}</em>` : ''}</span>`;
  }).join('');
  return `<div class="sent">
    <p class="sent-en">${vocabify(en)}</p>
    ${bnText ? `<p class="sent-bn">🇧🇩 ${esc(bnText)}</p>` : `<p class="sent-bn muted">বাংলা অনুবাদ: <a href="https://translate.google.com/?sl=en&tl=bn&text=${encodeURIComponent(en)}" target="_blank" rel="noopener">Google Translate-এ দেখুন ↗</a></p>`}
    <div class="sent-meta"><span>📐 ${info.type}</span><span>⏳ ${info.tense}</span><span>🔁 ${info.voice}</span></div>
    <div class="segs">${segHtml}</div>
    <details open><summary>শব্দে শব্দে Parts of Speech ও অর্থ</summary><div class="toks">${words}</div></details>
  </div>`;
}
const LEGEND = () => Object.entries(T).filter(([k]) => k !== 'P').map(([, L]) => `<span style="--tc:${L[2]}">${L[0].split(' (')[0]} <i>${L[1]}</i></span>`).join('');

// ---------------- word popup ----------------
let pop;
function ensurePop() {
  if (pop) return pop;
  pop = document.createElement('div'); pop.className = 'wpop'; pop.hidden = true;
  document.body.appendChild(pop);
  document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.wpop') && !e.target.closest('.vw')) pop.hidden = true; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') pop.hidden = true; });
  return pop;
}
async function showWord(w, ctx, anchor) {
  const p = ensurePop(); const d = dictEntry(w);
  const tg = ctx ? tag(ctx) : []; const hit = tg.find((x) => x.w.toLowerCase() === w);
  const role = hit ? T[hit.t] : null;
  const saved = JSON.parse(localStorage.getItem('tis_words') || '{}');
  p.innerHTML = `<button class="wpop-x" aria-label="বন্ধ">✕</button>
    <div class="wpop-h"><b>${esc(w)}</b>${d?.pos ? `<span>${esc(d.pos)}</span>` : ''}
      <button class="wsp" title="উচ্চারণ শুনুন">🔊</button></div>
    ${role ? `<div class="wrole" style="--tc:${role[2]}"><b>এই বাক্যে:</b> ${role[0]} — ${role[1]}<small>${esc(hit.why)}</small></div>` : ''}
    <div class="wrow"><b>বাংলা অর্থ</b><span>${esc(d?.bn || '…')}</span></div>
    ${d?.alt && Object.keys(d.alt).length ? `<div class="wrow"><b>অন্যান্য অর্থ</b><span>${Object.entries(d.alt).map(([k, v]) => `<i>${esc(k)}:</i> ${esc(v.join(', '))}`).join('<br>')}</span></div>` : ''}
    ${d?.def ? `<div class="wrow"><b>Meaning</b><span>${esc(d.def)}</span></div>` : ''}
    <div class="wrow"><b>Synonym</b><span class="wchips syn">${(d?.syn || []).map((s) => `<i>${esc(s)}</i>`).join('') || '<em>—</em>'}</span></div>
    <div class="wrow"><b>Antonym</b><span class="wchips ant">${(d?.ant || []).map((s) => `<i>${esc(s)}</i>`).join('') || '<em>—</em>'}</span></div>
    ${ctx ? `<div class="wctx">“${esc(ctx).replace(new RegExp(`\\b(${w})\\b`, 'i'), '<mark>$1</mark>')}”</div>` : ''}
    <div class="wpop-f"><button class="btn sm wsave">${saved[w] ? '★ শব্দভান্ডারে আছে' : '☆ শব্দভান্ডারে রাখুন'}</button>
      <a class="btn sm ghost" target="_blank" rel="noopener" href="https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(d?.base || w)}">Cambridge ↗</a></div>`;
  p.hidden = false;
  const r = anchor.getBoundingClientRect();
  if (innerWidth > 640) { p.style.left = Math.min(innerWidth - 400, Math.max(10, r.left)) + 'px'; p.style.top = (r.bottom + 8 + 330 > innerHeight ? Math.max(10, r.top - 340) : r.bottom + 8) + 'px'; }
  else { p.style.left = ''; p.style.top = ''; }
  p.querySelector('.wpop-x').onclick = () => (p.hidden = true);
  p.querySelector('.wsp').onclick = () => { try { const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; speechSynthesis.speak(u); } catch {} };
  p.querySelector('.wsave').onclick = (e) => {
    const s = JSON.parse(localStorage.getItem('tis_words') || '{}');
    if (s[w]) delete s[w]; else s[w] = { bn: d?.bn || '', pos: d?.pos || '', syn: d?.syn || [], ant: d?.ant || [], ctx: ctx || '', at: Date.now() };
    localStorage.setItem('tis_words', JSON.stringify(s)); e.target.textContent = s[w] ? '★ শব্দভান্ডারে আছে' : '☆ শব্দভান্ডারে রাখুন';
  };
  if (!d) { // unknown word: live dictionary lookup
    try {
      const j = await (await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`)).json();
      const m = j?.[0]?.meanings?.[0];
      if (m) p.querySelector('.wrow span').innerHTML = `${esc(m.definitions?.[0]?.definition || '')} <a href="https://translate.google.com/?sl=en&tl=bn&text=${encodeURIComponent(w)}" target="_blank" rel="noopener">বাংলা ↗</a>`;
    } catch {}
  }
}
document.addEventListener('click', (e) => {
  const v = e.target.closest('.vw'); if (!v) return;
  e.preventDefault(); e.stopPropagation();
  showWord(v.dataset.w, v.dataset.ctx || v.closest('[data-ctx]')?.dataset.ctx || v.parentElement?.textContent || '', v);
}, true);

window.TISG = { tag, structure, sentenceInfo, vocabify, renderSentence, showWord, dictEntry, isEnglish, LEGEND, setDay: (w) => (DAY = w || {}), dayWords: () => DAY, T };
})();
