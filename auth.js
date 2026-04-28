require('dotenv').config();
const { getPage, saveCookies } = require('./browser');

const MOBILE = process.env.VALINOR_MOBILE;
const LOGIN_URL = 'https://valinor.shadowfax.in/login';

async function startLogin() {
  const page = await getPage();
  console.log('Navigating to login page...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForSelector(
    'input[type="tel"], input[type="number"], input[placeholder*="obile"], input[placeholder*="hone"], input[placeholder*="number"]',
    { timeout: 15000 }
  );

  const inputs = await page.$$('input');
  if (inputs.length === 0) throw new Error('No input field found on login page');
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type(MOBILE, { delay: 80 });

  const buttons = await page.$$('button');
  if (buttons.length === 0) throw new Error('No button found on login page');
  await buttons[0].click();

  console.log(`OTP sent to ${MOBILE}`);
  return { success: true, message: `OTP sent to ${MOBILE}` };
}

async function completeLogin(otp) {
  const page = await getPage();
  console.log('Entering OTP...');

  await page.waitForTimeout(2000);
  const inputs = await page.$$('input');
  if (inputs.length === 0) throw new Error('OTP input field not found');

  const otpInput = inputs[inputs.length - 1];
  await otpInput.click({ clickCount: 3 });
  await otpInput.type(String(otp), { delay: 80 });

  const buttons = await page.$$('button');
  const lastBtn = buttons[buttons.length - 1];
  await lastBtn.click();
  
  await page.waitForTimeout(8000);
  await saveCookies();


  console.log('Login successful');
  return { success: true, message: 'Logged in and session saved' };
}
async function startSupportLogin() {
  const page = await getPage();
  await page.goto('https://support.shadowfax.in', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input', { timeout: 15000 });
  const inputs = await page.$$('input');
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type(MOBILE, { delay: 80 });
  const buttons = await page.$$('button');
  await buttons[0].click();
  return { success: true, message: `Support OTP sent to ${MOBILE}` };
}

async function completeSupportLogin(otp) {
  const page = await getPage();
  await page.waitForTimeout(2000);
  const inputs = await page.$$('input');
  const otpInput = inputs[inputs.length - 1];
  await otpInput.click({ clickCount: 3 });
  await otpInput.type(String(otp), { delay: 80 });
  const buttons = await page.$$('button');
  await buttons[buttons.length - 1].click();
  await page.waitForTimeout(8000);
  await saveCookies();
  return { success: true, message: 'Support portal logged in' };
}

module.exports = { startLogin, completeLogin, startSupportLogin, completeSupportLogin };
