'use strict';

// import node modules
const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// set up test environment
const expect = chai.expect;
chai.use(chaiHttp);

// import local data
const {QuestAns} = require('../questans/models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

// Add randomly generated documents to test database 
function seedQuestAnsData() {
    const seedData = [];
    for (let i = 0; i < 10; i += 1) {
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

// delete the entire test datbase after each test block
function tearDownDb() {
    console.warn('Deleting test database');
    return mongoose.connection.dropDatabase();
}

describe('SurveySays API', function() {
    
    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    after(function() {
        return closeServer();
    });

    describe('QuestAns API resource', function() {
        beforeEach(function() {
            return seedQuestAnsData();
        });
        
        afterEach(function() {
            return tearDownDb();
        });

        describe('GET /questans', function() {
            it('should return 3 questans objects with correct fields', function() {
                let res;
                return chai.request(app)
                    .get('/questans')
                    .then(function(_res) {
                        res = _res;
                        expect(res).to.have.status(200);
                        expect(res).to.be.json;
                        expect(res.body).to.be.an('array');
                        expect(res.body).to.have.lengthOf(3);
                        
                        res.body.forEach(function(questans) {
                            expect(questans).to.be.an('object');
                            expect(questans).to.include.keys('_id', 'question', 'answers','remainingAns');
                            expect(questans.question).to.be.a('string');
                            expect(questans.remainingAns).to.be.a('number');
                            questans.answers.forEach(function(ans){
                                expect(ans).to.be.an('object');
                                expect(ans).to.include.keys('matches','display','pts','guessed');
                                expect(ans.matches).to.have.lengthOf.at.least(1);
                                expect(ans.display).to.be.a('string');
                                expect(ans.pts).to.be.a('number');
                                expect(ans.guessed).to.be.a('boolean');
                            });
                        });
                    });
            });  
        });

        describe('POST /questans', function() {
            it('should add a new questans object', function() {
                const newQuestAns = generateQuestAns();

                return chai.request(app)
                .post('/questans')
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
        });
    });
});