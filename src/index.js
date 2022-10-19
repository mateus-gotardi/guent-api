require("dotenv").config();
const { Server } = require("socket.io");
const server = require("../server.js");
const mongoose = require("mongoose");
var rooms = {};
mongoose.connect(process.env.MONGO_URL, () => {
  console.log("connected to mongoDB");
});
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
server.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});
const createRoom = (id)=>{
  rooms[id]={a:'sala criada'}
  console.log(rooms)
}
io.on("connection", async (socket) => {
  console.log("socket connected:" + socket.id);
  socket.on("connect_error", (err) => {
    console.log(err.message);
  });

  socket.on("join-room", async (command) => {
    let roomID = command.roomID;
    if (!rooms[roomID]) {
      createRoom(roomID);
      io.emit('joined-room', roomID)
    }
    else {
      io.emit('joined-room', roomID)
    }
  });
});

module.exports = io;