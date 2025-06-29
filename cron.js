const cron = require('node-cron');
const { bookAppointment } = require('./main');

console.log("🕒 بدء نظام الفحص الدوري كل 10 دقائق...");

cron.schedule('*/10 * * * *', () => {
  console.log("🔁 تنفيذ محاولة جديدة...");
  bookAppointment();
});
