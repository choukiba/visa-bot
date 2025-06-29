require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { solveCaptcha } = require('./captcha');
const { sendNotification } = require('./notify');

const userDataPath = path.join(__dirname, 'data', 'user.json');
const USER_DATA = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));

// تحويل من العربية إلى الفرنسية
const CITY_MAP = {
  "الجزائر": "Alger",
  "وهران": "Oran",
  "عنابة": "Annaba"
};

const VISA_TYPE_MAP = {
  "قصيرة المدى": "court séjour",
  "طويلة المدى": "long séjour"
};

async function bookAppointment() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("🌐 Ouverture du site BLS...");
    await page.goto("https://algeria.blsspainvisa.com/arabic/book_appointment.php", {
      waitUntil: 'networkidle2'
    });

    // استعمال القيم بالفرنسية
    const cityFr = CITY_MAP[USER_DATA.city] || USER_DATA.city;
    const visaFr = VISA_TYPE_MAP[USER_DATA.visaType] || USER_DATA.visaType;

    await page.select('#Centre', cityFr);
    await page.waitForTimeout(1000);
    await page.select('#VisaCategoryId', visaFr);
    await page.waitForTimeout(1000);

    await page.click('#chkConcent');

    const siteKey = await page.$eval('.g-recaptcha', el => el.getAttribute('data-sitekey'));
    const token = await solveCaptcha(siteKey, page.url());

    await page.evaluate(`document.getElementById("g-recaptcha-response").innerHTML="${token}";`);
    await page.evaluate(() => {
      document.querySelector('textarea[name="g-recaptcha-response"]').style.display = 'block';
    });

    await page.type('#txtEmailId', USER_DATA.email);
    await page.type('#txtPassportNumber', USER_DATA.passport);

    await page.click('#btnSubmit');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const isAvailable = await page.evaluate(() => {
      const btn = document.querySelector('input[type="submit"][value="Next"]');
      return btn && !btn.disabled;
    });

    if (isAvailable) {
      console.log("✅ Rendez-vous disponible ! Réservation en cours...");

      await page.click('input[type="submit"][value="Next"]');
      await page.waitForTimeout(2000);
      await page.click('input[type="submit"][value="Confirm"]');
      await page.waitForSelector('.success-message, .confirmation-message', { timeout: 10000 });

      console.log("🎉 Rendez-vous confirmé !");
      await sendNotification("✅ Succès réservation", "Rendez-vous confirmé avec succès.");
      logAttempt(true, "Réservation réussie.");
    } else {
      console.log("❌ Aucun rendez-vous disponible.");
      logAttempt(false, "Aucun rendez-vous disponible.");
    }

  } catch (error) {
    console.error("⚠️ Erreur:", error.message);
    logAttempt(false, `Erreur: ${error.message}`);
  } finally {
    await browser.close();
  }
}

function logAttempt(success, message) {
  const logMessage = `${new Date().toISOString()} | ${success ? 'SUCCESS' : 'FAIL'} | ${message}\n`;
  const logPath = path.join(__dirname, 'logs', 'history.log');
  fs.appendFileSync(logPath, logMessage);
}

module.exports = { bookAppointment };
