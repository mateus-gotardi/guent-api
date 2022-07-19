require('dotenv').config()
const express = require('express')
const app = express()
const session = require('express-session')
const methodOverride = require('method-override')
const userRoutes = require('./routes/userRoutes')
const decksRouter = require('./routes/decksRouter')

app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(methodOverride('_method'))

app.use('/users', userRoutes)
app.use('/decks', decksRouter)

module.exports = app