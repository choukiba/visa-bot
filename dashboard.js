const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

let cronEnabled = true;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  const logPath = path.join(__dirname, 'logs/history.log');
  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = fs.readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [date, status, ...msg] = line.split('|');
        return {
          date: date?.trim(),
          status: status?.trim(),
          message: msg.join('|').trim()
        };
      });
  }
  res.render('index', { logs, cronEnabled });
});

app.get('/settings', (req, res) => {
  const userDataPath = path.join(__dirname, 'data/user.json');
  const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
  res.render('form', { userData, success: req.query.success === 'true' });
});

app.post('/settings', (req, res) => {
  const userDataPath = path.join(__dirname, 'data/user.json');
  fs.writeFileSync(userDataPath, JSON.stringify(req.body, null, 2));
  res.redirect('/settings?success=true');
});

app.post('/toggle-cron', (req, res) => {
  cronEnabled = !cronEnabled;
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 Dashboard running at http://localhost:${PORT}`);
});
