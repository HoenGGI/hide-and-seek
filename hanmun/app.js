// 오티링고 — 듀오링고식 과목별 학습 앱 (지금은 한문). 내용은 data.js, 화면 구조와 스타일은 index.html.
'use strict';

/* ════════ 작은 도구 ════════ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const HZ_RE = /[㐀-鿿豈-﫿]/;
const isHz = ch => HZ_RE.test(ch);
const hzOf = s => [...s].filter(isHz);
const eumOf = hun => hun.trim().split(/\s+/).pop();
const norm = s => String(s).replace(/[\s.,!?·'"()~\-]/g, '');
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dayKey(new Date());
const addDays = (key, n) => { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ════════ 아이콘 (24px 격자) ════════ */
const ICON = {
  flame: '<path fill="currentColor" d="M12.6 2.2c.6 3.3-1.9 5-1.9 7.6 0 1.3.9 2.3 2.1 2.3 1.4 0 2.2-1.1 2.2-2.6 2.2 1.7 3.4 4 3.4 6.3 0 3.7-2.9 6.4-6.4 6.4s-6.3-2.6-6.3-6.3c0-5.2 5.4-8.3 6.9-13.7z"/>',
  heart: '<path fill="currentColor" d="M12 20.6s-7.6-4.6-9.5-9.2C1 7.9 3.1 4.3 6.7 4.3c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.6 0 5.7 3.6 4.2 7.1-1.9 4.6-9.5 9.2-9.5 9.2z"/>',
  bolt: '<path fill="currentColor" d="M13.4 2 4.6 13.3h6l-1.2 8.7 9-11.6h-6.1z"/>',
  star: '<path fill="currentColor" d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z"/>',
  check: '<path fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="m5 12.6 4.6 4.6L19.2 7.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/>',
  trophy: '<path fill="currentColor" d="M7 3h10v2h3v2.5a4.5 4.5 0 0 1-4.2 4.5A5 5 0 0 1 13 15.1V18h3.5v3h-9v-3H11v-2.9A5 5 0 0 1 8.2 12 4.5 4.5 0 0 1 4 7.5V5h3zm0 4H6v.5a2.5 2.5 0 0 0 1.3 2.2A6 6 0 0 1 7 8zm10 0v1a6 6 0 0 1-.3 1.7A2.5 2.5 0 0 0 18 7.5V7z"/>',
  crown: '<path fill="currentColor" d="m3 7.5 4.6 4L12 4.5l4.4 7 4.6-4-1.8 11H4.8z"/>',
  book: '<path fill="currentColor" d="M3.5 5.2c0-.9.8-1.6 1.7-1.5 2.4.2 4.6.9 5.8 2.1V20c-1.4-1.1-3.6-1.7-5.9-1.9-.9 0-1.6-.8-1.6-1.6zm17 0c0-.9-.8-1.6-1.7-1.5-2.4.2-4.6.9-5.8 2.1V20c1.4-1.1 3.6-1.7 5.9-1.9.9 0 1.6-.8 1.6-1.6z"/>',
  x: '<path fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/>',
  speaker: '<path fill="currentColor" d="M3.5 9.2h3.8L12 5.3v13.4l-4.7-3.9H3.5z"/><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M15.3 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>',
  home: '<path fill="currentColor" d="M3 11.3 12 3.8l9 7.5v8.4c0 .6-.5 1.1-1.1 1.1H15v-6.2H9v6.2H4.1c-.6 0-1.1-.5-1.1-1.1z"/>',
  refresh: '<path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.6 4v4.6H15"/>',
  user: '<circle cx="12" cy="8" r="4.2" fill="currentColor"/><path fill="currentColor" d="M3.8 20.2c.8-4 4.2-6.4 8.2-6.4s7.4 2.4 8.2 6.4c.1.5-.3.8-.8.8H4.6c-.5 0-.9-.3-.8-.8z"/>',
  target: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  bulb: '<path fill="currentColor" d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.1.9 1.8v.5h6V16c0-.7.3-1.3.9-1.8A6.5 6.5 0 0 0 12 2.5zM9 18h6v1.3c0 1.2-1 2.2-2.2 2.2h-1.6C10 21.5 9 20.5 9 19.3z"/>',
  skip: '<path fill="currentColor" d="M5 6.2v11.6c0 .8.9 1.3 1.6.8L13 13.9v3.9c0 .8.9 1.3 1.6.8l7.2-5.8c.5-.4.5-1.2 0-1.6l-7.2-5.8c-.7-.5-1.6 0-1.6.8v3.9L6.6 5.4C5.9 4.9 5 5.4 5 6.2z"/>',
  quiz: '<rect x="5" y="4.5" width="14" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="8.5" y="2.5" width="7" height="4" rx="1.5" fill="currentColor"/><path d="m8.5 13.5 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="m15.5 15.5 5 5"/>',
};
const icon = (n, s = 24, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

/* ════════ 저장 상태 ════════ */
const KEY = 'ilsin.v1';
const DEF = { v: 1, xp: 0, days: {}, streak: 0, last: null, best: 0, done: {}, wrong: {}, quiz: [], subject: 'hanmun', settings: { sound: true, vib: true, tts: true, all: false, goal: 20, theme: 'system' } };
let S = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 1) return Object.assign(JSON.parse(JSON.stringify(DEF)), s, { settings: Object.assign({}, DEF.settings, s.settings) });
  } catch (e) { }
  return JSON.parse(JSON.stringify(DEF));
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
function streakNow() { const t = today(); return (S.last === t || S.last === addDays(t, -1)) ? S.streak : 0; }
const todayXp = () => S.days[today()] || 0;

