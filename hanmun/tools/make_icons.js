// Render the app icon (mascot on jade) to PNG for the web app and the Android launcher.
// Usage (with the web app served on localhost:8765):  node tools/make_icons.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WEB = path.resolve(__dirname, '..');
const RES = path.resolve(__dirname, '../../apk_hanmun/app/src/main/res');
const BG = '#1FA36A';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:8765/index.html');
  const svg = await p.evaluate(() => mascot('happy', 100).replace('class="m-body"', 'fill="#2F3445"'));

  // full: square tile with background; fg: transparent foreground for Android adaptive icons
  async function render(file, size, { bg, scale, round }) {
    const html = `<html><body style="margin:0;background:transparent">
      <div style="width:${size}px;height:${size}px;display:grid;place-items:center;${bg ? `background:${bg};` : ''}${round ? `border-radius:${size * round}px;` : ''}overflow:hidden">
        <div style="width:${size * scale}px;height:${size * scale}px;display:grid;place-items:center">${svg.replace(/width="\d+" height="\d+"/, `width="${size * scale * 0.86}" height="${size * scale}"`)}</div>
      </div></body></html>`;
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(html);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }

  await render(path.join(WEB, 'icon-192.png'), 192, { bg: BG, scale: 0.7 });
  await render(path.join(WEB, 'icon-512.png'), 512, { bg: BG, scale: 0.7 });
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    await render(path.join(RES, `mipmap-${d}`, 'ic_launcher.png'), Math.round(48 * k), { bg: BG, scale: 0.74, round: 0.22 });
    await render(path.join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), Math.round(48 * k), { bg: BG, scale: 0.7, round: 0.5 });
    await render(path.join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), Math.round(108 * k), { scale: 0.5 });
  }
  await b.close();
  console.log('icons written');
})();
