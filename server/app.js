const express = require('express');
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io")

app.use(cors());

const crypto = require('crypto');
const fs = require('fs');


function decryptMessage(encryptedMessage) {
    const buffer = Buffer.from(encryptedMessage, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf-8');
}
// function encryptMessage(message, publicKey){
//     const buffer = Buffer.from(message, 'utf-8');
//     const encrypted = crypto.publicEncrypt(publicKey, buffer)
//     return encrypted.toString('base64');
// }

const privateKey = fs.readFileSync('../ssl/certificate/private.key', 'utf-8');
const publicKey = fs.readFileSync('../ssl/certificate/public_key.pem', 'utf-8');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", (data) => {
        socket.join(data);

        console.log(`User with ID: ${socket.id} joined room: ${data}`);

    });


    socket.on("send_message", (data) => {
        console.log("Received message: ", data.message);

        const decryptedMessage = decryptMessage(data.message);
        console.log("Decrypted message: ", decryptedMessage);

        const encryptedResponse = crypto.publicEncrypt(
            publicKey,
            Buffer.from(`Echo: ${decryptedMessage}`)
        );

        console.log("Encrypted message: ", encryptedResponse.toString('base64'))

        socket.to(data.room).emit("receive_message", {
            message: decryptedMessage,
            author: data.author,
            time: new Date().toLocaleTimeString(),
        });
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });

    socket.on("request_public_key", () => {
        socket.emit("receive_public_key", publicKey);
    });

});

server.listen(8000, () => {
    console.log("SERVER RUNNING");
});


