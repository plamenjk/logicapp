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
});
