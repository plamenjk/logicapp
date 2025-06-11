const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = []; // {id, username, password, role}
const tokens = {}; // token => userId
const companies = []; // {id, name}
const offices = []; // {id, companyId, address}
const packages = []; // {id, companyId, senderId, receiverId, weight, toOffice, officeId, address, price, createdAt, delivered}

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

// ----- User management -----
app.get('/users', authenticate, employeeOnly, (req, res) => {
  res.json(users);
});

app.put('/users/:id', authenticate, employeeOnly, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({error: 'Not found'});
  const {username, password, role} = req.body;
  if (username) user.username = username;
  if (password) user.password = password;
  if (role) user.role = role;
  res.json(user);
});

app.delete('/users/:id', authenticate, employeeOnly, (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({error: 'Not found'});
  const removed = users.splice(idx, 1)[0];
  res.json(removed);
});

// ----- Company management -----
app.get('/companies', authenticate, employeeOnly, (req, res) => {
  res.json(companies);
});

app.post('/companies', authenticate, employeeOnly, (req, res) => {
  const {name} = req.body;
  if (!name) return res.status(400).json({error: 'Missing name'});
  const id = generateId();
  const company = {id, name};
  companies.push(company);
  res.json(company);
});

app.put('/companies/:id', authenticate, employeeOnly, (req, res) => {
  const c = companies.find(c => c.id === req.params.id);
  if (!c) return res.status(404).json({error: 'Not found'});
  if (req.body.name) c.name = req.body.name;
  res.json(c);
});

app.delete('/companies/:id', authenticate, employeeOnly, (req, res) => {
  const idx = companies.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({error: 'Not found'});
  const removed = companies.splice(idx,1)[0];
  res.json(removed);
});

// ----- Office management -----
app.get('/offices', authenticate, employeeOnly, (req, res) => {
  res.json(offices);
});

app.post('/offices', authenticate, employeeOnly, (req, res) => {
  const {companyId, address} = req.body;
  if (!companyId || !address) return res.status(400).json({error: 'Missing fields'});
  if (!companies.find(c => c.id === companyId)) return res.status(400).json({error: 'Invalid company'});
  const id = generateId();
  const office = {id, companyId, address};
  offices.push(office);
  res.json(office);
});

app.put('/offices/:id', authenticate, employeeOnly, (req, res) => {
  const office = offices.find(o => o.id === req.params.id);
  if (!office) return res.status(404).json({error:'Not found'});
  if (req.body.companyId) office.companyId = req.body.companyId;
  if (req.body.address) office.address = req.body.address;
  res.json(office);
});

app.delete('/offices/:id', authenticate, employeeOnly, (req, res) => {
  const idx = offices.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({error:'Not found'});
  const removed = offices.splice(idx,1)[0];
  res.json(removed);
});

app.post('/packages', authenticate, employeeOnly, (req, res) => {
  const {companyId, senderId, receiverId, weight, toOffice, officeId, address} = req.body;
  if (!senderId || !receiverId || !weight) return res.status(400).json({error: 'Missing fields'});
  const id = generateId();
  const price = calcPrice(weight, toOffice);
  const pack = {id, companyId, senderId, receiverId, weight, toOffice: !!toOffice, officeId, address, price, createdAt: new Date(), delivered: false};
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

app.put('/packages/:id', authenticate, employeeOnly, (req, res) => {
  const pack = packages.find(p => p.id === req.params.id);
  if (!pack) return res.status(404).json({error:'Not found'});
  const {senderId, receiverId, weight, toOffice, officeId, address} = req.body;
  if (senderId) pack.senderId = senderId;
  if (receiverId) pack.receiverId = receiverId;
  if (weight) pack.weight = weight;
  if (typeof toOffice !== 'undefined') pack.toOffice = toOffice;
  if (officeId) pack.officeId = officeId;
  if (address) pack.address = address;
  pack.price = calcPrice(pack.weight, pack.toOffice);
  res.json(pack);
});

app.delete('/packages/:id', authenticate, employeeOnly, (req, res) => {
  const idx = packages.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({error:'Not found'});
  const removed = packages.splice(idx,1)[0];
  res.json(removed);
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
