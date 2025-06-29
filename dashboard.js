const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// عرض السجل
app.get('/', (req, res) => {
  const logPath = path.join(__dirname, 'logs', 'history.log');
  let logs = [];

  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf-8');
    logs = content.trim().split('\n').reverse().slice(0, 20);
  }

  res.render('index', { logs });
});

// عرض نموذج الإعدادات
app.get('/settings', (req, res) => {
  const userDataPath = path.join(__dirname, 'data/user.json');
  const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
  res.render('form', { userData });
});

// حفظ الإعدادات
app.post('/settings', (req, res) => {
  const userDataPath = path.join(__dirname, 'data/user.json');
  fs.writeFileSync(userDataPath, JSON.stringify(req.body, null, 2));
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 Dashboard يعمل على http://localhost:${PORT}`);
});
