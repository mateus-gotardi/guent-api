require('dotenv').config()
const app = require('../server.js')
const mongoose = require("mongoose")
const { Server } = require('socket.io')
const createGame = require('./game/index')

mongoose.connect(process.env.MONGO_URL, () => {
  console.log('connected to mongoDB')
})


const io = new Server(app, {
  cors: {
    origin: "http://localhost:3000"
  }
})

app.listen(process.env.PORT, () => { console.log(`listening on port ${process.env.PORT}`) })

let rooms = {}
function createRoom(roomID) {
  rooms[roomID] = createGame(roomID)
}

io.on('connection', async (socket) => {
  console.log('socket connected: ' + socket.id);
  let userId, room
  const setup = (state, playerState, command) => {
    userId = command.user.id
    room = command.room
    console.log(rooms)
    let opponentId = rooms[room].state.playersId.find(i => i !== userId)
    let opponentState = rooms[room].playerPrivate[opponentId]
    io.to(opponentId).emit('playerState', { playerState: opponentState })
    io.to(room).emit('state', { state })
    io.to(userId).emit('playerState', { playerState })
  }
  socket.on("connect_error", (err) => {
    console.log(err.message);
  });
  socket.on("get-rooms", async (command) => {
    userId = command.playerId
    socket.join(userId)
    io.to(userId).emit('send-rooms', { rooms })
    console.log('sending rooms to: ' + userId);
  })
  socket.on('join-room', async (command) => {
    let roomID = command.room;
    let userId = command.user.id
    if (!rooms[roomID]) {
      createRoom(roomID)
      room = roomID
    }
    if (rooms[roomID].state.playersId.length < 2 && !rooms[roomID].state.playersId.find(i => i === userId)) {
      rooms[roomID].addPlayer(command)
      socket.join(roomID)
      let state = rooms[roomID].state
      let playerState = rooms[roomID].playerPrivate[userId]
      setup(state, playerState, command)
    } else if (rooms[roomID].state.playersId.find(i => i === userId)) {
      socket.join(roomID)
      let state = rooms[roomID].state
      let playerState = rooms[roomID].playerPrivate[userId]
      setup(state, playerState, command)
    }
  })
  socket.on('start-game', async (command) => {
    userId = command.user.id
    rooms[room].shuffleCards(command)
    let state = rooms[room].state
    let playerState = rooms[room].playerPrivate[userId]
    setup(state, playerState)
  })
  socket.on('redraw', async (command) => {
    userId = command.playerId
    if (rooms[room].playerPrivate[userId].redraws > 0) {
      rooms[room].redraw(command)
      let state = rooms[room].state
      let playerState = rooms[room].playerPrivate[userId]
      setup(state, playerState)
    } else {
      socket.to(userId).emit('error', 'you do not have any redraws available')
    }
  })
  socket.on('end-turn', async (command) => {
    userId = command.playerId
    rooms[room].endTurn(command)
    let state = rooms[room].state
    let playerState = rooms[room].playerPrivate[userId]
    setup(state, playerState)
  })
  socket.on('round-end', async (command) => {
    rooms[room].roundEnd()
    let state = rooms[room].state
    let playerState = rooms[room].playerPrivate[userId]
    setup(state, playerState)
  })
  socket.on('play-card', async (command) => {
    userId = command.playerId
    rooms[room].playCard(command)
    let state = rooms[room].state
    let playerState = rooms[room].playerPrivate[userId]
    setup(state, playerState)
  })

  socket.on('disconnect', (command) => {
    console.log(socket.id + ' disconnected')
    if (rooms[room]) {
      rooms[room].removePlayer(command)
      let state = rooms[room].state
      let playerState = rooms[room].playerPrivate[userId]
      setup(state, playerState={}, command)
    }
  })
  socket.on('end-game', async () => {
    let winner = rooms[room].state.winner
    const user = await User.findById(winner)
    user.victories += 1
    user.markModified('victories')
    await user.save();
    delete rooms[room]
    setup
  })
})

module.exports = app