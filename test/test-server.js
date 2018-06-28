'use strict';

// import node modules
const chai = require('chai');
const chaiHttp = require('chai-http');

// set up test environment
const expect = chai.expect;
chai.use(chaiHttp);

// import local files
const {app, runServer, closeServer} = require('../server');

describe('GET endpoints', function() {
    
    before(function() {
        return runServer();
    });
    
    after(function() {
        return closeServer();
      });


    it('should return index.html on GET "/"', function() {
        return chai.request(app).get('/')
            .then(function(res) {
                expect(res).to.have.status(200);
                expect(res).to.be.html;
        });
    });
});