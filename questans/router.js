'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const {QuestAns} = require('./models');

router.get('/', (req,res) => {  
  const questHist = req.query.questHist;
  // convert questHist strings to Mongo ObjectIds
  const questHistObjectIds = questHist.map(id => ObjectId(id));  

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
  
router.post('/', express.json(), (req,res) => {

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