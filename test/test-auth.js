'use strict';

// import node modules
const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken'); 

// set up test environment
const expect = chai.expect;
chai.use(chaiHttp);

// import models and local data
const {User} = require('../users/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL, JWT_SECRET, JWT_EXPIRY} = require('../config');

describe('Auth endpoints', function () {
    const username = 'exampleUser';
    const password = 'examplePass';
    let id = '';
    
    before(function () {
        return runServer(TEST_DATABASE_URL);
      });
    
    after(function () {
      return closeServer();
    });

    beforeEach(function () {
        return User.hashPassword(password).then(password =>
            User.create({
            username,
            password
            })
        )
        .then(user => id = user.id);
    });

    afterEach(function () {
    return User.remove({});
    });

    describe('POST /auth/loginlocal', function () {
        it('Should reject requests with no credentials', function() {
            return chai
                .request(app)
                .post('/auth/loginlocal')
                .then((res) => {
                    expect(res).to.have.status(400);
                });
        });

        it('Should reject requests with incorrect username', function() {
            return chai
                .request(app)
                .post('/auth/loginlocal')
                .send({username:'wronguser', password})
                .then((res) => {
                    expect(res).to.have.status(401);
                });
        });
        it('Should reject requests with incorrect password', function() {
            return chai
                .request(app)
                .post('/auth/loginlocal')
                .send({username, password: 'wrongpassword'})
                .then((res) => {
                    expect(res).to.have.status(401);
                });
        });
        it('Should return a valid JWT', function() {
            return chai
                .request(app)
                .post('/auth/loginlocal')
                .send({username, password})
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    const token = res.body.authToken;
                    expect(token).to.be.a('string');
                    const payload = jwt.verify(token, JWT_SECRET, {
                        algorithm: ['HS256']
                      });                    
                    expect(payload.user).to.deep.equal({
                        id,
                        username,
                        scores: [],
                        questionLog: [],
                        admin: false
                    });
                });
        });
    });

    describe('POST /auth/loginjwt', function () {
        it('Should reject requests with no credentials', function() {
            return chai
                .request(app)
                .post('/auth/loginjwt')
                .then((res) => {
                    expect(res).to.have.status(401);
                });
        });

        it('Should reject requests with an invalid token', function () {
            const token = jwt.sign(
                {user: {username}},
                'wrongsecret',
                {
                    algorithm: 'HS256', 
                    expiresIn: JWT_EXPIRY
                }
            );

            return chai
            .request(app)
            .post('/auth/loginjwt')
            .set('Authorization', `Bearer ${token}`)
            .then((res) => {
                expect(res).to.have.status(401);
            });
        });

        it('Should return a valid auth token with a newer expiry date', function () {
            const token = jwt.sign(
              {user: {username}},
              JWT_SECRET,
              {
                algorithm: 'HS256',
                subject: username,
                expiresIn: JWT_EXPIRY
              }
            );
            const decoded = jwt.decode(token);
      
            return chai
              .request(app)
              .post('/auth/loginjwt')
              .set('authorization', `Bearer ${token}`)
              .then(res => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                const token = res.body.authToken;
                expect(token).to.be.a('string');
                const payload = jwt.verify(token, JWT_SECRET, {
                  algorithm: ['HS256']
                });
                expect(payload.user).to.deep.equal({username});
                expect(payload.exp).to.be.at.least(decoded.exp);
              });
          });
    });
});