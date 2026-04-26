# ChatApp Frontend

A real-time group chat application frontend built with React.

## Features

- Create or join a chat room using a name and room ID
- Real-time messaging via WebSockets using STOMP protocol over SockJS
- Paginated message history with infinite scroll — scroll up to load older messages
- Smooth scroll position preservation when loading past messages
- Auto scroll to latest message on new message arrival
- Persistent session via localStorage — refresh without losing your room
- Clean disconnect on leaving a room

## Tech Stack

- React
- React Router
- Axios
- SockJS
- STOMPjs
- React Hot Toast
- CSS Modules

## Pages

- **Home** — Enter your name and room ID to create or join a room
- **ChatRoom** — Real-time chat interface with message history and WebSocket connection

## Environment

Update `src/config/AxiosHelper.js` with your backend URL:

```javascript
export const baseURL = "your-backend-url";
```

## Backend

This frontend connects to the [ChatApp Backend](https://github.com/Vedansh-Paliwal/chat-application-backend).