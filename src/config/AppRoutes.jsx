import { Routes, Route } from 'react-router-dom'
import { Home } from '../pages/Home/Home'
import { ChatRoom } from '../pages/ChatRoom/ChatRoom'

export const AppRoutes = () => {
    return (
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="*" element={<h1>404 Page Not Found</h1>} />
        </Routes>
    );
}