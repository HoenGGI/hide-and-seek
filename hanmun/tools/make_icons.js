// 앱 아이콘(초록 바탕에 흰 글자 "오티/링고")을 웹 앱과 안드로이드 런처용 PNG로 만든다.
// 사용법: node tools/make_icons.js   (Noto Sans CJK 글꼴 필요: apt install fonts-noto-cjk)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const WEB = path.resolve(__dirname, '..');
const RES = path.resolve(__dirname, '../../apk_hanmun/app/src/main/res');
const BG = '#1FA36A';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();

  // full: 바탕까지 칠한 아이콘 · fg: 안드로이드 적응형 아이콘용 투명 전경(안전 영역 안쪽)
  async function render(file, size, { bg, scale, round }) {
    const fs1 = size * scale;
    const html = `<html><body style="margin:0;background:transparent">
      <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;${bg ? `background:${bg};` : ''}${round ? `border-radius:${size * round}px;` : ''}overflow:hidden">
        <div style="font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;font-weight:700;color:#fff;font-size:${fs1}px;line-height:1.02;letter-spacing:-.04em;text-align:center">
          오티<br><span style="color:#FFE27A">링고</span></div>
      </div></body></html>`;
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(html);
    await p.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }

  await render(path.join(WEB, 'icon-192.png'), 192, { bg: BG, scale: 0.28 });
  await render(path.join(WEB, 'icon-512.png'), 512, { bg: BG, scale: 0.28 });
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    await render(path.join(RES, `mipmap-${d}`, 'ic_launcher.png'), Math.round(48 * k), { bg: BG, scale: 0.3, round: 0.22 });
    await render(path.join(RES, `mipmap-${d}`, 'ic_launcher_round.png'), Math.round(48 * k), { bg: BG, scale: 0.28, round: 0.5 });
    await render(path.join(RES, `mipmap-${d}`, 'ic_launcher_foreground.png'), Math.round(108 * k), { scale: 0.19 });
  }
  await b.close();
  console.log('icons written');
})();
