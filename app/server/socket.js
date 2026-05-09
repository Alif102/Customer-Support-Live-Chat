const { Server } = require("socket.io");

let io;

function initSocket(server) {

  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {

    console.log("✅ SOCKET CONNECTED");

    socket.on(
      "join-conversation",
      (conversationId) => {

        socket.join(conversationId);

        console.log(
          "JOINED:",
          conversationId
        );
      }
    );

    socket.on(
      "send-message",
      (message) => {

        io.to(
          message.conversationId
        ).emit(
          "receive-message",
          message
        );
      }
    );

    socket.on("disconnect", () => {
      console.log("❌ DISCONNECTED");
    });

  });
}

function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO,
};