import { httpClient } from "../config/AxiosHelper";

export const createRoom = async (roomDetails) => {
    const response = await httpClient.post(`/api/v1/rooms`, roomDetails);
    return response.data;
}

export const joinRoom = async (roomId) => {
    const response = await httpClient.get(`/api/v1/rooms/${roomId}`);
    return response.data;
}

export const loadMessages = async (roomId,size=20,page=0) => {
    const response = await httpClient.get(`/api/v1/rooms/${roomId}/messages?size=${size}&page=${page}`);
    return response.data;
}