require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

const COOKIES_PATH = './cookies.json';
let browser = null;
let page = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
    });
  }
  return browser;
}

async function getPage() {
  const b = await getBrowser();
  if (!page || page.isClosed()) {
    page = await b.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1366, height: 768 });
    if (fs.existsSync(COOKIES_PATH)) {
      const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'));
      await page.setCookie(...cookies);
    }
  }
  return page;
}

async function saveCookies() {
  if (!page) return;
  const cookies = await page.cookies();
  fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
  console.log('Session cookies saved');
}

function isSessionSaved() {
  return fs.existsSync(COOKIES_PATH);
}

module.exports = { getPage, saveCookies, isSessionSaved };
