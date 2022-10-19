require('dotenv').config()
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const decksRouter = require('./routes/decksRouter')

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(
  cors({
    origin: '*',
  })
)

app.use('/users', userRoutes)
app.use('/decks', decksRouter)


module.exports = server