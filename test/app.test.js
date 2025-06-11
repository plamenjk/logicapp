const should = require("should");
const request = require('supertest');
const app = require('../app');

let server;

describe('Logistic app API', function() {
  before(done => { server = app.listen(4000, done); });
  after(done => server.close(done));

  it('registers and logs in user', async function() {
    const register = await request(server)
      .post('/register')
      .send({username:'emp',password:'pass',role:'employee'})
      .expect(200);
    const login = await request(server)
      .post('/login')
      .send({username:'emp',password:'pass'})
      .expect(200);
    login.body.should.have.property('token');
  });

  it('employee can create company but client cannot', async function() {
    const regEmp = await request(server)
      .post('/register')
      .send({username:'emp2',password:'pass',role:'employee'})
      .expect(200);
    const empLogin = await request(server)
      .post('/login')
      .send({username:'emp2',password:'pass'})
      .expect(200);
    const token = empLogin.body.token;
    await request(server)
      .post('/companies')
      .set('Authorization', token)
      .send({name:'Comp'})
      .expect(200);

    const regCli = await request(server)
      .post('/register')
      .send({username:'cli',password:'pass',role:'client'})
      .expect(200);
    const cliLogin = await request(server)
      .post('/login')
      .send({username:'cli',password:'pass'})
      .expect(200);
    await request(server)
      .post('/companies')
      .set('Authorization', cliLogin.body.token)
      .send({name:'Bad'})
      .expect(403);
  });
});
