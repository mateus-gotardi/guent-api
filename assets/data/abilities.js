const allCards = require('./cards')

const abilities = {

  "agile": {
    name: "agile",
    description: "Agile: Can be placed in either the Close Combat or Ranged Combat row. Cannot be moved once placed.",
    onBeforePlace: function (card, type) {
      let newCard = card
      if (type === 1) {
        newCard.type = 1
      } else if (type === 0) {
        newCard.type = 0
      }
      return (newCard)
    }
  },
  "medic": {
    name: "medic",
    description: "Medic: Choose one card from your discard pile (excluding heroes / special cards) to play instantly.",
    waitResponse: true,
    onAfterPlace: function (cardFromDiscard, discard, cards) {
      let cardDetails = allCards[cardFromDiscard]
      if (!cardDetails.ability.includes('hero') || cardFromDiscard.type !== 4) {
        if (discard.indexOf(cardFromDiscard) === -1) {
          return ({ error: 'card not found in discard pile' })
        } else {
          let index = discard.indexOf(cardFromDiscard)
          cards.push(cardFromDiscard)
          discard.splice(index, 1)
          return (discard, cards)
        }
      } else {
        return ({ error: 'heroes ans special cards not allowed' })
      }

    }
  },
  "muster": {
    name: "muster",
    description: "Muster: Find any cards with the same name in your deck and play them instantly.",
    onAfterPlace: function (card, state, playerId, playerPrivate) {
      let detailedCard = allCards[card]
      let newState = state
      let newPlayerPrivate = playerPrivate
      playerPrivate[playerId].decks.map((c) => {
        let detailedC = allCards[c]
        if (detailedCard.musterType === detailedC.musterType) {
          newState[playerId].table.push(c)
          let index = newPlayerPrivate[playerId].deck.indexOf(c)
          newPlayerPrivate[playerId].deck.slice(index, 1)
        }
      })
      return ({ nState: newState, nPrivatePlayer: newPlayerPrivate })
    }
  },
  "spy": {
    name: "spy",
    description: "Spy: Place on your opponents battlefield (counts towards their total strength) then draw two new cards from your deck.",
    onPlace: function (card, state, playerId, playerPrivate) {
      let nState = state
      let nPlayerPrivate = playerPrivate
      let opponentId = nState.playersId.find(e => e !== playerId)
      let index = nPlayerPrivate.indexOf(card)
      nState[opponentId].table.push(card)
      nPlayerPrivate[playerId].cards.splice(index, 1)
      for (let i = 0; i < 2; i++) {
        let random = Math.floor(Math.random() * nPlayerPrivate[playerId].deck.length - 1)
        let newCard = nPlayerPrivate[playerId].deck[random]
        nPlayerPrivate[playerId].cards.push(newCard)
        nPlayerPrivate[playerId].decks.splice(random, 1)
      }
      return ({ nState, nPlayerPrivate })
    }
  },
  "weather_fog": {
    name: "weather_fog",
    description: "Sets the strength of all Ranged Combat cards to 1 for both players.",
    weatherFog: function (card, state) {
      if (!state.weather_cards.includes(1) && card === 'weather_fog') {
        state.weather_cards.push(1)
      }
      return (state)
    }
  },
  "weather_rain": {
    name: "weather_rain",
    description: "Sets the strength of all Siege Combat cards to 1 for both players.",
    weatherRain: function (card, state) {
      if (!state.weather_cards.includes(2) && card === 'weather_rain') {
        state.weather_cards.push(2);
      }
      return (state)
    }
  },
  "weather_frost": {
    name: "weather_frost",
    description: "Sets the strength of all Close Combat cards to 1 for both players.",
    weatherFrost: function (card, state) {
      if (!state.weather_cards.includes(0) && card === 'weather_frost') {
        state.weather_cards.push(0)
      }
      return (state)
    }
  },
  "weather_clear": {
    name: "weather_clear",
    description: "Removes all Weather Card (Biting Frost, Impenetrable Fog and Torrential Rain) effects.",
    weatherClear: function (card, state) {
      if (card === 'weather_clear') {
        state.weather_cards = []
      }
      return (state)
    }
  },
  "decoy": {
    name: "decoy",
    description: "Decoy: Swap with a card on the battlefield to return it to your hand.",
    decoy: function (card, table, cards) {
      let completeCard = allCards[card]
      index = table.indexOf(card);
      if (index >= 0 && !completeCard.ability.includes('hero')) {
        cards.push(card);
        table.splice(index, 1, decoy);
        return ({ table, cards })
      } else {
        return { error: 'card must not be a hero' }
      }

    }
  },
  "scorch_card": {
    name: "scorch",
    description: "Scorch: Discard after playing. Kills the strongest card(s) in the battlefield.",
    scorch_card: function (state) { //table1 and discard1 is from who played the card
      let newState = state
      let strongest = 0
      let listToRemove = []
      state.playersId.map((id) => {
        state[id].table.map((card) => {
          let cardDetails = state[id].tableDetails[card]
          if (cardDetails.power > strongest) {
            strongest = cardDetails.power
            listToRemove = [card]
          } else if (cardDetails.power === strongest) {
            listToRemove.push(card)
          }
        })
      })
      state.playersId.map((id) => {
        listToRemove.map((card) => {
          let index = newState[id].table.indexOf(card)
          if (index >= 0) {
            newState[id].table.splice(index, 1)
            newState[id].discard.push(card)
          }
        })
      })
      return (newState)
    }
  },
  "scorch": {
    name: "scorch",
    description: "Scorch: Destroy your enemy's strongest close combat unit(s) if the combined strength of all of his or her combat unit(s) is 10 or more.",
    scorchMelee: function (state, opponentId) {
      let nState = state
      let strongest = 0
      let listToRemove = []
      if (nState[opponentId].score.closeCombat >= 10) {
        state[opponentId].table.map((card) => {
          let cardDetails = state[opponentId].tableDetails[card]
          if (cardDetails.power > strongest && cardDetails.type === 0) {
            strongest = cardDetails.power
            listToRemove = [card]
          } else if (cardDetails.power === strongest && cardDetails.type === 0) {
            listToRemove.push(card)
          }
        })
        listToRemove.map((card) => {
          let index = nState[opponentId].table.indexOf(card)
          if (index >= 0) {
            nState[opponentId].table.splice(index, 1)
            nState[opponentId].discard.push(card)
          }
        })
      }
      return (nState)
    }
  },
  "foltest_leader1": {
    name: "Foltest: King of Temeria",
    description: "Pick an Impenetrable Fog card from your deck and play it instantly.",
    onActivate: function (state) {
      if (!state.weather_cards.includes(1)) {
        state.weather_cards.push(1)
      }
      return (state)
    }
  },
  "foltest_leader2": {
    name: "Foltest: Lord Commander",
    description: "Clear any weather effects (resulting from Biting Frost, Torrential Rain or Impenetrable Fog cards) in play.",
    onActivate: function (state) {
      state.weather_cards = []
      return (state)
    }
  },
  "foltest_leader3": {
    name: "Foltest: The Siegemaster",
    description: "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row).",
    onActivate: function (state, playerId) {
      let nState = state
      if (!nState[playerId].modifiers.command_horn.includes(2)) {
        nState[playerId].modifiers.command_horn.push(2)
      }
      return (nState)
    }
  },
  "foltest_leader4": { // do not send if other player siege score is lower than 10
    name: "Foltest: The Steel-Forged",
    description: "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.",
    onActivate: function (state, opponentId) {
      let nState = state
      let strongest = 0
      let listToRemove = []
      if (nState[opponentId].score.siege >= 10) {
        state[opponentId].table.map((card) => {
          let cardDetails = state[opponentId].tableDetails[card]
          if (cardDetails.power > strongest && cardDetails.type === 3) {
            strongest = cardDetails.power
            listToRemove = [card]
          } else if (cardDetails.power === strongest && cardDetails.type === 3) {
            listToRemove.push(card)
          }
        })
        listToRemove.map((card) => {
          let index = nState[opponentId].table.indexOf(card)
          if (index >= 0) {
            nState[opponentId].table.splice(index, 1)
            nState[opponentId].discard.push(card)
          }
        })
      }

      return (nState)
    }
  },
  "francesca_leader1": {
    name: "Francesca, Pureblood Elf",
    description: "Pick a Biting Frost card from your deck and play it instantly.",
    onActivate: function (state) {
      if (!state.weather_cards.includes(0)) {
        state.weather_cards.push(0)
      }
      return (state)
    }
  },
  "francesca_leader2": {
    name: "Francesca Findabair the Beautiful",
    description: "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row).",
    onActivate: function (state, playerId) {
      let nState = state
      if (!nState[playerId].modifiers.command_horn.includes(1)) {
        nState[playerId].modifiers.command_horn.push(1)
      }
      return (nState)
    }
  },
  "francesca_leader3": {
    name: "Francesca, Daisy of The Valley",
    description: "Draw an extra card at the beginning of the battle",
    //programado na camada do jogo
  },
  "francesca_leader4": { // do not send if other player combat score is lower than 10
    name: "Francesca, Queen of Dol Blathanna",
    description: "Destroy your enemy's Close Combat unit(s) if the combined strength of all his or her Close Combat units is 10 or more.",
    onActivate: function (state, opponentId) {
      let nState = state
      let strongest = 0
      let listToRemove = []
      if (nState[opponentId].score.closeCombat >= 10) {
        state[opponentId].table.map((card) => {
          let cardDetails = state[opponentId].tableDetails[card]
          if (cardDetails.power > strongest && cardDetails.type === 0) {
            strongest = cardDetails.power
            listToRemove = [card]
          } else if (cardDetails.power === strongest && cardDetails.type === 0) {
            listToRemove.push(card)
          }
        })
        listToRemove.map((card) => {
          let index = nState[opponentId].table.indexOf(card)
          if (index >= 0) {
            nState[opponentId].table.splice(index, 1)
            nState[opponentId].discard.push(card)
          }
        })
      }
    }
  },
  "eredin_leader1": {
    name: "Eredin, Commander of the Red Riders",
    description: "Double the strength of all your Close Combat units (unless a Commander's Horn is also present on that row).",
    onActivate: function (state, playerId) {
      let nState = state
      if (!nState[playerId].modifiers.command_horn.includes(0)) {
        nState[playerId].modifiers.command_horn.push(0)
      }
      return (nState)
    }
  },
  "eredin_leader2": {
    name: "Eredin, Bringer of Death",
    description: "Restore a card from your discard pile to your hand.",
    onActivate: function (cardFromDiscard, discard, cards) {
      let cardDetails = allCards[cardFromDiscard]
      if (!cardDetails.ability.includes('hero') || cardFromDiscard.type !== 4) {
        if (discard.indexOf(cardFromDiscard) === -1) {
          return ({ error: 'card not found in discard pile' })
        } else {
          let index = discard.indexOf(cardFromDiscard)
          cards.push(cardFromDiscard)
          discard.splice(index, 1)
          return (discard, cards)
        }
      } else {
        return ({ error: 'heroes ans special cards not allowed' })
      }

    }
  },
  "eredin_leader3": {
    name: "Eredin, Destroyer of Worlds",
    description: "Discard 2 cards and draw 1 card of your choice from your deck.",
    onActivate: function (playerId, cardsToDiscard, cardFromDiscard, playerPrivate, state) {
      let nState = state
      let nPlayerPrivate = playerPrivate
      cardsToDiscard.map(card => {
        nState[playerId].discard.push(card)
        let index = nPlayerPrivate[playerId].cards.indexOf(card)
        nPlayerPrivate[playerId].cards.splice(index, 1)
      })
      let index = nState[playerId].discard.indexOf(cardFromDiscard)
      if (index !== -1) {
        nState[playerId].discard.splice(index, 1)
        nPlayerPrivate[playerId].cards.push(cardFromDiscard)
      }
      return ({ nState, nPlayerPrivate })
    }
  },
  "eredin_leader4": {
    name: "Eredin: King of the Wild Hunt",
    description: "Pick any weather card from your deck and play it instantly.",
    onActivate: function (type, state) {
      if (!state.weather_cards.includes(type)) {
        state.push(type)
      }
      return ({ nState: state })
    }
  },
  "emreis_leader4": {
    name: "Emhyr vas Emreis: the Relentless",
    description: "Draw a card from your opponent's discard pile.",
    waitResponse: true,
    onActivate: function (card, state, playerPrivate, playerId, opponentId) {
      let cardDetails = allCards[card]
      let nState = state
      let nPlayerPrivate = playerPrivate
      if (!cardDetails.ability.includes('hero')) {
        let index = nState[opponentId].discard.indexOf(card)
        nState[opponentId].discard.splice(index, 1)
        nPlayerPrivate[playerId].cards.push(card)
      }
      return (nState, nPlayerPrivate)
    }
  },
  "emreis_leader3": {
    name: "Emhyr var Emreis: Emperor of Nilfgaard",
    description: "Look at 3 random cards from your opponent's hand.",
    onActivate: function (opponentsCards) {
      let randoms = []
      let look = []
      for (let i = 0; i < 3; i++) {
        let random = Math.floor(Math.random() * 12);
        while (randoms.find(e => e === random) != undefined) {
          console.log(random)
          random = Math.floor(Math.random() * 12);
        }
        randoms.push(random)
      }
      randoms.map((i) => {
        look.push(opponentsCards[i])
      })
      return (look)
    }
  },
  "emreis_leader2": {
    name: "Emhyr var Emreis: His Imperial Majesty",
    description: "Pick a Torrential Rain card from your deck and play it instantly.",
    onActivate: function (state) {
      if (!state.weather_cards.includes(2) && card === 'weather_rain') {
        state.weather_cards.push(2)
      }
      return (state)
    }
  },
  "emreis_leader1": {
    name: "Emhyr vas Emreis: The White Flame",
    description: "The White Flame : Cancel your opponent's Leader Ability.",
    //programado na camada do jogo
  },
  "hero": {
    name: "hero",
    description: "Hero: Not affected by special cards, weather cards or abilities."
  }
}
module.exports = abilities;