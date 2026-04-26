require('dotenv').config();
const { getPage, saveCookies } = require('./browser');

const MOBILE = process.env.VALINOR_MOBILE;
const LOGIN_URL = 'https://valinor.shadowfax.in/login';

async function startLogin() {
  const page = await getPage();
  console.log('Navigating to login page...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for mobile input and enter number
  await page.waitForSelector(
    'input[type="tel"], input[type="number"], input[placeholder*="obile"], input[placeholder*="hone"], input[placeholder*="number"]',
    { timeout: 15000 }
  );

  const inputs = await page.$$('input');
  if (inputs.length === 0) throw new Error('No input field found on login page');
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type(MOBILE, { delay: 80 });

  // Click the first button (Get OTP / Send OTP)
  const buttons = await page.$$('button');
  if (buttons.length === 0) throw new Error('No button found on login page');
  await buttons[0].click();

  console.log(`OTP sent to ${MOBILE}`);
  return { success: true, message: `OTP sent to ${MOBILE}` };
}

async function completeLogin(otp) {
  const page = await getPage();
  console.log('Entering OTP...');

  // Wait for OTP input field to appear
  await page.waitForTimeout(2000);
  const inputs = await page.$$('input');
  if (inputs.length === 0) throw new Error('OTP input field not found');

  // Clear and type OTP
  const otpInput = inputs[inputs.length - 1];
  await otpInput.click({ clickCount: 3 });
  await otpInput.type(String(otp), { delay: 80 });

  // Click submit/verify button
  const buttons = await page.$$('button');
  const lastBtn = buttons[buttons.length - 1];
  await lastBtn.click();

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
  await saveCookies();

  console.log('Login successful');
  return { success: true, message: 'Logged in and session saved' };
}

module.exports = { startLogin, completeLogin };
