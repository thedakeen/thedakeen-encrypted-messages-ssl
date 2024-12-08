const express = require('express');
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io")

app.use(cors());

const crypto = require('crypto');
const fs = require('fs');

require('dotenv').config({path: '../.env'});

const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf-8');
const publicKey = fs.readFileSync(process.env.PUBLIC_KEY_PATH, 'utf-8');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
let roomUsers = {};


function decryptMessage(encryptedMessage) {
    const buffer = Buffer.from(encryptedMessage, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf-8');
}

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        const { room, username } = data;

        socket.join(room);

        if (!roomUsers[room]) {
            roomUsers[room] = [];
        }

        roomUsers[room].push({ socketId: socket.id, username });
        console.log(`User with ID: ${socket.id} joined room: ${room}`);
        io.to(room).emit("update_user_list", roomUsers[room]);
    });


    socket.on("send_message", (data) => {
        console.log("Received message: ", data.message);

        const decryptedMessage = decryptMessage(data.message);
        console.log("Decrypted message: ", decryptedMessage);

        const encryptedResponse = crypto.publicEncrypt(
            publicKey,
            Buffer.from(`Echo: ${decryptedMessage}`)
        );

        // console.log("Encrypted message: ", encryptedResponse.toString('base64'))

        socket.to(data.room).emit("receive_message", {
            message: decryptedMessage,
            author: data.author,
            time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
        });

    });

    socket.on("disconnect", () => {

        let disconnectedUser = null;

        for (let room in roomUsers) {
            const user = roomUsers[room].find(user => user.socketId === socket.id);

            if (user) {
                disconnectedUser = user.username;
            }

            roomUsers[room] = roomUsers[room].filter(user => user.socketId !== socket.id);

            io.to(room).emit("update_user_list", roomUsers[room]);
        }


            io.emit("receive_message", {
                message: `${disconnectedUser} disconnected`,
            });

        console.log("User Disconnected", socket.id);
    });

    socket.on("request_public_key", () => {
        socket.emit("receive_public_key", publicKey);
    });

});

server.listen(8000, () => {
    console.log("SERVER RUNNING");
});


