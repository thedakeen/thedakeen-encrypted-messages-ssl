const express = require('express');
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io")


const crypto = require('crypto');
const fs = require('fs');
const privateKey = fs.readFileSync('../ssl/certificate/private.key', 'utf-8');
const publicKey = fs.readFileSync('../ssl/certificate/certificate.crt', 'utf-8');  // Чтение публичного ключа для клиента


function decryptMessage(encryptedMessage) {
    const buffer = Buffer.from(encryptedMessage, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf-8');
}

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.emit("certificate", publicKey);

    socket.on("join_room", (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
    });

    socket.on("send_message", (data) => {
        const decryptedMessage = decryptMessage(data.message);
        console.log(`Decrypted Message: ${decryptedMessage}`);
        data.message = decryptedMessage;
        socket.to(data.room).emit("receive_message", data);

    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

server.listen(8000, () => {
    console.log("SERVER RUNNING");
});

app.get('/certificate', (req, res) => {
    const certificate = fs.readFileSync('../ssl/certificate/certificate.crt', 'utf-8');
    res.send(certificate);
});


