import styles from "./ChatRoom.module.css"
import useChatContext from "../../context/ChatContext";
import { baseURL } from "../../config/AxiosHelper";
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";
import { loadMessages } from "../../services/RoomService";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import toast from "react-hot-toast";
import { handleApiError } from "../../utils/ApiErrorHandler";
import { FastForward } from "lucide-react";

export const ChatRoom = () => {

    const { roomId, currentUser, connected, setConnected, setRoomId, setCurrentUser } = useChatContext();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [stompClient, setStompClient] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const chatBoxRef = useRef(null);
    const [hasMore, setHasMore] = useState(true);
    const isLoadingMore = useRef(false);
    const prevScrollHeight = useRef(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!connected) {
            navigate("/");
        }
    }, [roomId, connected, currentUser]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await loadMessages(roomId);
                setMessages([...response.messages].reverse());
                setHasMore(response.currentPage < response.totalPages - 1);
            } catch (error) {
                toast.error(handleApiError(error));
            }
        };
        if (connected) {
            fetchMessages();
        }
    }, []);
    
    useEffect(() => {
        /*  scroll() and scrollTo() are actually the same thing — scroll is just an alias for scrollTo.
        Now let me explain the properties you found, because they're all related:
        scrollTop — how many pixels the user has scrolled from the top. If user hasn't scrolled at all, it's 0. If they've scrolled 
        down 200px, it's 200.
        scrollHeight — the total height of all content inside the element, including the part not visible on screen. Imagine your 
        chat has 100 messages but only 10 fit on screen — scrollHeight is the height of all 100.
        scrollTo({top, behavior}) — programmatically scrolls the element. top is where you want to scroll to (in pixels from top), 
        behavior: "smooth" animates it. 
        */
        if (chatBoxRef.current) {
            if(isLoadingMore.current) {
                isLoadingMore.current = false;
                // This pushes the view down by exactly how much new content was added above, keeping the same messages in view.
                chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight - prevScrollHeight.current;
                return;
            }
            chatBoxRef.current.scroll({
                top: chatBoxRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages]);

    /* 
    So to answer the exact question:
    "Whom am I sending the message to?"
    You're sending it to that one handler on the server. It's not like HTTP where the URL itself routes you to the right place. 
    With raw WebSocket, the URL just opens the connection — after that, routing is your problem. You have to manually tell the server 
    what the message is about inside the message itself.
    Now imagine your backend has:
    Room 42 chat
    Room 43 chat
    "User is typing" notifications
    "User joined" notifications
    Admin announcements
    With raw WebSocket, one connection receives everything. Your frontend gets a message — now what? You have to figure out what kind of 
    message it even is before doing anything with it.
    */
    // Initiate STOMP client
    useEffect(() => {
        const connectWebSocket = () => {
            const socket = new SockJS(`${baseURL}/chat`); /* "Hey backend, I want to open a WebSocket connection at /chat"
            new SockJS(...) doesn't give you a raw WebSocket object. It gives you a SockJS object that behaves like a WebSocket but with 
            that reliability fallback we talked about earlier (if WebSocket is blocked, it falls back silently).
            */
            const client = Stomp.over(socket); /* SockJS gives you the phone line (connection).
            But it's still a dumb line — you can only send raw strings through it, same wild west problem.
            Stomp.over(socket) takes that phone line and wraps it with STOMP's brain. Now instead of a dumb line, you have a smart 
            client that knows about:
            destinations (/app/room/42)
            subscriptions (/topic/room/42)
            structured messages */
            /* 
            new SockJS(...) actually opens the connection immediately when that line runs.
            So yes, by the time you do Stomp.over(socket), the connection is already open at the /chat level.
            But here's the thing —
            The connection is open but STOMP doesn't know about it yet. It's like the phone call connected, but nobody has said hello yet
            .STOMP needs to do its own handshake on top of the SockJS connection.
            */
            client.connect({}, () => {
                setStompClient(client);
                // STOMP handshake done, NOW you're fully ready, only subscribe inside here
                // The {} is for headers — like auth tokens if needed, empty for now.
                toast.success("Connected");
                /* 
                The callback function () => { ... } runs only after STOMP handshake is complete. This is important — you should only 
                subscribe inside this callback, because if you try subscribing before STOMP is ready, it'll fail. 
                Server pushes something to /topic/room/{roomId}, that callback fires automatically. message is whatever arrived (It's not
                just the text you sent. STOMP wraps it in an envelope — like a letter with a cover. The actual content you care about 
                sits inside: message.body)
                */
                client.subscribe(`/topic/room/${roomId}`, (messages) => {
                    const newMessage = JSON.parse(messages.body); // Since WebSockets carry only plain string, and in real apps, server 
                    // sends structured object, so it converts it into JSON object and we getting JS object on frontend via parse
                    setMessages((prev) => [...prev, newMessage]);
                });
            });
        };
        if (connected) {
            connectWebSocket();
        }
    }, [roomId])

    const handleScroll = () => {
        if(chatBoxRef.current.scrollTop === 0) {
            isLoadingMore.current = true;
            loadPastMessages();
        }
    };

    const loadPastMessages = async () => {
        try {
            if(hasMore) {
                const nextPage = currentPage + 1;
                setCurrentPage(nextPage);
                const response = await loadMessages(roomId, 20, nextPage);
                prevScrollHeight.current = chatBoxRef.current.scrollHeight;
                setMessages(prev => [...[...response.messages].reverse(), ...prev]);
                setHasMore(response.currentPage < response.totalPages - 1);
            }
            else {
                return;
            }
        } catch (error) {
            toast.error("Some error encountered while loading past messages");
        }
    }

    const handleMessageChange = (e) => {
        setInputMessage(e.target.value); // message is just a simple string, not an object, so no need to spread it first and then set.
        e.target.style.height = "auto"; // let browser calculate automatically
        e.target.style.height = e.target.scrollHeight + "px"; // then grow
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // don't add new line
            handleSendMessage();
        }
    }

    const handleSendMessage = async () => {
        if (stompClient && connected && inputMessage.trim()) {
            const message = {
                sender: currentUser,
                content: inputMessage
            };
            // STOMP's send() takes these arguments in order:
            // stompClient.send(destination, headers, body, unusedExtraHeaders);
            stompClient.send(`/app/sendMessage/${roomId}`,
                {}, // headers, like auth tokens etc, empty for now
                JSON.stringify(message),
                {}); // honestly this 4th argument is rarely used, some older versions of STOMP had it, most people just leave it empty and forget about it
            setInputMessage("");
        }
    }

    const handleLeaveRoom = () => {
        if (stompClient) {
            stompClient.disconnect();
        }
        setConnected(false);
        setRoomId("");
        setCurrentUser("");
        navigate("/");
    }

    return (
        <div className={styles.container}>
            <header>
                <div>
                    <p className={styles.roomDetails}>Room : <span>{roomId}</span></p>
                </div>
                <div className={styles.userDetails}>
                    User : <span>{currentUser}</span>
                </div>
                <div className={styles.leaveButton}>
                    <button onClick={handleLeaveRoom}>Leave Room</button>
                </div>
            </header>
            <main ref={chatBoxRef} onScroll={handleScroll}>
                {
                    messages.map((message, index) => (
                        <div key={index} className={`${styles.message} ${message.senderUsername === currentUser ? styles.sent : styles.received}`}>
                            <span className={styles.senderName}>{message.senderUsername}</span>
                            <p className={styles.messageContent}>{message.content}</p>
                        </div>
                    ))
                }
            </main>
            <div className={styles.sendMessage}>
                <textarea
                    value={inputMessage}
                    placeholder="Type a message ..."
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                />
                <button onClick={handleSendMessage} type="button" className={styles.sendButton}>→</button>
            </div>
        </div>
    );
}