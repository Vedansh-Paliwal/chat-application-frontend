import styles from "./JoinCreateChat.module.css"
import chatIcon from "../assets/chat_icon.png"
import { useState } from "react";
import { createRoom, joinRoom } from "../services/RoomService";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/ApiErrorHandler";
import useChatContext from "../context/ChatContext";
import { useNavigate } from "react-router-dom";

export const JoinCreateChat = () => {

    const [formData, setFormData] = useState({name: "", roomId: ""});
    const [error, setError] = useState("");
    const [createRoomLoading, setCreateRoomLoading] = useState(false);
    const [joinRoomLoading, setJoinRoomLoading] = useState(false);
    const {roomId, currentUser, connected, setRoomId, setCurrentUser, setConnected} = useChatContext();
    const navigate = useNavigate();

    const handleFormChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const handleJoinRoom = async (e) => {
        if(!validateForm()) return;
        setJoinRoomLoading(true);
        try {
            const response = await joinRoom(formData.roomId);
            setCurrentUser(formData.name);
            setRoomId(response.roomId);
            setConnected(true);
            navigate("/chat");
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setJoinRoomLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        if (!validateForm()) return;
        setCreateRoomLoading(true);
        try {
            const response = await createRoom({ roomId: formData.roomId.trim() });
            toast.success("Room created successfully!");
            // Join the room
            setCurrentUser(formData.name);
            setRoomId(response.roomId);
            setConnected(true);
            navigate("/chat");
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setCreateRoomLoading(false);
        }
    };
    
    function validateForm() {
        if (!formData.name.trim() || !formData.roomId.trim()) {
            setError("Please fill in all fields");
            return false;
        }
        setError("");
        return true;
    }
    
    return(
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.icon}>
                    <img src={chatIcon} alt="chat_Icon" className={styles.chatIcon}/>
                </div>
                <h1 className={styles.heading}>
                    Join Room / Create Room ..
                </h1>
                <form className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Your Name <span className={styles.required}>*</span> </label>
                        <input 
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Room ID <span className={styles.required}>*</span> </label>
                        <input 
                            type="text"
                            id="roomId"
                            name="roomId"
                            value={formData.roomId}
                            onChange={handleFormChange}
                            placeholder="Enter room ID"
                        />
                    </div>
                    <div className={`${styles.formGroup} ${styles.buttonStyles}`}>
                        <button disabled={joinRoomLoading || createRoomLoading} type="button" onClick={handleJoinRoom} className={styles.joinButton}>
                            {joinRoomLoading ? "Joining Room..." : "Join Room"}
                        </button>
                        <button disabled={createRoomLoading || joinRoomLoading} type="button" onClick={handleCreateRoom} className={styles.createButton}>
                            {createRoomLoading ? "Creating..." : "Create Room"}
                        </button>
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                </form>
            </div>
        </div>
    );
}