/* ════════ 소리 · 진동 · 읽어 주기 ════════ */
const NATIVE = window.Android || null;
let AC = null;
function tone(f, t, d, type = 'triangle', v = .16) {
  if (!S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .012); g.gain.exponentialRampToValueAtTime(.0008, t0 + d);
    o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d + .05);
  } catch (e) { }
}
const sfx = {
  tap: () => tone(660, 0, .05, 'sine', .05),
  right: () => { tone(784, 0, .14); tone(1175, .1, .26); },
  wrong: () => { tone(196, 0, .16, 'square', .055); tone(165, .13, .24, 'square', .055); },
  match: () => tone(988, 0, .09, 'sine', .08),
  done: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .09, .32, 'triangle', .13)),
  stamp: () => { tone(110, 0, .22, 'sine', .32); tone(70, .01, .3, 'sine', .25); },
};
function buzz(ms) {
  if (!S.settings.vib) return;
  try { if (NATIVE && NATIVE.vibrate) NATIVE.vibrate(ms); else if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { }
}
const tts = {
  ready() {
    try {
      if (NATIVE && NATIVE.ttsReady) return !!NATIVE.ttsReady();
      return 'speechSynthesis' in window && speechSynthesis.getVoices().some(v => /^ko/i.test(v.lang));
    } catch (e) { return false; }
  },
  say(text, slow) {
    if (!S.settings.tts || !text) return;
    try {
      if (NATIVE && NATIVE.speak) { NATIVE.speak(String(text), slow ? 0.6 : 0.95); return; }
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = slow ? .6 : .95;
      const v = speechSynthesis.getVoices().find(v => /^ko/i.test(v.lang)); if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { }
  }
};
if ('speechSynthesis' in window && !NATIVE) try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => { }; } catch (e) { }

/* ════════ 내용 색인 ════════ */
const POOL = { chars: [], words: [], sents: [] };
const LESSONS = [];           // 전체 레슨 (모든 과목, 순서대로)
const BYKEY = {};             // 오답 노트용: 키 → 문제 재료
const ALL_UNITS = [];         // 모든 과목의 단원
const UNIT_SUB = {};          // 단원 id → 과목 id
const TERMS = [];             // 용어 { t: 용어, d: 뜻 } (역사 등)
const itemSub = x => UNIT_SUB[x && x.u];
const SU = () => curSub().data;   // 지금 과목의 { units, summary, exam }
const subLessons = sid => LESSONS.filter(L => L.sub === sid);
function charObj(ch, hun, u) { return { kind: 'char', k: 'c:' + ch + '|' + hun, ch, hun, u }; }
function charsOf(item) { return hzOf(item.h).map((ch, i) => charObj(ch, item.c[i], item.u)); }
function reading(item) {           // 한자만 읽은 독음 (띄어쓰기 유지): 萬德은 取十之一 → 만덕 취십지일
  if (item.r) return item.r;
  let i = 0, out = '';
  for (const ch of item.h) { if (isHz(ch)) out += eumOf(item.c[i++]); else if (ch === ' ') out += ' '; }
  return out.replace(/\s+/g, ' ').trim();
}
function readingToe(item) {        // 토까지 붙인 독음: 만덕은 취십지일하여
  if (item.kind === 'word') return item.r;
  let i = 0, out = '';
  for (const ch of item.h) out += isHz(ch) ? eumOf(item.c[i++]) : ch;
  return out;
}
const eumsOf = item => item.kind === 'word' ? [...item.r] : item.c.map(eumOf);
const tokens = s => s.m.split(' ');

(function index() {
  const seenC = new Set();
  const addChar = c => { if (!seenC.has(c.k)) { seenC.add(c.k); POOL.chars.push(c); BYKEY[c.k] = c; } };
  SUBJECTS.filter(sb => sb.data).forEach(sb => sb.data.units.forEach(u => {
    UNIT_SUB[u.id] = sb.id; u.subj = sb.id; ALL_UNITS.push(u);
    u.lessons.forEach((L, li) => {
      L.id = L.id || u.id + '-' + li; L.u = u; L.idx = li; L.sub = sb.id;   // 레슨을 합치거나 빼도 기록이 어긋나지 않게 id를 직접 적을 수 있음
      (L.words || []).forEach(h => { const w = WORDS[h]; if (!w.u) { w.u = u.id; POOL.words.push(w); BYKEY[w.k] = w; } charsOf(w).forEach(addChar); });
      (L.sents || []).forEach(id => { const s = SENTS[id]; if (!s.u) { s.u = u.id; POOL.sents.push(s); BYKEY[s.k] = s; } charsOf(s).forEach(addChar); });
      (L.chars || []).forEach(([ch, hun]) => addChar(charObj(ch, hun, u.id)));
      ['quiz', 'cloze', 'pairs'].forEach(f => (L[f] || []).forEach((q, i) => { q.k = q.k || f[0] + ':' + L.id + ':' + i; q.kind = f; q.u = u.id; BYKEY[q.k] = q; }));
      (L.terms || []).forEach(([t, d]) => { const x = { kind: 'term', k: 'tm:' + t, t, d, u: u.id }; if (!BYKEY[x.k]) { BYKEY[x.k] = x; TERMS.push(x); } });
      LESSONS.push(L);
    });
    (sb.data.exam[u.id] || []).forEach((q, i) => { q.k = 'x:' + u.id + ':' + i; q.kind = 'exam'; q.u = u.id; BYKEY[q.k] = q; });
  }));
  SUBJECTS.filter(sb => sb.data && sb.data.mock).forEach(sb => sb.data.mock.forEach(m => m.items.forEach((q, i) => {
    q.k = 'm:' + m.id + ':' + i; q.kind = 'exam'; q.u = q.u || sb.data.units[0].id; BYKEY[q.k] = q;
  })));
})();

function unitItems(uids) {
  const set = new Set(uids), it = { words: [], sents: [], chars: [], quiz: [], cloze: [], pairs: [], terms: [] };
  LESSONS.filter(L => set.has(L.u.id)).forEach(L => {
    (L.words || []).forEach(h => it.words.push(WORDS[h]));
    (L.sents || []).forEach(id => it.sents.push(SENTS[id]));
    (L.chars || []).forEach(([ch, hun]) => it.chars.push(BYKEY['c:' + ch + '|' + hun]));
    ['quiz', 'cloze', 'pairs'].forEach(f => (L[f] || []).forEach(q => it[f].push(q)));
    (L.terms || []).forEach(([t]) => it.terms.push(BYKEY['tm:' + t]));
  });
  it.words = [...new Set(it.words)]; it.sents = [...new Set(it.sents)]; it.terms = [...new Set(it.terms)];
  return it;
}

/* ════════ 문제 만들기 ════════ */
function prefer(list, u) { return shuffle(list.filter(x => x.u === u)).concat(shuffle(list.filter(x => x.u !== u))); }
function distract(n, cands, ok, key) {
  const out = [], seen = new Set();
  for (const x of cands) { if (out.length >= n) break; if (!ok(x)) continue; const k = key(x); if (seen.has(k)) continue; seen.add(k); out.push(x); }
  return out;
}
// 한자 문자열을 화면용으로: 한자는 글자 단위 span, 한글 토는 작게
function hzHtml(str, { hints = null, mark = -1, big = '' } = {}) {
  let i = 0, out = '', toe = '';
  const flush = () => { if (toe.trim()) out += `<span class="toe">${esc(toe.trim())}</span>`; if (/\s$/.test(toe)) out += '<span class="gap"></span>'; toe = ''; };
  for (const ch of str) {
    if (isHz(ch)) {
      flush();
      const h = hints && hints[i];
      out += `<span class="hc${i === mark ? ' mark' : ''}${h ? ' hint' : ''}"${h ? ` data-hint="${esc(h)}"` : ''}>${ch}</span>`;
      i++;
    } else toe += ch;
  }
  flush();
  return `<span class="hzline hz ${big}">${out}</span>`;
}
const readLine = item => `<div class="rd">${esc(readingToe(item))}</div>`;
// 한글 문장 속 한자는 명조로, [[ ]]는 밑줄로, 줄바꿈은 그대로
const hzWrap = s => esc(s).replace(/\[\[(.+?)\]\]/g, '<u>$1</u>').replace(/[㐀-鿿豈-﫿]+/g, m => `<span class="hz">${m}</span>`).replace(/\n/g, '<br>');
// 한자 보기가 길면 두 칸 대신 한 줄씩
const hzLayout = vals => vals.some(v => v.length > 4) ? 'list hzlist' : 'grid2 hzopts';
function fakeReading(r) {
  const a = [...r], i = rnd(a.length);
  let e; do { e = eumOf(pick(POOL.chars).hun); } while (e === a[i] || e.length !== 1);
  a[i] = e; return a.join('');
}
function expOf(item) {
  if (!item) return '';
  if (item.kind === 'word') return `${item.h}(${item.r}): ${item.m}`;
  if (item.kind === 'sent') return `${readingToe(item)}: ${item.m}`;
  if (item.kind === 'char') return `${item.ch} ${item.hun}`;
  return item.exp || '';
}

const pairText = pairs => pairs.map(p => `${p[0]} – ${p[1]}`).join(' · ');
// 쓰기 문제 답 비교: 띄어쓰기·문장 부호·낫표·대소문자 무시
const ansNorm = v => norm(String(v).replace(/[「」『』〈〉《》]/g, '')).toLowerCase();
// 같은 것을 가리키는 다른 이름도 정답으로
const ALT_ANS = {
  '윌슨의 14개조 평화 원칙': ['14개조 평화 원칙', '윌슨의 14개조', '14개조 평화원칙'],
  '테니스코트의 서약': ['테니스코트 서약'],
  '인권 선언': ['인간과 시민의 권리 선언', '프랑스 인권 선언'],
  '국제 연합': ['UN', '국제 연합(UN)'],
  '신경제 정책': ['NEP', '신경제 정책(NEP)'],
};
// "신경제 정책(NEP)" → 신경제 정책(NEP) · 신경제 정책 · NEP 모두 정답
function altAnswers(a) {
  const t = String(a), out = new Set([t, ...(ALT_ANS[t] || [])]);
  const m = t.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (m) { out.add(m[1]); out.add(m[2]); (ALT_ANS[m[1]] || []).forEach(x => out.add(x)); }
  return [...new Set([...out].map(ansNorm))];
}
const X = {
  pickHunum(c) {
    const ds = distract(3, prefer(POOL.chars, c.u), x => x.ch !== c.ch && x.hun !== c.hun, x => x.hun);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: c.k, item: c, title: '이 한자의 훈과 음을 고르시오', layout: 'grid2',
      prompt: `<div class="bighz hz">${c.ch}</div>`,
      opts: shuffle([c, ...ds]).map(x => ({ v: x.hun, html: esc(x.hun), d: `${x.ch}의 훈음` })), ans: c.hun, answerText: `${c.ch} ${c.hun}`, say: c.hun, exp: ''
    };
  },
  pickHanja(c) {
    const ds = distract(3, prefer(POOL.chars, c.u), x => x.ch !== c.ch && x.hun !== c.hun, x => x.ch);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: c.k, item: c, title: `'${c.hun}'에 알맞은 한자를 고르시오`, layout: 'grid2 hzopts',
      prompt: `<div class="bubble">${esc(c.hun)}</div>`,
      opts: shuffle([c, ...ds]).map(x => ({ v: x.ch, html: `<span class="hz">${x.ch}</span>`, d: x.hun })), ans: c.ch, answerText: `${c.ch} (${c.hun})`, say: c.hun
    };
  },
  charMatch(chars, title) {
    const cs = distract(5, shuffle(chars), () => true, x => x.ch);
    const uniqHun = distract(5, cs, () => true, x => x.hun);
    if (uniqHun.length < 3) return null;
    const pairs = uniqHun.map(c => [c.ch, c.hun]);
    return { type: 'match', key: 'm:' + uniqHun.map(c => c.ch).join(''), title: title || '한자와 훈음을 짝지으시오', pairs, hz: [1, 0], answerText: pairText(pairs) };
  },
  pairs(p) { const pairs = shuffle(p.p).slice(0, 5); return { type: 'match', key: p.k, item: p, title: p.t, pairs, hz: p.hz, answerText: pairText(pairs) }; },
  wordEum(w) {
    let ds = distract(3, prefer(POOL.words, w.u), x => x.h !== w.h && x.r.length === w.r.length && x.r !== w.r, x => x.r).map(x => ({ v: x.r, d: `${x.h}의 독음` }));
    if (w.h[0] === '不') { const alt = (w.r[0] === '부' ? '불' : '부') + w.r.slice(1); ds = [{ v: alt, d: '不은 뒤 글자의 첫소리가 ㄷ·ㅈ이면 "부", 그 밖에는 "불"로 읽습니다' }, ...ds.filter(d => d.v !== alt)].slice(0, 3); }
    let guard = 0;
    while (ds.length < 3 && guard++ < 50) { const f = fakeReading(w.r); if (f !== w.r && !ds.some(d => d.v === f)) ds.push({ v: f, d: '' }); }
    return {
      type: 'choice', key: w.k, item: w, title: '이 어휘의 독음을 고르시오', layout: 'grid2',
      prompt: `<div class="bighz hz word">${w.h}</div>`, opts: shuffle([{ v: w.r, d: '' }, ...ds]).map(o => ({ v: o.v, html: esc(o.v), d: o.d })), ans: w.r, answerText: w.r, say: w.r, exp: expOf(w)
    };
  },
  wordMean(w) {
    const ds = distract(3, prefer(POOL.words, w.u), x => x.h !== w.h && x.m !== w.m, x => x.m);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: w.k, item: w, title: '이 어휘의 뜻을 고르시오', layout: 'list',
      prompt: `<div class="midhz hz">${w.h}</div><div class="rd">${esc(w.r)}</div>`,
      opts: shuffle([w, ...ds]).map(x => ({ v: x.m, html: esc(x.m), d: `${x.h}(${x.r})의 뜻` })), ans: w.m, answerText: w.m, say: w.r, exp: expOf(w)
    };
  },
  meanWord(w) {
    const ds = distract(3, prefer(POOL.words, w.u), x => x.h !== w.h && x.h.length === w.h.length, x => x.h);
    const more = ds.length < 3 ? distract(3 - ds.length, prefer(POOL.words, w.u), x => x.h !== w.h && !ds.includes(x), x => x.h) : [];
    const all = ds.concat(more);
    if (all.length < 3) return null;
    return {
      type: 'choice', key: w.k, item: w, title: '뜻에 알맞은 어휘를 고르시오', layout: 'grid2 hzopts',
      prompt: `<div class="bubble">${esc(w.m)}</div>`,
      opts: shuffle([w, ...all]).map(x => ({ v: x.h, html: `<span class="hz">${x.h}</span>`, d: `${x.r} · ${x.m}` })), ans: w.h, answerText: `${w.h} (${w.r})`, say: w.r, exp: expOf(w)
    };
  },
  buildWord(w) {
    const own = new Set(hzOf(w.h));
    const ds = distract(w.h.length > 2 ? 3 : 2, prefer(POOL.chars, w.u), x => !own.has(x.ch), x => x.ch).map(x => x.ch);
    return {
      type: 'tiles', key: w.k, item: w, title: '뜻에 맞게 한자를 순서대로 고르시오', tcls: 'hz',
      prompt: `<div class="bubble"><b>${esc(w.r)}</b> · ${esc(w.m)}</div>`,
      tiles: shuffle([...hzOf(w.h), ...ds]), ans: hzOf(w.h), join: '', answerText: `${w.h} (${w.r})`, say: w.r, exp: expOf(w)
    };
  },
  wordCloze(w) {
    if (!w.ex) return null;
    const ds = distract(3, prefer(POOL.words, w.u), x => x.h !== w.h, x => x.h);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: w.k, item: w, title: '빈칸에 알맞은 어휘를 고르시오', layout: 'grid2 hzopts',
      prompt: `<div class="cloze">${esc(w.ex).replace('○', '<span class="blank"></span>')}</div>`,
      opts: shuffle([w, ...ds]).map(x => ({ v: x.h, html: `<span class="hz">${x.h}</span>`, d: `${x.r} · ${x.m}` })), ans: w.h, answerText: `${w.h} (${w.r})`, say: w.r, exp: expOf(w)
    };
  },
  typeEum(item) {
    const r = reading(item);
    return {
      type: 'type', key: item.k, item, title: '독음을 한글로 쓰시오',
      prompt: item.kind === 'word' ? `<div class="bighz hz word">${item.h}</div>` : `<div class="sentence">${hzHtml(item.h)}</div>`,
      ans: [ansNorm(r), ansNorm(readingToe(item))], answerText: readingToe(item), say: readingToe(item), exp: expOf(item)
    };
  },
  listenWord(w) {
    const ds = distract(3, prefer(POOL.words, w.u), x => x.h !== w.h && x.r !== w.r, x => x.h);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: w.k, item: w, title: '들리는 어휘를 한자로 고르시오', layout: 'grid2 hzopts', listen: w.r,
      prompt: `<div class="listen"><button class="spk big" data-say="${esc(w.r)}" aria-label="다시 듣기">${icon('speaker', 40)}</button><button class="spk slow" data-say="${esc(w.r)}" data-slow="1" aria-label="천천히 듣기">천천히</button></div>`,
      opts: shuffle([w, ...ds]).map(x => ({ v: x.h, html: `<span class="hz">${x.h}</span>`, d: `${x.r} · ${x.m}` })), ans: w.h, answerText: `${w.h} (${w.r})`, say: w.r, exp: expOf(w)
    };
  },
  sentEum(s) {
    const eums = s.c.map(eumOf), have = new Set(eums);
    const ds = distract(2, prefer(POOL.chars, s.u), x => !have.has(eumOf(x.hun)), x => eumOf(x.hun)).map(x => eumOf(x.hun));
    return {
      type: 'tiles', key: s.k, item: s, title: '문장의 독음을 순서대로 맞추시오', tcls: 'eum',
      prompt: `<div class="sentence">${hzHtml(s.h)}</div>`, tiles: shuffle([...eums, ...ds]), ans: eums, join: '',
      answerText: readingToe(s), say: readingToe(s), exp: expOf(s)
    };
  },
  sentTrans(s) {
    const tk = tokens(s), have = new Set(tk);
    const others = prefer(POOL.sents, s.u).filter(x => x !== s).flatMap(x => tokens(x).map(t => ({ t, u: x.u })));
    const ds = distract(3, others, x => !have.has(x.t), x => x.t).map(x => x.t);
    return {
      type: 'tiles', key: s.k, item: s, title: '문장을 풀이하시오', tcls: 'ko',
      prompt: `<div class="sentence">${hzHtml(s.h, { hints: s.c })}</div>${readLine(s)}`, tiles: shuffle([...tk, ...ds]), ans: tk, join: ' ',
      answerText: s.m, say: readingToe(s), exp: s.note || ''
    };
  },
  sentBuild(s) {
    const own = new Set(hzOf(s.h));
    const ds = distract(3, prefer(POOL.chars, s.u), x => !own.has(x.ch), x => x.ch).map(x => x.ch);
    return {
      type: 'tiles', key: s.k, item: s, title: '풀이에 맞게 한자를 배열하시오', tcls: 'hz',
      prompt: `<div class="bubble">${esc(s.m)}</div><div class="rd sub">${esc(readingToe(s))}</div>`,
      tiles: shuffle([...hzOf(s.h), ...ds]), ans: hzOf(s.h), join: '', answerText: s.h, say: readingToe(s), exp: s.m
    };
  },
  sentChoice(s) {
    const ds = distract(3, prefer(POOL.sents, s.u), x => x !== s && x.m !== s.m, x => x.m);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: s.k, item: s, title: '알맞은 풀이를 고르시오', layout: 'list',
      prompt: `<div class="sentence">${hzHtml(s.h, { hints: s.c })}</div>${readLine(s)}`,
      opts: shuffle([s, ...ds]).map(x => ({ v: x.m, html: esc(x.m), d: `${x.h}의 풀이` })), ans: s.m, answerText: s.m, say: readingToe(s), exp: s.note || ''
    };
  },
  ctxChar(s, idx) {
    const cs = charsOf(s);
    const i = idx != null ? idx : (s.focus ? pick(s.focus) : rnd(cs.length));
    const c = cs[i];
    const ds = distract(3, prefer(POOL.chars, s.u), x => x.ch !== c.ch && x.hun !== c.hun, x => x.hun);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: s.k, item: s, title: '표시한 한자의 훈과 음을 고르시오', layout: 'grid2',
      prompt: `<div class="sentence">${hzHtml(s.h, { mark: i })}</div>`,
      opts: shuffle([c, ...ds]).map(x => ({ v: x.hun, html: esc(x.hun), d: `${x.ch}의 훈음` })), ans: c.hun, answerText: `${c.ch} ${c.hun}`, say: c.hun, exp: expOf(s)
    };
  },
  order(s) {
    if (!s.ord) return null;
    const chunks = s.ord.map(o => o[0]), ans = [...s.ord].sort((a, b) => a[1] - b[1]).map(o => o[0]);
    return {
      type: 'tiles', key: s.k, item: s, title: '풀이하는 순서대로 한자를 누르시오', tcls: 'hz', ordered: true,
      prompt: `<div class="sentence">${hzHtml(s.h, { hints: s.c })}</div><div class="bubble small">${esc(s.m)}</div>`,
      tiles: shuffle(chunks), ans, join: ' → ', answerText: ans.join(' → '), say: readingToe(s), exp: s.m
    };
  },
  quiz(q) {
    if (q.t === 'short' || q.t === 'seq' || q.p) return X.exam(q);
    return {
      type: 'choice', key: q.k, item: q, title: q.q, layout: q.hz ? hzLayout([q.a, ...q.w]) : (q.w.length < 3 ? 'grid2' : 'list'), quiz: true,
      prompt: '', opts: shuffle([q.a, ...q.w]).map(v => ({ v, html: q.hz ? `<span class="hz">${esc(v)}</span>` : esc(v), d: describe(v) })),
      ans: q.a, answerText: q.a, say: '', exp: q.exp || ''
    };
  },
  exam(q) {
    // 문제 상자: 한자만 있으면 크게, 아니면 보기 상자로
    const onlyHz = q.p && hzOf(q.p).length === q.p.replace(/\s/g, '').length;
    const box = !q.p ? '' : onlyHz ? `<div class="bighz hz word">${esc(q.p)}</div>` : `<div class="qbox${q.p.length > 50 ? ' long' : ''}">${hzWrap(q.p)}</div>`;
    if (q.t === 'seq') {
      let tiles = shuffle(q.a), guard = 0;
      while (tiles.join() === q.a.join() && guard++ < 8) tiles = shuffle(q.a);
      return { type: 'tiles', key: q.k, item: q, title: q.q, tcls: 'ko', ordered: true, prompt: box, tiles, ans: q.a, join: ' → ', answerText: q.a.join(' → '), say: '', exp: q.exp || '' };
    }
    if (q.t === 'short') return {
      type: 'type', key: q.k, item: q, title: q.q, prompt: box,
      ans: [...new Set(q.a.flatMap(altAnswers))], answerText: q.a[0], say: onlyHz ? q.a[0] : '', exp: q.exp || ''
    };
    return {
      type: 'choice', key: q.k, item: q, title: q.q, layout: q.hz ? hzLayout([q.a, ...q.w]) : (q.w.length < 3 ? 'grid2' : 'list'),
      prompt: box,
      opts: shuffle([q.a, ...q.w]).map(v => ({ v, html: q.hz ? `<span class="hz">${esc(v)}</span>` : hzWrap(v), d: describe(v) })),
      ans: q.a, answerText: q.a, say: '', exp: q.exp || ''
    };
  },
  // 용어: 뜻 → 용어 고르기 / 용어 → 뜻 고르기 / 뜻 → 용어 쓰기
  termPick(x) {
    const ds = distract(3, prefer(TERMS.filter(y => itemSub(y) === itemSub(x)), x.u), y => y.t !== x.t, y => y.t);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: x.k, item: x, title: '설명에 알맞은 용어를 고르시오', layout: 'grid2', prompt: `<div class="qbox">${hzWrap(x.d)}</div>`,
      opts: shuffle([x, ...ds]).map(y => ({ v: y.t, html: hzWrap(y.t), d: y.d })), ans: x.t, answerText: x.t, say: '', exp: ''
    };
  },
  termDef(x) {
    const ds = distract(3, prefer(TERMS.filter(y => itemSub(y) === itemSub(x)), x.u), y => y.t !== x.t, y => y.t);
    if (ds.length < 3) return null;
    return {
      type: 'choice', key: x.k, item: x, title: `'${x.t}'의 뜻으로 알맞은 것은?`, layout: 'list', prompt: '',
      opts: shuffle([x, ...ds]).map(y => ({ v: y.d, html: hzWrap(y.d), d: `${y.t}의 뜻` })), ans: x.d, answerText: x.d, say: '', exp: ''
    };
  },
  termType(x) {
    return { type: 'type', key: x.k, item: x, title: '설명에 알맞은 용어를 쓰시오', prompt: `<div class="qbox">${hzWrap(x.d)}</div>`, ans: altAnswers(x.t), answerText: x.t, say: '', exp: '' };
  },
  cloze(z) {
    const ws = [z.a, ...z.w].map(h => WORDS[h]).filter(Boolean);
    return {
      type: 'choice', key: z.k, item: z, title: '빈칸에 알맞은 어휘를 고르시오', layout: 'grid2 hzopts',
      prompt: `<div class="cloze">${esc(z.s).replace('○', '<span class="blank"></span>')}</div>`,
      opts: shuffle([z.a, ...z.w]).map(v => ({ v, html: `<span class="hz">${v}</span>`, d: describe(v) })), ans: z.a,
      answerText: WORDS[z.a] ? `${z.a} (${WORDS[z.a].r})` : z.a, say: WORDS[z.a] ? WORDS[z.a].r : '',
      exp: z.exp || ws.map(w => `${w.h}(${w.r}): ${w.m}`).join(' / ')
    };
  },
};

