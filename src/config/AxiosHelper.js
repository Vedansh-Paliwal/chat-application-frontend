import axios from 'axios';

export const baseURL = "https://chat-application-backend-hcf1.onrender.com";
export const httpClient = axios.create({
    baseURL: baseURL
});