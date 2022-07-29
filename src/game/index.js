const abilities = require('../../assets/data/abilities')
const allCards = require('../../assets/data/cards')
const Deck = require('../../assets/data/deck')
function createGame(room) {

    const state = {
        weather_cards: [], // 0 1 and/or 2
        turn,
        room: room,
        winner: null,
        playersId: [],
        error: false
    }
    const playerPrivate = {}
    function setState(newState) {
        Object.assign(state, newState)
    }
    function setPlayerPrivate(newPlayerPrivate) {
        Object.assign(playerPrivate, newPlayerPrivate)
    }
    function addPlayer(command) {
        const playerId = command.userId
        const { name, decks } = command.user
        let newState = state
        let newPlayerPrivate = playerPrivate
        if (newState.playersId.length < 2) {
            newState[playerId] = {
                name: name,
                endTurn: false,
                ready: false,
                score: { total: 0, closeCombat: 0, ranged: 0, siege: 0 },
                rounds,
                units: { closeCombat: 0, ranged: 0, siege: 0 },
                table: [],
                tableDetails: {},
                agile: {},
                discard: [],
                faction: { faction, leader, availableAbility: true },
                modifiers: {
                    morale_boost: [],// example [0,2] corresponds to morale boost for close combat and siege
                    tight_bond: [],
                    command_horn: [],
                }
            }
            newState.playersId.push(playerId)
            newPlayerPrivate[playerId] = { cards: [], decks: decks, redraws: 2 }
            setState(newState)
            setPlayerPrivate(newPlayerPrivate)
        }
    }
    function verifyScore() {
        let meleeScore = 0
        let meleeUnits = 0
        let rangedScore = 0
        let rangedUnits = 0
        let siegeScore = 0
        let siegeUnits = 0
        let tableWithScore = {}
        const hasDuplicates = (array) => {
            let duplicates = array.filter(function (value, index, arr) {
                return value === cardPlayed;
            });
            return (duplicates)
        }

        state.playersId.map((player) => {
            state[player].table.map((card) => {
                let completeCard = allCards[card]
                const tight_bond = () => {
                    const repeatedValues = hasDuplicates(state[player].table)
                    if (repeatedValues.includes[card] && completeCard.ability.includes('tight_bond')) {
                        completeCard.power = completeCard.power * 2
                        tableWithScore[card] = completeCard
                    }
                }
                if (completeCard.ability.includes('agile')) {
                    completeCard = state[player].agile[card]
                }
                switch (completeCard.type) {
                    case 0:
                        meleeUnits += 1
                        if (completeCard.ability.includes('hero')) {
                            meleeScore += completeCard.power
                        } else {
                            if (state.weather_cards.includes(0)) {
                                completeCard.power = 1
                            }
                            if (state[player].modifiers.tight_bond.includes(0)) {
                                tight_bond()
                            } if (state[player].modifiers.morale_boost.includes(0)) {
                                completeCard.power += 1
                                meleeScore += completeCard.power
                            } if (state[player].modifiers.command_horn.includes(0)) {
                                if (cardPlayed !== 'dandelion') {
                                    completeCard.power = completeCard.power * 2
                                }
                                meleeScore += completeCard.power
                            }
                            else {
                                meleeScore += completeCard.power
                            }
                        }
                        tableWithScore[card] = completeCard
                        break;
                    case 1:
                        rangedUnits += 1
                        if (completeCard.ability.includes('hero')) {
                            rangedScore += completeCard.power
                        } else {
                            if (state[player].modifiers.tight_bond.includes(1)) {
                                tight_bond()
                            } else if (state[player].modifiers.morale_boost.includes(1)) {
                                completeCard.power += 1
                                rangedScore += completeCard.power
                            } else if (state[player].modifiers.command_horn.includes(1)) {
                                completeCard.power = completeCard.power * 2
                                rangedScore += completeCard.power
                            }
                            else {
                                rangedScore += completeCard.power
                            }
                        }
                        tableWithScore[card] = completeCard
                        break;
                    case 2:
                        siegeUnits += 1
                        if (completeCard.ability.includes('hero')) {
                            siegeScore += completeCard.power
                        } else {
                            if (state[player].modifiers.tight_bond.includes(2)) {
                                tight_bond()
                            } else if (state[player].modifiers.morale_boost.includes(2)) {
                                completeCard.power += 1
                                siegeScore += completeCard.power
                            } else if (state[player].modifiers.command_horn.includes(2)) {
                                completeCard.power = completeCard.power * 2
                                siegeScore += completeCard.power
                            }
                            else {
                                siegeScore += completeCard.power
                            }
                        }
                        tableWithScore[card] = completeCard
                        break;
                }
            })
            state[player].tableDetails = tableWithScore
            state[player].score = {
                total: meleeScore + rangedScore + siegeScore,
                closeCombat: meleeScore, ranged: rangedScore, siege: siegeScore
            }
            state[player].units = { closeCombat: meleeUnits, ranged: rangedUnits, siege: siegeUnits }
            if (state[player].cards.length <= 0 && !state[player].endTurn) {
                state[player].endTurn = true
            }
        })
        if (state[state.playersId[0]].endTurn && state[state.playersId[1]].endTurn) {
            roundEnd()
        }
    }
    function shuffleCards(command) {
        const playerId = command.playerId
        const opponentPlayerId = state.playersId.find(element => element != playerId)
        const faction = command.faction
        let startCards = 10
        let rawDeck = playerPrivate[playerId].decks[faction]
        let handCards = []
        const verifyDeck = (deck) => {
            let numberOfUnits = 0
            let numberOfSpecial = 0
            let numberOfLeader = 0
            let leader
            let count = 0
            let newDeck = deck
            let error = false
            deck.map((c => {
                if (!Deck[faction].includes(c)) {
                    error = true
                }
                let card = allCards[c]
                if (card.type === 0 || card.type === 1 || card.type === 2) {
                    numberOfUnits += 1
                } else if (card.type === 3) {
                    numberOfLeader += 1
                    leader = c
                    newDeck.splice(count, 1)
                } else if (card.type === 4 || card.type === 5) {
                    numberOfSpecial += 1
                } else {
                    error = true
                }
                count += 1
            }))
            if (error) {
                return ({ error: 'invalid cards in deck' })
            }
            else if (numberOfUnits < 22 || numberOfLeader !== 1 || numberOfSpecial > 10) {
                return ({ error: 'invalid number of cards' })
            } else {
                return ({ leader, finalDeck: newDeck })
            }
        }
        let { leader, finalDeck } = verifyDeck(rawDeck)
        if (leader && finalDeck) {
            verifyLeaderAbility(leader)
            for (var i = 0; i < startCards; i++) {
                let random = Math.floor(Math.random() * deck.length - 1)
                handCards.push = finalDeck[random]
                finalDeck.splice(random, 1)
            }
            state[playerId].faction.faction = faction
            state[playerId].faction.leader = leader
            playerPrivate[playerId].decks = finalDeck
            playerPrivate[playerId].cards = handCards
        }

        const verifyLeaderAbility = function (leader) {
            if (allCards[leader].name === 'Francesca, Daisy of The Valley') {
                startCards = 11
                state[playerId].faction.availableAbility = false
            } else if (allCards[leader].name === 'Emhyr vas Emreis: The White Flame') {
                state[opponentPlayerId].faction.availableAbility = false
                state[playerId].faction.availableAbility = false
            }
        }
    }

    function redraw(command) {
        const playerId = command.playerId
        const cardToRedraw = command.card// raw name of the card
        let newPlayerPrivate = playerPrivate
        if (newPlayerPrivate[playerId].redraws > 0) {
            let deck = playerPrivate[playerId].decks
            let random = Math.floor(Math.random() * deck.length - 1)
            newPlayerPrivate[playerId].cards.push(deck[random])
            deck.splice(random, 1, cardToRedraw)
            newPlayerPrivate[playerId].decks = deck
            newPlayerPrivate[playerId].redraws -= 1
            setState(newState)
            setPlayerPrivate(newPlayerPrivate)
        }
    }

    function playCard(command) {
        const playerId = command.playerId
        if (turn === playerId) {
            const cardPlayed = command.cardPlayed
            let typeBoost = command.type
            let typeAgile = command.typeAgile
            let typeWeather = command.typeWeather
            let cardFromDiscard = command.cardFromDiscard
            let cardsToDiscard = command.cardsToDiscard
            let cardFromTable = command.cardFromTable
            const opponentPlayerId = state.playersId.find(element => element != playerId)
            let newState = state
            let newPlayerPrivate = playerPrivate
            let cardDetails = allCards[cardPlayed]
            const play = () => {// objeto completo da carta
                newState[playerId].table.push(cardPlayed)
                let index = newPlayerPrivate[playerId].cards.indexOf(cardPlayed)
                newPlayerPrivate[playerId].cards.splice(index, 1)
            }
            const verifyAbility = () => {
                let abilityFunction = {
                    'agile': abilities.agile.onBeforePlace,
                    'medic': abilities.medic.onAfterPlace,
                    'muster': abilities.muster.onAfterPlace,
                    'spy': abilities.tight_bond.onAfterPlace,
                    'weather_fog': abilities.weather_fog.weather_fog,
                    'weather_rain': abilities.weather_rain.weather_rain,
                    'weather_frost': abilities.weather_frost.weather_frost,
                    'weather_clear': abilities.weather_clear.weather_clear,
                    'decoy': abilities.weather_decoy.decoy,
                    'scorch_card': abilities.scorch_card.scorch_card,
                    'scorch': abilities.scorch.scorch,
                    'foltest_leader1': abilities.foltest_leader1.onActivate,
                    'foltest_leader2': abilities.foltest_leader2.onActivate,
                    'foltest_leader3': abilities.foltest_leader3.onActivate,
                    'foltest_leader4': abilities.foltest_leader4.onActivate,
                    'francesca_leader1': abilities.francesca_leader1.onActivate,
                    'francesca_leader2': abilities.francesca_leader2.onActivate,
                    'francesca_leader4': abilities.francesca_leader4.onActivate,
                    'eredin_leader1': abilities.eredin_leader1.onActivate,
                    'eredin_leader2': abilities.eredin_leader2.onActivate,
                    'eredin_leader3': abilities.eredin_leader3.onActivate,
                    'eredin_leader4': abilities.eredin_leader4.onActivate,
                    'emreis_leader2': abilities.emreis_leader2.onActivate,
                    'emreis_leader3': abilities.emreis_leader3.onActivate,
                    'emreis_leader4': abilities.emreis_leader4.onActivate,
                }
                let ability = cardDetails.abilities
                if (ability.includes('agile')) {
                    cardDetails = abilityFunction.agile(typeAgile)
                    agile[cardPlayed] = cardDetails
                    play()
                }
                if (ability.includes('morale_boost')) {
                    play()
                    let valid = [0, 1, 2]
                    if (!newState[playerId].modifiers.morale_boost.includes(cardDetails.type) && valid.includes(cardDetails.type)) {
                        newState[playerId].modifiers.morale_boost.push(cardDetails.type)
                    }
                }
                else if (ability.includes('weather')) {
                    newState = abilityFunction[ability](cardPlayed, newState)
                }
                else if (ability.includes('foltest_leader1') ||
                    ability.includes('foltest_leader2') ||
                    ability.includes('francesca_leader1') ||
                    ability.includes('emreis_leader2') ||
                    ability.includes('scorch_card')
                ) {
                    newState = abilityFunction[ability](newState)
                } else if (ability === 'commanders_horn_card') {
                    let valid = [0, 1, 2]
                    if (!newState[playerId].modifiers.command_horn.includes(typeBoost) && valid.includes(typeBoost)) {
                        newState[playerId].modifiers.command_horn.push(typeBoost)
                    }
                } else if (ability === 'commanders_horn') {
                    play()
                    let valid = [0, 1, 2]
                    if (!newState[playerId].modifiers.command_horn.includes(cardDetails.type) && valid.includes(cardDetails.type)) {
                        newState[playerId].modifiers.command_horn.push(cardDetails.type)
                    }
                } else if (ability === 'tight_bond') {
                    play()
                    let valid = [0, 1, 2]
                    if (!newState[playerId].modifiers.tight_bond.includes(cardDetails.type) && valid.includes(cardDetails.type)) {
                        newState[playerId].modifiers.tight_bond.push(cardDetails.type)
                    }
                } else if (ability === 'medic' || ability === 'eredin_leader2') {
                    if (ability === 'medic') {
                        play()
                    }
                    let { discard, table } = abilityFunction[ability](cardFromDiscard,
                        newState[playerId].discard, newState[playerId].table)
                    if (discard && table) {
                        newState[playerId].discard = discard
                        newState[playerId].table = table
                    }
                } else if (ability === 'muster') {
                    play()
                    let { nState, nPrivatePlayer } = abilityFunction[ability](cardPlayed, newState, playerId, newPlayerPrivate)
                    newState = nState
                    newPlayerPrivate = nPrivatePlayer
                } else if (ability === 'decoy') {
                    let { table, cards } = abilityFunction[ability](cardFromTable, newState[playerId].table, newPlayerPrivate[playerId].cards)
                    newState[playerId].table = table
                    newPlayerPrivate[playerId].cards = cards
                    play()
                } else if (ability === 'spy') {
                    let { nState, nPlayerPrivate } = abilityFunction[ability](cardPlayed, newState, playerId, newPlayerPrivate)
                    newState = nState
                    newPlayerPrivate = nPlayerPrivate
                } else if (ability === 'scorch' || ability === 'foltest_leader4' || ability === 'francesca_leader4') {
                    if (ability === 'scorch') {
                        play()
                    }
                    let nState = abilityFunction[ability](newState, opponentPlayerId)
                    newState = nState
                } else if (ability === 'francesca_leader2' || ability === 'foltest_leader3' || ability === 'eredin_leader1') {
                    let nState = abilityFunction[ability](newState, playerId)
                    newState = nState
                } else if (ability === 'eredin_leader3') {
                    let { nState, nPlayerPrivate } = abilityFunction[ability](playerId, cardsToDiscard, cardFromDiscard, playerPrivate, state)
                    newState = nState
                    newPlayerPrivate = nPlayerPrivate
                } else if (ability === 'eredin_leader4') {
                    let { nState } = abilityFunction[ability](typeWeather, state)
                    newState = nState
                } else if (ability === 'emreis_leader4') {
                    let { nState, nPlayerPrivate } = abilityFunction[ability](cardFromDiscard, state, playerPrivate, playerId, opponentPlayerId)
                    newState = nState
                    newPlayerPrivate = nPlayerPrivate
                } else if (ability === 'emreis_leader3') {
                    let { look } = abilityFunction[ability](playerPrivate[opponentPlayerId].cards)
                    newPlayerPrivate[playerId].look = look
                }
            }
            if (ability === null) {
                play()
            } else {
                verifyAbility()
            }
            setState(newState)
            setPlayerPrivate(newPlayerPrivate)
            verifyScore()

        }
    }
    function endTurn(command) {
        let playerId = command.playerId
        let newState = state
        newState[playerId].endTurn = true
        setState(newState)
    }
    function roundEnd() {
        if (state[state.playersId[0]].score.total > state[state.playersId[1]].score.total) {
            state[state.playersId[0]].rounds += 1
        } else if (state[state.playersId[0]].score.total < state[state.playersId[1]].score.total) {
            state[state.playersId[1]].rounds += 1
        } else if (state[state.playersId[0]].score.total === state[state.playersId[1]].score.total) {
            state[state.playersId[0]].rounds += 1
            state[state.playersId[1]].rounds += 1
        }
        state.playersId.map((id) => {
            state[id].table.map((card) => {
                state[id].discard.push(card)
            })
            state[id].table = []
            state[id].tableDetails = {}
            state[id].agile = {}
            state[id].endTurn = false
            state[id].modifiers = {
                morale_boost: [],
                tight_bond: [],
                command_horn: [],
            }
        })
        if (state[state.playersId[0]].rounds >= 2 && state[state.playersId[1]].rounds < 2) {
            state.winner = state.playersId[0]
        } else if (state[state.playersId[1]].rounds >= 2 && state[state.playersId[0]].rounds < 2) {
            state.winner = state.playersId[1]
        } else if (state[state.playersId[1]].rounds >= 2 && state[state.playersId[0]].rounds >= 2) {
            state.winner = 'draw'
        }
    }

    function removePlayer(command) {
        const playerId = command.playerId
        let index = state.playersId.indexOf(playerId)
        state.playersId.splice(index, 1)
        delete state[playerId]
        delete playerPrivate[playerId]
        state.winner = state.playersId[0]
    }

    return {
        addPlayer,
        removePlayer,
        state,
        playerPrivate,
        playCard,
        roundEnd,
        shuffleCards,
        redraw,
        endTurn
    }
}

module.exports = createGame