const T = {   // 새로 배우는 카드
  word(w) {
    const cs = charsOf(w);
    return {
      type: 'teach', key: w.k, item: w, say: w.r, html: `<div class="tag">새 어휘</div>
      <div class="tchars">${cs.map(c => `<button class="tchar" data-say="${esc(c.hun)}"><span class="hz">${c.ch}</span><small>${esc(c.hun)}</small></button>`).join('')}</div>
      <button class="treading" data-say="${esc(w.r)}">${icon('speaker', 20)}<span>${esc(w.r)}</span></button>
      <div class="tmean">${w.lit ? `<span class="lit">겉뜻</span> ${esc(w.lit)}<br><span class="lit in">속뜻</span> ` : ''}${esc(w.m)}</div>
      ${w.ex ? `<div class="tex">${esc(w.ex).replace('○', `<b><span class="hz">${w.h}</span>(${esc(w.r)})</b>`)}</div>` : ''}`
    };
  },
  sent(s) {
    const cs = charsOf(s); let i = 0, cells = '', toe = '';
    const flush = () => { if (toe.trim()) cells += `<span class="rtoe">${esc(toe.trim())}</span>`; if (/\s$/.test(toe)) cells += '<span class="rgap"></span>'; toe = ''; };
    for (const ch of s.h) { if (isHz(ch)) { flush(); const c = cs[i++]; cells += `<button class="rcell" data-say="${esc(c.hun)}"><span class="hz">${ch}</span><small>${esc(c.hun)}</small></button>`; } else toe += ch; }
    flush();
    return {
      type: 'teach', key: s.k, item: s, say: readingToe(s), html: `<div class="tag">새 문장</div>
      ${s.ctx ? `<p class="tctx">${esc(s.ctx)}</p>` : ''}
      <div class="ruby">${cells}</div>
      <button class="treading" data-say="${esc(readingToe(s))}">${icon('speaker', 20)}<span>${esc(readingToe(s))}</span></button>
      <div class="tmean">${esc(s.m)}</div>
      ${s.note ? `<div class="tex">${esc(s.note)}</div>` : ''}${s.src ? `<div class="tsrc">${esc(s.src)}</div>` : ''}`
    };
  },
  chars(list) {
    return {
      type: 'teach', key: 't:' + list.map(c => c.ch).join(''), say: list.map(c => c.hun).join(', '), html: `<div class="tag">새 한자</div>
      <div class="tchars many">${list.map(c => `<button class="tchar" data-say="${esc(c.hun)}"><span class="hz">${c.ch}</span><small>${esc(c.hun)}</small></button>`).join('')}</div>
      <p class="thelp">글자를 누르면 훈음을 읽어 줍니다.</p>`
    };
  },
  terms(list) {
    return {
      type: 'teach', key: 'tt:' + list.map(x => x.t).join('|'), say: '', html: `<div class="tag note">${icon('book', 16)} 용어 더하기</div>
      <ul class="nlist terms">${list.map(x => `<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`).join('')}</ul>`
    };
  },
  note(n) {
    return {
      type: 'teach', key: n.k, say: '', html: `<div class="tag note">${icon('bulb', 16)} 핵심 정리</div>
      ${n.big ? `<div class="bighz hz">${n.big}</div>` : ''}<h3 class="ntitle">${esc(n.title)}</h3>
      ${n.body ? `<p class="nbody">${esc(n.body)}</p>` : ''}
      ${n.list ? `<ul class="nlist">${n.list.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>` : ''}
      ${n.ex ? `<div class="tex">${esc(n.ex)}</div>` : ''}`
    };
  },
};

function wordGens(w, mode) {
  const g = [() => X.wordMean(w), () => X.meanWord(w), () => X.buildWord(w)];
  if (w.ex) g.push(() => X.wordCloze(w));
  if (mode !== 'learn') g.push(() => X.typeEum(w), () => X.wordEum(w));
  if (tts.ready() && S.settings.tts) g.push(() => X.listenWord(w));
  return shuffle(g);
}
function sentGens(s, mode) {
  const g = [() => X.sentEum(s), () => X.ctxChar(s), () => X.sentBuild(s), () => X.sentChoice(s)];
  if (mode !== 'learn') { g.push(() => X.sentTrans(s)); if (hzOf(s.h).length <= 7) g.push(() => X.typeEum(s)); }
  const out = shuffle(g);
  if (s.ord) out.unshift(() => X.order(s));      // 풀이 순서가 있는 문장은 꼭 한 번 연습
  return out;
}
// 같은 문제인지 가리는 서명: 문제 종류 + 질문 + 문제 상자 + 정답 (보기 순서는 무시)
const exSig = e => [e.type, e.title, e.prompt, e.answerText].map(x => String(x || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).join('|');
// 앞에서 나온 문제와 서명이 같은 것은 빼고, 최대 n개까지
// 같은 내용을 묻는 문제인지 가리는 열쇠: 정답(보기 기호·O/X 같은 흔한 답은 빼고)과 긴 자료
const exNorm = x => String(x || '').replace(/<[^>]+>/g, '').replace(/[\s「」『』〈〉《》'"“”‘’.,·]/g, '');
function exKeys(e) {
  const ks = [], a = exNorm(e.answerText), pr = exNorm(e.prompt);
  if (a && !/^([ㄱ-ㅎ],?)+$|^[①-⑩]+$|^(O|X|○|×|있다|없다|옳다|옳지않다)$/.test(a)) ks.push('A:' + a);
  if (pr.length > 25) ks.push('P:' + pr);
  return ks;
}
// 앞에서 나온 문제와 서명이 같은 것은 빼고, 최대 n개까지
// limit: 정답·자료가 같은 문제를 몇 번까지 허용할지 (1이면 한 번만, 2면 두 번까지, 0이면 제한 없음)
function takeNew(list, seen, n = Infinity, limit = 0) {
  const out = [];
  for (const e of list) {
    if (out.length >= n) break;
    if (!e) continue;
    if (e.type !== 'teach') {
      const k = exSig(e); if (seen.has(k)) continue;
      const ks = exKeys(e);
      if (limit === 1 && ks.some(x => seen.has(x))) continue;
      if (limit === 2 && ks.some(x => seen.has(x + '#2'))) continue;
      seen.add(k); ks.forEach(x => seen.add(seen.has(x) ? x + '#2' : x));
    }
    out.push(e);
  }
  return out;
}
// 정답·자료가 같은 문제가 바로 이어지지 않게 순서 고르기
function spread(list) {
  const out = [], rest = list.slice();
  const clash = (a, b) => a && b && a.type !== 'teach' && b.type !== 'teach' && exKeys(a).some(k => exKeys(b).includes(k));
  while (rest.length) {
    const prev = out[out.length - 1];
    let i = rest.findIndex(e => !clash(prev, e));
    if (i < 0) i = 0;
    out.push(rest.splice(i, 1)[0]);
  }
  // 끝에 몰려 어쩔 수 없이 붙은 것은 앞쪽 빈자리로 옮기기 (맨 앞 문제는 그대로)
  for (let i = 1; i < out.length; i++) {
    if (!clash(out[i - 1], out[i])) continue;
    const [e] = out.splice(i, 1);
    let j = 1;
    for (; j <= out.length; j++) if (!clash(out[j - 1], e) && !clash(e, out[j])) break;
    out.splice(j <= out.length ? j : i, 0, e);
  }
  return out;
}
// 겹치지 않게 최대한 고르고, 모자라면 완전히 같은 문제만 빼고 채우기
function takeVaried(make, seen, n, fill = true) {
  const out = takeNew(make(n + 40), seen, n, 1);
  if (out.length < n) out.push(...takeNew(make(n + 40), seen, n - out.length, 2));
  if (fill && out.length < n) out.push(...takeNew(make(n + 40), seen, n - out.length));
  return out;
}
function roundRobin(groups, n) {
  const out = []; groups = groups.filter(g => g.length).map(g => [...g]);
  while (out.length < n && groups.some(g => g.length)) {
    for (const g of groups) { if (out.length >= n) break; while (g.length) { const e = g.shift()(); if (e) { out.push(e); break; } } }
  }
  return out;
}
const uniqChars = list => { const s = new Set; return list.filter(c => !s.has(c.k) && s.add(c.k)); };
const charGens = c => shuffle([() => X.pickHunum(c), () => X.pickHanja(c)]);
const charGensLearn = c => [() => X.pickHanja(c), () => X.pickHunum(c)];   // 앞에서 훈음 고르기를 했으니 한자 고르기부터
const termGens = x => shuffle([() => X.termPick(x), () => X.termDef(x), () => X.termType(x)]);

function resolve(L) {
  return {
    words: (L.words || []).map(h => WORDS[h]), sents: (L.sents || []).map(id => SENTS[id]),
    chars: (L.chars || []).map(([ch, hun]) => BYKEY['c:' + ch + '|' + hun]), notes: (L.notes || []).map(id => NOTES[id]),
    quiz: L.quiz || [], cloze: L.cloze || [], pairs: L.pairs || [], terms: (L.terms || []).map(([t]) => BYKEY['tm:' + t])
  };
}
function buildLearn(it) {
  const head = [], mixed = [];
  it.notes.forEach(n => head.push(T.note(n)));
  if (it.terms.length) head.push(T.terms(it.terms));
  if (it.chars.length) { head.push(T.chars(it.chars)); it.chars.forEach(c => head.push(X.pickHunum(c) || X.pickHanja(c))); }
  it.words.forEach(w => { head.push(T.word(w)); head.push(X.pickHunum(pick(charsOf(w)))); head.push(X.wordEum(w)); });
  it.sents.forEach(s => { head.push(T.sent(s)); head.push(X.sentTrans(s)); });
  it.pairs.forEach(p => mixed.push(X.pairs(p)));
  it.cloze.forEach(z => mixed.push(X.cloze(z)));
  it.quiz.forEach(q => mixed.push(X.quiz(q)));
  const all = uniqChars([...it.chars, ...it.words.flatMap(charsOf), ...it.sents.flatMap(charsOf)]);
  if (all.length >= 4 && !it.pairs.length) mixed.push(X.charMatch(all));
  const graded = head.filter(e => e && e.type !== 'teach').length + mixed.length;
  const groups = [...it.words.map(w => wordGens(w, 'learn')), ...it.sents.map(s => sentGens(s, 'learn')), ...it.chars.map(charGensLearn), ...it.terms.map(termGens)];
  // 문장이 하나뿐인 레슨도 충분히 연습하도록: 핵심 글자 훈음, 문장 속 한자 고르기를 덧붙인다
  it.sents.forEach(s => {
    groups.push((s.focus || []).map(i => () => X.ctxChar(s, i)));
    groups.push(shuffle(charsOf(s)).slice(0, 3).map(c => () => X.pickHanja(c)));
  });
  const target = Math.max(3, 13 - graded), seen = new Set();
  const headU = takeNew(head, seen), mixedU = takeNew(mixed, seen);
  mixedU.push(...takeVaried(k => roundRobin(groups, k), seen, target, false));
  const firstQ = headU.filter(e => e.type !== 'teach').pop();
  return [...headU, ...spread([firstQ, ...shuffle(mixedU)].filter(Boolean)).slice(firstQ ? 1 : 0)];
}
function buildMixed(it, n, mode, { quizN = 3, clozeN = 2 } = {}) {
  const fixed = [];
  it.terms = it.terms || [];
  // 한자 재료가 없는 과목(역사 등)은 문제 대부분을 레슨 문제에서 고른다
  if (!it.words.length && !it.sents.length && !it.chars.length) quizN = Math.max(quizN, n - 2 - Math.min(3, it.terms.length));
  shuffle(it.pairs).slice(0, 1).forEach(p => fixed.push(X.pairs(p)));
  const chars = uniqChars([...it.chars, ...it.words.flatMap(charsOf), ...it.sents.flatMap(charsOf)]);
  if (chars.length >= 4) fixed.push(X.charMatch(chars));
  shuffle(it.cloze).slice(0, clozeN).forEach(z => fixed.push(X.cloze(z)));
  shuffle(it.quiz).slice(0, quizN).forEach(q => fixed.push(X.quiz(q)));
  const groups = shuffle([...it.words.map(w => wordGens(w, mode)), ...it.sents.map(s => sentGens(s, mode)), ...shuffle(chars).slice(0, 6).map(charGens), ...it.terms.map(termGens)]);
  const seen = new Set(), fx = takeNew(fixed, seen, Infinity, 1), want = Math.max(4, n - fx.length);
  return spread(shuffle([...fx, ...takeVaried(k => roundRobin(groups, k), seen, want)]).slice(0, n));
}
function buildLesson(L) {
  if (L.exam) {
    const it = unitItems(L.exam); if (L.pairs) it.pairs = L.pairs.concat(it.pairs);
    return { mode: 'exam', ex: buildMixed(it, L.exam.length > 2 ? 25 : 20, 'review', { quizN: 5, clozeN: 2 }) };
  }
  if (L.review) return { mode: 'review', ex: buildMixed(unitItems([L.u.id]), 15, 'review') };
  return { mode: 'learn', ex: buildLearn(resolve(L)) };
}
function learnedItems() {
  const mine = subLessons(curSub().id).filter(L => !L.exam && !L.review);
  const done = mine.filter(L => S.done[L.id]);
  const use = done.length ? done : mine.filter(L => mine.length && L.u === mine[0].u);
  const uids = [...new Set(use.map(L => L.u.id))];
  const it = { words: [], sents: [], chars: [], quiz: [], cloze: [], pairs: [], terms: [] };
  use.forEach(L => {
    const r = resolve(L);
    ['words', 'sents', 'chars', 'quiz', 'cloze', 'pairs', 'terms'].forEach(f => it[f].push(...r[f]));
  });
  it.words = [...new Set(it.words)]; it.sents = [...new Set(it.sents)]; it.terms = [...new Set(it.terms)];
  return { it, uids };
}
function exFromKey(k) {
  const x = BYKEY[k]; if (!x) return null;
  if (x.kind === 'char') return pick([X.pickHunum, X.pickHanja])(x);
  if (x.kind === 'word') return pick([X.wordEum, X.wordMean, X.meanWord, X.buildWord, X.typeEum])(x) || X.wordEum(x);
  if (x.kind === 'sent') return pick([X.sentEum, X.sentTrans, X.ctxChar, X.sentBuild, X.order])(x) || X.sentTrans(x);
  if (x.kind === 'quiz') return X.quiz(x);
  if (x.kind === 'cloze') return X.cloze(x);
  if (x.kind === 'pairs') return X.pairs(x);
  if (x.kind === 'exam') return X.exam(x);
  if (x.kind === 'term') return pick([X.termPick, X.termDef, X.termType])(x) || X.termType(x);
  return null;
}
const PRACTICE = {
  mistakes() {
    const keys = Object.entries(S.wrong).filter(([k]) => BYKEY[k] && itemSub(BYKEY[k]) === curSub().id).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 12);
    const ex = keys.map(exFromKey).filter(Boolean);
    return shuffle(ex);
  },
  chars() {
    const { it } = learnedItems();
    const chars = shuffle(uniqChars([...it.chars, ...it.words.flatMap(charsOf), ...it.sents.flatMap(charsOf)]));
    const ex = [X.charMatch(chars.slice(0, 8))];
    chars.slice(0, 10).forEach(c => ex.push(pick([X.pickHunum, X.pickHanja])(c)));
    return shuffle(ex.filter(Boolean)).slice(0, 12);
  },
  words() { const { it } = learnedItems(); return buildMixed({ ...it, sents: [], quiz: [], pairs: [], chars: [] }, 12, 'review', { quizN: 0, clozeN: 2 }); },
  sents() {
    const { it } = learnedItems();
    if (!it.sents.length) return null;
    const gs = shuffle(it.sents).map(s => sentGens(s, 'review'));
    return takeVaried(k => roundRobin(gs, k), new Set(), 12);
  },
  mixed() { const { it } = learnedItems(); return buildMixed(it, 12, 'review', { quizN: 9, clozeN: 0 }); },
};

/* ════════ 레슨 진행 ════════ */
let LS = null, CUR = null;
const PRAISE = ['정답!', '맞았습니다', '좋습니다', '정확합니다', '맞습니다'];
const lessonEl = () => $('#lesson');

function startLesson(cfg) {
  const quiz = cfg.mode === 'quiz';
  if (!cfg.ex || !cfg.ex.length) { toast('연습할 문제가 아직 없습니다'); return; }
  LS = Object.assign({ i: 0, solved: 0, right: 0, wrong: 0, combo: 0, t0: Date.now(), missed: new Set(), log: [] }, cfg);
  LS.q = cfg.ex.slice(); LS.total = cfg.ex.length;
  const el = lessonEl();
  el.hidden = false; document.body.classList.add('in-lesson'); el.classList.toggle('quizmode', quiz);
  el.innerHTML = `<div class="lhead"><button class="iconbtn" id="lquit" aria-label="그만하기">${icon('x', 26)}</button>
    <div class="pbar" role="progressbar" aria-label="진행도"><i></i><span class="combo"></span></div>
    ${LS.limit ? `<div class="qtimer" aria-live="off">${fmtClock(LS.limit)}</div>` : ''}${quiz ? `<div class="qcount"><b>1</b>/${LS.total}</div>` : ''}</div>
    <div class="lbody"><div class="lin"></div></div><div class="lfoot"><div class="fb"></div><div class="fbtns"><button class="btn ghost" id="lskip">건너뛰기</button><button class="btn wide" id="lcheck" disabled>확인</button></div></div>
    <div class="tip" hidden></div>`;
  $('#lquit').onclick = () => confirmQuit();
  $('#lcheck').onclick = () => onMain();
  $('#lskip').onclick = () => quiz ? quizRecord(true) : skipEx();
  if (LS.limit) startTimer();
  renderEx();
}
function setProgress(anim) {
  const p = LS.solved / LS.total;
  $('.pbar i', lessonEl()).style.width = Math.max(3, p * 100) + '%';
  if (anim && LS.combo >= 3 && [3, 5, 8, 10, 15, 20].includes(LS.combo)) {
    const c = $('.pbar .combo', lessonEl()); c.textContent = `${LS.combo}연속 정답!`; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
  }
}
function footState(state, res) {
  const foot = $('.lfoot', lessonEl()), btn = $('#lcheck'), fb = $('.fb', foot);
  foot.className = 'lfoot' + (['ok', 'no', 'skip'].includes(state) ? ' ' + state : ''); fb.innerHTML = '';
  // 건너뛰기는 문제를 풀고 있을 때만 (배우기 카드, 채점 뒤에는 숨김)
  const skip = $('#lskip'); if (skip) skip.hidden = !['idle', 'ready', 'match'].includes(state);
  if (state === 'idle' || state === 'ready') {
    btn.textContent = LS.mode === 'quiz' ? (LS.i >= LS.q.length - 1 ? '제출하기' : '다음') : '확인';
    btn.disabled = state === 'idle'; btn.className = 'btn wide';
  }
  if (state === 'teach') { btn.textContent = '계속'; btn.disabled = false; btn.className = 'btn wide'; }
  if (state === 'match') { btn.textContent = '확인'; btn.disabled = true; btn.className = 'btn wide'; }
  if (state === 'ok' || state === 'no') {
    const ok = state === 'ok';
    fb.innerHTML = `<div class="fbhead">${icon(ok ? 'check' : 'x', 22, 'fbicon')}<b>${ok ? pick(PRAISE) : '틀렸습니다'}</b>
      ${CUR.say ? `<button class="spk mini" data-say="${esc(CUR.say)}" aria-label="읽어 주기">${icon('speaker', 18)}</button>` : ''}</div>
      ${ok ? '' : mineLine(mineInfo(CUR)) + `<div class="fbans"><span>정답</span> ${hzWrap(CUR.answerText)}</div>`}
      ${res && res.exp ? `<div class="fbexp">${hzWrap(res.exp)}</div>` : ''}`;
    btn.textContent = '계속'; btn.disabled = false; btn.className = 'btn wide ' + (ok ? '' : 'red');
  }
  if (state === 'skip') {
    fb.innerHTML = `<div class="fbhead">${icon('skip', 22, 'fbicon')}<b>건너뛰었습니다</b>
      ${CUR.say ? `<button class="spk mini" data-say="${esc(CUR.say)}" aria-label="읽어 주기">${icon('speaker', 18)}</button>` : ''}</div>
      <div class="fbans"><span>정답</span> ${hzWrap(CUR.answerText)}</div>
      ${res && res.exp ? `<div class="fbexp">${hzWrap(res.exp)}</div>` : ''}
      <div class="fbexp">이 문제는 레슨 끝에 다시 나옵니다.</div>`;
    btn.textContent = '계속'; btn.disabled = false; btn.className = 'btn wide sky';
  }
}
function renderEx() {
  CUR = LS.q[LS.i];
  hideTip();
  setProgress(false);
  const box = $('.lin', lessonEl());
  box.classList.remove('enter'); void box.offsetWidth; box.classList.add('enter');
  $('.lbody', lessonEl()).scrollTop = 0;
  CUR.state = { sel: null, picked: [], done: false };
  const qc = $('.qcount b', lessonEl()); if (qc) qc.textContent = LS.i + 1;
  const R = RENDER[CUR.type];
  box.innerHTML = R(CUR);
  if (CUR.type === 'teach') { footState('teach'); if (CUR.say) setTimeout(() => tts.say(CUR.say), 250); }
  else if (CUR.type === 'match') footState('match');
  else footState('idle');
  if (CUR.listen) setTimeout(() => tts.say(CUR.listen), 300);
  const inp = $('input.typein', box); if (inp) setTimeout(() => inp.focus(), 250);
}
const titleHtml = t => `<h2 class="extitle">${hzWrap(t)}</h2>`;
const RENDER = {
  teach: e => `<div class="teach">${e.html}</div>`,
  choice: e => `${titleHtml(e.title)}<div class="prompt">${e.prompt}</div>
    <div class="opts ${e.layout}">${e.opts.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span class="otext">${o.html}</span></button>`).join('')}</div>`,
  tiles: e => `${titleHtml(e.title)}<div class="prompt">${e.prompt}</div>
    <div class="answer ${e.tcls}${e.ordered ? ' ordered' : ''}" aria-label="답"></div>
    <div class="bank ${e.tcls}">${e.tiles.map((t, i) => `<button class="tile" data-i="${i}">${e.tcls === 'hz' ? `<span class="hz">${esc(t)}</span>` : esc(t)}</button>`).join('')}</div>`,
  type: e => `${titleHtml(e.title)}<div class="prompt">${e.prompt}</div>
    <input class="typein" type="text" lang="ko" inputmode="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="한글로 입력">`,
  match: e => {
    const L = shuffle(e.pairs.map((p, i) => ({ i, t: p[0] }))), R = shuffle(e.pairs.map((p, i) => ({ i, t: p[1] })));
    const cell = (x, side) => `<button class="mt ${e.hz[side] ? 'hzm' : ''}" data-side="${side}" data-i="${x.i}">${e.hz[side] ? `<span class="hz">${esc(x.t)}</span>` : esc(x.t)}</button>`;
    return `${titleHtml(e.title)}<div class="match"><div class="mcol">${L.map(x => cell(x, 0)).join('')}</div><div class="mcol">${R.map(x => cell(x, 1)).join('')}</div></div>`;
  },
};
// 레슨 화면의 모든 누름을 한곳에서 처리
function onLessonClick(ev) {
  const t = ev.target;
  const spk = t.closest('[data-say]'); if (spk) { tts.say(spk.dataset.say, !!spk.dataset.slow); if (spk.classList.contains('tchar') || spk.classList.contains('rcell')) { spk.classList.remove('pop'); void spk.offsetWidth; spk.classList.add('pop'); } return; }
  const retry = t.closest('[data-qretry]');
  if (retry && LS) {
    const ex = LS.log.filter(l => !l.ok).map(l => freshEx(l.e));
    closeLesson(); startLesson({ mode: 'practice', title: '퀴즈 오답 다시 풀기', ex }); return;
  }
  const hint = t.closest('.hc.hint'); if (hint && LS && LS.mode !== 'quiz') { showTip(hint); return; }
  hideTip();
  if (!CUR || CUR.state.done) return;
  const opt = t.closest('.opt');
  if (opt && CUR.type === 'choice') {
    sfx.tap(); $$('.opt', lessonEl()).forEach(o => o.classList.toggle('sel', o === opt));
    CUR.state.sel = +opt.dataset.i; footState('ready'); return;
  }
  const tile = t.closest('.tile');
  if (tile && CUR.type === 'tiles') {
    sfx.tap();
    const i = +tile.dataset.i, inAns = tile.parentElement.classList.contains('answer'), st = CUR.state;
    if (inAns) { st.picked = st.picked.filter(x => x !== i); }
    else if (!tile.classList.contains('used')) { st.picked.push(i); }
    drawTiles(); footState(st.picked.length ? 'ready' : 'idle'); return;
  }
  const mt = t.closest('.mt');
  if (mt && CUR.type === 'match' && !mt.classList.contains('ok')) matchTap(mt);
}
function drawTiles() {
  const box = lessonEl(), ans = $('.answer', box), st = CUR.state;
  $$('.bank .tile', box).forEach(b => b.classList.toggle('used', st.picked.includes(+b.dataset.i)));
  ans.innerHTML = st.picked.map(i => `<button class="tile in" data-i="${i}">${CUR.tcls === 'hz' ? `<span class="hz">${esc(CUR.tiles[i])}</span>` : esc(CUR.tiles[i])}</button>`).join('');
}
function matchTap(mt) {
  sfx.tap();
  const side = +mt.dataset.side, st = CUR.state;
  $$(`.mt[data-side="${side}"]`, lessonEl()).forEach(b => b.classList.toggle('sel', b === mt));
  st['s' + side] = mt;
  const a = st.s0, b = st.s1; if (!a || !b) return;
  st.s0 = st.s1 = null;
  if (a.dataset.i === b.dataset.i) {
    sfx.match(); buzz(15);
    [a, b].forEach(x => { x.classList.remove('sel'); x.classList.add('ok'); x.disabled = true; });
    const say = CUR.pairs[+a.dataset.i]; if (CUR.hz[1] === 0 && CUR.hz[0] === 1 && /\s/.test(say[1])) tts.say(say[1]);
    if ($$('.mt:not(.ok)', lessonEl()).length === 0) { st.done = true; setTimeout(() => finishEx(true, ''), 350); }
  } else {
    sfx.wrong(); buzz(60); st.miss = (st.miss || 0) + 1;
    [a, b].forEach(x => { x.classList.remove('sel'); x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); });
  }
}
function judge() {
  const e = CUR, st = e.state;
  if (e.type === 'choice') return e.opts[st.sel].v === e.ans;
  if (e.type === 'tiles') { const got = st.picked.map(i => e.tiles[i]); return got.length === e.ans.length && got.every((x, i) => x === e.ans[i]); }
  if (e.type === 'type') return e.ans.includes(ansNorm($('input.typein', lessonEl()).value));
  return true;
}
function onMain() {
  if (!LS || !CUR) return;
  const foot = $('.lfoot', lessonEl());
  if (foot.classList.contains('ok') || foot.classList.contains('no') || foot.classList.contains('skip')) return nextEx();
  if (CUR.type === 'teach') { LS.solved++; return nextEx(); }
  if (CUR.type === 'type' && !$('input.typein', lessonEl()).value.trim()) return;
  if (CUR.type === 'choice' && CUR.state.sel == null) return;
  if (CUR.type === 'tiles' && !CUR.state.picked.length) return;
  if (LS.mode === 'quiz') return quizRecord(false);
  finishEx(judge());
}
function finishEx(ok) {
  const e = CUR, st = e.state; st.done = true;
  const box = lessonEl();
  if (e.type === 'choice') $$('.opt', box).forEach(o => { const v = e.opts[+o.dataset.i].v; if (v === e.ans) o.classList.add('right'); else if (+o.dataset.i === st.sel) o.classList.add('wrong'); o.disabled = true; });
  if (e.type === 'tiles') { $('.answer', box).classList.add(ok ? 'right' : 'wrong'); $$('.tile', box).forEach(b => b.disabled = true); }
  if (e.type === 'type') { const inp = $('input.typein', box); inp.classList.add(ok ? 'right' : 'wrong'); inp.readOnly = true; inp.blur(); }
  if (ok) {
    LS.right++; LS.combo++; LS.solved++; sfx.right(); buzz(18);
    if (LS.mode === 'practice' && e.key && S.wrong[e.key] && !e.retry && !LS.missed.has(e.key)) { delete S.wrong[e.key]; LS.cleared = (LS.cleared || 0) + 1; }
  } else {
    LS.wrong++; LS.combo = 0; sfx.wrong(); buzz(90);
    // 'enter'를 먼저 빼야 흔들기가 끝난 뒤 들어오는 애니메이션이 다시 재생되지 않는다
    const lin = $('.lin', box); lin.classList.remove('enter'); lin.classList.add('shake'); setTimeout(() => lin.classList.remove('shake'), 400);
    if (e.key) { S.wrong[e.key] = (S.wrong[e.key] || 0) + 1; LS.missed.add(e.key); }
    const again = Object.assign({}, e, { retry: true });
    if (again.opts) again.opts = shuffle(again.opts);
    if (again.tiles) again.tiles = shuffle(again.tiles);
    LS.q.push(again);
  }
  save();
  setProgress(ok);
  footState(ok ? 'ok' : 'no', { exp: e.exp });
  if (e.say && e.type !== 'match') setTimeout(() => tts.say(e.say), ok ? 380 : 500);
}
// 모르는 문제 건너뛰기: 정답을 보여 주고, 레슨 끝에 다시 내고 오답 노트에 넣는다
function skipEx() {
  if (!LS || !CUR || CUR.state.done || CUR.type === 'teach') return;
  const e = CUR, box = lessonEl(); e.state.done = true;
  hideTip();
  if (e.type === 'choice') $$('.opt', box).forEach(o => { if (e.opts[+o.dataset.i].v === e.ans) o.classList.add('right'); o.disabled = true; });
  if (e.type === 'tiles') $$('.tile', box).forEach(b => b.disabled = true);
  if (e.type === 'type') { const inp = $('input.typein', box); inp.readOnly = true; inp.blur(); }
  if (e.type === 'match') $$('.mt', box).forEach(b => b.disabled = true);
  LS.wrong++; LS.combo = 0; LS.skipped = (LS.skipped || 0) + 1;
  if (e.key) { S.wrong[e.key] = (S.wrong[e.key] || 0) + 1; LS.missed.add(e.key); }
  LS.q.push(freshEx(e));
  save(); sfx.tap(); buzz(15);
  footState('skip', { exp: e.exp });
  if (e.say && e.type !== 'match') setTimeout(() => tts.say(e.say), 400);
}
function nextEx() {
  LS.i++;
  if (LS.i >= LS.q.length) finishLesson(); else renderEx();
}
function closeLesson() {
  stopTimer(); LS = null; CUR = null; hideTip(); closeModal();
  const el = lessonEl(); el.hidden = true; el.innerHTML = ''; document.body.classList.remove('in-lesson');
  renderTop(); show(TAB);
}
function confirmQuit() {
  modal(`<h3>정말 그만두시겠습니까?</h3><p>지금 그만두면 이번 레슨에서 푼 내용이 저장되지 않습니다.</p>
    <button class="btn wide" data-act="stay">계속 공부하기</button><button class="btn wide ghost danger" data-act="quit">그만두기</button>`,
    { stay: closeModal, quit: closeLesson });
}
// XP를 더하고 연속 학습일을 갱신: 오늘 첫 학습이면 first, 이번에 목표를 넘겼으면 wasGoal
function award(xp) {
  const t = today(), first = S.last !== t;
  if (first) { S.streak = S.last === addDays(t, -1) ? S.streak + 1 : 1; S.last = t; S.best = Math.max(S.best, S.streak); }
  S.xp += xp; S.days[t] = (S.days[t] || 0) + xp;
  const wasGoal = (S.days[t] - xp) < S.settings.goal && S.days[t] >= S.settings.goal;
  return { first, wasGoal };
}

