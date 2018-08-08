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
const {QuestAns} = require('../questans/models');
const {User} = require('../users/models');
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

// delete the entire test datbase after each test block
function tearDownDb() {
    return mongoose.connection.dropDatabase();
}

describe('QuestAns API', function() {

    let questHist = [];

    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    after(function() {
        return closeServer();
    });

    beforeEach(function() {
        return seedQuestAnsData()
            .then(() => getQuestLog(numQuestAns - 1))
            .then(questLog => questHist = [...questLog]);
    });
    
    afterEach(function() {
        return tearDownDb();
    });

    describe('GET /questans', function() {           
        it('should return a questans object with correct fields', function() {                
            return chai.request(app)
                .get('/questans')
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('object');
                    expect(res.body).to.include.keys('_id', 'question', 'answers','remainingAns');
                    expect(res.body.question).to.be.a('string');
                    expect(res.body.remainingAns).to.be.a('number');
                    res.body.answers.forEach(function(ans){
                        expect(ans).to.be.an('object');
                        expect(ans).to.include.keys('matches','display','pts','guessed');
                        expect(ans.matches).to.have.lengthOf.at.least(1);
                        expect(ans.display).to.be.a('string');
                        expect(ans.pts).to.be.a('number');
                        expect(ans.guessed).to.be.a('boolean');
                    });
                });
        });

        it('should not return questions in questionLog', function() {
            return chai.request(app)
                .get('/questans')
                .query({questHist})
                .then(function(res) { 
                    expect(res.body._id).to.be.a('string');
                    expect(questHist.indexOf(res.body._id)).to.be.lessThan(0);
                });
        });    
    });

    describe('POST /questans', function() {
        it('should add a new questans object', function() {
            const newQuestAns = generateQuestAns();
            const userData = {
                username: faker.internet.userName(), 
                password: '',
                admin: true
            };

            User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                });
            
            const token = createToken(userData);


            return chai.request(app)
                .post('/questans')
                .set('authorization', `Bearer ${token}`)
                .send(newQuestAns)
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.keys('_id', 'question', 'answers', 'remainingAns');
                    expect(res.body.question).to.equal(newQuestAns.question);
                    for (let i = 0; i < res.body.answers.length; i += 1) {
                        expect(res.body.answers[i].matches).to.deep.equal(newQuestAns.answers[i].matches);
                        expect(res.body.answers[i].display).to.equal(newQuestAns.answers[i].display);
                        expect(res.body.answers[i].pts).to.equal(newQuestAns.answers[i].pts);
                    }
                    return QuestAns.findById(res.body._id);
                })
                .then(function(questans) {
                    expect(questans.question).to.equal(newQuestAns.question);
                    for (let i = 0; i < questans.answers.length; i += 1) {
                        expect(questans.answers[i].matches).to.deep.equal(newQuestAns.answers[i].matches);
                        expect(questans.answers[i].display).to.equal(newQuestAns.answers[i].display);
                        expect(questans.answers[i].pts).to.equal(newQuestAns.answers[i].pts);
                    }
                });
        });

        it('should reject unauthorized users from submiting questions', function() {
            const newQuestAns = generateQuestAns();
            const userData = {
                username: faker.internet.userName(), 
                password: '',
                admin: false
            };

            User.hashPassword('testpassword')
                .then(password => {
                    userData.password = password;
                    return User.create(userData);
                });
            
            const token = createToken(userData);

            return chai.request(app)
            .post('/questans')
            .set('authorization', `Bearer ${token}`)
            .send(newQuestAns)
            .then((res) => expect(res).to.have.status(401));
        });
    });
});