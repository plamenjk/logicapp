# Logistic Company Web Application

This project provides a minimal example of a logistics management API written in Node.js using Express. It supports registering users with roles, logging in, and managing packages.

## Features
- User registration and authentication
- Roles: `employee` and `client`
- Employees can register packages, view all packages and revenue reports
- Clients can view only their own packages
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
The API will be available on port 3000 by default.
