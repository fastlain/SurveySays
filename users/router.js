'use strict';

const express = require('express');
const router = express.Router();

const {User} = require('./models');

const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config');

const createAuthToken = function (user) {
    return jwt.sign({user}, config.JWT_SECRET, {
        subject: user.username,
        expiresIn: config.JWT_EXPIRY,
        algorithm: 'HS256'
    });
};

router.use(express.json());

// create a new user
router.post('/', (req, res) => {   
    // check for required fields
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'field missing',
            location: missingField
        });
    }

    // check that required fields are strings
    const stringFields = ['username', 'password'];
    const nonStringField = stringFields.find(field => { 
        return (field in req.body && typeof req.body[field] !== 'string');
    });

    if (nonStringField) {
        return res.status(422).json({
          code: 422,
          reason: 'ValidationError',
          message: 'Incorrect field type: expected string',
          location: nonStringField
        });
    }

    // check for fields with whitespace (untrimmed)
    const explicityTrimmedFields = ['username', 'password'];
    const nonTrimmedField = explicityTrimmedFields.find(
      field => req.body[field].trim() !== req.body[field]
    );
  
    if (nonTrimmedField) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'cannot start or end with whitespace',
        location: nonTrimmedField
      });
    }

    // check credential length
    const sizedFields = {
        username: {
          min: 1
        },
        password: {
          min: 10,
          // bcrypt truncates after 72 characters
          max: 72
        }
    };
    
    const tooSmallField = Object.keys(sizedFields).find(field => 
        'min' in sizedFields[field] && req.body[field].trim().length < sizedFields[field].min
    );
    const tooLargeField = Object.keys(sizedFields).find(field =>
        'max' in sizedFields[field] && req.body[field].trim().length > sizedFields[field].max
      );
    
    if (tooSmallField || tooLargeField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: tooSmallField
            ? `must be at least ${sizedFields[tooSmallField].min} characters long`
            : `must be at most ${sizedFields[tooLargeField].max} characters long`,
            location: tooSmallField || tooLargeField
        });
    }

    // Check if username already exists
    let {username, password} = req.body;
    return User.find({username})
        .countDocuments()
        .then(count => {
            if (count > 0) {
                // There is an existing user with the same username
                return Promise.reject({
                    code: 422,
                    reason: 'ValidationError',
                    message: 'already taken',
                    location: 'username'
                });
            }
            // If there is no existing user, hash the password
            return User.hashPassword(password);
        })
        .then(hash => {
            return User.create({
                username,
                password: hash
            });
        })
        .then(user => {
            return res.status(201).json(user.serialize());
        })
        .catch(err => {
            // Forward validation errors on to the client, otherwise give a 500
            // error because something unexpected has happened
            if (err.reason === 'ValidationError') {
                return res.status(err.code).json(err);
            }
            res.status(500).json({
                code: 500,
                message: 'Internal server error'
            });
        });

});

const jwtAuth = passport.authenticate('jwt', {session: false});

// update a user's data (excluding username password and admin status)
router.put('/:id', jwtAuth, (req,res) => {
    // check for required fields
    const requiredFields = ['id', 'username', 'questionLog', 'scores'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'field missing',
            location: missingField
        });
    }

    // check if params.id is the same as the body.id
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        console.error(message);
        return res.status(400).send(message);
    }
    
    User.findOne({_id: req.body.id})
        .then(user => {
            user.scores = req.body.scores;
            user.questionLog = req.body.questionLog;
            user.save();
            return user;
        })
        .then(user => {
            // create and return a new JWT that reflects the updated user data
            const authToken = createAuthToken(user.serialize());
            return res.status(200).json({authToken});
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({message: 'Internal server error'});
        });      
});

router.delete('/:id', jwtAuth, (req,res) => {
    // check for required field
    const requiredFields = ['id'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422,
            reason: 'ValidationError',
            message: 'field missing',
            location: missingField
        });
    }
    
    // check if params.id is the same as the body.id
    if (req.params.id !== req.body.id) {
        const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message});
    }

    return User.deleteOne({_id: req.params.id})
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({message: 'internal server error'});
        });
});

module.exports = router;