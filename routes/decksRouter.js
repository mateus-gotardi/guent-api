const express = require("express")
const decksRouter = express.Router()
const deck = require('../assets/data/deck')
const User = require('../schemas/User')
const WithAuth = require('../middlewares/users')
const VerifyCards = require('../middlewares/deckMaker')

decksRouter.post('/northern', WithAuth, VerifyCards,async (req, res) => {   
    const {userCards, faction} = req.body //cards must be an array of objects(cards)
})


module.exports = decksRouter;