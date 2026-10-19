(function () {
  const W = 800, H = 500, DURATION = 30, GRACE = 3;
  const PLAYER_R = 10, SEEKER_R = 12;
  const PLAYER_SPEED = 170, PATROL_SPEED = 90, CHASE_SPEED = 140, VISION = 230;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const timerEl = document.getElementById('timer');
  const statusEl = document.getElementById('status');
  const overlay = document.getElementById('overlay');
  const resultEl = document.getElementById('result');
  const detailEl = document.getElementById('detail');

  const obstacles = [
    { x: 120, y: 80, w: 140, h: 50 },
    { x: 340, y: 60, w: 50, h: 150 },
    { x: 560, y: 90, w: 150, h: 60 },
    { x: 80, y: 260, w: 60, h: 140 },
    { x: 250, y: 300, w: 160, h: 50 },
    { x: 500, y: 250, w: 50, h: 160 },
    { x: 630, y: 330, w: 120, h: 60 },
  ];

  const keys = {};
  addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  let player, seeker, elapsed, state, last;

  function hitsObstacle(x, y, r) {
    if (x < r || y < r || x > W - r || y > H - r) return true;
    return obstacles.some(o =>
      x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r);
  }

  // Line of sight: sample points along the segment against obstacles.
  function canSee(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d > VISION) return false;
    const steps = Math.ceil(d / 5);
    for (let i = 1; i < steps; i++) {
      const t = i / steps, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (obstacles.some(o => x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h)) return false;
    }
    return true;
  }

  function randomPoint() {
    for (;;) {
      const x = 20 + Math.random() * (W - 40), y = 20 + Math.random() * (H - 40);
      if (!hitsObstacle(x, y, 16)) return { x, y };
    }
  }

  // Move with per-axis collision so entities slide along walls.
  function move(e, dx, dy, r) {
    if (!hitsObstacle(e.x + dx, e.y, r)) e.x += dx;
    if (!hitsObstacle(e.x, e.y + dy, r)) e.y += dy;
  }

  function start() {
    player = { x: 60, y: 450 };
    seeker = { x: 740, y: 50, target: null, mode: 'patrol', stuck: 0 };
    elapsed = 0;
    state = 'playing';
    overlay.hidden = true;
    last = performance.now();
  }

  function end(won) {
    state = won ? 'won' : 'lost';
    resultEl.textContent = won ? 'You win!' : 'Caught!';
    detailEl.textContent = won
      ? 'You stayed hidden for ' + DURATION + ' seconds.'
      : 'The seeker found you after ' + elapsed.toFixed(1) + ' seconds.';
    overlay.hidden = false;
  }

  function update(dt) {
    elapsed += dt;
    if (elapsed >= DURATION) return end(true);

    let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0);
    let dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    move(player, dx * PLAYER_SPEED * dt, dy * PLAYER_SPEED * dt, PLAYER_R);

    if (elapsed < GRACE) { statusEl.textContent = 'Seeker is counting... hide!'; return; }

    if (canSee(seeker, player)) {
      seeker.mode = 'chase';
      seeker.target = { x: player.x, y: player.y };
    } else if (seeker.mode === 'chase' && !seeker.target) {
      seeker.mode = 'patrol';
    }
    if (!seeker.target) seeker.target = randomPoint();

    statusEl.textContent = seeker.mode === 'chase' ? 'Seeker spotted you!' : 'Seeker is searching...';

    const tx = seeker.target.x - seeker.x, ty = seeker.target.y - seeker.y;
    const dist = Math.hypot(tx, ty);
    if (dist < 8) {
      seeker.target = null;
      seeker.mode = 'patrol';
    } else {
      const speed = (seeker.mode === 'chase' ? CHASE_SPEED : PATROL_SPEED) * dt;
      const sx = seeker.x, sy = seeker.y;
      move(seeker, tx / dist * speed, ty / dist * speed, SEEKER_R);
      // Blocked by an obstacle: give up on this target and pick another.
      if (Math.hypot(seeker.x - sx, seeker.y - sy) < speed * 0.3) {
        if (++seeker.stuck > 10) { seeker.target = randomPoint(); seeker.stuck = 0; }
      } else seeker.stuck = 0;
    }

    if (Math.hypot(seeker.x - player.x, seeker.y - player.y) < PLAYER_R + SEEKER_R) end(false);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#6b4f3a';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

    if (state === 'playing' && elapsed >= GRACE) {
      ctx.beginPath();
      ctx.arc(seeker.x, seeker.y, VISION, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 80, 80, 0.07)';
      ctx.fill();
    }
    ctx.fillStyle = '#e53935';
    ctx.beginPath(); ctx.arc(seeker.x, seeker.y, SEEKER_R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#42a5f5';
    ctx.beginPath(); ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2); ctx.fill();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (state === 'playing') update(dt);
    timerEl.textContent = Math.max(0, DURATION - elapsed).toFixed(1);
    draw();
    requestAnimationFrame(frame);
  }

  document.getElementById('restart').addEventListener('click', start);
  addEventListener('keydown', e => { if (e.key === 'Enter' && state !== 'playing') start(); });
  start();
  requestAnimationFrame(frame);
})();
