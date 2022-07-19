const verifyCards= (req, res, next) => {
    const {userCards, faction} = req.body
    if (faction === 'northern'){
        const northern = deck.northern.data
        userCards.forEach(card => {
            if(northern.indexof(card.name)===-1){
                return res.status(400).json({error:'invalid cards'})
            }
        })
        next()
    }
}
module.exports =verifyCards;