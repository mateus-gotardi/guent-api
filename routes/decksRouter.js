const express = require("express")
const decksRouter = express.Router()
const User = require('../schemas/User')
const WithAuth = require('../middlewares/users')
const VerifyCards = require('../middlewares/deckMaker')

decksRouter.get('/all', WithAuth, async (req, res) => {
    try {
        user = await User.findById(req.session.login)
        res.status(200).json(user.decks)
    } catch (err) {
        res.status(500).json(err)
    }
})
decksRouter.get('/:faction', WithAuth, async (req, res) => {
    const faction = req.params.faction
    try {
        user = await User.findById(req.session.login)
        res.status(200).json(user.decks[faction])
    } catch (err) {
        res.status(500).json(err)
    }
})

decksRouter.put('/', WithAuth, VerifyCards, async (req, res) => {
    const { userCards, faction } = req.body
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
    const userId = req.session.login
    try {
        let user = await User.findById(userId)
        let userDecks = user.decks
        userCards.map((i) => {
            switch (faction) {
                case "nilfgaardian":
                    userDecks.nilfgaardian.push(i);
                    console.log('saving nilfgaardian...');
                    break;
                case "northern":
                    userDecks.northern.push(i);
                    console.log('saving northern...');
                    break;
                case "scoiatael":
                    userDecks.scoiatael.push(i);
                    console.log('saving scoiatael...');
                    break;
                case "monster":
                    userDecks.monster.push(i)
                    console.log('saving monster...' + i);
                    break;
            }
        })
        user.decks = userDecks
        user.markModified('decks')
        await user.save();


        res.status(200).json({ message: 'cards saved successfully' })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }

})


module.exports = decksRouter;