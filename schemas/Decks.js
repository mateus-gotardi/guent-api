const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const decksSchema = new mongoose.Schema({
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



module.exports = mongoose.model('User', decksSchema);
