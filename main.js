require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { solveCaptcha } = require('./captcha');
const { sendNotification } = require('./notify');

// تحميل بيانات المستخدم من user.json
const userDataPath = path.join(__dirname, 'data', 'user.json');
const USER_DATA = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));

async function bookAppointment() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("🌐 فتح الموقع...");
    await page.goto("https://algeria.blsspainvisa.com/arabic/book_appointment.php", {
      waitUntil: 'networkidle2'
    });

    // انتظار القوائم المنسدلة
    await page.waitForSelector('#Centre', { timeout: 15000 });
    await page.select('#Centre', USER_DATA.city);

    await page.waitForSelector('#VisaCategoryId', { timeout: 10000 });
    await page.select('#VisaCategoryId', USER_DATA.visaType);

    await page.waitForSelector('#chkConcent', { timeout: 5000 });
    await page.click('#chkConcent');

    // انتظار الكابتشا وقراءة المفتاح
    await page.waitForSelector('.g-recaptcha', { timeout: 10000 });
    const siteKey = await page.$eval('.g-recaptcha', el => el.getAttribute('data-sitekey'));

    console.log("🧠 جاري حل الكابتشا...");
    const token = await solveCaptcha(siteKey, page.url());

    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${token}";`);
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea[name="g-recaptcha-response"]');
      textarea.style.display = 'block';
    });

    // تعبئة البيانات
    await page.waitForSelector('#txtEmailId', { timeout: 5000 });
    await page.type('#txtEmailId', USER_DATA.email);

    await page.waitForSelector('#txtPassportNumber', { timeout: 5000 });
    await page.type('#txtPassportNumber', USER_DATA.passport);

    // إرسال النموذج
    await page.waitForSelector('#btnSubmit');
    await page.click('#btnSubmit');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // التحقق من توفر موعد
    const isAvailable = await page.evaluate(() => {
      const btn = document.querySelector('input[type="submit"][value="Next"]');
      return btn && !btn.disabled;
    });

    if (isAvailable) {
      console.log("✅ تم العثور على موعد! حجز الموعد الآن...");

      await page.click('input[type="submit"][value="Next"]');
      await page.waitForTimeout(2000);

      // تأكيد الموعد
      await page.click('input[type="submit"][value="Confirm"]');

      await page.waitForSelector('.success-message, .confirmation-message', { timeout: 10000 });

      console.log("🎉 تم الحجز بنجاح!");
      await sendNotification("✅ نجاح حجز الموعد", "تم حجز موعد التأشيرة بنجاح.");
      logAttempt(true, "تم الحجز بنجاح.");
    } else {
      console.log("❌ لا توجد مواعيد متوفرة.");
      logAttempt(false, "لا توجد مواعيد.");
    }

  } catch (error) {
    console.error("⚠️ حدث خطأ:", error.message);
    logAttempt(false, `خطأ: ${error.message}`);
  } finally {
    await browser.close();
  }
}

function logAttempt(success, message) {
  const logMessage = `${new Date().toISOString()} | ${success ? 'SUCCESS' : 'FAIL'} | ${message}\n`;
  const logPath = path.join(__dirname, 'logs', 'history.log');
  fs.appendFileSync(logPath, logMessage);
}

// شغّل السكريبت مباشرة
bookAppointment();
