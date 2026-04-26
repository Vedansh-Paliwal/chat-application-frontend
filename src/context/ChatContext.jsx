import { createContext, useContext, useState, useEffect } from "react";

const ChatContext = createContext()

export const ChatProvider = ({children}) => {
    const [roomId, setRoomId] = useState(localStorage.getItem("roomId") || "");
    const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
    const [connected, setConnected] = useState(localStorage.getItem("connected") === "true");

    useEffect(() => {
        localStorage.setItem("roomId", roomId);
        localStorage.setItem("currentUser", currentUser);
        localStorage.setItem("connected", connected);
    }, [roomId, currentUser, connected]);

    return <ChatContext.Provider value={{roomId, currentUser, connected, setRoomId, setCurrentUser, setConnected}}>
        {children}
    </ChatContext.Provider>
}

const useChatContext = () => useContext(ChatContext);
export default useChatContext;