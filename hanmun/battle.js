'use strict';
/* ════════ 친구와 대결 — 같은 문제를 동시에 풀고 빠르고 정확할수록 점수가 높은 실시간 퀴즈 ════════
   방장이 방 번호를 만들면 친구들이 그 번호로 들어옵니다. 휴대폰끼리는 공개 MQTT 중계 서버를 거쳐 이야기합니다.
   주고받는 것은 별명 · 문제 번호 · 고른 답 · 점수뿐이고, 문제 내용은 각자 앱에 들어 있는 것을 보여 줍니다. */

/* ── 작은 MQTT 3.1.1 클라이언트 (WebSocket, QoS 0) ── */
const MQ_BROKERS = (() => {
  try { const x = JSON.parse(localStorage.getItem('otl-brokers')); if (Array.isArray(x) && x.length) return x.slice(0, 9); } catch (e) { }
  return ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
})();
const MQ_TE = new TextEncoder(), MQ_TD = new TextDecoder();
function mqStr(s) { const b = MQ_TE.encode(s); return [b.length >> 8, b.length & 255, ...b]; }
function mqPkt(type, body) {
  const len = []; let n = body.length;
  do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; len.push(d); } while (n > 0);
  const out = new Uint8Array(1 + len.length + body.length);
  out[0] = type; out.set(len, 1); out.set(body, 1 + len.length); return out;
}
class Mq {
  constructor(url) { this.url = url; this.subs = new Set(); this.buf = new Uint8Array(0); this.onMsg = null; this.onDown = null; this.ws = null; this.up = false; }
  connect(ms = 7000) {
    this.buf = new Uint8Array(0);
    return new Promise((ok, no) => {
      let done = false;
      const fail = why => { if (done) return; done = true; this.close(); no(new Error(why)); };
      const timer = setTimeout(() => fail('timeout'), ms);
      let ws;
      try { ws = new WebSocket(this.url, 'mqtt'); } catch (e) { clearTimeout(timer); return fail('ws'); }
      this.ws = ws; ws.binaryType = 'arraybuffer';
      ws.onopen = () => {
        const id = 'otl' + Math.random().toString(36).slice(2, 12);
        ws.send(mqPkt(0x10, [...mqStr('MQTT'), 4, 0x02, 0, 60, ...mqStr(id)]));
      };
      ws.onerror = () => { clearTimeout(timer); fail('error'); };
      ws.onclose = () => {
        clearTimeout(timer); clearInterval(this.ping);
        const was = this.up; this.up = false;
        if (!done) fail('closed'); else if (was && this.onDown) this.onDown();
      };
      ws.onmessage = ev => this.feed(new Uint8Array(ev.data), rc => {
        if (done) return; clearTimeout(timer);
        if (rc !== 0) return fail('refused');
        done = true; this.up = true;
        this.ping = setInterval(() => this.send(0xC0, []), 25000);
        this.subs.forEach(t => this.sendSub(t));
        ok(this);
      });
    });
  }
  feed(u8, onConnack) {
    const b = new Uint8Array(this.buf.length + u8.length); b.set(this.buf); b.set(u8, this.buf.length); this.buf = b;
    for (;;) {
      if (this.buf.length < 2) return;
      let mul = 1, len = 0, i = 1, d;
      do { if (i >= this.buf.length) return; d = this.buf[i++]; len += (d & 127) * mul; mul *= 128; } while (d & 128 && i < 5);
      if (this.buf.length < i + len) return;
      const head = this.buf[0], body = this.buf.slice(i, i + len); this.buf = this.buf.slice(i + len);
      const type = head >> 4;
      if (type === 2) onConnack(body[1]);
      else if (type === 3 && body.length >= 2) {
        const tl = (body[0] << 8) | body[1], qos = (head >> 1) & 3;
        const topic = MQ_TD.decode(body.subarray(2, 2 + tl)), start = 2 + tl + (qos ? 2 : 0);
        if (this.onMsg && body.length - start < 16384) {
          let m = null; try { m = JSON.parse(MQ_TD.decode(body.subarray(start))); } catch (e) { }
          if (m && typeof m === 'object' && !Array.isArray(m)) { try { this.onMsg(topic, m); } catch (e) { console.error(e); } }
        }
      }
    }
  }
  send(type, body) { try { if (this.ws && this.ws.readyState === 1) { this.ws.send(mqPkt(type, body)); return true; } } catch (e) { } return false; }
  sendSub(t) { this.send(0x82, [0, 1, ...mqStr(t), 0]); }
  sub(t) { this.subs.add(t); if (this.up) this.sendSub(t); }
  pub(t, obj) { return this.up && this.send(0x30, [...mqStr(t), ...MQ_TE.encode(JSON.stringify(obj))]); }
  close() {
    clearInterval(this.ping); this.up = false; this.onDown = null;
    const ws = this.ws; this.ws = null;
    if (ws) { try { if (ws.readyState === 1) ws.send(mqPkt(0xE0, [])); } catch (e) { } try { ws.close(); } catch (e) { } }
  }
}