/* ════════ 퀴즈 (시험처럼 풀고 마지막에 채점) ════════ */
function buildQuiz(uids, n) {
  const bank = shuffle(uids.flatMap(u => SU().exam[u] || [])).map(X.exam);
  const it = unitItems(uids);
  const gens = shuffle([
    ...it.words.map(w => shuffle([() => X.wordEum(w), () => X.typeEum(w), () => X.wordMean(w), () => X.meanWord(w), () => X.wordCloze(w)])),
    ...it.sents.map(s => shuffle([() => X.sentChoice(s), () => X.ctxChar(s), () => X.sentEum(s), () => X.sentBuild(s), ...(s.ord ? [() => X.order(s)] : [])])),
    ...it.terms.map(termGens), ...shuffle(it.quiz).map(q => [() => X.quiz(q)]),
  ]);
  const seen = new Set(), fromBank = takeNew(bank, seen, Math.round(n * 0.65), 1);
  const rest = takeVaried(k => roundRobin(gens, k), seen, n - fromBank.length);
  // 그래도 모자라면 남은 문제 은행에서
  if (fromBank.length + rest.length < n) rest.push(...takeNew(bank, seen, n - fromBank.length - rest.length));
  return spread(shuffle([...fromBank, ...rest]).slice(0, n));
}
function startQuiz(u, n) {
  const uids = u === 'all' ? SU().units.filter(x => SU().exam[x.id]).map(x => x.id) : [u];
  const unit = ALL_UNITS.find(x => x.id === u);
  startLesson({ mode: 'quiz', title: `${curSub().name} ${unit ? unit.no : '전체'} 퀴즈`, ex: buildQuiz(uids, n) });
}
function answerOf(e) {
  const st = e.state;
  if (e.type === 'choice') return st.sel == null ? '' : e.opts[st.sel].v;
  if (e.type === 'tiles') return st.picked.map(i => e.tiles[i]).join(e.join);
  if (e.type === 'type') return $('input.typein', lessonEl()).value.trim();
  return '';
}
// 내가 고른 답과, 그 답이 실제로 무엇인지(다른 한자의 훈음, 다른 어휘의 뜻 등)
function mineInfo(e) {
  let d = '';
  if (e.type === 'choice' && e.state.sel != null) { const o = e.opts[e.state.sel]; d = o.d != null ? o.d : describe(o.v); }
  return { mine: answerOf(e) || '(답하지 않음)', d };
}
const mineLine = (mi, cls = 'fbans mine') => `<div class="${cls}"><span>내 답</span> ${hzWrap(mi.mine)}${mi.d ? `<em>${hzWrap(mi.d)}</em>` : ''}</div>`;
// 보기 값이 무엇인지 찾아 설명: 설명 사전(GLOSS) → 어휘 독음·뜻 → 한자 훈음 → 문장 독음·풀이
function describe(v) {
  v = String(v).trim();
  if (typeof GLOSS !== 'undefined' && GLOSS[v]) return GLOSS[v];
  const w = WORDS[v]; if (w) return `${w.r} · ${w.m}`;
  if (v.length === 1 && isHz(v)) { const c = POOL.chars.find(x => x.ch === v); return c ? c.hun : ''; }
  const s = POOL.sents.find(x => hzOf(x.h).join('') === v); if (s) return `${reading(s)} · ${s.m}`;
  return '';
}
function freshEx(e) {
  const c = Object.assign({}, e, { retry: false });
  if (c.opts) c.opts = shuffle(c.opts);
  if (c.tiles) c.tiles = shuffle(c.tiles);
  return c;
}
// 퀴즈에서는 정답을 바로 알려 주지 않고 기록만 한다
function quizRecord(skip) {
  if (!LS || !CUR || CUR.state.done) return;
  const e = CUR; e.state.done = true;
  const ok = !skip && judge();
  const mi = skip ? { mine: '(건너뜀)', d: '' } : mineInfo(e);
  LS.log.push({ e, ok, mine: mi.mine, d: mi.d });
  if (ok) LS.right++; else { LS.wrong++; if (e.key) S.wrong[e.key] = (S.wrong[e.key] || 0) + 1; }
  LS.solved++; save(); sfx.tap(); buzz(10);
  LS.i++;
  if (LS.i >= LS.q.length) finishQuiz(); else renderEx();
}
function qReview(l, i) {
  const e = l.e;
  return `<div class="qr ${l.ok ? 'ok' : 'no'}">
    <div class="qrh"><span class="qmark">${l.ok ? '○' : '✕'}</span><span class="qno">${i + 1}.</span><b>${hzWrap(e.title)}</b></div>
    ${e.prompt ? `<div class="qrp">${e.prompt}</div>` : ''}
    ${mineLine({ mine: l.mine || '(답하지 않음)', d: l.ok ? '' : l.d }, 'qra')}
    ${l.ok ? '' : `<div class="qra right"><span>정답</span>${hzWrap(e.answerText)}</div>`}
    ${e.exp ? `<div class="qre">${hzWrap(e.exp)}</div>` : ''}</div>`;
}
function finishQuiz() {
  stopTimer();
  const n = LS.log.length, right = LS.log.filter(l => l.ok).length, score = Math.round(right / n * 100);
  const xp = 5 + Math.round(score / 10) + (score === 100 ? 5 : 0);
  const { first, wasGoal } = award(xp);
  S.quiz = [{ d: today(), r: LS.title, n, s: score }, ...(S.quiz || [])].slice(0, 30);
  if (LS.mockId) { S.mock = S.mock || {}; const m = S.mock[LS.mockId] || { best: 0, n: 0 }; S.mock[LS.mockId] = { best: Math.max(m.best, score), n: m.n + 1, last: score }; }
  save();
  sfx.done(); buzz(40);
  CUR = null;
  const msg = score === 100 ? '만점' : score >= 90 ? '거의 다 맞혔습니다' : score >= 70 ? '꽤 맞혔습니다' : score >= 50 ? '절반은 넘었습니다' : '요약을 한 번 더 보고 풀어 보십시오';
  const wrongN = n - right;
  $('.lhead', lessonEl()).classList.add('dim');
  $('.lin', lessonEl()).innerHTML = `<div class="qres">
    <div class="qtop"><div class="qscore" style="--p:${score}"><div class="qsin"><b>${score}</b><small>점</small></div>
      ${score >= 90 ? '<div class="seal"><span>참</span><span>잘</span><span>했</span><span>어</span><span>요</span></div>' : ''}</div></div>
    <h2>${msg}</h2><p class="dsub">${esc(LS.title)} · ${n}문제 중 ${right}문제 정답 · +${xp} XP</p>
    ${LS.mockId ? `<p class="mocktime">${LS.timeUp ? '시간이 다 되어 남은 문제는 틀린 것으로 채점했습니다' : `걸린 시간 ${fmtClock(Math.round((Date.now() - LS.t0) / 1000))} / ${LS.limit / 60}분`}</p>` : ''}
    ${wrongN ? `<button class="btn wide red" data-qretry>${icon('refresh', 20)} 틀린 ${wrongN}문제 다시 풀기</button>` : ''}
    <h3 class="sect">문제 다시 보기</h3>
    <div class="qlist">${LS.log.map(qReview).join('')}</div></div>`;
  if (score >= 90 && !reduceMotion()) confetti();
  if (score >= 90) setTimeout(() => sfx.stamp(), 520);
  const foot = $('.lfoot', lessonEl()); foot.className = 'lfoot'; $('.fb', foot).innerHTML = '';
  const skip = $('#lskip'); if (skip) skip.hidden = true;
  const btn = $('#lcheck'); btn.disabled = false; btn.className = 'btn wide'; btn.textContent = '완료';
  btn.onclick = () => { if (first) streakScreen(wasGoal); else closeLesson(); };
}

