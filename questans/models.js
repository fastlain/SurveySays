'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const questAnsSchema = mongoose.Schema({
    question: {type: String, required: true},
    answers: [
        {
            display: {type: String, required: true},
            matches: [{type: String, required: true}],
            pts: {type: Number, required: true},
            guessed: {type: Boolean, required: true, default: false}
        }
    ],
    remainingAns: {
        type: Number, 
        default: function() {
            return this.answers.length;
        }
    }
});

const QuestAns = mongoose.model('QuestAns', questAnsSchema, 'questans');

module.exports = {QuestAns};