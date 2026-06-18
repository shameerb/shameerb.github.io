// Drives the system Chrome via puppeteer-core, screenshots each target page,
// and dumps computed styles of the first <p> in <main> for comparison.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://127.0.0.1:4321";
const OUT = "scripts/inspect-out";
mkdirSync(OUT, { recursive: true });

const targets = [
	{ name: "home", url: "/" },
	{ name: "about", url: "/about/" },
	{ name: "projects", url: "/projects/" },
	{ name: "post-raft", url: "/posts/raft/" },
];

const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: "new",
	defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 },
});

const results = [];
for (const t of targets) {
	const page = await browser.newPage();
	await page.goto(BASE + t.url, { waitUntil: "networkidle0", timeout: 30000 });
	// Wait for web fonts to settle.
	await page.evaluate(() => document.fonts.ready);

	const data = await page.evaluate(() => {
		const main = document.querySelector("main");
		// Prefer a paragraph inside .prose (blog body) if present; else first <p> in <main>.
		const firstP = main?.querySelector(".prose p") ?? main?.querySelector("p");
		const h1 = main?.querySelector("h1");
		const pick = (el) => {
			if (!el) return null;
			const cs = getComputedStyle(el);
			return {
				tag: el.tagName,
				classes: el.className,
				fontFamily: cs.fontFamily,
				fontSize: cs.fontSize,
				fontWeight: cs.fontWeight,
				lineHeight: cs.lineHeight,
				letterSpacing: cs.letterSpacing,
				color: cs.color,
				opacity: cs.opacity,
				ancestorOpacities: (() => {
					const xs = [];
					let n = el;
					while (n && n !== document.documentElement) {
						const o = getComputedStyle(n).opacity;
						if (o !== "1") xs.push(`${n.tagName}.${n.className || ""}=${o}`);
						n = n.parentElement;
					}
					return xs;
				})(),
				textSnippet: (el.textContent || "").trim().slice(0, 60),
			};
		};
		return { p: pick(firstP), h1: pick(h1), bodyClass: document.body.className };
	});

	await page.screenshot({ path: `${OUT}/${t.name}.png`, fullPage: false });
	results.push({ ...t, ...data });
	await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