function finishLesson() {
  const secs = Math.round((Date.now() - LS.t0) / 1000);
  const acc = LS.right + LS.wrong ? Math.round(LS.right / (LS.right + LS.wrong) * 100) : 100;
  const perfect = LS.wrong === 0;
  let xp = LS.mode === 'exam' ? 20 : LS.mode === 'review' ? 15 : LS.mode === 'practice' ? 8 : 10;
  if (perfect) xp += 5;
  const { first, wasGoal } = award(xp);
  if (LS.lesson) { const d = S.done[LS.lesson.id] || { n: 0, best: 0 }; d.n++; d.best = Math.max(d.best, acc); S.done[LS.lesson.id] = d; }
  save();
  sfx.done(); buzz(40);
  const title = perfect ? '하나도 안 틀렸습니다' : LS.mode === 'exam' ? '평가 끝' : LS.mode === 'review' ? '단원 복습 끝' : LS.mode === 'practice' ? '복습 끝' : '레슨 끝';
  const box = $('.lin', lessonEl());
  $('.lhead', lessonEl()).classList.add('dim');
  box.innerHTML = `<div class="done">
    <div class="seal big"><span>참</span><span>잘</span><span>했</span><span>어</span><span>요</span></div>
    <h2>${title}</h2><p class="dsub">${LS.title ? esc(LS.title) : ''}</p>
    ${LS.kind === 'mistakes' ? `<p class="dsub">오답 노트에서 ${LS.cleared || 0}문제를 지웠습니다 · 남은 오답 ${Object.keys(S.wrong).filter(k => BYKEY[k] && itemSub(BYKEY[k]) === curSub().id).length}문제${LS.missed.size ? ' (이번에 틀린 문제는 남겨 두었습니다)' : ''}</p>` : ''}
    <div class="dstats"><div class="ds gold"><small>획득 XP</small><b>${icon('bolt', 20)} ${xp}</b></div>
    <div class="ds jade"><small>정확도</small><b>${icon('target', 20)} ${acc}%</b></div>
    <div class="ds sky"><small>걸린 시간</small><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b></div></div>
    ${LS.missed.size ? `<p class="dnote">${LS.skipped ? '틀리거나 건너뛴' : '틀린'} ${LS.missed.size}개는 <b>복습 → 오답 노트</b>에 모아 두었습니다.</p>` : ''}</div>`;
  if (!reduceMotion()) confetti();
  setTimeout(() => sfx.stamp(), 520);
  const foot = $('.lfoot', lessonEl()); foot.className = 'lfoot';
  $('.fb', foot).innerHTML = '';
  $('#lskip').hidden = true;
  const btn = $('#lcheck'); btn.disabled = false; btn.className = 'btn wide'; btn.textContent = '계속';
  CUR = null;
  btn.onclick = () => { if (first) streakScreen(wasGoal); else { closeLesson(); afterLesson(); } };
}
function streakScreen(goal) {
  const t = today(), box = $('.lin', lessonEl());
  const week = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  box.innerHTML = `<div class="streak">
    <div class="sflame">${icon('flame', 120)}<b>${S.streak}</b></div>
    <h2>${S.streak}일 연속 학습</h2>
    <div class="week">${week.map(k => { const d = new Date(k.replace(/-/g, '/')); return `<div class="wday ${S.days[k] ? 'on' : ''} ${k === t ? 'today' : ''}"><small>${wd[d.getDay()]}</small><i>${S.days[k] ? icon('check', 16) : ''}</i></div>`; }).join('')}</div>
    <p class="motto">내일도 하면 <b>${S.streak + 1}일 연속</b>입니다.${goal ? '<br>오늘 목표 XP도 채웠습니다.' : ''}</p></div>`;
  sfx.done();
  $('#lcheck').onclick = () => { closeLesson(); afterLesson(); };
}
function afterLesson() { if (TAB === 'learn') scrollToCurrent(true); }
function startPractice(kind) {
  const ex = PRACTICE[kind]();
  if (!ex || !ex.length) { toast(kind === 'mistakes' ? '오답 노트가 비어 있습니다' : '레슨을 하나 끝내면 열립니다'); return; }
  const titles = { mistakes: '오답 노트 복습', chars: '한자 훈음 연습', words: '어휘 연습', sents: '문장 연습' };
  startLesson({ mode: 'practice', kind, title: titles[kind], ex });
}
function startNode(L) {
  const b = buildLesson(L);
  startLesson({ mode: b.mode, ex: b.ex, lesson: L, title: `${L.u.no} · ${L.t}` });
}

