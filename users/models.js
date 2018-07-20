'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const bcrypt = require('bcryptjs')

const UserSchema = mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    questionLog: [{type: mongoose.Schema.Types.ObjectId, ref: 'QuestAns'}],
    scores: [Number]
});

UserSchema.methods.serialize = function() {
    return {
        id: this._id, 
        username: this.username,
        questionLog: this.questionLog,
        scores: this.scores
    }
}

UserSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

// encrypt password with bcrypt
UserSchema.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User};