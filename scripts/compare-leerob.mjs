// Compare the visual rhythm of /posts/raft/ against leerob.com/agents.
// Pulls computed styles for body bg, prose paragraphs, headings, images, and inter-element spacing.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "scripts/inspect-out";
mkdirSync(OUT, { recursive: true });

const targets = [
	{ name: "raft-local-dark", url: "http://127.0.0.1:4321/posts/raft/", theme: "dark" },
	{ name: "mdelements-dark", url: "http://127.0.0.1:4321/posts/markdown-elements/", theme: "dark" },
	{ name: "leerob-agents", url: "https://leerob.com/agents", theme: null },
];

const browser = await puppeteer.launch({
	executablePath: CHROME,
	headless: "new",
	defaultViewport: { width: 1280, height: 1600, deviceScaleFactor: 2 },
});

const results = [];
for (const t of targets) {
	const page = await browser.newPage();
	if (t.theme) {
		// Pre-set localStorage theme so ThemeProvider picks it up on first paint.
		await page.evaluateOnNewDocument((theme) => {
			try { localStorage.setItem("theme", theme); } catch {}
		}, t.theme);
	}
	await page.goto(t.url, { waitUntil: "networkidle0", timeout: 45000 });
	await page.evaluate(() => document.fonts.ready);

	const data = await page.evaluate(() => {
		const cs = (el) => (el ? getComputedStyle(el) : null);
		const grab = (el, extra = {}) => {
			if (!el) return null;
			const s = getComputedStyle(el);
			const r = el.getBoundingClientRect();
			return {
				tag: el.tagName,
				cls: el.className?.toString().slice(0, 120) ?? "",
				fontFamily: s.fontFamily,
				fontSize: s.fontSize,
				fontWeight: s.fontWeight,
				lineHeight: s.lineHeight,
				letterSpacing: s.letterSpacing,
				color: s.color,
				marginTop: s.marginTop,
				marginBottom: s.marginBottom,
				width: `${Math.round(r.width)}px`,
				...extra,
			};
		};

		// Find the article-like main column. Try common selectors.
		const article =
			document.querySelector("article") ??
			document.querySelector("main") ??
			document.body;
		const proseRoot =
			article.querySelector(".prose") ??
			article.querySelector('[class*="prose"]') ??
			article;

		const body = document.body;
		const bodyStyle = getComputedStyle(body);
		const html = document.documentElement;

		const ps = Array.from(proseRoot.querySelectorAll("p"));
		const h1 = proseRoot.querySelector("h1") ?? article.querySelector("h1");
		const h2 = proseRoot.querySelector("h2");
		const h3 = proseRoot.querySelector("h3");
		const imgs = Array.from(proseRoot.querySelectorAll("img"));
		const firstImg = imgs[0] ?? null;

		// First "real" body paragraph: skip tiny ones (likely metadata like dates).
		const bodyP =
			ps.find((p) => (p.textContent || "").trim().length > 60) ?? ps[0] ?? null;

		// Measure vertical gap between body p and the next h2 (header-to-content gap signal).
		const findGap = (a, b) => {
			if (!a || !b) return null;
			const ar = a.getBoundingClientRect();
			const br = b.getBoundingClientRect();
			return `${Math.round(br.top - ar.bottom)}px`;
		};
		const h2Next = h2 ? h2.nextElementSibling : null;
		const gapH2ToNext = findGap(h2, h2Next);
		const gapPToNextH2 = bodyP && h2 ? findGap(bodyP, h2) : null;

		return {
			url: location.href,
			theme: html.getAttribute("data-theme"),
			body: {
				bg: bodyStyle.backgroundColor,
				color: bodyStyle.color,
				fontFamily: bodyStyle.fontFamily,
				fontSize: bodyStyle.fontSize,
			},
			proseRoot: {
				tag: proseRoot.tagName,
				cls: proseRoot.className?.toString().slice(0, 120) ?? "",
				width: `${Math.round(proseRoot.getBoundingClientRect().width)}px`,
				maxWidth: getComputedStyle(proseRoot).maxWidth,
			},
			article: {
				width: `${Math.round(article.getBoundingClientRect().width)}px`,
				maxWidth: getComputedStyle(article).maxWidth,
			},
			bodyP: grab(bodyP),
			h1: grab(h1),
			h2: grab(h2),
			h3: grab(h3),
			firstImg: firstImg
				? grab(firstImg, {
						naturalWidth: firstImg.naturalWidth,
						parentTag: firstImg.parentElement?.tagName,
						parentCls: firstImg.parentElement?.className?.toString().slice(0, 100),
						parentWidth: `${Math.round(firstImg.parentElement?.getBoundingClientRect().width ?? 0)}px`,
				  })
				: null,
			imgCount: imgs.length,
			gapPToNextH2,
			gapH2ToNext,
		};
	});

	await page.screenshot({ path: `${OUT}/${t.name}.png`, fullPage: false });
	results.push({ name: t.name, ...data });
	await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
