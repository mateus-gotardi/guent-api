module.exports = {

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
    onAfterPlace: function (cardFromDiscard, discard, table) {
      if (!discard[cardFromDiscard]) {
        return ({ error: 'card not found in discard pile' })
      } else {
        if (cardFromDiscard.ability.includes("hero") || cardFromDiscard.type === 4) {
          return ({ error: 'heroes and special cards are not allowed' })
        } else {
          let index = discard.indexOf(cardFromDiscard)
          table.push(cardFromDiscard)
          discard.splice(index, 1)
        }
        return (discard, table)
      }
    }
  },
  "morale_boost": {
    name: "morale_boost",
    description: "Morale Boost: Adds +1 strength to all units in the row, excluding itself.",
    onEachCardPlace: function (card, table, modifiers) {
      table.map((i) => {
        if (i !== card && i.type === card.type) {
          let index = modifiers.indexOf(i)
          if (index === -1) {
            modifiers.push(i)
          }
          i.power += 1;
        }
        return (table, modifiers)
      })
    }
  },
  "muster": {
    name: "muster",
    description: "Muster: Find any cards with the same name in your deck and play them instantly.",
    onAfterPlace: function (card, deck, table) {
      table.push(card)
      let newDeck = deck
      deck.map((i) => {
        if (card.musterType && i.musterType === card.musterType) {
          let index = newDeck.indexOf(i)
          newDeck.splice(index, 1)
          table.push(i)
        }
      })
      deck = newDeck
      return (deck, table)
    }
  },
  "tight_bond": {
    name: "tight_bond",
    description: "Tight Bond: Place next to a card with the same name to double the strength of both cards.",
    onAfterPlace: function (card, table, modifiers) {
      table.map((i) => {
        if (i.name === card.name) {
          let index = modifiers.indexOf(i)
          if (index === -1) {
            modifiers.push(i)
          }
          i.power = i.power * 2
        }
      })
      return (table, modifiers)
    }
  },
  "spy": {
    name: "spy",
    description: "Spy: Place on your opponents battlefield (counts towards their total strength) then draw two new cards from your deck.",
    onPlace: function (card, attackerState, defenderTable) {
      defenderTable.push(card);
      for (i = 0; i <= 1; i++) {
        let random = Math.floor(Math.random() * decks.length - 1)
        let newCard = attackerState.decks[random]
        attackerState.cards.push(newCard);
        attackerState.decks.splice(random, 1)
      }
      return (attackerState, defenderTable)
    }
  },
  "weather_fog": {
    name: "weather_fog",
    description: "Sets the strength of all Ranged Combat cards to 1 for both players.",
    weatherFog: function (card, state) {
      if (!state.weather_fog) {
        state.weather_fog = true;
        state.weather_cards.push(card)
      }
      return (state)
    }
  },
  "weather_rain": {
    name: "weather_rain",
    description: "Sets the strength of all Siege Combat cards to 1 for both players.",
    weatherRain: function (card, state) {
      if (!state.weather_rain) {
        state.weather_rain = true;
        state.weather_cards.push(card);
      }
      return (state)
    }
  },
  "weather_frost": {
    name: "weather_frost",
    description: "Sets the strength of all Close Combat cards to 1 for both players.",
    weatherFrost: function (card, state) {
      if (!state.weather_frost) {
        state.weather_frost = true;
        state.weather_cards.push(card)
      }
      return (state)
    }
  },
  "weather_clear": {
    name: "weather_clear",
    description: "Removes all Weather Card (Biting Frost, Impenetrable Fog and Torrential Rain) effects.",
    weatherClear: function (state) {
      state.weatherFog = false;
      state.weatherFrost = false;
      state.weatherRain = false;
      state.weather_cards = []
      return (state)
    }
  },
  "decoy": {
    name: "decoy",
    description: "Decoy: Swap with a card on the battlefield to return it to your hand.",
    decoy: function (card, decoy, table, cards) {
      index = table.indexOf(card);
      if (index >= 0) {
        cards.push(card);
        table.splice(index, 1, decoy);
      }
    }
  },
  "scorch_card": {
    name: "scorch",
    description: "Scorch: Discard after playing. Kills the strongest card(s) in the battlefield.",
    scorch_card: function (table1, table2, discard1, discard2) { //table1 and discard1 is from who played the card
      let strongest1 = []
      let strongest2 = []
      if (table1.length > 0 || table2.length > 0) {
        table1.map((i) => {
          if (i.power > strongest1[0].power && !i.ability.includes("hero")) {
            strongest1 = [i]
          } else if (i.power === strongest1[0].power && !i.ability.includes("hero")) {
            strongest1.push(i)
          }
        })
        table2.map((i) => {
          if (i.power > strongest2[0].power && !i.ability.includes("hero")) {
            strongest2 = [i]
          } else if (i.power === strongest2[0].power && !i.ability.includes("hero")) {
            strongest2.push(i)
          }
        })

        if (strongest2[0].power > strongest1[0].power) {
          strongest2.map((i) => {
            discard2.push(i)
            index = table2.indexOf(i)
            table2.splice(index, 1)
          })
        } else if (strongest1[0].power > strongest2[0].power) {
          strongest1.map((i) => {
            discard1.push(i)
            index = table1.indexOf(i)
            table1.splice(index, 1)
          })
        } else if (strongest1[0].power === strongest2[0].power) {
          strongest1.map((i) => {
            discard1.push(i)
            index = table1.indexOf(i)
            table1.splice(index, 1)
          })
          strongest2.map((i) => {
            discard2.push(i)
            index = table2.indexOf(i)
            table2.splice(index, 1)
          })
        }
      }
      return (table1, table2, discard1, discard2)
    }
  },
  "scorch": {
    name: "scorch",
    description: "Scorch: Destroy your enemy's strongest close combat unit(s) if the combined strength of all of his or her combat unit(s) is 10 or more.",
    scorchMelee: function (table, discard) {
      let totalStrength = 0
      table.map((i) => {
        if (i.type === 0) {
          totalStrength += i.power
        }
      })
      if (totalStrength >= 10) {
        let bigger = []
        table.map((i) => {
          if (i.type === 0 && i.power > bigger[0].power && !i.ability.includes('hero')) {
            bigger = [i]
          } else if (i.type === 0 && i.power === bigger[0].power && !i.ability.includes('hero')) {
            bigger.push(i)
          }
        })
        bigger.map((i) => {
          let index = table.indexOf(i)
          table.splice(index, 1)
          discard.push(i)
        })
      }
      return (table, discard)
    }
  },
  "commanders_horn": {
    name: "commanders_horn",
    description: "Commander's Horn: Doubles the strength of all unit cards in a row. Except this card.",
    onBeforePlace: function (card, table, modifiers) {
      let permission = true
      modifiers.map((i) => {
        if (i.type === card.type) {
          permission = false
        }
      })
      if (permission) {
        table.map((i) => {
          if (i.type === card.type && !i.ability.includes('hero')) {
            modifiers.push(i)
            i.power = i.power * 2
          }
        })
      }
      table.push(card)
      return (table, modifiers)
    }
  },
  "commanders_horn_card": {
    name: "commanders_horn",
    description: "Commander's Horn: Doubles the strength of all unit cards in a row. Limited to 1 per row.",
    onBeforePlace: function (card, type, table, modifiers) {
      let permission = true
      modifiers.map((i) => {
        if (i.type === type) {
          permission = false
        }
      })
      if (permission) {
        table.map((i) => {
          if (i.type === type && !i.ability.includes('hero')) {
            modifiers.push(i)
            i.power = i.power * 2
          }
        })
        table.push(card)
      } else {
        return ({ error: 'this row already contains a commanders_horn' })
      }

      return (table, modifiers)
    }
  },
  "foltest_leader1": {
    name: "Foltest: King of Temeria",
    description: "Pick an Impenetrable Fog card from your deck and play it instantly.",
    onActivate: function (card, state) {
      if (!state.weather_fog) {
        state.weather_fog = true;
        state.weather_cards.push(card)
      }
      return (state)
    }
  },
  "foltest_leader2": {
    name: "Foltest: Lord Commander",
    description: "Clear any weather effects (resulting from Biting Frost, Torrential Rain or Impenetrable Fog cards) in play.",
    onActivate: function (state) {
      state.weatherFog = false;
      state.weatherFrost = false;
      state.weatherRain = false;
      state.weather_cards = []
      return (state)
    }
  },
  "foltest_leader3": {
    name: "Foltest: The Siegemaster",
    description: "Doubles the strength of all your Siege units (unless a Commander's Horn is also present on that row).",
    onActivate: function (card, table, modifiers) {
      let permission = true
      modifiers.map((i) => {
        if (i.type === 2) {
          permission = false
        }
      })
      if (permission) {
        table.map((i) => {
          if (i.type === 2 && !i.ability.includes('hero')) {
            modifiers.push(i)
            i.power = i.power * 2
          }
        })
        table.push(card)
      } else {
        return ({ error: 'this row already contains a commanders_horn' })
      }

      return (table, modifiers)
    }
  },
  "foltest_leader4": { // do not send if other player siege score is lower than 10
    name: "Foltest: The Steel-Forged",
    description: "Destroy your enemy's strongest Siege unit(s) if the combined strength of all his or her Siege units is 10 or more.",
    onActivate: function (table, discard) {
      let strongest = []
      if (table.length > 0) {
        table.map((i) => {
          if (i.power > strongest[0].power && i.type === 2 && !i.ability.includes('hero')) {
            strongest = [i]
          } else if (i.power === strongest[0].power && i.type === 2 && !i.ability.includes('hero')) {
            strongest.push(i)
          }
        })
        strongest.map((i) => {
          let index = table.indexOf(i)
          discard.push(i)
          table.splice(index, 1)
        })
      }
      return (table, discard)
    }
  },
  "francesca_leader1": {
    name: "Francesca, Pureblood Elf",
    description: "Pick a Biting Frost card from your deck and play it instantly.",
    onActivate: function (card, state) {
      if (!state.weather_frost) {
        state.weather_frost = true;
        state.weather_cards.push(card)
      }
      return (state)
    }
  },
  "francesca_leader2": {
    name: "Francesca Findabair the Beautiful",
    description: "Doubles the strength of all your Ranged Combat units (unless a Commander's Horn is also present on that row).",
    onActivate: function (card, table, modifiers) {
      let permission = true
      modifiers.map((i) => {
        if (i.type === 1) {
          permission = false
        }
      })
      if (permission) {
        table.map((i) => {
          if (i.type === 1 && !i.ability.includes('hero')) {
            modifiers.push(i)
            i.power = i.power * 2
          }
        })
        table.push(card)
      } else {
        return ({ error: 'this row already contains a commanders_horn' })
      }
      return (table, modifiers)
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
    onActivate: function (table, discard) {
      if (table.length > 0) {
        table.map((i) => {
          if (i.power > strongest[0].power && i.type === 0 && !i.ability.includes('hero')) {
            let index = table.indexOf(i)
            discard.push(i)
            table.splice(index, 1)
          }
        })
      }
      return (table, discard)
    }
  },
  "eredin_leader1": {
    name: "Eredin, Commander of the Red Riders",
    description: "Double the strength of all your Close Combat units (unless a Commander's Horn is also present on that row).",
    onActivate: function (card, table, modifiers) {
      let permission = true
      modifiers.map((i) => {
        if (i.type === 0) {
          permission = false
        }
      })
      if (permission) {
        table.map((i) => {
          if (i.type === 0 && !i.ability.includes('hero')) {
            modifiers.push(i)
            i.power = i.power * 2
          }
        })
        table.push(card)
      } else {
        return ({ error: 'this row already contains a commanders_horn' })
      }
      return (table, modifiers)
    }
  },
  "eredin_leader2": {
    name: "Eredin, Bringer of Death",
    description: "Restore a card from your discard pile to your hand.",
    onActivate: function (cardFromDiscard, discard, cards) {
      if (!discard[cardFromDiscard]) {
        return ({ error: 'card not found in discard pile' })
      } else {
        if (cardFromDiscard.ability.includes("hero") || cardFromDiscard.type === 4) {
          return ({ error: 'heroes and special cards are not allowed' })
        } else {
          let index = discard.indexOf(cardFromDiscard)
          cards.push(cardFromDiscard)
          discard.splice(index, 1)
        }
        return (discard, cards)
      }
    }
  },
  "eredin_leader3": {
    name: "Eredin, Destroyer of Worlds",
    description: "Discard 2 cards and draw 1 card of your choice from your deck.",
    onActivate: function (deck, cards, discard, cardFromDeck, card1, card2) {
      let index1 = cards.indexOf(card1);
      let pass1, pass2
      if (index1 !== -1) {
        discard.push(card1)
        cards.splice(index1, 1)
        pass1 = true
      }
      let index2 = cards.indexOf(card2);
      if (index2 !== -1) {
        discard.push(card2)
        cards.splice(index2, 1)
        pass2 = true
      }
      if (pass1 && pass2) {
        let index = deck.indexOf(cardFromDeck)
        if (index !== -1) {
          cards.push(cardFromDeck)
          deck.splice(index, 1)
        }
      }
    }
  },
  "eredin_leader4": {
    name: "Eredin: King of the Wild Hunt",
    description: "Pick any weather card from your deck and play it instantly.",
    onActivate: function (card, state) {
      if (!state.modifiers[card.ability]) {
        state.modifiers[card.ability] = true
      }
    }
  },
  "emreis_leader4": {
    name: "Emhyr vas Emreis: the Relentless",
    description: "Draw a card from your opponent's discard pile.",
    waitResponse: true,
    onActivate: function (card) {
      var discard = this.foe.getDiscard();

      discard = this.filter(discard, {
        "ability": "hero",
        "type": [card.constructor.TYPE.SPECIAL, card.constructor.TYPE.WEATHER]
      })

      this.send("played:emreis_leader4", {
        cards: JSON.stringify(discard)
      }, true);
    }
  },
  "hero": {
    name: "hero",
    description: "Hero: Not affected by special cards, weather cards or abilities."
  }
}