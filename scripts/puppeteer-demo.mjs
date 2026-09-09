import puppeteer from 'puppeteer';

const out = '/opt/cursor/artifacts';

async function clickByText(page, text) {
  const box = await page.evaluate((t) => {
    const nodes = Array.from(document.querySelectorAll('div,span,button,a,p'));
    const el = nodes.find((n) => (n.textContent || '').trim().toUpperCase() === t.toUpperCase());
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, text);
  if (!box) throw new Error(`missing ${text}`);
  await page.mouse.click(box.x, box.y);
  await new Promise((r) => setTimeout(r, 1000));
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 120000 });
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});
await page.reload({ waitUntil: 'networkidle0', timeout: 120000 });
await new Promise((r) => setTimeout(r, 2200));

await page.screenshot({ path: `${out}/puppeteer_home_quiet.png` });
await clickByText(page, 'WALK TOWARD NEAREST');
await page.screenshot({ path: `${out}/puppeteer_home_discovered.png` });
await clickByText(page, 'OPEN NOTE');
await page.screenshot({ path: `${out}/puppeteer_note_open.png` });
await clickByText(page, 'ECHO');
await page.screenshot({ path: `${out}/puppeteer_note_echoed.png` });
await clickByText(page, 'RETURN');
await clickByText(page, 'LEAVE A NOTE');
await new Promise((r) => setTimeout(r, 600));
const areas = await page.$$('textarea');
await areas.at(-1).focus();
await page.keyboard.type('Midnight keeps secrets.', { delay: 8 });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: `${out}/puppeteer_drop_compose.png` });
await clickByText(page, 'DROP HERE');
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: `${out}/puppeteer_home_after_drop.png` });
console.log(await page.evaluate(() => document.body.innerText));
await browser.close();
console.log('artifacts written');
