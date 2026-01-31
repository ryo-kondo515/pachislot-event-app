import puppeteer, { Browser, Page } from "puppeteer";

/**
 * User-Agentのリスト
 */
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

/**
 * ランダムなUser-Agentを取得
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * ランダムな待機時間（ミリ秒）
 */
export function getRandomDelay(min: number = 1000, max: number = 3000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 指定時間待機する
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Puppeteerブラウザを起動する
 */
export async function launchBrowser(): Promise<Browser> {
  return await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });
}

/**
 * ページを開いてHTMLを取得する
 */
export async function fetchPageWithPuppeteer(
  url: string,
  options: {
    waitForSelector?: string;
    timeout?: number;
    retries?: number;
  } = {}
): Promise<string | null> {
  const { waitForSelector, timeout = 30000, retries = 3 } = options;

  let browser: Browser | null = null;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Puppeteer] Attempt ${attempt}/${retries}: Fetching ${url}`);

      browser = await launchBrowser();
      const page: Page = await browser.newPage();

      // User-Agentを設定
      const userAgent = getRandomUserAgent();
      await page.setUserAgent(userAgent);
      console.log(`[Puppeteer] Using User-Agent: ${userAgent}`);

      // ビューポートを設定
      await page.setViewport({ width: 1920, height: 1080 });

      // リクエストインターセプトを有効化（画像・フォント・スタイルシートをブロックして高速化）
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        if (["image", "font", "stylesheet"].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      // ページを開く
      console.log(`[Puppeteer] Navigating to ${url}...`);
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout,
      });

      // 指定されたセレクタを待機
      if (waitForSelector) {
        console.log(`[Puppeteer] Waiting for selector: ${waitForSelector}`);
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }

      // ランダムな待機時間
      const randomDelay = getRandomDelay(1000, 2000);
      console.log(`[Puppeteer] Waiting ${randomDelay}ms...`);
      await delay(randomDelay);

      // HTMLを取得
      const html = await page.content();
      console.log(`[Puppeteer] Successfully fetched HTML (${html.length} bytes)`);

      await browser.close();
      return html;
    } catch (error) {
      lastError = error as Error;
      console.error(`[Puppeteer] Attempt ${attempt}/${retries} failed:`, error);

      if (browser) {
        await browser.close().catch(() => {});
      }

      // 最後の試行でない場合は待機してから再試行
      if (attempt < retries) {
        const retryDelay = getRandomDelay(2000, 5000);
        console.log(`[Puppeteer] Retrying in ${retryDelay}ms...`);
        await delay(retryDelay);
      }
    }
  }

  console.error(`[Puppeteer] Failed to fetch ${url} after ${retries} attempts`);
  return null;
}

/**
 * 複数のページを順次取得する
 */
export async function fetchMultiplePagesWithPuppeteer(
  urls: string[],
  options: {
    waitForSelector?: string;
    timeout?: number;
    retries?: number;
    delayBetweenPages?: number;
  } = {}
): Promise<Map<string, string | null>> {
  const { delayBetweenPages = 3000, ...fetchOptions } = options;
  const results = new Map<string, string | null>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[Puppeteer] Fetching page ${i + 1}/${urls.length}: ${url}`);

    const html = await fetchPageWithPuppeteer(url, fetchOptions);
    results.set(url, html);

    // 最後のページでない場合は待機
    if (i < urls.length - 1) {
      const randomDelay = getRandomDelay(delayBetweenPages, delayBetweenPages + 2000);
      console.log(`[Puppeteer] Waiting ${randomDelay}ms before next page...`);
      await delay(randomDelay);
    }
  }

  return results;
}
