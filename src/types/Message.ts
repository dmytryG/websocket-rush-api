import WebSocket from "ws";
import {Client} from "../types/Client";

export interface Message {
    data: any
    context: any
    id: string
    topic: string
    isResponse: boolean
    client: Client | null | undefined
    isError: boolean | null | undefined
}