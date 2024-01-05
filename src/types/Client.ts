import WebSocket from "ws";

export interface Client {
    context: any
    socket: WebSocket
}