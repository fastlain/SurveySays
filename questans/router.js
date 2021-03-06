'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const passport = require('passport');

const {QuestAns} = require('./models');

router.get('/', (req,res) => {  
	let questHistObjectIds = [];
	
	// if request contains question history, convert question ids to ObjectIds
	if (req.query.questHist) {
		const questHist = req.query.questHist;
		// convert questHist strings to Mongo ObjectIds
		questHistObjectIds = questHist.map(id => ObjectId(id));  
	} 

	QuestAns
		//get questions NOT in history and choose 1 at random
		.aggregate([{$match: {_id: {$nin: questHistObjectIds}}}, {$sample: {size: 1}} ])
		.then(questans => {    
			res.json(questans[0]);
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});
});

router.use(express.json());

const jwtAuth = passport.authenticate('jwt', {session: false});

router.post('/', jwtAuth, (req,res) => {

	// check is user is an admin
	if (req.user.admin !== true) {
		return res.status(401).json({message: 'not authorized'});
	}	

	// check for required questans fields
	const requiredFields = ['question', 'answers'];
	for (let i = 0; i < requiredFields.length; i += 1) {
		const field = requiredFields[i];
		if (!(field in req.body)) {
			const message = `Missing field: '${field}' in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}
	
	// check for required questans.answers fields
	const requiredAnsFields = ['display', 'matches', 'pts'];
	for (let j = 0; j < req.body.answers.length; j += 1) {  
		for (let k = 0; k < requiredAnsFields; k += 1) {
			const ansField = requiredAnsFields[k];
			if(!(ansField in req.body.answers)) {
				const message = `Missing field: '${ansField}' in answers[${j}]`;
				console.error(message);
				return res.status(400).send(message);
			}
		}
	}
	
	const newData = {
		question: req.body.question,    
		answers: req.body.answers,
	};
	
	QuestAns
		.create(newData)
		.then(newEntry => res.status(201).json(newEntry))
		.catch(err => {
			console.error(err);
			res.status(500).json({message: 'Internal server error'});
		});  
});

module.exports = router;