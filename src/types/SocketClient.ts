import WebSocket from "ws";

export interface SocketClient {
    context: any
    socket: WebSocket
}