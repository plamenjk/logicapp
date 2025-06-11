const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const users = []; // {id, username, password, role}
const tokens = {}; // token => userId
const packages = []; // {id, senderId, receiverId, weight, toOffice, address, price, createdAt, delivered}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function calcPrice(weight, toOffice) {
  const base = toOffice ? 5 : 10;
  return base + weight * 0.5;
}

function authenticate(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !tokens[token]) {
    return res.status(401).json({error: 'Unauthorized'});
  }
  const user = users.find(u => u.id === tokens[token]);
  if (!user) return res.status(401).json({error: 'Invalid token'});
  req.user = user;
  next();
}

function employeeOnly(req, res, next) {
  if (req.user.role !== 'employee') {
    return res.status(403).json({error: 'Forbidden'});
  }
  next();
}

app.post('/register', (req, res) => {
  const {username, password, role} = req.body;
  if (!username || !password || !role) return res.status(400).json({error: 'Missing fields'});
  if (users.find(u => u.username === username)) return res.status(400).json({error: 'User exists'});
  const id = generateId();
  users.push({id, username, password, role});
  res.json({id, username, role});
});

app.post('/login', (req, res) => {
  const {username, password} = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({error: 'Invalid credentials'});
  const token = generateId();
  tokens[token] = user.id;
  res.json({token});
});

app.post('/packages', authenticate, employeeOnly, (req, res) => {
  const {senderId, receiverId, weight, toOffice, address} = req.body;
  if (!senderId || !receiverId || !weight) return res.status(400).json({error: 'Missing fields'});
  const id = generateId();
  const price = calcPrice(weight, toOffice);
  const pack = {id, senderId, receiverId, weight, toOffice: !!toOffice, address, price, createdAt: new Date(), delivered: false};
  packages.push(pack);
  res.json(pack);
});

app.get('/packages', authenticate, (req, res) => {
  if (req.user.role === 'employee') return res.json(packages);
  const userId = req.user.id;
  res.json(packages.filter(p => p.senderId === userId || p.receiverId === userId));
});

app.get('/packages/:id', authenticate, (req, res) => {
  const pack = packages.find(p => p.id === req.params.id);
  if (!pack) return res.status(404).json({error: 'Not found'});
  if (req.user.role === 'employee' || pack.senderId === req.user.id || pack.receiverId === req.user.id) {
    return res.json(pack);
  }
  res.status(403).json({error: 'Forbidden'});
});

app.put('/packages/:id/deliver', authenticate, employeeOnly, (req, res) => {
  const pack = packages.find(p => p.id === req.params.id);
  if (!pack) return res.status(404).json({error: 'Not found'});
  pack.delivered = true;
  res.json(pack);
});

app.get('/revenue', authenticate, employeeOnly, (req, res) => {
  const {start, end} = req.query;
  const startDate = start ? new Date(start) : new Date(0);
  const endDate = end ? new Date(end) : new Date();
  const total = packages.filter(p => p.createdAt >= startDate && p.createdAt <= endDate).reduce((sum, p) => sum + p.price, 0);
  res.json({total});
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
