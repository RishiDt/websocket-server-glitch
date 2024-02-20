const http = require("http");

const socketIo = require("socket.io");


const app = require('express')();
const server = http.createServer(app);
const io = socketIo(server);

//store connected senders
connectedSenders = new Map();

app.get("/", (req, res) => {
  res.send("Hello, this is your server responding to a GET request!");
});

io.on("connection", (socket) => {
  console.log(
    "A client connected SID & connectedSenders is",
    socket.id,
    connectedSenders
  );

  //hello token from sender
  socket.on("senderHello", (data) => {
    console.log("hello token from sender:", data);
    key = data[`uId`];
    value = data[`socketId`];
    connectedSenders.set(`${key.toString()}`, `${value}`);
  });

  //receiver request for location
  socket.on("locationRequest", (data) => {
    console.log("locationRequest from receiver", data);

    receiverId = data[`uId`];
    receiverSocketId = data[`socketId`];
    senderId = data["senderId"];

    if (connectedSenders.has(senderId.toString())) {
      console.log(
        "sender: ",
        senderId,
        "detected in connectedSenders. sending sendLocation event to it."
      );
      senderSocketId = connectedSenders.get(`${senderId}`);

      io.to(senderSocketId.toString()).emit("sendLocation", {
        receiverId: receiverId,
        receiverSocketId: receiverSocketId,
      });
    } else {
      console.log(
        "sender:",
        senderId,
        "not in connectedSenders. sending message to receiver:",
        receiverId
      );
      io.to(socket.id).emit("serverMessage", {
        message: "sender is yet to connect",
        code: "NO_RECEIVER_CONNECTED",
      });
    }
  });

  //sender sent data now redirect to receiver
  socket.on("myLocation", (data) => {
    console.log("myLocation sent from sender:", data["uId"], socket.id);
    console.log("sending to receiverId: ", data["receiverId"]);

    io.to(data["receiverSocketId"].toString()).emit("senderLocation", {
      message: "last location from sender",
      data: data,
    });
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("A client disconnected", socket.id);

    if (connectedSenders.size != 0) {
      connectedSenders.forEach((value, key) => {
        if (`${value}` === socket.id) {
          console.log("removing ", value, "from connected senders");
          connectedSenders.delete(key);
        }
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`socket server listening on ${PORT}`);
});

console.log("websocket_api imported");