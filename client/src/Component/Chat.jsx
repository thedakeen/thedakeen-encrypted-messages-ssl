import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import crypto from "crypto";

function encryptMessage(message, publicKey){
    const buffer = Buffer.from(message, 'utf-8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer)
    return encrypted.toString('base64');
}

function Chat({ socket, username, room }) {
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [publicKey, setPublicKey] = useState("");
    const [userList, setUserList] = useState([]);

    const sendMessage = async () => {
        if (currentMessage !== "" && publicKey !== "") {
            const encryptedMessage = encryptMessage(currentMessage, publicKey)

            const messageData = {
                room: room,
                author: username,
                message: encryptedMessage,
                time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
                publicKey: publicKey,
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, {...messageData, message: currentMessage}]);
            setCurrentMessage("");
        } else {
            console.log("Message is empty.");
        }
    };

    useEffect(() => {
        const handleReceiveMessage = (data) => {
            setMessageList((list) => [...list, data]);
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [socket]);

    useEffect(() => {
        socket.emit("request_public_key");

        socket.on("receive_public_key", (key) => {
            console.log("Received public key:", key);
            setPublicKey(key);
        });

        return () => {
            socket.off("receive_public_key");
        };
    }, [socket]);

    useEffect(() => {
        const handleUpdateUserList = (userList) => {
            console.log("User list in room:", userList);
            setUserList(userList);
        };

        socket.on("update_user_list", handleUpdateUserList);

        return () => {
            socket.off("update_user_list", handleUpdateUserList);
        };
    }, [socket]);

    return (
        <div className="chat-window">
            <div className="chat-header">
                <p>Live Chat</p>
            </div>

            <div className="main-container">
                <div className="user-list">
                    <h3>In the room:</h3>
                    <ul>
                        {userList.map((user, index) => (
                            <li key={index}>{user.username}</li>
                        ))}
                    </ul>
                </div>

                <div className="chat-container">
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
            </div>
        </div>
    );
}

export default Chat;
