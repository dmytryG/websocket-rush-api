import WebSocket from 'ws';
import { Message } from '../types/Message'; // Assuming Message type is
import { v4 as uuidv4 } from 'uuid';
import {RequestConfig} from "../types/RequestConfig";
import {RequestCallback} from "../types/RequestCallback";
import Logger from "./Logger";
import APIError from "../types/APIError";

export class Client {
    private ws: WebSocket | null = null;
    private connected: boolean = false
    private pendingRequests: Map<string, RequestCallback> = new Map();

    constructor(private url: string) {}

    protected processIncoming(msg: WebSocket.MessageEvent): void {
        try {
            // @ts-ignore
            const parsed: Message = JSON.parse(msg.data)
            Logger.log("Client got message", parsed)
            const pending = this.pendingRequests.get(parsed.id)
            if (!pending) {
                return
            } else {
                pending.callback(parsed)
            }
        } catch (e) {
            Logger.error("Error in incoming message loop", e)
        }

    }

    public async connect(): Promise<void> {
        Logger.log("Connecting client ws")
        this.ws = new WebSocket(this.url);

        await new Promise((resolve, reject) => {
            this.ws!.on('open', resolve);
            this.ws!.on('error', reject);
        });

        this.ws!.onmessage = this.processIncoming

        this.ws!.on('close', this.onClose);

        this.connected = true;
        await Logger.log("Socket successfully connected")
    }

    public async request(config: Partial<RequestConfig>): Promise<Message> {
        Logger.log("Requesting", config)
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                throw new APIError('WebSocket client is not connected', 404);
            }
            if (!config.topic) {
                throw new APIError('Topic have to be provided', 400);
            }
            const messageId = uuidv4()
            const message = {
                data: config.data,
                context: config.context,
                id: messageId,
                topic: config.topic,
                isResponse: false,
                client: undefined,
                isError: false
            } as Message

            const JSONToSend = JSON.stringify(message)

            const onResolved = (result: Message) => {
                // this.pendingRequests.delete(messageId)
                Logger.log("Request resolved", result)
                resolve(result)
            }

            this.pendingRequests.set(messageId, { request: message, callback: onResolved })

            this.ws!.send(JSONToSend)

            Logger.log("Sent request", JSONToSend)
        })
    }

    public onClose(callback: () => void): void {
        Logger.log("Called logging out of WS")
        this.connected = false;
    }

    public close(): void {
        if (this.ws) {
            this.ws.close();

        }
        this.connected = false;
    }
}
