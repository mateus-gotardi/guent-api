const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io')
const cors = require('cors');
const createGame = require('../src/game/index')

app.use(cors())

const server = http.createServer(app);

const io =new Server(server, {
    cors:{
        origin: "http://localhost:3000"
    }
})

server.listen('3002',()=>{
    console.log('socket listening on http://localhost:3002')
})

let rooms = {}
function createRoom(roomID) {
    rooms[roomID] = createGame(roomID)
}

io.on('connection', async (socket) => {
    console.log('socket connected:'+socket.id);
    let userId, room
    const setup = (state, playerState) => {
        let opponentId = rooms[room].playersId.find(i => i !== playerId)
        let opponentState = rooms[room].playerPrivate[opponentId]
        socket.to(room).emit('state', { state })
        socket.to(userId).emit('playerState', { playerState })
        socket.to(opponentId).emit('playerState', { opponentState })
    }
    socket.on("connect_error", (err) => {
        console.log(err.message);
    });
    socket.on('join-room', async (command) => {
        let roomID = command.room;
        if (!rooms[roomID]) {
            createRoom(roomID)
            room = roomID
        }
        if (rooms[roomID].state.playersId.length < 2) {
            rooms[roomID].addPlayer(command)
            socket.request.session.room = roomID
            socket.join(roomID)
            let state = rooms[roomID].state
            let playerState = rooms[roomID].playerPrivate[userId]
            setup(state, playerState)
        }
    })
    socket.on('start-game', async (command) => {
        command.playerId = userId
        rooms[room].shuffleCards(command)
        let state = rooms[room].state
        let playerState = rooms[room].playerPrivate[userId]
        setup(state, playerState)
    })
    socket.on('redraw', async (command) => {
        command.playerId = userId
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
        command.playerId = userId
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
        command.playerId = playerId
        rooms[room].playCard(command)
        let state = rooms[room].state
        let playerState = rooms[room].playerPrivate[userId]
        setup(state, playerState)
    })

    socket.on('disconnect', () => {
        command.playerId = userId
        rooms[room].removePlayer(command)
        let state = rooms[room].state
        setup(state)
    })
    socket.on('end-game', async () => {
        let winner = rooms[room].state.winner
        const user = await User.findById(winner)
        user.victories += 1
        user.markModified('victories')
        await user.save();
        delete rooms[room]
        socket.request.session.room = undefined
        setup
    })
})

module.exports = io