const express = require("express");
const cors = require("cors");
const socket = require("socket.io");
const path = require('path');

const app = express();

app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: ['GET', 'POST']
}));

app.use(express.static(path.join(__dirname, 'public')));

const server = require('http').createServer(app);

const io = require('socket.io')(server, {
  cors: {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST']
  }
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});

io.on("connection", (visitor) => {
  console.log("We have a new visitor with id: " + visitor.id);

  visitor.on("join_room", (data) => {
    visitor.join(data.room);
    console.log(`${data.username} joined room: ${data.room}`);
  });

  visitor.on("message", (data) => {
    console.log("Received message:", data);
    io.to(data.room).emit("new_msg", data);
  });

  visitor.on('broadcast', (data) => {
    visitor.to(data.room).emit('new_broadcast', data);
  });

  // أحداث WebRTC
  visitor.on('offer', (data) => {
    visitor.to(data.room).emit('offer', data);
  });

  visitor.on('answer', (data) => {
    visitor.to(data.room).emit('answer', data);
  });

  visitor.on('candidate', (data) => {
    visitor.to(data.room).emit('candidate', data);
  });
});
