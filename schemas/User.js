const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    decks: Array,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
})
userSchema.methods.isCorrectPassword = function (password, callback) {
    bcrypt.compare(password, this.password, function (err, same) {
        if (err) {
            callback(err)
        } else {
            callback(err, same)
        }
    })
}


module.exports = mongoose.model('User', userSchema);
