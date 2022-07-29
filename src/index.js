require('dotenv').config()
const app = require('../server.js')
const mongoose = require("mongoose")
mongoose.connect(process.env.MONGO_URL, () => {
  console.log('connected to mongoDB')
})
app.listen(process.env.PORT, ()=>{console.log(`listening on port ${process.env.PORT}`)})
module.exports = app