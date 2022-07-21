const abilities = require('../assets/data/abilities')

export default function createGame(room) {
    const state = {
        player1: { id, name, score, rounds, active: false, table: [], redraws: 2, faction },
        player2: { id, name, score, rounds, active: false, table: [], redraws: 2, faction },
        turn,
        room: room,
        winner: null,
    }
    const player1state = { id, cards: [], discard, decks }
    const player2state = { id, cards: [], discard, decks }

    const observers = []

    function subscribe(observerFunction) {
        observers.push(observerFunction)
    }

    function notifyAll(command) {
        for (const observerFunction of observers) {
            observerFunction(command)
        }
    }

    function setState(newState) {
        Object.assign(state, newState)
    }

    function addPlayer(command) {
        const playerId = command.user._id
        const { name, decks } = command.user
        let success = false
        if (!player1state.id) {
            player1state.id = playerId
            player1state.name = name
            player1state.score = 0
            player1state.rounds = 0
            player1state.active = true
            player1state.decks = decks
            success = true
        } else if (!player2state.id) {
            player2state.id = playerId
            player2state.name = name
            player2state.score = 0
            player2state.rounds = 0
            player2state.active = true
            player2state.decks = decks
            success = true
        }
        if (success) {
            notifyAll({
                type: 'add-player',
                playerId: playerId,
            })
        } else {
            return ({
                type: 'error-add-player',
                playerId: playerId,
            })
        }


    }

    function shuffleCards(command) {
        const playerId = command.playerId
        const faction = command.faction
        const verifyLength = (deck) => {
            let units = 0
            let special = 0
            let leader = 0
            deck.map((card) => {
                if (card.type === 0 || card.type === 1 || card.type === 2) {
                    units += 1
                } else if (card.type === 3) {
                    leader += 1
                } else if (card.type === 4 || card.type === 5) {
                    special += 1
                }
            })
            if (units < 22 || leader !== 1 || special > 10) {
                return false
            } else {
                return true
            }
        }
        let cards = []
        let deck = []
        switch (playerId) {
            case player1state.id:
                deck = player1state.decks[faction]
                if (verifyLength(deck)) {
                    state.player1.faction = faction
                    for (var i = 0; i < 11; i++) {
                        let random = Math.floor(Math.random() * deck.length - 1)
                        cards.push(deck[random])
                        deck.splice(random, random + 1)
                    }
                    player1state.cards = cards
                    player1state.decks[faction] = deck
                }
                break;
            case player2state.id:
                deck = player2state.decks[faction]
                state.player2.faction = faction
                for (var i = 0; i < 11; i++) {
                    let random = Math.floor(Math.random() * deck.length - 1)
                    cards.push(deck[random])
                    deck.splice(random, random + 1)
                }
                player2state.cards = cards
                player2state.decks[faction] = deck
                break;
        }
    }
    function redraw(command) {
        const playerId = command.playerId
        const cardToRedraw = command.card
        switch (playerId) {
            case player1state.id:
                if (state.player1.redraws > 0) {
                    const faction = state.player1.faction
                    let deck = player1state.decks[faction]
                    let cards = player1state.cards
                    let indexRedraw = cards.indexOf(cardToRedraw)
                    cards.splice(indexRedraw, indexRedraw + 1)
                    player1state.discard.push(cardToRedraw)
                    let random = Math.floor(Math.random() * deck.length - 1)
                    let newCard = deck[random]
                    deck.splice(random, random + 1)
                    cards.push(newCard)
                    player1state.cards = cards
                    player1state.decks[faction] = deck
                    player1state.redraws -= 1
                }
                break;
            case player2state.id:
                if (state.player1.redraws > 0) {
                    const faction = state.player2.faction
                    let deck = player2state.decks[faction]
                    let cards = player2state.cards
                    let indexRedraw = cards.indexOf(cardToRedraw)
                    cards.splice(indexRedraw, indexRedraw + 1)
                    player2state.discard.push(cardToRedraw)
                    let random = Math.floor(Math.random() * deck.length - 1)
                    let newCard = deck[random]
                    deck.splice(random, random + 1)
                    cards.push(newCard)
                    player2state.cards = cards
                    player2state.decks[faction] = deck
                    player2state.redraws -= 1
                }
                break;
        }
    }

    function playCard(command) {
        const playerId = command.playerId
        const cardPlayed = command.cardPlayed

        if (state.turn === playerId) {
            switch (playerId) {
                case turn:
                    if (playerId === player1state.id) {
                        let cardIndex = player1state.hand.indexOf(cardPlayed)
                        player1state.hand.splice(cardIndex, cardIndex + 1)
                        state.table.player1.push(cardPlayed)
                        state.score.player1 += cardPlayed.power
                    }

                    else if (playerId == player2State.id) {
                        let cardIndex = player2State.hand.indexOf(cardPlayed)
                        player2state.hand.splice(cardIndex, cardIndex + 1)
                        state.table.player2.push(cardPlayed)
                        state.score.player2 += cardPlayed.power
                    }
                    break;
            }

        }
        notifyAll({
            type: 'play-card',
            playerId: playerId,
        })
    }
    function roundEnd() {
        state.table.player1.map((i) => {
            player1state.discard.push(i)
        })
        state.table.player2.map((i) => {
            player2state.discard.push(i)
        })
        if (state.score.player1 > state.score.player2) {
            state.rounds.player1 += 1
        } else if (state.score.player2 > state.score.player1) {
            state.rounds.player2 += 1
        }
        if (state.rounds.player1 >= 2) {
            state.winner = state.players.player1.id
        } else if (state.rounds.player2 >= 2) {
            state.winner = state.players.player2.id
        }

        state.table.player1 = []
        state.table.player2 = []
        state.score.player1 = 0
        state.score.player2 = 0
        notifyAll({
            type: 'round-end',
            playerId: playerId,
        })
    }

    function removePlayer(command) {
        const playerId = command.playerId
        if (player1state.id === playerId) {

            state.winner === player2state.id
        } else if (player2state.id === playerId) {

            state.winner === player1state.id
        }
        state.player1 = { id: null, name: null, score: 0, rounds: 0, active: false, table: [], redraws: 2, faction: null }
        state.player2 = { id: null, name: null, score: 0, rounds: 0, active: false, table: [], redraws: 2, faction: null }
        player2state.id = null
        player1state.id = null
        notifyAll({
            type: 'remove-player',
            playerId: playerId
        })
    }



    return {
        addPlayer,
        removePlayer,
        state,
        setState,
        subscribe,
        player1state,
        player2state,
        playCard,
        roundEnd,
        shuffleCards,
        redraw
    }
}