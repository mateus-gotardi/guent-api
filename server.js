require('dotenv').config()
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, { cors: { origin: "*" } })
const session = require('express-session')
const userRoutes = require('./routes/userRoutes')
const decksRouter = require('./routes/decksRouter')
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use('/users', userRoutes)
app.use('/decks', decksRouter)


io.use(wrap(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
})));

io.on('connection', async (socket) => {
  const userId = socket.request.session.login;
  socket.on("connect_error", (err) => {
    console.log(err.message);
  });
  socket.on('joinRoom', async (room) => {
    let sockets = await io.in(room).fetchSockets();
    if (sockets.length < 2) {
      socket.join(room)
      socket.emit('setup', )
    }
  })
  
  socket.on('disconnect', () => {
    
  })
})


module.exports = server