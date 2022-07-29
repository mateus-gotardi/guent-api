const express = require("express")
const decksRouter = express.Router()
const User = require('../schemas/User')
const WithAuth = require('../middlewares/users')
const VerifyCards = require('../middlewares/deckMaker')


decksRouter.put('/', VerifyCards, async (req, res) => {
    const { userCards, faction, userId } = req.body
    /*userCards must be an array with the names of the cards, like this:
    userCards = [
      "kayran",
      "leshen",
      "imlerith",
      "draug",
      "avallach",
      "dandelion"
    ]
    */
    try {
        let usr = await User.findById(userId)
        let newDecks = usr.decks
        newDecks[faction] = userCards
        let user = await User.findByIdAndUpdate(userId,
            { $set: { decks: newDecks, updated_at: Date.now() } },
            { upsert: true, 'new': true }
        )
        res.status(200).json({ message: 'cards saved successfully', user: { name: user.name, email: user.email, id: user._id, decks: user.decks, victories: user.victories } })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }

})


module.exports = decksRouter;