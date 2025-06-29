const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function bookAppointment(user) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://algeria.blsspainglobal.com/DZA/account/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.type('#email', user.email);
    await page.type('#password', user.passport); // مؤقتًا نستخدم رقم الجواز ككلمة مرور
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    // TODO: أضف هنا التصفح داخل الحساب ومحاولة الحجز إن وُجد موعد

    logResult(true, `🟢 تم تسجيل الدخول لـ ${user.email}`);
  } catch (err) {
    logResult(false, `🔴 فشل مع ${user.email} - ${err.message}`);
  } finally {
    await browser.close();
  }
}

function logResult(success, message) {
  const logLine = `${new Date().toISOString()} | ${success ? "SUCCESS" : "FAIL"} | ${message}\n`;
  const logFile = path.join(__dirname, 'logs', 'history.log');
  fs.appendFileSync(logFile, logLine, 'utf8');
}

module.exports = { bookAppointment };