/* ════════ 힌트 말풍선 ════════ */
function showTip(el) {
  const tip = $('.tip', lessonEl()); if (!tip) return;
  tip.textContent = el.dataset.hint; tip.hidden = false;
  const r = el.getBoundingClientRect(), host = lessonEl().getBoundingClientRect();
  const w = tip.offsetWidth;
  tip.style.left = Math.min(host.width - w - 8, Math.max(8, r.left - host.left + r.width / 2 - w / 2)) + 'px';
  tip.style.top = (r.bottom - host.top + 6) + 'px';
  tts.say(el.dataset.hint);
}
function hideTip() { const tip = $('.tip', lessonEl()); if (tip) tip.hidden = true; }

/* ════════ 모달 · 토스트 · 축하 ════════ */
let MODAL_ACT = null;
function modal(html, acts) {
  const m = $('#modal'); m.hidden = false; m.innerHTML = `<div class="mcard" role="dialog" aria-modal="true">${html}</div>`;
  MODAL_ACT = acts || {};
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; MODAL_ACT = null; }
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2000); setTimeout(() => t.remove(), 2400);
}
function confetti() {
  const host = document.createElement('div'); host.className = 'confetti';
  const cols = ['#21A46B', '#2D8CE8', '#F0644F', '#F5B800', '#8B63E6', '#FF8FA3'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i');
    p.style.left = rnd(100) + '%'; p.style.background = pick(cols);
    p.style.animationDelay = (Math.random() * .5) + 's'; p.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
    p.style.setProperty('--dx', (rnd(160) - 80) + 'px'); p.style.setProperty('--r', (rnd(720) - 360) + 'deg');
    host.appendChild(p);
  }
  lessonEl().appendChild(host); setTimeout(() => host.remove(), 3200);
}

/* ════════ 상단 막대 · 과목 탭 ════════ */
// 예전에 고른 과목이 목록에서 빠졌으면 한문으로
const curSub = () => SUBJECTS.find(s => s.id === S.subject) || SUBJECTS.find(s => s.id === 'hanmun') || SUBJECTS[0];
const subMark = s => `<span class="smk${isHz(s.mark) ? ' hz' : ''}">${esc(s.mark)}</span>`;
function renderTop() {
  const st = streakNow(), cur = curSub();
  const top = $('#top');
  top.innerHTML = `<div class="toprow"><div class="brand"><span class="brandname">오티링고</span></div>
    <button class="stat flame ${st ? '' : 'off'}" data-go="profile" aria-label="연속 학습 ${st}일">${icon('flame', 24)}<b>${st}</b></button>
    <button class="stat xp" data-go="profile" aria-label="총 ${S.xp} XP">${icon('bolt', 24)}<b>${S.xp}</b></button></div>
    ${TAB === 'profile' || TAB === 'exam' ? '' : `<div class="subjects" role="tablist" aria-label="과목">${SUBJECTS.map(s => `<button role="tab" aria-selected="${s === cur}"
      class="subj c-${s.color}${s === cur ? ' on' : ''}${s.ready ? '' : ' soon'}" data-subj="${s.id}">${subMark(s)}${esc(s.name)}</button>`).join('')}</div>`}`;
  const on = $('.subj.on', top); if (on) on.parentElement.scrollLeft = on.offsetLeft - 60;
  document.documentElement.style.setProperty('--toph', top.offsetHeight + 'px');
}
// 아직 내용이 없는 과목: 탭만 열어 두고 '준비 중' 화면
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b; };
function renderSoon(sub, tab) {
  const what = { learn: '레슨', quiz: '퀴즈', notes: '요약', review: '복습' }[tab] || '내용';
  return `<div class="page soonpage c-${sub.color}">${tab === 'learn' ? examBanner() : ''}
    <div class="soonmark${isHz(sub.mark) ? ' hz' : ''}">${esc(sub.mark)}</div>
    <h1>${esc(sub.name)}</h1><span class="soonbadge">준비 중</span>
    <p class="soontxt">${esc(sub.name)} ${what}${josa(what, '은', '는')} 공부할 내용이 들어오면 여기에서 열립니다.</p>
    ${examRange(sub.id, true)}
    ${tab === 'learn' ? `<div class="soonpath">${[0, 1, 2, 3, 4].map(i => `<div class="nrow" style="--x:${Math.round(Math.sin(i * 0.95) * 64)}px"><span class="node locked">${icon('lock', 30)}</span></div>`).join('')}</div>`
      : ''}
    <button class="btn wide ghost" data-subj="hanmun">한문 공부하러 가기</button>
  </div>`;
}

/* ════════ 시험 시간표 · 범위 (exams.js) ════════ */
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const keyDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const daysUntil = k => Math.round((keyDate(k) - keyDate(today())) / 86400000);
const dateLabel = k => { const d = keyDate(k); return `${d.getMonth() + 1}월 ${d.getDate()}일(${WD[d.getDay()]})`; };
const ddLabel = k => { const n = daysUntil(k); return n > 0 ? `D-${n}` : n === 0 ? 'D-day' : '끝'; };
const examOn = () => typeof EXAM_INFO !== 'undefined' && EXAM_INFO.days.length && daysUntil(EXAM_INFO.days[EXAM_INFO.days.length - 1].date) >= 0;
const examSubs = d => d.slots.filter(s => s[1]).map(s => EXAM_INFO.subjects[s[1]].name);
// 과목이 언제 시험인지: "12월 3일(목) 3교시"
function examWhen(id) {
  for (const d of EXAM_INFO.days) { const s = d.slots.find(x => x[1] === id); if (s) return { date: d.date, period: s[0] }; }
  return null;
}
// 학습 화면 맨 위의 D-day 카드 (시험이 끝나면 사라짐)
function examBanner() {
  if (!examOn()) return '';
  const first = EXAM_INFO.days[0], n = daysUntil(first.date);
  const todayDay = EXAM_INFO.days.find(d => daysUntil(d.date) === 0);
  const nextDay = EXAM_INFO.days.find(d => daysUntil(d.date) >= 0);
  const big = n > 0 ? `D-${n}` : '시험 중';
  const sub = todayDay ? `오늘: ${examSubs(todayDay).join(' · ')}` : n > 0 ? `${dateLabel(first.date)} ${examSubs(first).join(' · ')}부터` : `다음: ${dateLabel(nextDay.date)} ${examSubs(nextDay).join(' · ')}`;
  return `<button class="xbanner" data-go="exam"><span class="xbd">${big}</span><span class="xbt"><b>${esc(EXAM_INFO.title)}</b><small>${esc(sub)}</small></span><span class="xbgo">시간표 · 범위 ›</span></button>`;
}
// 과목 하나의 시험 범위 카드
function examRange(id, compact) {
  if (typeof EXAM_INFO === 'undefined') return '';
  const x = EXAM_INFO.subjects[id]; if (!x) return '';
  const w = examWhen(id);
  return `<div class="xsub c-${x.color}${compact ? ' compact' : ''}" id="xr-${id}">
    <div class="xsh"><span class="smk${isHz(x.mark) ? ' hz' : ''}">${esc(x.mark)}</span><b>${compact ? '시험 범위' : esc(x.name)}</b>
      ${w ? `<span class="xwhen">${dateLabel(w.date)} ${w.period}교시</span>` : ''}</div>
    <ul>${x.range.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    <p class="xmat">${icon('book', 16)} ${esc(x.material)}</p>
    ${x.tip ? `<p class="xtip">${esc(x.tip)}</p>` : ''}
    ${!compact && SUBJECTS.some(s => s.id === id && s.ready) ? `<button class="btn ghost xquiz" data-xquiz="${id}">${icon('quiz', 18)} ${esc(x.name)} 퀴즈 풀기 (20문제)</button>` : ''}
  </div>`;
}
function renderExam() {
  const E = EXAM_INFO, first = E.days[0].date, last = E.days[E.days.length - 1].date, n = daysUntil(first);
  const order = E.days.flatMap(d => d.slots.filter(s => s[1]).map(s => s[1]));
  return `<div class="page exam">
    <button class="backlink" data-go="learn">‹ 학습으로</button>
    <div class="xhero"><div><h1>${esc(E.title)}</h1><p>${esc(E.grade)} · ${dateLabel(first)} ~ ${dateLabel(last)}</p></div>
      <span class="xheroD">${daysUntil(last) < 0 ? '끝' : n > 0 ? `D-${n}` : '시험 중'}</span></div>
    <h2 class="sect">시험 시간표</h2>
    ${E.days.map(d => {
      const dn = daysUntil(d.date);
      return `<div class="xday${dn === 0 ? ' today' : dn < 0 ? ' past' : ''}"><div class="xdh"><b>${dateLabel(d.date)}</b><span>${ddLabel(d.date)}</span></div>
      ${d.slots.map(([p, id]) => { const x = id && E.subjects[id], pr = E.periods[p];
        return `<${x ? `button data-xr="${id}"` : 'div'} class="xslot${x ? ` c-${x.color}` : ' rest'}"><span class="xper">${p}교시</span><span class="xtime">${pr.time}${x ? `<small>입실 ${pr.enter}</small>` : ''}</span>
          <span class="xsj">${x ? `<span class="smk${isHz(x.mark) ? ' hz' : ''}">${esc(x.mark)}</span>${esc(x.name)}` : '교과수업'}</span></${x ? 'button' : 'div'}>`; }).join('')}
      </div>`; }).join('')}
    <p class="xnote">${esc(E.note)}</p>
    <h2 class="sect">시험 범위</h2>
    ${order.map(id => examRange(id)).join('')}
    <h2 class="sect">시험 끝난 뒤</h2>
    <div class="xafter">${E.after.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>
  </div>`;
}

