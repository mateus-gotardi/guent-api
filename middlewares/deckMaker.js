const deck = require('../assets/data/deck')
const verifyCards = (req, res, next) => {
    const { userCards, faction } = req.body
    let valid = true
    userCards.map((i) => {
        if (deck[faction].data.indexOf(i)===-1) {
            console.log('not '+faction)
            valid = false
        }
    })
    if (!valid){
        res.status(401).json({ error: 'Invalid cards' })
    }else{
        next()
    }
}
module.exports = verifyCards;