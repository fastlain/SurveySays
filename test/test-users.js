'use strict';

// import node modules
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const jwt = require('jsonwebtoken');

// set up test environment
const expect = chai.expect;
chai.use(chaiHttp);

// import models and local data
const {User} = require('../users/models');
const {QuestAns} = require('../questans/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL, JWT_SECRET, JWT_EXPIRY} = require('../config');

// define how many questions to seed in the fake database
const numQuestAns = 10;

// Add randomly generated questans documents to test database 
function seedQuestAnsData() {
    const seedData = [];
    for (let i = 0; i < numQuestAns; i += 1) {
        seedData.push(generateQuestAns());
    }    
    return QuestAns.insertMany(seedData);
}

// Generate a fake questans test document
function generateQuestAns() {
    const fakeQuestAns = {
        question: faker.lorem.sentence(),
        answers: []
    };

    // Generate fake answer objects
    for (let i = 0; i < 5; i += 1) {
        const generatedAns = {
            display: faker.random.word(),
            matches: [],
            pts: Math.floor(Math.random()*100) + 1
        };
    
        // add 1-7 random words as matches
        for (let i = 0; i < Math.floor(Math.random()*7) + 1; i += 1) {
            generatedAns.matches.push(faker.random.word());
        }

        fakeQuestAns.answers.push(generatedAns);
    }
    return fakeQuestAns;
}

// create an JWT authentication token for a test user
function createToken(user) {
    const token = jwt.sign(
        {user}, 
        JWT_SECRET,
        {
            subject: user.username,
            expiresIn: JWT_EXPIRY,
            algorithm: 'HS256'
        });
    return token;
}

// get random question ids to simulate a user's question log
function getQuestLog(length) {
    return QuestAns.aggregate([{$sample: {size: length}}, {$project: {_id: true}}])
        .then(ids => {
            let questionLog = [];
            ids.forEach(id => {                
                return questionLog.push(id._id.toString())
            });
            return questionLog;
        });
}

function tearDownDb() {
    return mongoose.connection.dropDatabase();
}

describe('Users API', function() {

    const username = 'exampleUser';
    const password = 'examplePassword';

    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    after(function() {
        return closeServer();
    });
    
    afterEach(function() {
        return tearDownDb();
    });

    describe('POST /users', function() {     
        it('Should reject users with missing username', function() {   
            return chai
                .request(app)
                .post('/users')
                .send({password})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('field missing');
                    expect(res.body.location).to.equal('username');
                });
        });
        it('Should reject users with missing password', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('field missing');
                    expect(res.body.location).to.equal('password');
                });
        });
        it('Should reject users with non-string username', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username: 1234, password})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('Incorrect field type: expected string');
                    expect(res.body.location).to.equal('username');
                });
        });
        it('Should reject users with non-string password', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username, password: 1234})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('Incorrect field type: expected string');
                    expect(res.body.location).to.equal('password');
                });
        });
        it('Should reject users with non-trimmed username', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username: ` ${username} `, password})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('cannot start or end with whitespace');
                    expect(res.body.location).to.equal('username');
                });
        });
        it('Should reject users with non-trimmed password', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username, password:` ${password} `})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('cannot start or end with whitespace');
                    expect(res.body.location).to.equal('password');
                });
        });

        it('Should reject users with empty username', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username: '', password})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('must be at least 1 characters long');
                    expect(res.body.location).to.equal('username');
                });
        });
        it('Should reject users with password less than ten characters', function() {
            return chai
                .request(app)
                .post('/users')
                .send({username, password: '123456789'})
                .then((res) => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('must be at least 10 characters long');
                    expect(res.body.location).to.equal('password');
                });
        });
        it('Should reject users with password greater than 72 characters', function () {
                return chai
                    .request(app)
                    .post('/users')
                    .send({username, password: new Array(73).fill('a').join(''),})
                    .then((res) => {
                        expect(res).to.have.status(422);
                        expect(res.body.reason).to.equal('ValidationError');
                        expect(res.body.message).to.equal('must be at most 72 characters long');
                        expect(res.body.location).to.equal('password');
                    });
        });
        it('Should reject users with duplicate username', function () {
            return User.create({username, password})
                .then(() => {
                    return chai.request(app)
                        .post('/users')
                        .send({username, password});
                })
                .then(res => {
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('already taken');
                    expect(res.body.location).to.equal('username');
                }); 
        });
        it('Should create a new user', function () {
            return chai
                .request(app)
                .post('/users')
                .send({username, password})
                .then(res => {
                    expect(res).to.have.status(201);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.keys(
                        'id',
                        'username',
                        'questionLog',
                        'scores',
                        'admin'
                    );
                    expect(res.body.username).to.equal(username);
                    expect(res.body.questionLog).to.have.length(0);
                    expect(res.body.scores).to.have.length(0);
                    expect(res.body.admin).to.equal(false);
                    return User.findOne({username});
                })
                .then(user => {
                    expect(user).to.not.be.null;
                    expect(user.username).to.equal(username);
                    expect(user.questionLog).to.have.length(0);
                    expect(user.scores).to.have.length(0);
                    expect(user.admin).to.equal(false);
                    return user.validatePassword(password);
                })
                .then(passwordIsCorrect => {
                    expect(passwordIsCorrect).to.be.true;
                });
        });
    });

    describe('PUT /users/:id', function() {     
        it('Should update user data', function() {
            const userData = {
                username: 'testuserA'
            };
            const newUserData = {
                username: 'testuserA',
                scores: [90, 80, 70, 60]
            };

            let token;

            return User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                })
                .then((data) => {
                    token = createToken(userData);
                    newUserData.id = data._id;

                    return seedQuestAnsData();
                })
                .then(() => getQuestLog(3))
                .then(questLog => {
                    newUserData.questionLog = [...questLog]
                    
                    return chai
                        .request(app)
                        .put(`/users/${newUserData.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send(newUserData);
                })
                .then(res => {                    
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.have.keys('authToken');
                    
                    return User.findOne({_id: newUserData.id})
                        .then(user => {
                            let stringLog = user.questionLog.map(score => score.toString());
                            expect(user.scores).to.deep.equal(newUserData.scores);
                            expect(stringLog).to.deep.equal(newUserData.questionLog);
                        });
                });
        });

        it('Should reject requests with missing scores', function() {
            const userData = {
                username: 'testuserA'
            };
            const newUserData = {
                username: 'testuserA'
            };

            let token;

            return User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                })
                .then((data) => {
                    token = createToken(userData);
                    newUserData.id = data._id;

                    return seedQuestAnsData();
                })
                .then(() => getQuestLog(3))
                .then(questLog => {
                    newUserData.questionLog = [...questLog]
                    
                    return chai
                        .request(app)
                        .put(`/users/${newUserData.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send(newUserData);
                })
                .then(res => {                    
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('field missing');
                    expect(res.body.location).to.equal('scores');
                });
        });

        it('Should reject requests with missing questionLogs', function() {
            const userData = {
                username: 'testuserA',
            };
            const newUserData = {
                username: 'testuserA',
                scores: [90, 80, 70, 60]
            };

            let token;

            return User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                })
                .then((data) => {
                    token = createToken(userData);
                    newUserData.id = data._id;
                    
                    return chai
                        .request(app)
                        .put(`/users/${newUserData.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send(newUserData);
                })
                .then(res => {                    
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('field missing');
                    expect(res.body.location).to.equal('questionLog');
                });
        });

        it('Should reject unauthorized PUT requests', function() {
            return chai
                .request(app)
                .put(`/users/1234`)
                .then(res => {
                    expect(res).to.have.status(401);
                });
        });
    });
    
    describe('DELETE /users/:id', function() {
        it('Should delete user with matching id', function() { 
            const userData = {
                username: 'testuserA'
            };
            let token;

            return User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                })
                .then((data) => {
                    token = createToken(userData);
                    userData.id = data._id;
                    
                    return chai
                        .request(app)
                        .delete(`/users/${userData.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send({id: userData.id});
                })
                .then(res => {                    
                    expect(res).to.have.status(204);
                    
                    return User.findOne({_id: userData.id})
                        .then(user => {
                            expect(user).to.be.null;
                        });
                });
        });

        it('Should reject requests if missing required field', function() { 
            const userData = {
                username: 'testuserA'
            };
            let token;

            return User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                })
                .then((data) => {
                    token = createToken(userData);
                    userData.id = data._id;
                    
                    return chai
                        .request(app)
                        .delete(`/users/${userData.id}`)
                        .set('authorization', `Bearer ${token}`)
                })
                .then(res => {                    
                    expect(res).to.have.status(422);
                    expect(res.body.reason).to.equal('ValidationError');
                    expect(res.body.message).to.equal('field missing');
                    expect(res.body.location).to.equal('id');
                });
        });

        it('Should reject requests if param id does not match body id', function() { 
            const userData = {
                username: 'testuserA'
            };
            let token;

            return User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                })
                .then((data) => {
                    token = createToken(userData);
                    userData.id = data._id;
                    
                    return chai
                        .request(app)
                        .delete(`/users/${userData.id}`)
                        .set('authorization', `Bearer ${token}`)
                        .send({id: '1234'});
                })
                .then(res => {                    
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.equal(`Request path id (${userData.id}) and request body id (1234) must match`);
                });
        });
    });
});