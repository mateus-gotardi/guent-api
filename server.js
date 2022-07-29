require('dotenv').config()
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const cors = require('cors')
const session = require('express-session') 
const userRoutes = require('./routes/userRoutes')
const decksRouter = require('./routes/decksRouter')

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}))
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
)
app.use('/users', userRoutes)
app.use('/decks', decksRouter)


module.exports = server