import createGame from "./index"
const server = require('../server.js')
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
const io = require('socket.io')(server, { cors: { origin: "*" } })
const rooms = {}
function createRoom(roomID) {
    rooms[roomID] = createGame(roomID)
}

io.use(wrap(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
})));

io.on('connection', async (socket) => {
    const userId = socket.request.session.login;
    const room = socket.request.session.room;
    const setup = (state, playerState) => {
        socket.to(room).emit('state', { state })
        socket.to(userId).emit('playerState', { playerState })
    }
    socket.on("connect_error", (err) => {
        console.log(err.message);
    });
    socket.on('join-room', async (command) => {
        let roomID = command.room;
        if (!rooms[roomID]) {
            createRoom(roomID)
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
            socket.to(userId).emit('error', 'you do not have any redraws available' )
        }
    })
    socket.on('end-turn', async (command) => {
        command.playerId = userId
        rooms[room].endTur(command)
        let state = rooms[room].state
        let playerState = rooms[room].playerPrivate[userId]
        setup(state, playerState)
    })
    socket.on('round-end', async (command) => {
        rooms[room].roundEnd
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
    socket.on('end-game', ()=>{
        delete rooms[room]
        socket.request.session.room = undefined
    })
})