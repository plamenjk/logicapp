# Logistic Company Web Application

This project provides a simple logistics management API and demo frontend written in Node.js using Express. Users can register with roles, log in, and manage companies, offices, employees/clients and packages.

## Features
- User registration and authentication
- Roles: `employee` and `client`
- Employees can create companies, offices, users and packages, as well as view all packages and revenue reports
- Clients can view only their own packages
- Basic in-memory CRUD endpoints for companies, offices, users and packages
- Simple HTML frontend in `public/` for registration, login and listing packages
- Price is calculated based on weight and delivery type (to office or to address)
- Basic tests using Mocha and Supertest

## Usage

Install dependencies:
```bash
npm install
```

Run tests:
```bash
npm test
```

Start the server:
```bash
npm start
```
The API and frontend will be available on port 3000 by default. Open `http://localhost:3000` in your browser to try the demo UI.