/* ── 문제 ── */
const B_COLORS = ['coral', 'sky', 'ochre', 'jade'];
const B_SHAPES = [
  '<path fill="currentColor" d="M12 3.5 21.5 20h-19z"/>',
  '<path fill="currentColor" d="m12 2.5 9.5 9.5-9.5 9.5L2.5 12z"/>',
  '<circle cx="12" cy="12" r="9.3" fill="currentColor"/>',
  '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="2" fill="currentColor"/>',
];
const bShape = (i, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${B_SHAPES[i]}</svg>`;
// 객관식(보기 2~4개)인 단원 평가 · 모의고사 · 레슨 퀴즈 문제
const bIsMC = q => q && (q.kind === 'exam' || q.kind === 'quiz') && !q.t && Array.isArray(q.w) && q.w.length >= 1 && q.w.length <= 3;
function battlePool(sub, uid) {
  const seen = new Set();
  return Object.values(BYKEY).filter(q => {
    if (!bIsMC(q) || UNIT_SUB[q.u] !== sub) return false;
    if (uid !== 'all' && (q.u !== uid || q.k.startsWith('m:'))) return false;
    const sig = norm(q.q + (q.p || '')) + '|' + norm(q.a);
    if (seen.has(sig)) return false; seen.add(sig); return true;
  });
}
// 정답이 서로 다른 문제로 n개 (모자라면 같은 답도 허용)
function battlePick(pool, n) {
  const out = [], answers = new Set(), rest = [];
  for (const q of shuffle(pool)) {
    const a = norm(q.a);
    if (out.length < n && !answers.has(a)) { out.push(q); answers.add(a); } else rest.push(q);
  }
  while (out.length < n && rest.length) out.push(rest.shift());
  return shuffle(out);
}
const bDur = (q, base) => base + ((q.p || '').length > 60 || q.q.length > 60 ? 10 : 0);
const bOpts = q => [q.a, ...q.w];

/* ── 상태 ── */
const BT = { el: null, view: 'menu', role: null, mq: null, pin: '', me: null, host: null, c: null, timers: [] };
const B_MAX = 40;
function bName() { return String(S.bname || '').trim(); }
function bClean(s) { return String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10); }
const bTopic = (pin, k) => `otilingo/v1/${pin}/${k}`;
function bEveryMs(fn, ms) { const t = setInterval(fn, ms); BT.timers.push(t); return t; }
function bClearTimers() { BT.timers.forEach(clearInterval); BT.timers = []; clearTimeout(BT.next); BT.next = null; }

function openBattle() {
  if (!curSub().ready) return;
  BT.el = BT.el || Object.assign(document.createElement('div'), { id: 'battle' });
  if (!BT.el.isConnected) document.body.appendChild(BT.el);
  BT.el.hidden = false; document.body.classList.add('bopen');
  BT.me = BT.me || { id: Math.random().toString(36).slice(2, 10) };
  BT.setup = BT.setup || { u: 'all', n: 10, d: 20 };
  bGo('menu');
}
function closeBattle() {
  bLeave(); BT.view = 'closed';
  if (BT.el) { BT.el.hidden = true; BT.el.innerHTML = ''; }
  document.body.classList.remove('bopen');
  renderTop(); if (TAB === 'quiz') { const y = scrollY; show('quiz'); window.scrollTo(0, y); }
}
// 방에서 나가기 (연결 끊기)
function bLeave() {
  bClearTimers();
  if (BT.mq) {
    if (BT.role === 'host') BT.mq.pub(bTopic(BT.pin, 'h'), { t: 'bye' });
    else if (BT.role === 'player') BT.mq.pub(bTopic(BT.pin, 'p'), { t: 'leave', id: BT.me.id });
    const mq = BT.mq; BT.mq = null; setTimeout(() => mq.close(), 150);
  }
  BT.role = null; BT.host = null; BT.c = null; BT.pin = '';
}
function bGo(view) { BT.view = view; bRender(); }
function bBack() {
  if (BT.view === 'menu' || BT.view === 'join' || BT.view === 'setup' || BT.view === 'error') { if (BT.view === 'menu' || BT.view === 'error') closeBattle(); else bGo('menu'); return; }
  if (BT.c && BT.c.phase === 'end') { closeBattle(); return; }
  modal(`<h3>대결에서 나가시겠습니까?</h3><p>${BT.role === 'host' ? '방장이 나가면 방이 닫혀서 친구들도 더 이상 풀 수 없습니다.' : '지금 나가면 이번 대결 점수는 사라집니다.'}</p>
    <button class="btn wide" data-act="stay">계속하기</button><button class="btn wide ghost danger" data-act="leave">나가기</button>`,
    { stay: closeModal, leave: () => { closeModal(); closeBattle(); } });
}

/* ── 연결 ── */
async function bConnect(idx) {
  const mq = new Mq(MQ_BROKERS[idx]);
  await mq.connect();
  return mq;
}
async function bHostStart() {
  const name = bClean($('#bname', BT.el) && $('#bname', BT.el).value) || bName();
  if (!name) { toast('별명을 먼저 써 주십시오'); return; }
  S.bname = name; save();
  const st = BT.setup, sub = curSub();
  const pool = battlePool(sub.id, st.u);
  if (pool.length < 4) { toast('이 범위에는 대결할 문제가 모자랍니다'); return; }
  bGo('connecting');
  let mq = null, idx = 0;
  for (; idx < MQ_BROKERS.length && !mq; idx++) { try { mq = await bConnect(idx); } catch (e) { mq = null; } }
  if (!mq) { BT.err = '대결 서버에 연결하지 못했습니다. 인터넷(와이파이나 데이터)이 켜져 있는지 확인하고 다시 해 보십시오.'; bGo('error'); return; }
  if (BT.view !== 'connecting') { mq.close(); return; }
  idx--;
  BT.mq = mq; BT.role = 'host';
  BT.pin = String(idx + 1) + String(rnd(100000)).padStart(5, '0');
  const u = st.u === 'all' ? null : sub.data.units.find(x => x.id === st.u);
  BT.host = {
    sub: sub.id, subName: sub.name, range: u ? `${u.no} ${u.title}` : '전체 범위', uid: st.u, n: Math.min(st.n, pool.length), base: st.d,
    players: new Map([[BT.me.id, { id: BT.me.id, name, score: 0, streak: 0, right: 0, seen: Infinity, host: true }]]),
    phase: 'lobby', i: -1, qs: [], ord: [], ans: new Map(), t0: 0,
  };
  mq.onMsg = (t, m) => { if (t === bTopic(BT.pin, 'p')) hostOnMsg(m); else if (t === bTopic(BT.pin, 'h')) clientOnMsg(m); };
  mq.onDown = () => bReconnect();
  mq.sub(bTopic(BT.pin, 'p')); mq.sub(bTopic(BT.pin, 'h'));
  BT.c = { phase: 'lobby', players: [], heard: Date.now(), info: { subName: sub.name, range: BT.host.range, n: BT.host.n } };
  bEveryMs(hostTick, 1000);
  hostBroadcast();
  bGo('room');
}
async function bJoin() {
  const pin = String(($('#bpin', BT.el) || {}).value || '').replace(/\D/g, '');
  const name = bClean(($('#bname', BT.el) || {}).value) || bName();
  if (!name) { toast('별명을 먼저 써 주십시오'); return; }
  if (!/^[1-9]\d{5}$/.test(pin) || +pin[0] > MQ_BROKERS.length) { toast('방 번호 여섯 자리를 확인해 주십시오'); return; }
  S.bname = name; save();
  bGo('connecting');
  let mq = null;
  try { mq = await bConnect(+pin[0] - 1); } catch (e) { mq = null; }
  if (!mq) { BT.err = '대결 서버에 연결하지 못했습니다. 인터넷(와이파이나 데이터)이 켜져 있는지 확인하고 다시 해 보십시오.'; bGo('error'); return; }
  if (BT.view !== 'connecting') { mq.close(); return; }
  BT.mq = mq; BT.role = 'player'; BT.pin = pin; BT.myName = name;
  BT.c = { phase: 'wait', players: [], heard: 0, joinedAt: Date.now() };
  mq.onMsg = (t, m) => { if (t === bTopic(pin, 'h')) clientOnMsg(m); };
  mq.onDown = () => bReconnect();
  mq.sub(bTopic(pin, 'h'));
  const hello = () => BT.mq && BT.mq.pub(bTopic(pin, 'p'), { t: 'join', id: BT.me.id, name });
  hello();
  bEveryMs(() => {
    const c = BT.c; if (!c) return;
    if (!c.heard) {
      if (Date.now() - c.joinedAt > 9000) { BT.err = `${pin}번 방을 찾지 못했습니다. 방 번호가 맞는지, 방장이 방을 열어 두었는지 확인해 주십시오.`; bLeave(); bGo('error'); return; }
      hello(); return;
    }
    BT.mq && BT.mq.pub(bTopic(pin, 'p'), c.inRoom ? { t: 'hb', id: BT.me.id } : { t: 'join', id: BT.me.id, name });
    bLostCheck();
  }, 2500);
  bGo('room');
}
// 연결이 끊기면 같은 서버에 다시 붙는다
async function bReconnect() {
  const old = BT.mq; if (!old) return;
  bBanner('연결이 끊겨서 다시 연결하는 중…');
  for (let k = 0; k < 20 && BT.mq === old; k++) {
    try { await old.connect(); if (BT.mq !== old) return; old.onDown = () => bReconnect(); bBanner('');
      if (BT.role === 'player') old.pub(bTopic(BT.pin, 'p'), { t: 'join', id: BT.me.id, name: BT.myName });
      else hostBroadcast();
      return;
    } catch (e) { await new Promise(r => setTimeout(r, 2000)); }
  }
}
function bLostCheck() {
  const c = BT.c; if (!c || BT.role !== 'player' || !c.heard || c.phase === 'end' || c.phase === 'closed') return;
  bBanner(Date.now() - c.heard > 12000 ? '방장과 연결이 잠시 끊겼습니다. 기다리는 중…' : '');
}
function bBanner(msg) { const b = BT.el && $('.bbanner', BT.el); if (b) { b.textContent = msg; b.hidden = !msg; } }

/* ── 방장: 문제 내기 · 채점 ── */
const hostPub = m => BT.mq && BT.mq.pub(bTopic(BT.pin, 'h'), m);
function hostBoard() {
  return [...BT.host.players.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map(p => ({ id: p.id, name: p.name, score: p.score, streak: p.streak, right: p.right }));
}
function hostActive() { const now = Date.now(); return [...BT.host.players.values()].filter(p => p.host || now - p.seen < 15000); }
function hostLobbyMsg() {
  const H = BT.host;
  return { t: 'lobby', sub: H.sub, subName: H.subName, range: H.range, n: H.n, players: [...H.players.values()].map(p => ({ id: p.id, name: p.name })) };
}
function hostQMsg() {
  const H = BT.host, q = H.qs[H.i], o = bOpts(q);
  return { t: 'q', i: H.i, n: H.n, k: q.k, ord: H.ord, dur: H.dur, left: Math.max(0, H.dur * 1000 - (Date.now() - H.t0)), txt: { q: q.q, o: H.ord.map(j => o[j]) }, got: H.ans.size, of: hostActive().length };
}
function hostBroadcast() {
  const H = BT.host; if (!H) return;
  if (H.phase === 'lobby') hostPub(hostLobbyMsg());
  else if (H.phase === 'q') hostPub(hostQMsg());
  else if (H.phase === 'rev') hostPub(H.revMsg);
  else if (H.phase === 'end') hostPub({ t: 'end', board: hostBoard() });
}
function hostOnMsg(m) {
  const H = BT.host; if (!H || typeof m.id !== 'string' || m.id.length > 20 || m.id === BT.me.id) return;
  const p = H.players.get(m.id);
  if (m.t === 'join') {
    let name = bClean(m.name) || '친구';
    if (!p) {
      if (H.players.size >= B_MAX) return;
      const names = new Set([...H.players.values()].map(x => x.name));
      for (let k = 2; names.has(name); k++) name = (bClean(m.name) || '친구').slice(0, 8) + k;
      H.players.set(m.id, { id: m.id, name, score: 0, streak: 0, right: 0, seen: Date.now() });
      if (H.phase === 'lobby') { sfx.match(); buzz(10); }
    } else p.seen = Date.now();
    hostBroadcast(); if (H.phase === 'lobby') bRenderLobbyList();
    return;
  }
  if (!p) return;
  p.seen = Date.now();
  if (m.t === 'leave') { H.players.delete(m.id); hostBroadcast(); if (H.phase === 'lobby') bRenderLobbyList(); else hostCheckAll(); return; }
  if (m.t === 'ans') hostTakeAnswer(m.id, m.i, m.c, m.ms);
}
function hostTakeAnswer(id, i, c, ms) {
  const H = BT.host;
  if (H.phase !== 'q' || i !== H.i || H.ans.has(id) || !Number.isInteger(c) || c < 0 || c >= H.ord.length) return;
  const real = Date.now() - H.t0;
  ms = Math.max(0, Math.min(+ms || real, real, H.dur * 1000));
  H.ans.set(id, { c, ms });
  hostPub({ t: 'cnt', i: H.i, got: H.ans.size, of: hostActive().length });
  hostCheckAll();
}
function hostCheckAll() {
  const H = BT.host; if (!H || H.phase !== 'q') return;
  const act = hostActive();
  bCount(H.ans.size, act.length);
  if (act.every(p => H.ans.has(p.id))) hostReveal();
}
function hostTick() {
  const H = BT.host; if (!H) return;
  const now = Date.now();
  if (H.phase === 'q' && now - H.t0 > H.dur * 1000 + 600) hostReveal();
  if (!H.lastCast || now - H.lastCast > 3000) {
    H.lastCast = now;
    if (H.phase === 'q') hostPub({ t: 'cnt', i: H.i, got: H.ans.size, of: hostActive().length, left: Math.max(0, H.dur * 1000 - (now - H.t0)) });
    else hostBroadcast();
  }
  if (H.phase === 'lobby') { const el = $('.bplist', BT.el); if (el) bRenderLobbyList(); }
}
function hostStartGame() {
  const H = BT.host; if (!H || H.phase !== 'lobby') return;
  if (H.players.size < 2) { toast('친구가 한 명 이상 들어와야 시작할 수 있습니다'); return; }
  H.qs = battlePick(battlePool(H.sub, H.uid), H.n); H.n = H.qs.length;
  H.players.forEach(p => { p.score = 0; p.streak = 0; p.right = 0; });
  H.i = -1; H.phase = 'rev'; hostNext();
}
function hostNext() {
  const H = BT.host; if (!H || H.phase !== 'rev') return;
  clearTimeout(BT.next); BT.next = null;
  if (H.i + 1 >= H.n) { H.phase = 'end'; hostBroadcast(); return; }
  H.i++; H.phase = 'q'; H.ans = new Map(); H.t0 = Date.now();
  const q = H.qs[H.i];
  H.dur = bDur(q, H.base);
  H.ord = shuffle(bOpts(q).map((_, j) => j));
  hostBroadcast();
}
function hostReveal() {
  const H = BT.host; if (!H || H.phase !== 'q') return;
  H.phase = 'rev';
  const right = H.ord.indexOf(0), res = {};
  H.players.forEach(p => {
    const a = H.ans.get(p.id), ok = !!a && a.c === right;
    let gain = 0;
    if (ok) { p.streak++; p.right++; gain = Math.round(500 + 500 * (1 - a.ms / (H.dur * 1000))) + Math.min(p.streak - 1, 5) * 100; }
    else p.streak = 0;
    p.score += gain; res[p.id] = { ok, gain, c: a ? a.c : -1 };
  });
  H.revMsg = { t: 'rev', i: H.i, n: H.n, right, res, board: hostBoard() };
  hostBroadcast();
}

/* ── 모두(방장 포함): 받은 메시지로 화면 ── */
function clientOnMsg(m) {
  const c = BT.c; if (!c) return;
  const first = !c.heard; c.heard = Date.now(); bBanner('');
  if (first && c.phase === 'wait') bRender();
  if (m.t === 'lobby' && Array.isArray(m.players)) {
    const ps = m.players.filter(p => p && typeof p.id === 'string').slice(0, B_MAX).map(p => ({ id: p.id, name: bClean(p.name) || '친구' }));
    c.info = { subName: bClean(m.subName), range: String(m.range || '').slice(0, 40), n: +m.n || 0 };
    c.players = ps;
    if (BT.role === 'player') {
      const was = c.inRoom; c.inRoom = ps.some(p => p.id === BT.me.id);
      if (!c.inRoom && was) { c.phase = 'closed'; c.why = '방장이 나를 방에서 내보냈습니다.'; bRender(); return; }
      if (!c.inRoom) return;
    }
    if (c.phase !== 'lobby') { c.phase = 'lobby'; c.myRight = 0; bRender(); } else bRenderLobbyList();
    return;
  }
  if (m.t === 'q' && Number.isInteger(m.i) && Array.isArray(m.ord)) {
    if (BT.role === 'player') c.inRoom = true;
    if (c.phase === 'q' && c.q && c.q.i === m.i) { c.q.until = Math.min(c.q.until, Date.now() + (+m.left || 0)); bCount(m.got, m.of); return; }
    if (c.phase === 'rev' && c.q && c.q.i === m.i) return;
    const q = BYKEY[m.k], ord = m.ord.map(Number);
    const valid = bIsMC(q) && ord.length === bOpts(q).length && ord.every((x, j) => Number.isInteger(x) && x >= 0 && x < ord.length && ord.indexOf(x) === j);
    const dur = Math.max(5, Math.min(60, +m.dur || 20));
    c.q = { i: m.i, n: Math.max(1, +m.n || 1), item: valid ? q : null, ord: valid ? ord : null, txt: m.txt || {}, dur, until: Date.now() + Math.max(0, Math.min(dur * 1000, +m.left || dur * 1000)), shown: Date.now(), mine: -1 };
    c.phase = 'q'; c.got = +m.got || 0; c.of = +m.of || 0;
    bRender(); sfx.tap();
    return;
  }
  if (m.t === 'cnt' && c.phase === 'q' && c.q && m.i === c.q.i) {
    if (m.left != null) c.q.until = Math.min(c.q.until, Date.now() + Math.max(0, +m.left));
    bCount(m.got, m.of); return;
  }
  if (m.t === 'rev' && c.q && m.i === c.q.i && c.phase !== 'rev' && m.res && Array.isArray(m.board)) {
    c.phase = 'rev'; c.rev = { right: +m.right, me: m.res[BT.me.id] || { ok: false, gain: 0, c: -1 }, board: bBoard(m.board), n: +m.n || c.q.n };
    const me = c.rev.me;
    if (me.ok) { c.myRight = (c.myRight || 0) + 1; sfx.right(); buzz(18); }
    else { sfx.wrong(); buzz(70); if (c.q.item && c.q.item.k) { S.wrong[c.q.item.k] = (S.wrong[c.q.item.k] || 0) + 1; save(); } }
    bRender();
    if (BT.role === 'host') { clearTimeout(BT.next); BT.next = setTimeout(() => hostNext(), 8000); }
    return;
  }
  if (m.t === 'end' && Array.isArray(m.board) && c.phase !== 'end') {
    c.phase = 'end'; c.board = bBoard(m.board);
    const xp = 5 + 2 * (c.myRight || 0); award(xp); save(); c.xp = xp;
    sfx.done(); buzz(40); bRender();
    return;
  }
  if (m.t === 'bye' && BT.role === 'player' && c.phase !== 'end') { c.phase = 'closed'; c.why = '방장이 방을 닫았습니다.'; bRender(); }
}
const bBoard = b => b.filter(p => p && typeof p.id === 'string').slice(0, B_MAX)
  .map(p => ({ id: p.id, name: bClean(p.name) || '친구', score: Math.max(0, Math.round(+p.score || 0)), streak: Math.max(0, +p.streak || 0), right: Math.max(0, +p.right || 0) }));

// 답 고르기 (방장은 바로 자기 채점기에, 친구는 방장에게 보냄)
function bAnswer(j) {
  const c = BT.c; if (!c || c.phase !== 'q' || c.q.mine >= 0 || Date.now() > c.q.until) return;
  c.q.mine = j; const ms = Date.now() - c.q.shown;
  sfx.tap(); buzz(12);
  if (BT.role === 'host') hostTakeAnswer(BT.me.id, c.q.i, j, ms);
  else {
    const i = c.q.i, send = () => BT.mq && BT.mq.pub(bTopic(BT.pin, 'p'), { t: 'ans', id: BT.me.id, i, c: j, ms });
    send(); setTimeout(() => { if (BT.c === c && c.phase === 'q' && c.q.i === i) send(); }, 1500);   // 혹시 빠졌을 때 한 번 더
  }
  $$('.btile', BT.el).forEach((b, k) => { b.disabled = true; b.classList.toggle('picked', k === j); b.classList.toggle('dim', k !== j); });
  const w = $('.bwait', BT.el); if (w) w.hidden = false;
}
function bCount(got, of) {
  if (!BT.c) return; BT.c.got = +got || 0; BT.c.of = +of || 0;
  const el = BT.el && $('.bcount', BT.el); if (el) el.textContent = `${BT.c.got} / ${BT.c.of}명 답함`;
}

/* ── 화면 ── */
function bRender() {
  const el = BT.el; if (!el) return;
  clearInterval(BT.clock); BT.clock = null;
  const v = BT.view, c = BT.c;
  let body = '';
  if (v === 'menu') body = bMenuHtml();
  else if (v === 'setup') body = bSetupHtml();
  else if (v === 'join') body = bJoinHtml();
  else if (v === 'connecting') body = `<div class="bcenter"><div class="bspin"></div><p>대결 서버에 연결하는 중…</p></div>`;
  else if (v === 'error') body = `<div class="bcenter"><p>${esc(BT.err || '문제가 생겼습니다.')}</p><button class="btn wide" data-b="menu">처음으로</button></div>`;
  else if (c) body = c.phase === 'wait' ? `<div class="bcenter"><div class="bspin"></div><p>${c.heard ? '이미 시작한 대결입니다. 다음 문제부터 같이 풀 수 있습니다.' : esc(BT.pin) + '번 방에 들어가는 중…'}</p></div>`
    : c.phase === 'lobby' ? bLobbyHtml() : c.phase === 'q' ? bQuestionHtml() : c.phase === 'rev' ? bRevealHtml() : c.phase === 'end' ? bEndHtml()
    : `<div class="bcenter"><p>${esc(c.why || '대결이 끝났습니다.')}</p><button class="btn wide" data-b="close">나가기</button></div>`;
  const title = BT.pin ? `방 번호 <b>${esc(BT.pin)}</b>` : '친구와 대결';
  el.innerHTML = `<div class="bhead"><button class="iconbtn" data-b="back" aria-label="나가기">${icon('x', 26)}</button><div class="btitle">${title}</div></div>
    <div class="bbanner" hidden></div><div class="bbody"><div class="bin">${body}</div></div>`;
  if (c && c.phase === 'q' && v === 'room') bStartClock();
  if (c && c.phase === 'lobby' && v === 'room') bRenderLobbyList();
  if (c && c.phase === 'end' && v === 'room' && c.board && c.board[0] && c.board[0].id === BT.me.id) bConfetti();
}
function bMenuHtml() {
  const sub = curSub();
  return `<div class="bhero"><div class="bshapes">${[0, 1, 2, 3].map(i => `<span class="c-${B_COLORS[i]}">${bShape(i, 30)}</span>`).join('')}</div>
      <h2>친구와 ${esc(sub.name)} 대결</h2><p>같은 문제를 동시에 풀고, 빨리 맞힐수록 점수를 더 받습니다.</p></div>
    <label class="bfield"><span>내 별명</span><input id="bname" maxlength="10" autocomplete="off" placeholder="예: 역사왕" value="${esc(bName())}"></label>
    <button class="btn wide" data-b="setup">${icon('crown', 22)} 방 만들기</button>
    <button class="btn wide sky" data-b="join">${icon('user', 22)} 친구 방에 참가하기</button>
    <p class="bnote">인터넷이 연결되어 있어야 합니다. 별명과 답은 공개 중계 서버를 거쳐 친구 휴대폰으로 가니, 실명이나 개인정보는 쓰지 마십시오.</p>`;
}
function bSetupHtml() {
  const sub = curSub(), st = BT.setup;
  const units = sub.data.units.filter(u => battlePool(sub.id, u.id).length >= 4);
  if (st.u !== 'all' && !units.some(u => u.id === st.u)) st.u = 'all';
  const sel = units.find(u => u.id === st.u);
  return `<h2 class="bh2">${esc(sub.name)} 대결 방 만들기</h2>
    <h3 class="sect">범위</h3>
    <div class="chips wrap">${[['all', '전체'], ...units.map(u => [u.id, u.no])].map(([id, t]) => `<button class="chip ${st.u === id ? 'on' : ''}" data-bu="${id}">${esc(t)}</button>`).join('')}</div>
    <p class="qrange">${sel ? `${esc(sel.no)} · ${esc(sel.title)}` : `${esc(sub.name)} 전체에서 골고루`}</p>
    <h3 class="sect">문항 수</h3>
    <div class="goals">${[5, 10, 15, 20].map(n => `<button class="chip ${st.n === n ? 'on' : ''}" data-bn="${n}">${n}문제</button>`).join('')}</div>
    <h3 class="sect">문제당 시간</h3>
    <div class="goals">${[10, 20, 30].map(d => `<button class="chip ${st.d === d ? 'on' : ''}" data-bd="${d}">${d}초<small>${{ 10: '번개', 20: '보통', 30: '여유' }[d]}</small></button>`).join('')}</div>
    <p class="bnote">긴 문제는 10초를 더 줍니다.</p>
    <button class="btn wide bgo" data-b="host">방 열기</button>`;
}
function bJoinHtml() {
  return `<h2 class="bh2">친구 방에 참가하기</h2>
    <label class="bfield"><span>방 번호</span><input id="bpin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" placeholder="숫자 여섯 자리" class="bpin"></label>
    <label class="bfield"><span>내 별명</span><input id="bname" maxlength="10" autocomplete="off" placeholder="예: 한문짱" value="${esc(bName())}"></label>
    <button class="btn wide sky" data-b="go">들어가기</button>
    <p class="bnote">방장 화면에 보이는 여섯 자리 번호를 넣습니다. 방장과 같은 과목 문제가 나옵니다.</p>`;
}
function bLobbyHtml() {
  const c = BT.c, info = c.info || {}, host = BT.role === 'host';
  return `<div class="bpinbox"><small>방 번호</small><b>${esc(BT.pin.replace(/(\d{3})(\d{3})/, '$1 $2'))}</b>
      <span>${esc(info.subName || '')} · ${esc(info.range || '')} · ${info.n || ''}문제</span></div>
    ${host ? `<p class="bhint">친구에게 이 번호를 알려 주십시오. 친구는 오티링고 → 퀴즈 → <b>친구와 대결</b> → <b>참가하기</b>에서 넣으면 됩니다.</p>` : `<p class="bhint">들어왔습니다. 방장이 시작하면 문제가 나옵니다.</p>`}
    <h3 class="sect">참가자 <span class="bpc"></span></h3>
    <div class="bplist"></div>
    ${host ? `<button class="btn wide bgo" data-b="start">대결 시작</button>` : `<div class="bcenter small"><div class="bspin"></div></div>`}`;
}
function bRenderLobbyList() {
  const c = BT.c, el = BT.el && $('.bplist', BT.el); if (!c || !el) return;
  const ps = BT.role === 'host' ? [...BT.host.players.values()] : c.players;
  const now = Date.now();
  el.innerHTML = ps.map((p, i) => `<span class="bp c-${B_COLORS[i % 4]}${p.id === BT.me.id ? ' me' : ''}${BT.role === 'host' && !p.host && now - p.seen > 15000 ? ' off' : ''}">${esc(p.name)}${p.id === BT.me.id ? ' (나)' : ''}</span>`).join('');
  const pc = $('.bpc', BT.el); if (pc) pc.textContent = `${ps.length}명`;
  const go = $('[data-b="start"]', BT.el); if (go) go.disabled = ps.length < 2;
}
function bQuestionHtml() {
  const q = BT.c.q;
  let title, box = '', opts;
  if (q.item) {
    const ex = X.exam(q.item), o = bOpts(q.item);
    title = hzWrap(q.item.q); box = ex.prompt;
    opts = q.ord.map(j => q.item.hz ? `<span class="hz">${esc(o[j])}</span>` : hzWrap(o[j]));
  } else {
    title = esc(String(q.txt.q || '문제를 불러오지 못했습니다. 앱을 최신 버전으로 업데이트해 주십시오.').slice(0, 300));
    opts = (Array.isArray(q.txt.o) ? q.txt.o : []).slice(0, 4).map(v => esc(String(v).slice(0, 120)));
  }
  const long = opts.some(h => h.replace(/<[^>]+>/g, '').length > 14);
  return `<div class="bqtop"><span class="bqno">${q.i + 1} / ${q.n}</span><span class="bcount">${BT.c.got || 0} / ${BT.c.of || 0}명 답함</span><span class="bclock">${Math.ceil(Math.max(0, q.until - Date.now()) / 1000)}</span></div>
    <div class="btbar"><i></i></div>
    <div class="bq"><h2 class="bqt">${title}</h2>${box}</div>
    <div class="btiles${long ? ' long' : ''}${q.item && q.item.hz ? ' hzt' : ''}">${opts.map((h, j) => `<button class="btile c-${B_COLORS[j]}" data-bt="${j}"><span class="bts">${bShape(j)}</span><span class="btx">${h}</span></button>`).join('')}</div>
    <p class="bwait" hidden>답을 냈습니다. 다른 친구들을 기다리는 중…</p>`;
}
function bStartClock() {
  const q = BT.c.q, bar = $('.btbar i', BT.el), num = $('.bclock', BT.el);
  const tick = () => {
    const left = Math.max(0, q.until - Date.now());
    if (bar) bar.style.width = (100 * left / (q.dur * 1000)) + '%';
    if (num) { const s = Math.ceil(left / 1000); num.textContent = s; num.classList.toggle('low', s <= 5); }
    if (!left) { clearInterval(BT.clock); BT.clock = null; $$('.btile', BT.el).forEach(b => b.disabled = true); const w = $('.bwait', BT.el); if (w && q.mine < 0) { w.hidden = false; w.textContent = '시간 끝'; } }
  };
  tick(); BT.clock = setInterval(tick, 200);
}
function bRevealHtml() {
  const c = BT.c, q = c.q, r = c.rev, me = r.me;
  const right = q.item ? bOpts(q.item)[q.ord[r.right]] : (q.txt.o || [])[r.right];
  const rightHtml = q.item && q.item.hz ? `<span class="hz">${esc(right)}</span>` : hzWrap(String(right || ''));
  const myRank = r.board.findIndex(p => p.id === BT.me.id) + 1;
  const mine = r.board[myRank - 1];
  const last = q.i + 1 >= r.n;
  return `<div class="brev ${me.ok ? 'ok' : 'no'}"><b>${me.ok ? '정답!' : me.c < 0 ? '시간 초과' : '틀렸습니다'}</b>
      <span>${me.ok ? `+${me.gain}점${mine && mine.streak > 1 ? ` · ${mine.streak}연속 정답` : ''}` : '0점'}</span></div>
    <div class="bans"><small>정답</small><div class="bansv"><span class="bts c-${B_COLORS[r.right]}">${bShape(r.right, 18)}</span>${rightHtml}</div>
      ${q.item && q.item.exp ? `<p class="bexp">${hzWrap(q.item.exp)}</p>` : ''}</div>
    <h3 class="sect">순위 <small class="bmyrank">나는 ${myRank}등</small></h3>
    ${bRankList(r.board.slice(0, 5))}
    ${BT.role === 'host' ? `<button class="btn wide bgo" data-b="next">${last ? '최종 결과 보기' : '다음 문제'} ›</button><p class="bnote">8초 뒤에 자동으로 넘어갑니다.</p>`
      : `<p class="bnote">${last ? '잠시 후 최종 결과가 나옵니다.' : '잠시 후 다음 문제가 나옵니다.'}</p>`}`;
}
function bRankList(list) {
  return `<ol class="brank">${list.map((p, i) => `<li class="${p.id === BT.me.id ? 'me' : ''}"><span class="brk">${i + 1}</span><span class="brn">${esc(p.name)}${p.id === BT.me.id ? ' (나)' : ''}</span><b>${p.score.toLocaleString()}</b></li>`).join('')}</ol>`;
}
function bEndHtml() {
  const c = BT.c, b = c.board || [], myRank = b.findIndex(p => p.id === BT.me.id) + 1, me = b[myRank - 1];
  const pod = [b[1], b[0], b[2]];
  return `<h2 class="bh2 center">최종 결과</h2>
    <div class="bpod">${pod.map((p, i) => p ? `<div class="bpd p${[2, 1, 3][i]}${p.id === BT.me.id ? ' me' : ''}"><span class="bpn">${esc(p.name)}</span><span class="bps">${p.score.toLocaleString()}</span><div class="bpb">${[2, 1, 3][i]}</div></div>` : '<div class="bpd empty"></div>').join('')}</div>
    <div class="bmine"><b>${myRank ? `${myRank}등` : ''}</b> ${me ? `${me.right}문제 맞힘 · ${me.score.toLocaleString()}점` : ''}<span>+${c.xp || 0} XP</span></div>
    ${b.length > 3 ? bRankList(b) : ''}
    <p class="bnote">틀린 문제는 오답 노트에 모아 두었습니다.</p>
    ${BT.role === 'host' ? `<button class="btn wide bgo" data-b="again">같은 친구들과 한 번 더</button>` : `<p class="bnote">방장이 한 번 더 하면 자동으로 이어집니다.</p>`}
    <button class="btn wide ghost" data-b="close">나가기</button>`;
}
function bConfetti() {
  const host = document.createElement('div'); host.className = 'confetti';
  const cols = ['#21A46B', '#2D8CE8', '#F0644F', '#F5B800', '#8B63E6', '#FF8FA3'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i');
    p.style.left = rnd(100) + '%'; p.style.background = pick(cols);
    p.style.animationDelay = (Math.random() * .5) + 's'; p.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
    p.style.setProperty('--dx', (rnd(160) - 80) + 'px'); p.style.setProperty('--r', (rnd(720) - 360) + 'deg');
    host.appendChild(p);
  }
  BT.el.appendChild(host); setTimeout(() => host.remove(), 3200);
}

/* ── 누르기 ── */
document.addEventListener('click', ev => {
  const t = ev.target;
  if (t.closest('[data-battle]')) { sfx.tap(); openBattle(); return; }
  if (!BT.el || !t.closest('#battle')) return;
  const tile = t.closest('[data-bt]'); if (tile) { bAnswer(+tile.dataset.bt); return; }
  const set = t.closest('[data-bu],[data-bn],[data-bd]');
  if (set) { sfx.tap(); if (set.dataset.bu) BT.setup.u = set.dataset.bu; if (set.dataset.bn) BT.setup.n = +set.dataset.bn; if (set.dataset.bd) BT.setup.d = +set.dataset.bd; const y = $('.bbody', BT.el).scrollTop; bRender(); $('.bbody', BT.el).scrollTop = y; return; }
  const b = t.closest('[data-b]'); if (!b) return;
  const a = b.dataset.b; sfx.tap();
  const nameIn = $('#bname', BT.el); if (nameIn && bClean(nameIn.value)) { S.bname = bClean(nameIn.value); save(); }
  if (a === 'back') bBack();
  else if (a === 'close') closeBattle();
  else if (a === 'menu') { bLeave(); bGo('menu'); }
  else if (a === 'setup') { if (!bName()) { toast('별명을 먼저 써 주십시오'); nameIn && nameIn.focus(); return; } bGo('setup'); }
  else if (a === 'join') bGo('join');
  else if (a === 'host') bHostStart();
  else if (a === 'go') bJoin();
  else if (a === 'start') hostStartGame();
  else if (a === 'next') hostNext();
  else if (a === 'again') { const H = BT.host; if (H) { H.phase = 'lobby'; H.i = -1; H.players.forEach(p => { p.score = 0; p.streak = 0; p.right = 0; }); hostBroadcast(); } }
});
document.addEventListener('keydown', ev => {
  if (!BT.el || BT.el.hidden) return;
  if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('#bpin,#bname')) { ev.preventDefault(); const go = $('[data-b="go"],[data-b="setup"]', BT.el); if (go) go.click(); return; }
  if (BT.c && BT.c.phase === 'q' && /^[1-4]$/.test(ev.key) && $('#modal').hidden) bAnswer(+ev.key - 1);
});
// 방장 화면이 잠시 꺼졌다 켜지면 바로 상태를 다시 알림
document.addEventListener('visibilitychange', () => { if (!document.hidden && BT.role === 'host') hostBroadcast(); });
{
  const prevBack = window.__onBack;
  window.__onBack = () => {
    if (BT.el && !BT.el.hidden && $('#modal').hidden) { bBack(); return true; }
    return prevBack ? prevBack() : false;
  };
}
// 퀴즈 화면 맨 위 카드
function battleCard() {
  return `<button class="bcard" data-battle="1"><span class="bcs">${[0, 1, 2, 3].map(i => `<i class="c-${B_COLORS[i]}">${bShape(i, 16)}</i>`).join('')}</span>
    <span class="bct"><b>친구와 대결</b><small>방 번호로 모여서 같은 문제를 동시에 풀 수 있습니다</small></span><span class="bcg">›</span></button>`;
}
