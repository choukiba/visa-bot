require('dotenv').config();
const fetch = require('node-fetch');

async function solveCaptcha(siteKey, pageUrl) {
  const apiKey = process.env.TWO_CAPTCHA_KEY;
  const url = `http://2captcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}`;
  const res = await fetch(url);
  const body = await res.text();

  if (!body.startsWith('OK|')) throw new Error("فشل إرسال طلب الكابتشا");

  const requestId = body.split('|')[1];

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const check = await fetch(`http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}`);
    const result = await check.text();
    if (result.includes('OK|')) return result.split('|')[1];
  }

  throw new Error("انتهى الوقت ولم تُحل الكابتشا");
}

module.exports = { solveCaptcha };
