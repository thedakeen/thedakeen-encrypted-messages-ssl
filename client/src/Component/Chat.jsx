import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

import crypto from "crypto-browserify";

// async function fetchCertificate(){
//     const response = await fetch("https://localhost:8000/certificate");
//     return await response.text();
// }

function encryptMessage(message, publicKey){
    const buffer = Buffer.from(message, 'utf-8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64');
}


/////////////////////////////////////

// function Chat({ socket, username, room }) {
//     const [currentMessage, setCurrentMessage] = useState("");
//     const [messageList, setMessageList] = useState([]);
//
//     const sendMessage = async () => {
//         if (currentMessage !== "") {
//             const publicKey = await fetchCertificate();
//             const encryptedMessage = encryptMessage(currentMessage, publicKey);
//
//
//             const messageData = {
//                 room: room,
//                 author: username,
//                 message: encryptedMessage,
//                 time:
//                     new Date(Date.now()).getHours() +
//                     ":" +
//                     new Date(Date.now()).getMinutes(),
//             };
//
//             await socket.emit("send_message", messageData);
//             // setMessageList((list) => [...list, messageData]);
//             setMessageList((list) => [...list, { ...messageData, message: currentMessage }]);
//             setCurrentMessage("");
//         }
//     };

function Chat({ socket, username, room }) {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [publicKey, setPublicKey] = useState(null);

    const sendMessage = async () => {
        console.log("sendMessage called");
        if (currentMessage !== "" && publicKey) {
            const encryptedMessage = encryptMessage(currentMessage, publicKey);

            const messageData = {
                room: room,
                author: username,
                message: encryptedMessage,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, { ...messageData, message: currentMessage }]);
            setCurrentMessage("");
        }else{
            console.log("Public key not available or message is empty.");
        }
    };

    useEffect(() => {
        socket.on("certificate", (key) => {
            console.log("Received public key:", key);  // Добавьте лог для проверки
            setPublicKey(key);
        });

        const handleReceiveMessage = (data) => {
            setMessageList((list) => [...list, data]);
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("certificate");
        };
    }, [socket]);

    return (
        <div className="chat-window">
            <div className="chat-header">
                <p>Live Chat</p>
            </div>
            <div className="chat-body">
                <ScrollToBottom className="message-container">
                    {messageList.map((messageContent) => {
                        return (
                            <div
                                className="message"
                                id={username === messageContent.author ? "other" : "you"}
                            >
                                <div>
                                    <div className="message-content">
                                        <p>{messageContent.message}</p>
                                    </div>
                                    <div className="message-meta">
                                        <p id="time">{messageContent.time}</p>
                                        <p id="author">{messageContent.author}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </ScrollToBottom>
            </div>
            <div className="chat-footer">
                <input
                    type="text"
                    value={currentMessage}
                    placeholder="Hey..."
                    onChange={(event) => {
                        setCurrentMessage(event.target.value);
                    }}
                    onKeyDown={(event) => {
                        event.key === "Enter" && sendMessage();
                    }}
                />
                <button onClick={sendMessage}>&#9658;</button>
            </div>
        </div>
    );
}

export default Chat;