const abilities = require('../assets/data/abilities')

export default function createGame(room) {
    const state = {
        modifiers: {
            weather_fog: false,
            weather_rain: false,
            weather_frost: false
        },
        weather_cards: [],
        player1: {
            id,
            name,
            score: () => {
                let total = 0
                if (table.length > 0) {
                    this.table.map((i) => {
                        total += i.power
                    })
                }
                return (total)
            },
            rounds,
            active: false,
            table: [],
            redraws: 2,
            faction,
            modifiers: {//affected cards are staged for later
                active: false,
                morale_boost: [],
                tight_bond: [],
                command_horn: []
            }
        },
        player2: {
            id,
            name,
            score: () => {
                let total = 0
                if (table.length > 0) {
                    this.table.map((i) => {
                        total += i.power
                    })
                }
                return (total)
            },
            rounds,
            active: false,
            table: [],
            redraws: 2,
            faction,
            modifiers: {
                active: false,
                morale_boost: [],
                tight_bond: [],
                command_horn: []
            }
        },
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
        let number = 10
        let cards = []
        let deck = []
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
        const verifyScoiatael = (deck, faction)=>{
            if (faction === 'scoiatael') {
                let index = deck.indexOf({
                    name: "Francesca, Daisy of The Valley",
                    power: 0,
                    ability: "francesca_leader3",
                    img: "francesca_daisy",
                    faction: "scoiatael",
                    type: 3
                })
                if (index >= 0){
                    number = 11
                }
            }
        }
        switch (playerId) {
            case player1state.id:
                deck = player1state.decks[faction]
                verifyScoiatael(deck, faction)
                if (verifyLength(deck)) {
                    state.player1.faction = faction
                    for (var i = 0; i < number; i++) {
                        let random = Math.floor(Math.random() * deck.length - 1)
                        while (deck[random].type === 3) {
                            random = Math.floor(Math.random() * deck.length - 1)
                        }
                        cards.push(deck[random])
                        deck.splice(random, 1)
                    }
                    player1state.cards = cards
                    player1state.decks = deck
                }
                break;
            case player2state.id:
                deck = player2state.decks[faction]
                verifyScoiatael(deck, faction)
                state.player2.faction = faction
                for (var i = 0; i < number; i++) {
                    let random = Math.floor(Math.random() * deck.length - 1)
                    while (deck[random].type === 3) {
                        random = Math.floor(Math.random() * deck.length - 1)
                    }
                    cards.push(deck[random])
                    deck.splice(random, 1)
                }
                player2state.cards = cards
                player2state.decks = deck
                break;
        }
    }
    function redraw(command) {
        const playerId = command.playerId
        const cardToRedraw = command.card
        switch (playerId) {
            case player1state.id:
                if (state.player1.redraws > 0) {
                    let deck = player1state.decks
                    let cards = player1state.cards
                    let indexRedraw = cards.indexOf(cardToRedraw)
                    cards.splice(indexRedraw, 1)
                    player1state.discard.push(cardToRedraw)
                    let random = Math.floor(Math.random() * deck.length - 1)
                    let newCard = deck[random]
                    deck.splice(random, 1)
                    cards.push(newCard)
                    player1state.cards = cards
                    player1state.decks = deck
                    player1state.redraws -= 1
                }
                break;
            case player2state.id:
                if (state.player1.redraws > 0) {
                    let deck = player2state.decks
                    let cards = player2state.cards
                    let indexRedraw = cards.indexOf(cardToRedraw)
                    cards.splice(indexRedraw, 1)
                    player2state.discard.push(cardToRedraw)
                    let random = Math.floor(Math.random() * deck.length - 1)
                    let newCard = deck[random]
                    deck.splice(random, 1)
                    cards.push(newCard)
                    player2state.cards = cards
                    player2state.decks = deck
                    player2state.redraws -= 1
                }
                break;
        }
    }

    function playCard(command) {
        const playerId = command.playerId
        const cardPlayed = command.cardPlayed
        let cardIndex;
        if (state.turn === playerId) {
            switch (playerId) {
                case player1state.id:
                    cardIndex = player1state.cards.indexOf(cardPlayed)
                    player1state.cards.splice(cardIndex, 1)
                    state.table.player1.push(cardPlayed)
                    break;
                case player2state.id:
                    cardIndex = player2State.cards.indexOf(cardPlayed)
                    player2state.cards.splice(cardIndex, 1)
                    state.table.player2.push(cardPlayed)
                    break;
            }

        }
        notifyAll({
            type: 'play-card',
            playerId: playerId,
        })
    }

    function roundEnd() {//reduzir o power se tiver morale_boost
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