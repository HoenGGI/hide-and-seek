(() => {
  'use strict';

  // ===== 기본 설정 =====
  const TILE = 32;
  const COLS = 30;
  const ROWS = 17;
  const W = COLS * TILE;
  const H = ROWS * TILE;
  const STEP = 1 / 120;
  const EPS = 0.01;

  const GRAVITY = 1800;
  const JUMP_V = 560; // 혼자서 약 2.7칸, 친구를 밟으면 약 3.6칸
  const RUN_SPEED = 220;
  const MAX_FALL = 900;
  const BOX_SPEED = 70;
  const PLATFORM_SPEED = 90;
  const COYOTE_TIME = 0.08;
  const JUMP_BUFFER = 0.1;
  const PLAYER_W = 26;
  const PLAYER_H = 28;

  const FONT = "'Jua', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  const PLAYER_COLORS = ['#ff6b6b', '#4dabf7', '#ffa94d', '#51cf66'];
  const LINK_COLORS = { a: '#f06595', b: '#845ef7', c: '#20c997' };
  const KEYMAP = [
    { left: 'KeyA', right: 'KeyD', jump: 'KeyW', down: 'KeyS' },
    { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', down: 'ArrowDown' },
    { left: 'KeyJ', right: 'KeyL', jump: 'KeyI', down: 'KeyK' },
    { left: 'Numpad4', right: 'Numpad6', jump: 'Numpad8', down: 'Numpad5' },
  ];
  const KEY_LABELS = [
    ['A  D', 'W', 'S'],
    ['←  →', '↑', '↓'],
    ['J  L', 'I', 'K'],
    ['넘패드 4  6', '8', '5'],
  ];

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const game = {
    mode: 'title', // title | play | clear | ending
    playerCount: 2,
    startStage: 0,
    levelIndex: 0,
    level: null,
    time: 0,
    levelTime: 0,
    clearTimer: 0,
    particles: [],
  };
  window.game = game;

  // ===== 사운드 =====
  const Sfx = {
    ac: null,
    unlock() {
      if (!this.ac) {
        try {
          this.ac = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          this.ac = null;
        }
      } else if (this.ac.state === 'suspended') {
        this.ac.resume();
      }
    },
    tone(freq, dur, type, vol, slide, delay) {
      const ac = this.ac;
      if (!ac) return;
      const t = ac.currentTime + (delay || 0);
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    play(name) {
      switch (name) {
        case 'jump': this.tone(420, 0.12, 'square', 0.04, 1.6); break;
        case 'key': [660, 880, 1320].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.08, 0, i * 0.07)); break;
        case 'unlock': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.08, 0, i * 0.08)); break;
        case 'enter': this.tone(300, 0.15, 'sine', 0.1, 2); break;
        case 'die': this.tone(320, 0.35, 'sawtooth', 0.05, 0.3); break;
        case 'click': this.tone(220, 0.06, 'square', 0.05); break;
        case 'gate': this.tone(160, 0.25, 'triangle', 0.08, 0.6); break;
        case 'select': this.tone(640, 0.05, 'square', 0.04); break;
        case 'clear': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'square', 0.05, 0, i * 0.09)); break;
      }
    },
  };

  // ===== 입력 =====
  const keys = new Set();
  const pressed = new Set();
  const padPrev = [];
  let menuPadPrev = {};

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    Sfx.unlock();
    keys.add(e.code);
    if (!e.repeat) {
      pressed.add(e.code);
      onMenuKey(e.code);
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function connectedPads() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    return Array.from(list || []).filter(Boolean);
  }

  function readPad(pad) {
    if (!pad) return null;
    const b = (n) => !!(pad.buttons[n] && pad.buttons[n].pressed);
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;
    return {
      left: ax < -0.4 || b(14),
      right: ax > 0.4 || b(15),
      jump: b(0) || b(12),
      down: ay > 0.6 || b(13) || b(1),
      up: ay < -0.6 || b(12),
      start: b(9) || b(0),
      back: b(8),
    };
  }

  function pollInputs() {
    const pads = connectedPads();
    const result = [];
    for (let i = 0; i < 4; i++) {
      const km = KEYMAP[i];
      const pad = readPad(pads[i]);
      const prev = padPrev[i] || {};
      result.push({
        left: keys.has(km.left) || !!(pad && pad.left),
        right: keys.has(km.right) || !!(pad && pad.right),
        jump: keys.has(km.jump) || !!(pad && pad.jump),
        down: keys.has(km.down) || !!(pad && pad.down),
        jumpPressed: pressed.has(km.jump) || !!(pad && pad.jump && !prev.jump),
        downPressed: pressed.has(km.down) || !!(pad && pad.down && !prev.down),
      });
      padPrev[i] = pad || {};
    }
    pressed.clear();
    return result;
  }

  function blankInputs() {
    return [0, 1, 2, 3].map(() => ({ left: false, right: false, jump: false, down: false, jumpPressed: false, downPressed: false }));
  }

  function onMenuKey(code) {
    if (game.mode === 'title') {
      if (code === 'ArrowLeft' || code === 'KeyA') changeCount(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') changeCount(1);
      else if (code === 'ArrowUp' || code === 'KeyW') changeStage(-1);
      else if (code === 'ArrowDown' || code === 'KeyS') changeStage(1);
      else if (code === 'Enter' || code === 'Space') startGame();
    } else if (game.mode === 'play' || game.mode === 'clear') {
      if (code === 'KeyR') restartLevel();
      else if (code === 'Escape') game.mode = 'title';
    } else if (game.mode === 'ending') {
      if (code === 'Enter' || code === 'Space' || code === 'Escape') game.mode = 'title';
    }
  }

  // 타이틀/엔딩 화면에서 게임패드로 메뉴 조작
  function pollMenuPad() {
    if (game.mode !== 'title' && game.mode !== 'ending') {
      menuPadPrev = {};
      return;
    }
    const pad = readPad(connectedPads()[0]);
    if (!pad) return;
    const edge = (k) => pad[k] && !menuPadPrev[k];
    if (game.mode === 'title') {
      if (edge('left')) changeCount(-1);
      if (edge('right')) changeCount(1);
      if (edge('up')) changeStage(-1);
      if (edge('down')) changeStage(1);
      if (edge('start')) startGame();
    } else if (edge('start')) {
      game.mode = 'title';
    }
    menuPadPrev = pad;
  }

  function changeCount(d) {
    game.playerCount = Math.max(2, Math.min(4, game.playerCount + d));
    Sfx.play('select');
  }

  function changeStage(d) {
    game.startStage = (game.startStage + d + LEVELS.length) % LEVELS.length;
    Sfx.play('select');
  }

  // ===== 스테이지 =====
  function startGame(count, stage) {
    if (count) game.playerCount = count;
    if (stage !== undefined) game.startStage = stage;
    loadLevel(game.startStage);
    game.mode = 'play';
  }

  function restartLevel() {
    loadLevel(game.levelIndex);
    game.mode = 'play';
  }

  function nextLevel() {
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.mode = 'ending';
      game.startStage = 0;
      return;
    }
    loadLevel(game.levelIndex + 1);
    game.mode = 'play';
  }

  function loadLevel(index) {
    const def = LEVELS[index];
    const n = game.playerCount;
    const req = (r) => (r === 'all' ? n : Math.min(r || 1, n));
    const L = {
      def,
      grid: [],
      gates: {},
      buttons: [],
      spikes: [],
      boxes: [],
      platforms: [],
      players: [],
      bodies: [],
      door: null,
      key: null,
      spawn: { x: 64, y: H - TILE - PLAYER_H },
    };
    const boxDefs = def.boxes || [];
    const platDefs = def.platforms || [];
    const btnDefs = def.buttons || {};

    for (let r = 0; r < ROWS; r++) {
      const row = def.map[r] || '';
      const cells = [];
      let lastBtn = null;
      let lastPlat = null;
      for (let c = 0; c < COLS; c++) {
        const ch = row[c] || '.';
        let cell = 0;
        if (ch === '#') {
          cell = 1;
        } else if (ch === '^') {
          L.spikes.push({ x: c * TILE + 2, y: r * TILE + TILE - 14, w: TILE - 4, h: 14 });
        } else if (ch >= 'A' && ch <= 'C') {
          cell = ch;
          const id = ch.toLowerCase();
          if (!L.gates[id]) L.gates[id] = { open: false, tiles: [] };
          L.gates[id].tiles.push({ x: c * TILE, y: r * TILE, w: TILE, h: TILE });
        } else if (ch >= 'a' && ch <= 'c') {
          if (lastBtn && lastBtn.id === ch && lastBtn.x + lastBtn.w === c * TILE) {
            lastBtn.w += TILE;
          } else {
            const bd = btnDefs[ch] || {};
            lastBtn = { id: ch, x: c * TILE, w: TILE, floorY: (r + 1) * TILE, req: req(bd.req), latch: !!bd.latch, pressed: false, latched: false, count: 0 };
            L.buttons.push(lastBtn);
          }
        } else if (ch === 'P') {
          L.spawn = { x: c * TILE + (TILE - PLAYER_W) / 2, y: (r + 1) * TILE - PLAYER_H };
        } else if (ch === '*') {
          const kx = c * TILE + TILE / 2;
          const ky = r * TILE + TILE / 2;
          L.key = { x: kx, y: ky, ox: kx, oy: ky, holder: null, used: false };
        } else if (ch === '@') {
          L.door = { x: c * TILE, y: (r - 1) * TILE, w: TILE, h: TILE * 2, unlocked: false, flash: 0 };
        } else if (ch === 'X') {
          const bd = boxDefs[L.boxes.length] || {};
          const bx = c * TILE;
          const by = r * TILE;
          L.boxes.push(makeBody('box', bx, by, (bd.w || 1) * TILE, (bd.h || 1) * TILE, { weight: req(bd.weight), ox: bx, oy: by, pushDir: 0, pushCount: 0 }));
        } else if (ch === '=') {
          if (lastPlat && lastPlat.x + lastPlat.w === c * TILE) {
            lastPlat.w += TILE;
          } else {
            const pd = platDefs[L.platforms.length] || {};
            const px = c * TILE;
            const py = r * TILE;
            lastPlat = makeBody('platform', px, py, TILE, TILE, {
              x0: px, y0: py,
              x1: px + (pd.dx || 0) * TILE, y1: py + (pd.dy || 0) * TILE,
              links: pd.link ? [].concat(pd.link) : [],
            });
            L.platforms.push(lastPlat);
          }
        }
        if (ch !== '=') lastPlat = null;
        if (!(ch >= 'a' && ch <= 'c')) lastBtn = null;
        cells.push(cell);
      }
      L.grid.push(cells);
    }

    for (let i = 0; i < n; i++) {
      const p = makeBody('player', L.spawn.x + i * TILE, L.spawn.y, PLAYER_W, PLAYER_H, {
        index: i, color: PLAYER_COLORS[i], facing: 1, coyote: 0, jumpBuffer: 0,
        dead: false, entered: false, respawn: 0, squash: 0, walk: 0, label: 3,
      });
      L.players.push(p);
    }

    game.level = L;
    game.levelIndex = index;
    game.levelTime = 0;
    game.clearTimer = 0;
    game.particles = [];
    refreshBodies();
  }

  function makeBody(kind, x, y, w, h, extra) {
    return Object.assign({ kind, x, y, w, h, vx: 0, vy: 0, grounded: false, ground: null, frameDx: 0, frameDy: 0 }, extra);
  }

  function refreshBodies() {
    const L = game.level;
    L.bodies = [...L.platforms, ...L.boxes, ...L.players.filter((p) => !p.dead && !p.entered)];
  }

  // ===== 충돌 =====
  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function tileSolid(c, r) {
    if (c < 0 || c >= COLS || r < 0) return true;
    if (r >= ROWS) return false;
    const cell = game.level.grid[r][c];
    if (cell === 1) return true;
    if (typeof cell === 'string') return !game.level.gates[cell.toLowerCase()].open;
    return false;
  }

  // area 안에 있는 막히는 것(타일, 다른 몸체)마다 cb 호출
  function blockers(ent, area, cb) {
    const c0 = Math.floor(area.x / TILE);
    const c1 = Math.floor((area.x + area.w - EPS) / TILE);
    const r0 = Math.floor(area.y / TILE);
    const r1 = Math.floor((area.y + area.h - EPS) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (tileSolid(c, r)) cb(c * TILE, r * TILE, TILE, TILE, null);
      }
    }
    for (const b of game.level.bodies) {
      if (b !== ent && overlaps(area, b)) cb(b.x, b.y, b.w, b.h, b);
    }
  }

  function moveX(e, dx) {
    if (!dx) return 0;
    const right = e.x + e.w;
    const area = dx > 0 ? { x: right, y: e.y, w: dx, h: e.h } : { x: e.x + dx, y: e.y, w: -dx, h: e.h };
    let allowed = dx;
    blockers(e, area, (bx, by, bw) => {
      if (dx > 0) {
        if (bx >= right - EPS) allowed = Math.min(allowed, Math.max(0, bx - right));
      } else if (bx + bw <= e.x + EPS) {
        allowed = Math.max(allowed, Math.min(0, bx + bw - e.x));
      }
    });
    e.x += allowed;
    return allowed;
  }

  function moveY(e, dy) {
    if (!dy) return 0;
    const bottom = e.y + e.h;
    const area = dy > 0 ? { x: e.x, y: bottom, w: e.w, h: dy } : { x: e.x, y: e.y + dy, w: e.w, h: -dy };
    let allowed = dy;
    let hit = null;
    let found = false;
    blockers(e, area, (bx, by, bw, bh, body) => {
      if (dy > 0) {
        if (by < bottom - EPS) return;
        const a = Math.max(0, by - bottom);
        // 타일과 몸체를 동시에 밟고 있으면 몸체를 땅으로 친다 (움직이는 발판에 실려 가도록)
        if (!found || a < allowed || (a === allowed && body)) {
          allowed = a;
          hit = body;
          found = true;
        }
      } else if (by + bh <= e.y + EPS) {
        const a = Math.min(0, by + bh - e.y);
        if (!found || a > allowed) {
          allowed = a;
          found = true;
        }
      }
    });
    e.y += allowed;
    if (found) {
      if (dy > 0) {
        e.grounded = true;
        e.ground = hit;
      }
      e.vy = 0;
    }
    return allowed;
  }

  // 밟고 있는 것이 움직이면 같이 움직이고, 그다음 자기 속도만큼 움직인다
  function integrate(e, dt) {
    const sx = e.x;
    const sy = e.y;
    const g = e.ground;
    if (g) {
      if (g.frameDx) moveX(e, g.frameDx);
      if (g.frameDy) {
        const vy = e.vy;
        moveY(e, g.frameDy);
        e.vy = vy;
      }
    }
    e.grounded = false;
    e.ground = null;
    moveX(e, e.vx * dt);
    if (e.vy < 0) liftRiders(e, e.vy * dt);
    moveY(e, e.vy * dt);
    e.frameDx = e.x - sx;
    e.frameDy = e.y - sy;
  }

  // 머리 위에 올라탄 것들을 먼저 들어 올려서, 친구를 태운 채로도 점프할 수 있게 한다
  function liftRiders(e, dy) {
    for (const b of game.level.bodies) {
      if (b === e || b.ground !== e || b.kind === 'platform') continue;
      liftRiders(b, dy);
      const vy = b.vy;
      moveY(b, dy);
      b.vy = vy;
      b.ground = null; // 이번 스텝에 한 번 더 따라 올라가지 않도록
      if (b.kind === 'player') b.coyote = 0;
    }
  }

  // ===== 업데이트 =====
  function isLinkActive(id) {
    return game.level.buttons.some((b) => b.id === id && (b.pressed || b.latched));
  }

  function inputDir(inp) {
    return (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  }

  function updatePlatform(pl, dt) {
    const active = pl.links.some(isLinkActive);
    const tx = active ? pl.x1 : pl.x0;
    const ty = active ? pl.y1 : pl.y0;
    const max = PLATFORM_SPEED * dt;
    const sx = pl.x;
    const sy = pl.y;
    let dy = Math.max(-max, Math.min(max, ty - pl.y));
    if (dy > 0) {
      // 내려갈 때 아래에 있는 친구를 깔아뭉개지 않게 멈춘다
      const area = { x: pl.x, y: pl.y + pl.h, w: pl.w, h: dy };
      for (const b of game.level.bodies) {
        if (b !== pl && overlaps(area, b)) dy = Math.min(dy, Math.max(0, b.y - (pl.y + pl.h)));
      }
    }
    pl.y += dy;
    pl.x += Math.max(-max, Math.min(max, tx - pl.x));
    pl.frameDx = pl.x - sx;
    pl.frameDy = pl.y - sy;
  }

  // dir 방향으로 target 을 밀고 있는 플레이어 수 (줄줄이 밀기 포함)
  function countPushers(target, dir, inputs, seen) {
    let n = 0;
    for (const p of game.level.players) {
      if (p.dead || p.entered || seen.has(p)) continue;
      if (inputDir(inputs[p.index]) !== dir) continue;
      if (!(p.y < target.y + target.h - 1 && p.y + p.h > target.y + 1)) continue;
      const gap = dir > 0 ? target.x - (p.x + p.w) : p.x - (target.x + target.w);
      if (gap < -2 || gap > 3) continue;
      seen.add(p);
      n += 1 + countPushers(p, dir, inputs, seen);
    }
    return n;
  }

  function computePush(inputs) {
    for (const b of game.level.boxes) {
      const right = countPushers(b, 1, inputs, new Set());
      const left = countPushers(b, -1, inputs, new Set());
      b.pushCount = Math.max(left, right);
      b.pushDir = 0;
      if (right >= b.weight && left < b.weight) b.pushDir = 1;
      else if (left >= b.weight && right < b.weight) b.pushDir = -1;
    }
  }

  function updateBox(b, dt) {
    b.vx = b.pushDir * BOX_SPEED;
    b.vy = Math.min(b.vy + GRAVITY * dt, MAX_FALL);
    integrate(b, dt);
    if (b.y > H + 100) {
      b.x = b.ox;
      b.y = b.oy;
      b.vy = 0;
    }
  }

  // 공중에 뜬 친구 머리 위에서는 점프할 수 없다 (2단 점프 꼼수 방지)
  function standingFirm(p) {
    if (!p.grounded) return false;
    for (let g = p.ground, depth = 0; g && g.kind === 'player' && depth < 8; g = g.ground, depth++) {
      if (!g.grounded) return false;
    }
    return true;
  }

  function updatePlayer(p, inp, dt) {
    const dir = inputDir(inp);
    p.vx = dir * RUN_SPEED;
    if (dir) p.facing = dir;
    p.coyote = standingFirm(p) ? COYOTE_TIME : p.coyote - dt;
    p.jumpBuffer = inp.jumpPressed ? JUMP_BUFFER : p.jumpBuffer - dt;
    if (p.jumpBuffer > 0 && p.coyote > 0) {
      p.vy = -JUMP_V;
      p.jumpBuffer = 0;
      p.coyote = 0;
      p.ground = null;
      p.squash = -0.2;
      Sfx.play('jump');
    }
    // 점프 키를 일찍 떼면 낮게 뛴다
    const g = !inp.jump && p.vy < 0 ? GRAVITY * 2.2 : GRAVITY;
    p.vy = Math.min(p.vy + g * dt, MAX_FALL);
    const wasGrounded = p.grounded;
    const fallSpeed = p.vy;
    integrate(p, dt);
    if (p.grounded && !wasGrounded && fallSpeed > 350) {
      p.squash = 0.22;
      dust(p.x + p.w / 2, p.y + p.h, 4);
    }
    if (p.grounded && dir) p.walk += dt;
  }

  function freeSpawnSpot(p) {
    const L = game.level;
    for (let k = 0; k < 16; k++) {
      const spot = { x: L.spawn.x + (k % 4) * TILE, y: L.spawn.y - Math.floor(k / 4) * (PLAYER_H + 8), w: p.w, h: p.h };
      if (L.bodies.some((b) => overlaps(spot, b))) continue;
      let blocked = false;
      blockers(null, spot, (bx, by, bw, bh, body) => {
        if (!body) blocked = true;
      });
      if (!blocked) return spot;
    }
    return { x: L.spawn.x, y: L.spawn.y };
  }

  function killPlayer(p) {
    const L = game.level;
    p.dead = true;
    p.respawn = 0.8;
    p.ground = null;
    burst(p.x + p.w / 2, p.y + p.h / 2, p.color, 18);
    Sfx.play('die');
    if (L.key && L.key.holder === p) {
      L.key.holder = null;
      L.key.x = L.key.ox;
      L.key.y = L.key.oy;
    }
    refreshBodies();
  }

  function updateKey(dt) {
    const L = game.level;
    const k = L.key;
    if (!k || k.used) return;
    if (!k.holder) {
      const rect = { x: k.x - 10, y: k.y - 10, w: 20, h: 20 };
      for (const p of L.players) {
        if (!p.dead && !p.entered && overlaps(p, rect)) {
          k.holder = p;
          Sfx.play('key');
          burst(k.x, k.y, '#ffd43b', 10);
          break;
        }
      }
      return;
    }
    const h = k.holder;
    const t = Math.min(1, dt * 14);
    k.x += (h.x + h.w / 2 - h.facing * 12 - k.x) * t;
    k.y += (h.y - 14 - k.y) * t;
    if (L.door && overlaps(h, L.door)) {
      k.used = true;
      k.holder = null;
      L.door.unlocked = true;
      L.door.flash = 1;
      Sfx.play('unlock');
      burst(L.door.x + TILE / 2, L.door.y + TILE, '#ffd43b', 24);
    }
  }

  function updateDoor(inputs) {
    const L = game.level;
    const door = L.door;
    if (!door || !door.unlocked) return;
    let changed = false;
    for (const p of L.players) {
      if (p.dead || !inputs[p.index].downPressed) continue;
      if (p.entered) {
        const spot = { x: door.x + (TILE - p.w) / 2, y: door.y + door.h - p.h, w: p.w, h: p.h };
        if (!L.bodies.some((b) => overlaps(spot, b))) {
          p.entered = false;
          p.x = spot.x;
          p.y = spot.y;
          p.vx = p.vy = 0;
          p.ground = null;
          changed = true;
        }
      } else if (p.grounded && overlaps(p, door)) {
        p.entered = true;
        changed = true;
        Sfx.play('enter');
        burst(door.x + TILE / 2, door.y + TILE * 1.4, p.color, 8);
      }
    }
    if (changed) refreshBodies();
    if (L.players.every((p) => p.entered)) {
      game.mode = 'clear';
      game.clearTimer = 0;
      Sfx.play('clear');
      for (let i = 0; i < 60; i++) confetti();
    }
  }

  function onButtonDirect(b, btn) {
    return b.grounded && !b.ground && Math.abs(b.y + b.h - btn.floorY) < 1 && b.x < btn.x + btn.w && b.x + b.w > btn.x;
  }

  function updateButtons() {
    const L = game.level;
    for (const btn of L.buttons) {
      let count = 0;
      for (const b of L.bodies) {
        if (b.kind === 'platform') continue;
        // 버튼 위의 친구를 밟고 있는 친구도 같이 센다
        let cur = b;
        for (let depth = 0; cur && depth < 8; depth++) {
          if (cur.dead || cur.entered) break;
          if (onButtonDirect(cur, btn)) {
            count++;
            break;
          }
          cur = cur.ground;
        }
      }
      const was = btn.pressed;
      btn.count = count;
      btn.pressed = count >= btn.req;
      if (btn.pressed && !was) Sfx.play('click');
      if (btn.pressed && btn.latch) btn.latched = true;
    }
  }

  function updateGates() {
    const L = game.level;
    for (const id in L.gates) {
      const gate = L.gates[id];
      if (isLinkActive(id)) {
        if (!gate.open) Sfx.play('gate');
        gate.open = true;
      } else if (gate.open) {
        // 누가 문 칸에 서 있으면 닫히지 않는다
        const occupied = gate.tiles.some((t) => L.bodies.some((b) => overlaps(t, b)));
        if (!occupied) {
          gate.open = false;
          Sfx.play('gate');
        }
      }
    }
  }

  function step(inputs, dt) {
    const L = game.level;
    refreshBodies();
    for (const b of [...L.platforms, ...L.boxes, ...L.players]) {
      b.frameDx = 0;
      b.frameDy = 0;
    }
    for (const pl of L.platforms) updatePlatform(pl, dt);
    computePush(inputs);

    // 아래에 있는 것부터 움직여야 위에 올라탄 것이 따라간다
    const movers = L.bodies.filter((b) => b.kind !== 'platform');
    movers.sort((a, b) => {
      const d = b.y + b.h - (a.y + a.h);
      if (Math.abs(d) > 0.5) return d;
      return (a.kind === 'box' ? 0 : 1) - (b.kind === 'box' ? 0 : 1);
    });
    for (const m of movers) {
      if (m.kind === 'box') updateBox(m, dt);
      else updatePlayer(m, inputs[m.index], dt);
    }

    for (const p of L.players) {
      if (!p.dead) continue;
      p.respawn -= dt;
      if (p.respawn <= 0) {
        const spot = freeSpawnSpot(p);
        p.x = spot.x;
        p.y = spot.y;
        p.vx = p.vy = 0;
        p.dead = false;
        p.label = 2;
        refreshBodies();
      }
    }

    updateKey(dt);
    for (const p of L.players) {
      if (p.dead || p.entered) continue;
      if (p.y > H + 40 || L.spikes.some((s) => overlaps(p, s))) killPlayer(p);
    }
    if (game.mode === 'play') updateDoor(inputs);
    refreshBodies();
    updateButtons();
    updateGates();
  }

  // ===== 파티클 =====
  function addParticle(x, y, vx, vy, color, size, life, gravity) {
    game.particles.push({ x, y, vx, vy, color, size, life, max: life, gravity });
  }

  function dust(x, y, n) {
    for (let i = 0; i < n; i++) addParticle(x + (Math.random() - 0.5) * 16, y - 2, (Math.random() - 0.5) * 80, -Math.random() * 40, 'rgba(120,110,100,0.5)', 3 + Math.random() * 2, 0.35, 0);
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 80 + Math.random() * 180;
      addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s - 60, color, 3 + Math.random() * 3, 0.6 + Math.random() * 0.3, 500);
    }
  }

  function confetti() {
    const colors = [...PLAYER_COLORS, '#ffd43b', '#cc5de8'];
    addParticle(Math.random() * W, -10 - Math.random() * 100, (Math.random() - 0.5) * 120, 60 + Math.random() * 120, colors[Math.floor(Math.random() * colors.length)], 4 + Math.random() * 4, 2.5, 200);
  }

  function updateParticles(dt) {
    for (const p of game.particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    game.particles = game.particles.filter((p) => p.life > 0);
  }

  // ===== 그리기 =====
  function text(str, x, y, opts) {
    const o = Object.assign({ size: 18, color: '#3d405b', align: 'center', stroke: null, strokeWidth: 4, baseline: 'middle' }, opts);
    ctx.font = `${o.size}px ${FONT}`;
    ctx.textAlign = o.align;
    ctx.textBaseline = o.baseline;
    if (o.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.strokeWidth;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.color;
    ctx.fillText(str, x, y);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fffaf0');
    g.addColorStop(1, '#fde8cd');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTiles() {
    const L = game.level;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (L.grid[r][c] !== 1) continue;
        const x = c * TILE;
        const y = r * TILE;
        ctx.fillStyle = '#3d405b';
        ctx.fillRect(x, y, TILE + 0.5, TILE + 0.5); // 타일 사이 틈이 보이지 않게 살짝 겹친다
        if (r > 0 && L.grid[r - 1][c] !== 1) {
          ctx.fillStyle = '#7d82b8';
          ctx.fillRect(x, y, TILE, 5);
        }
      }
    }
  }

  function drawGates() {
    const L = game.level;
    for (const id in L.gates) {
      const gate = L.gates[id];
      const color = LINK_COLORS[id];
      for (const t of gate.tiles) {
        if (gate.open) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(t.x + 3, t.y + 3, t.w - 6, t.h - 6);
          ctx.restore();
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(t.x + 2, t.y, t.w - 4, t.h);
          ctx.save();
          ctx.beginPath();
          ctx.rect(t.x + 2, t.y, t.w - 4, t.h);
          ctx.clip();
          ctx.strokeStyle = 'rgba(0,0,0,0.18)';
          ctx.lineWidth = 5;
          for (let i = -TILE; i < TILE * 2; i += 12) {
            ctx.beginPath();
            ctx.moveTo(t.x + i, t.y);
            ctx.lineTo(t.x + i + TILE, t.y + TILE);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }
  }

  function drawSpikes() {
    ctx.fillStyle = '#868e96';
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 1.5;
    for (const s of game.level.spikes) {
      const n = 3;
      const sw = s.w / n;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(s.x + i * sw, s.y + s.h);
        ctx.lineTo(s.x + i * sw + sw / 2, s.y);
        ctx.lineTo(s.x + (i + 1) * sw, s.y + s.h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function drawButtons() {
    for (const btn of game.level.buttons) {
      const color = LINK_COLORS[btn.id];
      const down = btn.pressed || btn.latched;
      ctx.fillStyle = '#495057';
      roundRect(btn.x + 2, btn.floorY - 5, btn.w - 4, 5, 2);
      ctx.fill();
      ctx.fillStyle = color;
      const ph = down ? 3 : 7;
      roundRect(btn.x + 5, btn.floorY - 5 - ph, btn.w - 10, ph, 2);
      ctx.fill();
      if (btn.req > 1 || btn.latch) {
        const label = btn.latched ? '✓' : `${btn.count}/${btn.req}`;
        text(label, btn.x + btn.w / 2, btn.floorY - 24, { size: 16, color, stroke: '#fff' });
      }
    }
  }

  function drawPlatforms() {
    for (const pl of game.level.platforms) {
      const color = LINK_COLORS[pl.links[0]] || '#868e96';
      ctx.save();
      ctx.setLineDash([3, 6]);
      ctx.strokeStyle = 'rgba(61,64,91,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pl.x0 + pl.w / 2, pl.y0 + pl.h / 2);
      ctx.lineTo(pl.x1 + pl.w / 2, pl.y1 + pl.h / 2);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#f2c14e';
      roundRect(pl.x, pl.y, pl.w, pl.h, 4);
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(pl.x + 4, pl.y + pl.h / 2 - 2, pl.w - 8, 4);
    }
  }

  function drawBoxes() {
    for (const b of game.level.boxes) {
      ctx.fillStyle = '#d4a373';
      roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(b.x + 6, b.y + 6);
      ctx.lineTo(b.x + b.w - 6, b.y + b.h - 6);
      ctx.moveTo(b.x + b.w - 6, b.y + 6);
      ctx.lineTo(b.x + 6, b.y + b.h - 6);
      ctx.strokeStyle = 'rgba(139,90,43,0.45)';
      ctx.stroke();
      if (b.weight > 1) {
        const label = b.pushCount > 0 ? `${Math.min(b.pushCount, b.weight)}/${b.weight}` : `${b.weight}명`;
        text(label, b.x + b.w / 2, b.y + b.h / 2, { size: 20, color: '#fff', stroke: '#8b5a2b' });
      }
    }
  }

  function drawDoor() {
    const L = game.level;
    const d = L.door;
    if (!d) return;
    ctx.fillStyle = '#6d4c41';
    roundRect(d.x - 4, d.y - 4, d.w + 8, d.h + 4, 8);
    ctx.fill();
    ctx.fillStyle = d.unlocked ? '#2b2118' : '#a1887f';
    roundRect(d.x, d.y, d.w, d.h, 5);
    ctx.fill();
    if (!d.unlocked) {
      const cx = d.x + d.w / 2;
      const cy = d.y + d.h / 2 + 4;
      ctx.strokeStyle = '#f59f00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 5, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#fcc419';
      roundRect(cx - 8, cy - 4, 16, 12, 2);
      ctx.fill();
    } else {
      const inside = L.players.filter((p) => p.entered);
      inside.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(d.x + 8 + (i % 2) * 16, d.y + 18 + Math.floor(i / 2) * 14, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      text(`${inside.length}/${L.players.length}`, d.x + d.w / 2, d.y - 16, { size: 16, color: '#6d4c41', stroke: '#fff' });
    }
    if (d.flash > 0) {
      ctx.save();
      ctx.globalAlpha = d.flash;
      ctx.fillStyle = '#fff3bf';
      roundRect(d.x - 4, d.y - 4, d.w + 8, d.h + 4, 8);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawKeyShape(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#e67700';
    ctx.fillStyle = '#ffd43b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-5, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(0, -2, 12, 4);
    ctx.strokeRect(0, -2, 12, 4);
    ctx.fillRect(8, 2, 3, 4);
    ctx.fillRect(4, 2, 3, 3);
    ctx.fillStyle = '#e67700';
    ctx.beginPath();
    ctx.arc(-5, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawKey() {
    const k = game.level.key;
    if (!k || k.used) return;
    const bob = k.holder ? 0 : Math.sin(game.time * 3) * 3;
    drawKeyShape(k.x, k.y + bob);
  }

  function drawPlayerShape(x, y, w, h, color, facing, squash, t) {
    const sw = w * (1 + squash);
    const sh = h * (1 - squash);
    const left = x + w / 2 - sw / 2;
    const top = y + h - sh;
    ctx.fillStyle = color;
    // 귀
    ctx.beginPath();
    ctx.moveTo(left + 3, top + 6);
    ctx.lineTo(left + 6, top - 5);
    ctx.lineTo(left + 11, top + 3);
    ctx.moveTo(left + sw - 3, top + 6);
    ctx.lineTo(left + sw - 6, top - 5);
    ctx.lineTo(left + sw - 11, top + 3);
    ctx.fill();
    roundRect(left, top, sw, sh, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // 눈 (가끔 깜빡)
    const blink = Math.sin(t * 1.7 + x * 0.05) > 0.985;
    const ex = left + sw / 2 + facing * 3;
    const ey = top + sh * 0.42;
    ctx.fillStyle = '#fff';
    for (const dx of [-5, 5]) {
      ctx.beginPath();
      if (blink) ctx.ellipse(ex + dx, ey, 4, 1, 0, 0, Math.PI * 2);
      else ctx.ellipse(ex + dx, ey, 4, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!blink) {
      ctx.fillStyle = '#222';
      for (const dx of [-5, 5]) {
        ctx.beginPath();
        ctx.arc(ex + dx + facing * 1.5, ey + 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPlayers() {
    const L = game.level;
    for (const p of L.players) {
      if (p.dead || p.entered) continue;
      const bob = p.grounded && Math.abs(p.vx) > 0 ? Math.abs(Math.sin(p.walk * 18)) * -2 : 0;
      drawPlayerShape(p.x, p.y + bob, p.w, p.h, p.color, p.facing, p.squash, game.time);
    }
    for (const p of L.players) {
      if (p.dead || p.entered || p.label <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.label);
      text(`${p.index + 1}P`, p.x + p.w / 2, p.y - 14, { size: 14, color: p.color, stroke: '#fff' });
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.5));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    const L = game.level;
    text(`STAGE ${game.levelIndex + 1}  ${L.def.name}`, 16, 17, { size: 18, color: '#fff', align: 'left' });
    text('R 다시하기   ESC 메뉴', W - 16, 17, { size: 15, color: '#c9cbe3', align: 'right' });
    if (L.def.hint && game.levelTime < 12) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (12 - game.levelTime) / 1.5);
      text(L.def.hint, W / 2, 56, { size: 18, color: '#3d405b', stroke: '#fffaf0', strokeWidth: 6 });
      ctx.restore();
    }
  }

  function drawClear() {
    const t = Math.min(1, game.clearTimer / 0.4);
    const scale = 0.5 + 0.5 * (1 - Math.pow(1 - t, 3)) + Math.sin(game.clearTimer * 8) * 0.02;
    ctx.save();
    ctx.fillStyle = `rgba(255,250,240,${0.5 * t})`;
    ctx.fillRect(0, 0, W, H);
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    text('CLEAR!', 0, 0, { size: 96, color: '#ff6b6b', stroke: '#fff', strokeWidth: 12 });
    ctx.restore();
  }

  function drawTitle() {
    drawBackground();
    ctx.fillStyle = '#3d405b';
    ctx.fillRect(0, H - 40, W, 40);
    ctx.fillStyle = '#7d82b8';
    ctx.fillRect(0, H - 40, W, 5);

    text('다같이 문으로!', W / 2, 92, { size: 68, color: '#3d405b', stroke: '#fff', strokeWidth: 10 });
    text('친구들과 함께하는 협동 퍼즐', W / 2, 146, { size: 22, color: '#7d6b5d' });

    text('플레이어 수', W / 2 - 150, 206, { size: 18, color: '#7d6b5d' });
    text(`◀  ${game.playerCount}명  ▶`, W / 2 - 150, 240, { size: 32, color: '#3d405b' });
    text('← →', W / 2 - 150, 272, { size: 14, color: '#a0928a' });

    const def = LEVELS[game.startStage];
    text('시작 스테이지', W / 2 + 150, 206, { size: 18, color: '#7d6b5d' });
    text(`${game.startStage + 1}. ${def.name}`, W / 2 + 150, 240, { size: 28, color: '#3d405b' });
    text('↑ ↓', W / 2 + 150, 272, { size: 14, color: '#a0928a' });

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    roundRect(W / 2 - 300, 296, 600, 30 + game.playerCount * 30, 12);
    ctx.fill();
    for (let i = 0; i < game.playerCount; i++) {
      const y = 322 + i * 30;
      const [move, jump, door] = KEY_LABELS[i];
      drawPlayerShape(W / 2 - 272, y - 12, 20, 22, PLAYER_COLORS[i], 1, 0, game.time);
      text(`${i + 1}P`, W / 2 - 234, y, { size: 18, color: PLAYER_COLORS[i], align: 'left' });
      text(`이동 ${move}     점프 ${jump}     문 들어가기 ${door}`, W / 2 - 190, y, { size: 17, color: '#3d405b', align: 'left' });
    }

    if (Math.floor(game.time * 2) % 2 === 0) {
      text('Enter / Space 로 시작', W / 2, 462, { size: 26, color: '#ff6b6b', stroke: '#fff', strokeWidth: 6 });
    }
    text('게임패드를 연결하면 연결한 순서대로 1P, 2P ... 로 조작돼요', W / 2, H - 18, { size: 14, color: '#c9cbe3' });

    // 바닥에서 뛰노는 친구들
    for (let i = 0; i < 4; i++) {
      const x = ((game.time * 60 + i * 230) % (W + 60)) - 30;
      const jump = Math.max(0, Math.sin(game.time * 4 + i * 1.3)) * 22;
      drawPlayerShape(x, H - 40 - PLAYER_H - jump, PLAYER_W, PLAYER_H, PLAYER_COLORS[i], 1, 0, game.time);
    }
  }

  function drawEnding() {
    drawBackground();
    drawParticles();
    text('모든 스테이지 클리어!', W / 2, H / 2 - 50, { size: 60, color: '#ff6b6b', stroke: '#fff', strokeWidth: 10 });
    text('함께해서 즐거웠어요', W / 2, H / 2 + 20, { size: 26, color: '#3d405b' });
    for (let i = 0; i < game.playerCount; i++) {
      const x = W / 2 - (game.playerCount * 44) / 2 + i * 44 + 9;
      const jump = Math.max(0, Math.sin(game.time * 6 + i)) * 20;
      drawPlayerShape(x, H / 2 + 90 - jump, PLAYER_W, PLAYER_H, PLAYER_COLORS[i], 1, 0, game.time);
    }
    if (Math.floor(game.time * 2) % 2 === 0) text('Enter 로 처음으로', W / 2, H - 60, { size: 22, color: '#7d6b5d' });
  }

  function render() {
    if (game.mode === 'title') {
      drawTitle();
      return;
    }
    if (game.mode === 'ending') {
      drawEnding();
      return;
    }
    drawBackground();
    drawDoor();
    drawTiles();
    drawGates();
    drawSpikes();
    drawButtons();
    drawPlatforms();
    drawBoxes();
    drawPlayers();
    drawKey();
    drawParticles();
    drawHUD();
    if (game.mode === 'clear') drawClear();
  }

  function updateVisuals(dt) {
    if (!game.level) return;
    for (const p of game.level.players) {
      p.squash -= p.squash * Math.min(1, dt * 12);
      p.label -= dt;
    }
    if (game.level.door) game.level.door.flash = Math.max(0, game.level.door.flash - dt * 2);
  }

  // ===== 화면 크기 =====
  function resize() {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H) * 0.96;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
    canvas.width = Math.floor(W * scale * dpr);
    canvas.height = Math.floor(H * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ===== 메인 루프 =====
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    game.time += dt;
    pollMenuPad();

    if (game.mode === 'play' || game.mode === 'clear') {
      acc += dt;
      let steps = Math.floor(acc / STEP);
      if (steps > 0) {
        acc -= steps * STEP;
        steps = Math.min(steps, 12);
        const inputs = pollInputs();
        for (let i = 0; i < steps; i++) {
          step(inputs, STEP);
          // 눌린 순간은 첫 스텝에만 적용
          for (const inp of inputs) {
            inp.jumpPressed = false;
            inp.downPressed = false;
          }
        }
      }
      game.levelTime += dt;
      if (game.mode === 'clear') {
        game.clearTimer += dt;
        if (Math.random() < 0.3) confetti();
        if (game.clearTimer > 2) nextLevel();
      }
    } else {
      acc = 0;
      pressed.clear();
      if (game.mode === 'ending' && Math.random() < 0.4) confetti();
    }

    updateParticles(dt);
    updateVisuals(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 테스트/디버그용
  game.api = { startGame, loadLevel, restartLevel, nextLevel, step, blankInputs, STEP, TILE };
})();
