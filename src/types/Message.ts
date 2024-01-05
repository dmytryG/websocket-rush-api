import WebSocket from "ws";
import {SocketClient} from "./SocketClient";

export interface Message {
    data: any
    context: any
    id: string
    topic: string
    isResponse: boolean
    client: SocketClient | null | undefined
    isError: boolean | null | undefined
}