/* ════════ 학습(길) 화면 ════════ */
let TAB = 'learn';
function lessonState(L) {
  if (S.done[L.id]) return 'done';
  if (S.settings.all) return 'open';
  const mine = subLessons(L.sub), first = mine.find(x => !S.done[x.id]);
  return L === first ? 'current' : mine.indexOf(L) < mine.indexOf(first) ? 'open' : 'locked';
}
function renderLearn() {
  const goal = S.settings.goal, tx = todayXp(), pct = Math.min(100, Math.round(tx / goal * 100));
  let html = examBanner() + `<div class="goalcard"><div class="gtxt"><b>오늘의 목표</b><span>${tx} / ${goal} XP</span></div><div class="gbar"><i style="width:${pct}%"></i></div>${pct >= 100 ? `<span class="gdone">${icon('check', 16)} 달성</span>` : ''}</div>`;
  SU().units.forEach((u, ui) => {
    html += `<section class="unit c-${u.color}" id="${u.id}">
      <header class="uhead"><div><small>${esc(u.no)}</small><h2>${esc(u.title)}</h2><p>${esc(u.sub)}</p></div>
      <button class="unote" data-notes="${u.id}" aria-label="${esc(u.no)} 요약 보기">${icon('book', 22)}<span>요약</span></button></header><div class="path">`;
    u.lessons.forEach((L, li) => {
      const idx = LESSONS.indexOf(L), st = lessonState(L), x = Math.round(Math.sin(li * 0.95 + (ui % 2 ? Math.PI : 0)) * 74);
      const ic = L.exam ? 'crown' : L.review ? 'trophy' : st === 'done' ? 'check' : st === 'locked' ? 'lock' : 'star';
      html += `<div class="nrow" style="--x:${x}px">
        <button class="node ${st}${L.review || L.exam ? ' big' : ''}" data-l="${idx}" aria-label="${esc(L.t)} ${st === 'done' ? '완료' : st === 'locked' ? '잠김' : ''}">
        ${st === 'current' ? '<span class="startbub">시작!</span><span class="ring"></span>' : ''}${icon(ic, L.review || L.exam ? 36 : 32)}</button></div>`;
    });
    html += `</div></section>`;
  });
  const all = subLessons(curSub().id).every(L => S.done[L.id]);
  html += `<p class="pathend"><span>${all ? '레슨을 다 끝냈습니다. 시험 전에는 복습 탭에서 오답 노트를 풀어 보십시오.' : '여기까지가 마지막 레슨입니다.'}</span></p>`;
  return html;
}
function nodePop(btn) {
  closePop();
  const L = LESSONS[+btn.dataset.l], st = lessonState(L), u = L.u;
  const n = u.lessons.filter(x => !x.review && !x.exam).length;
  const pos = L.review ? '단원 복습' : L.exam ? '종합 평가' : `레슨 ${L.idx + 1} / ${n}`;
  const d = S.done[L.id];
  const pop = document.createElement('div');
  pop.className = `npop c-${u.color} ${st}`;
  pop.innerHTML = `<b class="ptitle">${esc(L.t)}</b><span class="ppos">${pos}${d ? ` · ${d.n}번 완료 · 최고 ${d.best}%` : ''}</span>
    ${st === 'locked' ? '<p class="plock">앞의 레슨을 끝내면 열립니다.</p>' : `<button class="btn wide pgo" data-start="${btn.dataset.l}">${st === 'done' ? '다시 하기' : '시작하기'} <small>+${L.exam ? 20 : L.review ? 15 : 10} XP</small></button>`}`;
  btn.parentElement.appendChild(pop); btn.parentElement.classList.add('open');
  requestAnimationFrame(() => pop.classList.add('show'));
}
function closePop() { $$('.npop').forEach(p => { p.parentElement.classList.remove('open'); p.remove(); }); }
function scrollToCurrent(smooth) {
  const n = $('.node.current') || $$('.node.done').pop();
  if (n) { const r = n.getBoundingClientRect(); window.scrollTo({ top: window.scrollY + r.top - innerHeight * 0.42, behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' }); }
}

/* ════════ 복습 화면 ════════ */
function renderReview() {
  const sid = curSub().id, wrongN = Object.keys(S.wrong).filter(k => BYKEY[k] && itemSub(BYKEY[k]) === sid).length;
  const exams = SU().units.flatMap(u => u.lessons).filter(L => L.exam);
  const { it } = learnedItems();
  const charN = uniqChars([...it.chars, ...it.words.flatMap(charsOf), ...it.sents.flatMap(charsOf)]).length;
  const card = (k, ic, c, t, d, dis) => `<button class="rcard c-${c}" data-practice="${k}" ${dis ? 'disabled' : ''}><span class="ricon">${icon(ic, 28)}</span><span class="rtxt"><b>${t}</b><small>${d}</small></span></button>`;
  return `<div class="page"><h1 class="ptitle">복습</h1><p class="plead">틀린 문제와 배운 내용을 다시 풀 수 있습니다.</p>
    ${card('mistakes', 'refresh', 'coral', '오답 노트', wrongN ? `틀렸던 문제 ${wrongN}개 다시 풀기` : '아직 틀린 문제가 없습니다', !wrongN)}
    ${sid === 'hanmun' ? `${card('chars', 'star', 'jade', '한자 훈음 연습', `배운 한자 ${charN}자에서 골라 풀기`)}
    ${card('words', 'book', 'violet', '어휘 연습', `독음 · 뜻 · 빈칸 채우기`)}
    ${card('sents', 'bulb', 'sky', '문장 연습', it.sents.length ? `독음 · 풀이 · 풀이 순서` : '문장 레슨을 끝내면 열립니다', !it.sents.length)}`
      : card('mixed', 'bulb', 'sky', '개념 문제 연습', `배운 레슨에서 문제 · 용어 · 순서 맞추기를 골라 풀기`)}
    ${exams.length ? `<h2 class="sect">${icon('crown', 22)} 시험 대비</h2>` : ''}
    ${exams.map((L) => `<button class="rcard c-ink" data-lesson="${L.id}"><span class="ricon">${icon('crown', 26)}</span><span class="rtxt"><b>${esc(L.t)}</b><small>${L.exam.map(id => ALL_UNITS.find(u => u.id === id).no).join(' · ')} · ${L.exam.length > 2 ? 25 : 20}문제${S.done[L.id] ? ` · 최고 ${S.done[L.id].best}%` : ''}</small></span></button>`).join('')}
  </div>`;
}

/* ════════ 퀴즈 화면 ════════ */
let QUIZ_U = 'all', QUIZ_N = 10;
function renderQuiz() {
  const qunits = SU().units.filter(u => SU().exam[u.id]);
  const chips = [['all', '전체'], ...qunits.map(u => [u.id, u.no])];
  const sel = qunits.find(u => u.id === QUIZ_U);
  const hist = (S.quiz || []).slice(0, 8);
  const best = (S.quiz || []).length ? Math.max(...S.quiz.map(h => h.s)) : null;
  return `<div class="page quiz"><h1 class="ptitle">퀴즈</h1>
    <p class="plead">시험처럼 끝까지 푼 다음 한 번에 채점합니다. 틀린 문제는 오답 노트에 모입니다.</p>
    ${typeof battleCard === 'function' ? battleCard() : ''}
    ${mockCards()}
    <h2 class="sect">연습 퀴즈 범위</h2>
    <div class="chips wrap">${chips.map(([id, t]) => `<button class="chip ${QUIZ_U === id ? 'on' : ''}" data-qu="${id}">${t}</button>`).join('')}</div>
    <p class="qrange">${sel ? `${esc(sel.no)} · ${esc(sel.title)}` : `${esc(curSub().name)} ${qunits.length}개 단원 전체에서 골고루`}</p>
    <h2 class="sect">문항 수</h2>
    <div class="goals">${[10, 20, 30].map(n => `<button class="chip ${QUIZ_N === n ? 'on' : ''}" data-qn="${n}">${n}문제<small>약 ${n / 2}분</small></button>`).join('')}</div>
    <button class="btn wide qstart" data-qstart="1">${icon('quiz', 22)} 퀴즈 시작</button>
    <h2 class="sect">최근 기록${best != null ? `<span class="qbest">최고 ${best}점</span>` : ''}</h2>
    ${hist.length ? `<div class="qhist">${hist.map(h => `<div class="qh"><span class="qhs ${h.s >= 90 ? 'hi' : h.s >= 70 ? 'mid' : 'lo'}">${h.s}</span>
      <span class="qht"><b>${esc(h.r)}</b><small>${h.d.slice(5).replace('-', '월 ')}일 · ${h.n}문제</small></span></div>`).join('')}</div>`
      : `<p class="empty">아직 푼 퀴즈가 없습니다.</p>`}
  </div>`;
}

function mockCards() {
  const ms = SU().mock || [];
  if (!ms.length) return '';
  return `<h2 class="sect">모의고사</h2><p class="mocklead">학교 시험처럼 정해진 ${ms[0].items.length}문항을 ${ms[0].min}분 안에 풉니다. 문항당 ${Math.round(100 / ms[0].items.length)}점.</p>
    <div class="mocks">${ms.map((m, i) => { const r = (S.mock || {})[m.id];
      return `<button class="mock" data-mock="${i}"><span class="mno">${esc(m.t)}</span>
        <span class="mtx"><b>${esc(curSub().name)} 모의고사 ${esc(m.t)}</b><small>${m.items.length}문항 · ${m.min}분${r ? ` · ${r.n}번 풂` : ''}</small></span>
        ${r ? `<span class="mbest ${r.best >= 90 ? 'hi' : r.best >= 70 ? 'mid' : 'lo'}">${r.best}<small>점</small></span>` : `<span class="mgo">${icon('quiz', 20)}</span>`}</button>`; }).join('')}</div>`;
}
function startMock(i) {
  const m = SU().mock[i];
  modal(`<h3>${esc(curSub().name)} 모의고사 ${esc(m.t)}</h3><p>${m.items.length}문항 · 제한 시간 ${m.min}분입니다. 시간이 다 되면 남은 문제는 틀린 것으로 채점합니다.</p>
    <button class="btn wide" data-act="go">시작하기</button><button class="btn wide ghost" data-act="no">다음에</button>`,
    { go: () => { closeModal(); startLesson({ mode: 'quiz', mockId: m.id, limit: m.min * 60, title: `${curSub().name} 모의고사 ${m.t}`, ex: m.items.map(X.exam) }); }, no: closeModal });
}
const fmtClock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
let TIMER = null;
function startTimer() {
  stopTimer();
  TIMER = setInterval(() => {
    if (!LS || !LS.limit) return stopTimer();
    const left = Math.max(0, LS.limit - Math.floor((Date.now() - LS.t0) / 1000));
    const el = $('.qtimer', lessonEl()); if (el) { el.textContent = fmtClock(left); el.classList.toggle('low', left <= 300); }
    if (left === 0) timeUp();
  }, 1000);
}
function stopTimer() { if (TIMER) { clearInterval(TIMER); TIMER = null; } }
// 시간이 다 되면 남은 문제를 답하지 않은 것으로 기록하고 채점
function timeUp() {
  stopTimer(); if (!LS || LS.log.length >= LS.q.length) return;
  LS.timeUp = true; closeModal();
  for (let i = LS.log.length; i < LS.q.length; i++) {
    const e = LS.q[i]; LS.log.push({ e, ok: false, mine: '(시간 종료)', d: '' }); LS.wrong++;
    if (e.key) S.wrong[e.key] = (S.wrong[e.key] || 0) + 1;
  }
  save(); toast('시간이 다 되었습니다'); finishQuiz();
}

/* ════════ 요약 · 노트 화면 ════════ */
let NOTE_U = 'all', NOTE_Q = '', NOTE_HIDE = false, NOTE_MODE = 'sum';
const hid = s => NOTE_HIDE ? `<span class="cover" tabindex="0">${esc(s)}</span>` : esc(s);
function renderNotes() {
  const chips = [['all', '전체'], ...noteUnits().map(u => [u.id, u.no])];
  return `<div class="page notes"><h1 class="ptitle">요약</h1>
    <div class="seg big">${[['sum', '핵심 요약'], ['all', '전체 노트']].map(([m, l]) => `<button data-nmode="${m}" class="${NOTE_MODE === m ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${NOTE_MODE === 'all' ? `<div class="nsearch">${icon('search', 20)}<input id="nq" type="search" placeholder="${curSub().id === 'hanmun' ? '한자, 독음, 뜻으로 찾기' : curSub().id === 'korean' ? '용어, 개념, 자음·모음으로 찾기' : curSub().id === 'science' ? '개념, 용어로 찾기' : '용어, 사건, 인물로 찾기'}" value="${esc(NOTE_Q)}" autocomplete="off"></div>` : ''}
    <div class="chips">${chips.map(([id, t]) => `<button class="chip ${NOTE_U === id ? 'on' : ''}" data-nu="${id}">${t}</button>`).join('')}
      <button class="chip hide ${NOTE_HIDE ? 'on' : ''}" data-hide="1">${NOTE_HIDE ? '답 가림' : '답 가리기'}</button></div>
    <div id="nlist">${notesBody()}</div></div>`;
}
const notesBody = () => NOTE_MODE === 'sum' ? summaryList() : noteList();
// 종합 평가만 있는 단원(마무리)은 요약·노트에서 뺀다
const noteUnits = () => SU().units.filter(u => !u.lessons.every(L => L.exam));
function summaryList() {
  return SU().units.filter(u => SU().summary[u.id] && (NOTE_U === 'all' || NOTE_U === u.id)).map(u => `<section class="sunit c-${u.color}">
    <div class="shead"><small>${esc(u.no)}</small><h2>${esc(u.title)}</h2></div>
    ${SU().summary[u.id].map(sumSection).join('')}
    <button class="btn wide ghost squiz" data-quizunit="${u.id}">${icon('quiz', 20)} ${esc(u.no)} 퀴즈 풀기</button></section>`).join('');
}
function sumSection(sec) {
  let body = '';
  if (sec.text) body += `<p class="stext">${hzWrap(sec.text)}</p>`;
  if (sec.words) body += `<table class="swords"><tbody>${sec.words.map(h => WORDS[h]).map(w => `<tr data-say="${esc(w.r)}">
    <th class="hz">${w.h}</th><td class="sr">${hid(w.r)}</td><td>${hid(w.lit ? `(겉뜻) ${w.lit} / (속뜻) ${w.m}` : w.m)}</td></tr>`).join('')}</tbody></table>`;
  if (sec.sents) body += sec.sents.map(id => SENTS[id]).map(s => `<div class="ssent" data-say="${esc(readingToe(s))}">
    <div class="sh">${hzHtml(s.h)}</div><div class="sr">${hid(readingToe(s))}</div><div class="sm">${hid(s.m)}</div></div>`).join('');
  if (sec.rows) body += `<div class="srows">${sec.rows.map(([a, b]) => `<div class="srow${a.length > 7 ? ' stack' : ''}"><b>${hzWrap(a)}</b><span>${hzWrap(b)}</span></div>`).join('')}</div>`;
  if (sec.tips) body += `<ul class="stips">${sec.tips.map(t => `<li>${hzWrap(t)}</li>`).join('')}</ul>`;
  return `<div class="ssec${sec.tips ? ' stipsec' : ''}"><h3>${sec.tips ? icon('bulb', 18) : ''}${hzWrap(sec.t)}</h3>${body}</div>`;
}
function noteList() {
  const q = NOTE_Q.trim();
  const match = (...xs) => !q || xs.some(x => x && String(x).includes(q));
  let out = '';
  noteUnits().filter(u => NOTE_U === 'all' || NOTE_U === u.id).forEach(u => {
    const it = unitItems([u.id]);
    const notes = [...new Set(u.lessons.flatMap(L => L.notes || []))].map(id => NOTES[id]).filter(n => match(n.title, n.body, n.ex, n.big, (n.list || []).flat().join(" ")));
    const chars = it.chars.filter(c => match(c.ch, c.hun));
    const words = it.words.filter(w => match(w.h, w.r, w.m, w.c.join(' ')));
    const sents = it.sents.filter(s => match(s.h, s.m, readingToe(s), s.c.join(' ')));
    const terms = it.terms.filter(x => match(x.t, x.d));
    if (!notes.length && !chars.length && !words.length && !sents.length && !terms.length) return;
    out += `<section class="nunit c-${u.color}"><h2><small>${esc(u.no)}</small> ${esc(u.title)}</h2>`;
    notes.forEach(n => { out += `<div class="ncard note"><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ''}${n.list ? `<ul>${n.list.map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join('')}</ul>` : ''}${n.ex ? `<p class="nex">${esc(n.ex)}</p>` : ''}</div>`; });
    if (chars.length) out += `<div class="ngrid">${chars.map(c => `<button class="nchar" data-say="${esc(c.hun)}"><span class="hz">${c.ch}</span><small>${hid(c.hun)}</small></button>`).join('')}</div>`;
    words.forEach(w => {
      out += `<div class="ncard word"><button class="nhz" data-say="${esc(w.r)}"><span class="hz">${w.h}</span></button><div class="nbody">
      <div class="nr">${hid(w.r)} <span class="nhun">${w.c.map(esc).join(' · ')}</span></div><div class="nm">${hid(w.m)}</div></div></div>`;
    });
    sents.forEach(s => {
      out += `<div class="ncard sent"><button class="nsent" data-say="${esc(readingToe(s))}">${hzHtml(s.h)}</button>
      <div class="nhun">${hzOf(s.h).map((ch, i) => `${ch} ${esc(s.c[i])}`).join(' · ')}</div>
      <div class="nr">${hid(readingToe(s))}</div><div class="nm">${hid(s.m)}</div>${s.src ? `<div class="nsrc">${esc(s.src)}</div>` : ''}</div>`;
    });
    if (terms.length) out += `<div class="ncard terms"><b>용어 더하기</b><ul>${terms.map(x => `<li><b>${esc(x.t)}</b> ${hid(x.d)}</li>`).join('')}</ul></div>`;
    out += `</section>`;
  });
  return out || `<p class="empty">찾는 내용이 없습니다.</p>`;
}

/* ════════ 프로필 화면 ════════ */
function renderProfile() {
  const doneN = LESSONS.filter(L => S.done[L.id]).length;
  const learned = uniqChars(LESSONS.filter(L => S.done[L.id] && !L.exam).flatMap(L => { const r = resolve(L); return [...r.chars, ...r.words.flatMap(charsOf), ...r.sents.flatMap(charsOf)]; }));
  const hzN = new Set(learned.map(c => c.ch)).size;
  const t = today(), week = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const max = Math.max(S.settings.goal, ...week.map(k => S.days[k] || 0));
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  const tg = (k, label, desc) => `<label class="set"><span><b>${label}</b>${desc ? `<small>${desc}</small>` : ''}</span><input type="checkbox" data-set="${k}" ${S.settings[k] ? 'checked' : ''}><i class="sw"></i></label>`;
  const subRows = SUBJECTS.map(s => {
    const ls = subLessons(s.id), dn = ls.filter(L => S.done[L.id]).length;
    return `<button class="sprog c-${s.color}" data-subj-go="${s.id}">${subMark(s)}<b>${esc(s.name)}</b>
      ${s.ready && ls.length ? `<span class="gbar"><i style="width:${Math.round(dn / ls.length * 100)}%"></i></span><small>${dn}/${ls.length}</small>` : '<span class="soonbadge small">준비 중</span>'}</button>`;
  }).join('');
  return `<div class="page profile"><div class="phead"><div><h1>나의 학습</h1><p>2학년 2학기 · 오티링고</p></div></div>
    <div class="pstats">
      <div class="ps flame">${icon('flame', 26)}<b>${streakNow()}</b><small>연속 학습일</small></div>
      <div class="ps xp">${icon('bolt', 26)}<b>${S.xp}</b><small>총 XP</small></div>
      <div class="ps jade">${icon('check', 26)}<b>${doneN}<em>/${LESSONS.length}</em></b><small>끝낸 레슨</small></div>
      <div class="ps violet"><span class="hz pshz">字</span><b>${hzN}</b><small>익힌 한자</small></div>
    </div>
    <h2 class="sect">과목별 진도</h2>
    <div class="sprogs">${subRows}</div>
    <h2 class="sect">이번 주 XP</h2>
    <div class="chart" role="img" aria-label="최근 7일 XP">${week.map(k => { const v = S.days[k] || 0, d = new Date(k.replace(/-/g, '/')); return `<div class="bar ${k === t ? 'today' : ''}"><em>${v || ''}</em><i style="height:${Math.round(v / max * 100)}%"></i><small>${wd[d.getDay()]}</small></div>`; }).join('')}
      <span class="goalline" style="bottom:calc(22px + ${S.settings.goal / max} * (100% - 44px))"><small>목표</small></span></div>
    <h2 class="sect">오늘의 목표</h2>
    <div class="goals">${[10, 20, 30, 50].map(g => `<button class="chip ${S.settings.goal === g ? 'on' : ''}" data-goal="${g}">${g} XP<small>${{ 10: '가볍게', 20: '보통', 30: '열심히', 50: '시험 기간' }[g]}</small></button>`).join('')}</div>
    <h2 class="sect">설정</h2>
    <div class="sets">
      ${tg('sound', '효과음')}${tg('vib', '진동')}${tg('tts', '읽어 주기', '한자와 독음을 소리 내어 읽습니다')}
      ${tg('all', '모든 레슨 열기', '시험 전에 원하는 레슨부터 공부할 수 있습니다')}
      <div class="set"><span><b>화면 테마</b></span><div class="seg">${[['system', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(([v, l]) => `<button data-theme-set="${v}" class="${S.settings.theme === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    </div>
    <h2 class="sect">진행 상황 백업</h2>
    <p class="plead">앱을 지우거나 새 버전으로 다시 설치하기 전에 백업 코드를 복사해 두십시오.</p>
    <div class="row2"><button class="btn ghost wide" data-act="export">백업 코드 복사</button><button class="btn ghost wide" data-act="import">백업 불러오기</button></div>
    <button class="btn ghost wide danger" data-act="reset">처음부터 다시 하기</button>
    ${NATIVE ? '' : `<h2 class="sect">안드로이드 앱</h2><p class="plead">휴대폰에 앱으로 설치하면 인터넷 없이도 공부할 수 있습니다.</p>
    <a class="btn wide" href="otilingo.apk" download>안드로이드 앱(APK) 받기</a>`}
    <p class="about">오티링고 v1.32</p></div>`;
}
function exportCode() {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  modal(`<h3>백업 코드</h3><p>아래 코드를 메모장이나 메신저에 붙여 넣어 보관하십시오.</p><textarea class="code" readonly>${code}</textarea>
    <button class="btn wide" data-act="copy">복사하기</button><button class="btn wide ghost" data-act="close">닫기</button>`, {
    copy: () => {
      const ta = $('#modal textarea'); let ok = false;
      try { if (NATIVE && NATIVE.copy) { NATIVE.copy(code); ok = true; } } catch (e) { }
      if (!ok) { ta.select(); try { ok = document.execCommand('copy'); } catch (e) { } }
      if (!ok && navigator.clipboard) { navigator.clipboard.writeText(code).then(() => toast('복사했습니다')); return; }
      toast(ok ? '복사했습니다' : '코드를 길게 눌러 복사해 주십시오');
    }, close: closeModal
  });
}
function importCode() {
  modal(`<h3>백업 불러오기</h3><p>복사해 둔 백업 코드를 붙여 넣으십시오. 지금 기록은 덮어써집니다.</p><textarea class="code" placeholder="백업 코드"></textarea>
    <button class="btn wide" data-act="load">불러오기</button><button class="btn wide ghost" data-act="close">취소</button>`, {
    load: () => {
      try {
        const s = JSON.parse(decodeURIComponent(escape(atob($('#modal textarea').value.trim()))));
        if (!s || s.v !== 1) throw 0;
        S = Object.assign(JSON.parse(JSON.stringify(DEF)), s, { settings: Object.assign({}, DEF.settings, s.settings) }); save();
        closeModal(); applyTheme(); renderTop(); show(TAB); toast('기록을 불러왔습니다');
      } catch (e) { toast('코드가 올바르지 않습니다'); }
    }, close: closeModal
  });
}

/* ════════ 탭 · 이벤트 ════════ */
function show(tab, opts = {}) {
  TAB = tab;
  closePop();
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  renderTop();
  const v = $('#view'), sub = curSub();
  v.innerHTML = tab === 'profile' ? renderProfile() : tab === 'exam' ? renderExam() : !sub.ready ? renderSoon(sub, tab)
    : tab === 'learn' ? renderLearn() : tab === 'review' ? renderReview() : tab === 'notes' ? renderNotes() : renderQuiz();
  if (tab === 'learn' && sub.ready) requestAnimationFrame(() => scrollToCurrent(false));
  else if (opts.unit) requestAnimationFrame(() => { const s = document.getElementById(opts.unit) || $(`.nunit.c-${ALL_UNITS.find(u => u.id === opts.unit).color}`); if (s) s.scrollIntoView(); });
  else window.scrollTo(0, 0);
}
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
}

document.addEventListener('click', ev => {
  const t = ev.target;
  if (t.closest('#lesson')) return onLessonClick(ev);
  if (t.closest('#modal')) {
    const a = t.closest('[data-act]'); if (a && MODAL_ACT && MODAL_ACT[a.dataset.act]) MODAL_ACT[a.dataset.act]();
    else if (t.id === 'modal' && !LS) closeModal();
    return;
  }
  const tab = t.closest('.tabs [data-tab]'); if (tab) { sfx.tap(); show(tab.dataset.tab); return; }
  const go = t.closest('[data-go]'); if (go) { show(go.dataset.go); return; }
  const node = t.closest('.node'); if (node) { sfx.tap(); const open = node.parentElement.querySelector('.npop'); if (open) closePop(); else nodePop(node); return; }
  const st = t.closest('[data-start]'); if (st) { closePop(); startNode(LESSONS[+st.dataset.start]); return; }
  if (!t.closest('.npop')) closePop();
  const nb = t.closest('[data-notes]'); if (nb) { NOTE_U = nb.dataset.notes; NOTE_Q = ''; NOTE_MODE = 'sum'; show('notes', { unit: null }); return; }
  const nm = t.closest('[data-nmode]'); if (nm) { NOTE_MODE = nm.dataset.nmode; show('notes'); return; }
  const qu = t.closest('[data-qu]'); if (qu) { sfx.tap(); QUIZ_U = qu.dataset.qu; const y = scrollY; show('quiz'); window.scrollTo(0, y); return; }
  const qn = t.closest('[data-qn]'); if (qn) { sfx.tap(); QUIZ_N = +qn.dataset.qn; const y = scrollY; show('quiz'); window.scrollTo(0, y); return; }
  if (t.closest('[data-qstart]')) { startQuiz(QUIZ_U, QUIZ_N); return; }
  const mk = t.closest('[data-mock]'); if (mk) { sfx.tap(); startMock(+mk.dataset.mock); return; }
  const xr = t.closest('[data-xr]'); if (xr) { const el = document.getElementById('xr-' + xr.dataset.xr); if (el) window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - $('#top').offsetHeight - 12, behavior: reduceMotion() ? 'auto' : 'smooth' }); return; }
  const xq = t.closest('[data-xquiz]'); if (xq) { S.subject = xq.dataset.xquiz; save(); QUIZ_U = 'all'; TAB = 'quiz'; startQuiz('all', 20); return; }
  const qz = t.closest('[data-quizunit]'); if (qz) { QUIZ_U = qz.dataset.quizunit; TAB = 'quiz'; startQuiz(QUIZ_U, 10); return; }
  const sg = t.closest('[data-subj-go]'); if (sg) { sfx.tap(); S.subject = sg.dataset.subjGo; NOTE_U = QUIZ_U = 'all'; save(); show('learn'); return; }
  const sj = t.closest('[data-subj]');
  if (sj) { sfx.tap(); if (S.subject !== sj.dataset.subj) { S.subject = sj.dataset.subj; NOTE_U = QUIZ_U = 'all'; save(); show(TAB); } return; }
  const pr = t.closest('[data-practice]'); if (pr) { startPractice(pr.dataset.practice); return; }
  const ls = t.closest('[data-lesson]'); if (ls) { startNode(LESSONS.find(L => L.id === ls.dataset.lesson)); return; }
  const say = t.closest('[data-say]'); if (say) { tts.say(say.dataset.say); say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop'); }
  const cov = t.closest('.cover'); if (cov) { cov.classList.toggle('open'); return; }
  const nu = t.closest('[data-nu]'); if (nu) { NOTE_U = nu.dataset.nu; $$('.chip[data-nu]').forEach(c => c.classList.toggle('on', c === nu)); $('#nlist').innerHTML = notesBody(); return; }
  const hd = t.closest('[data-hide]'); if (hd) { NOTE_HIDE = !NOTE_HIDE; hd.classList.toggle('on', NOTE_HIDE); hd.textContent = NOTE_HIDE ? '답 가림' : '답 가리기'; $('#nlist').innerHTML = notesBody(); return; }
  const gl = t.closest('[data-goal]'); if (gl) { S.settings.goal = +gl.dataset.goal; save(); show('profile'); window.scrollTo(0, document.body.scrollHeight * 0.3); return; }
  const th = t.closest('[data-theme-set]'); if (th) { S.settings.theme = th.dataset.themeSet; save(); applyTheme(); $$('[data-theme-set]').forEach(b => b.classList.toggle('on', b === th)); syncNativeTheme(); return; }
  const act = t.closest('[data-act]');
  if (act) {
    const a = act.dataset.act;
    if (a === 'export') exportCode();
    if (a === 'import') importCode();
    if (a === 'reset') modal(`<h3>처음부터 다시 하시겠습니까?</h3><p>XP, 연속 학습, 끝낸 레슨, 오답 노트가 모두 지워집니다.</p>
      <button class="btn wide ghost" data-act="close">취소</button><button class="btn wide red" data-act="wipe">모두 지우기</button>`,
      { close: closeModal, wipe: () => { const keep = S.settings; S = JSON.parse(JSON.stringify(DEF)); S.settings = keep; save(); closeModal(); renderTop(); show('learn'); toast('처음부터 시작합니다'); } });
  }
});
document.addEventListener('change', ev => {
  const s = ev.target.closest('[data-set]'); if (!s) return;
  S.settings[s.dataset.set] = s.checked; save(); renderTop();
  if (s.dataset.set === 'tts' && s.checked) tts.say('읽어 주기를 켰습니다');
});
document.addEventListener('input', ev => {
  if (ev.target.id === 'nq') { NOTE_Q = ev.target.value; $('#nlist').innerHTML = noteList(); }
  if (ev.target.classList.contains('typein') && CUR && !CUR.state.done) footState(ev.target.value.trim() ? 'ready' : 'idle');
});
document.addEventListener('keydown', ev => {
  if (!LS || !$('#modal').hidden) return;
  if (ev.key === 'Enter') { ev.preventDefault(); if (!CUR) { const b = $('#lcheck'); if (b) b.click(); } else onMain(); return; }
  if (CUR && CUR.type === 'choice' && !CUR.state.done && /^[1-9]$/.test(ev.key)) { const o = $$('.opt', lessonEl())[+ev.key - 1]; if (o) o.click(); }
});
// 안드로이드 뒤로 가기: 처리했으면 true
window.__onBack = () => {
  if (!$('#modal').hidden) { const a = MODAL_ACT || {}; (a.stay || a.leave || a.close || closeModal)(); return true; }
  if (LS) { if (!CUR && $('#lcheck')) { $('#lcheck').click(); return true; } confirmQuit(); return true; }
  if ($('.npop')) { closePop(); return true; }
  if (TAB !== 'learn') { show('learn'); return true; }
  return false;
};
function syncNativeTheme() {
  try {
    if (!NATIVE || !NATIVE.setDark) return;
    const t = S.settings.theme, dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    NATIVE.setDark(dark);
  } catch (e) { }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && !LS) { renderTop(); if (TAB === 'learn') { const y = scrollY; show('learn'); window.scrollTo(0, y); } } });

/* ════════ 시작 ════════ */
applyTheme(); syncNativeTheme();
renderTop(); show('learn');
if (!NATIVE && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });

// 내용 점검(개발용): 콘솔에서 __ilsin.validate()
window.__ilsin = {
  get S() { return S; }, get LS() { return LS; }, get CUR() { return CUR; }, LESSONS, WORDS, SENTS, BYKEY, buildLesson, PRACTICE, startNode, startPractice,
  validate() {
    const errs = [];
    Object.values(WORDS).forEach(w => {
      if (hzOf(w.h).length !== w.c.length) errs.push('훈음 개수: ' + w.h);
      const derived = w.c.map(eumOf).join('');
      if (derived !== w.r && !['旅行', '流行', '不動'].includes(w.h)) errs.push(`독음 불일치: ${w.h} ${w.r} vs ${derived}`);
      if (!w.u) errs.push('레슨에 없음: ' + w.h);
    });
    Object.values(SENTS).forEach(s => {
      if (hzOf(s.h).length !== s.c.length) errs.push('훈음 개수: ' + s.id);
      if (s.ord && s.ord.map(o => o[0]).join('') !== hzOf(s.h).join('')) errs.push('풀이 순서 조각: ' + s.id);
      if (s.focus && s.focus.some(i => i >= s.c.length)) errs.push('focus 범위: ' + s.id);
      if (!s.u) errs.push('레슨에 없음: ' + s.id);
    });
    LESSONS.forEach(L => ['quiz', 'cloze'].forEach(f => (L[f] || []).forEach(q => { if ((q.w || []).includes(q.a)) errs.push('정답이 오답 목록에: ' + q.k); })));
    LESSONS.forEach(L => (L.notes || []).forEach(id => { if (!NOTES[id]) errs.push('없는 정리 카드: ' + id); }));
    LESSONS.forEach(L => (L.quiz || []).forEach(q => { if (q.t === 'seq' && q.a.length < 3) errs.push('순서 문제가 너무 짧음: ' + q.k); }));
    if (new Set(LESSONS.map(L => L.id)).size !== LESSONS.length) errs.push('레슨 id 중복');
    SUBJECTS.filter(x => x.data).flatMap(x => Object.values(x.data.exam).flat()).forEach(q => {
      if (q.t === 'short') { if (!q.a.length) errs.push('단답형 형식: ' + q.k); }
      else if (!q.w || q.w.length < 3 || q.w.includes(q.a) || new Set(q.w).size !== q.w.length) errs.push('객관식 보기: ' + q.k);
    });
    SUBJECTS.filter(x => x.data).flatMap(x => Object.entries(x.data.summary)).forEach(([u, secs]) => secs.forEach(s => {
      (s.words || []).forEach(h => { if (!WORDS[h]) errs.push(`요약 ${u}: 없는 어휘 ${h}`); });
      (s.sents || []).forEach(id => { if (!SENTS[id]) errs.push(`요약 ${u}: 없는 문장 ${id}`); });
    }));
    return errs;
  }
};
