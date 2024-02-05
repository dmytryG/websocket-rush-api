"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BClient = void 0;
const uuid_1 = require("uuid");
const Logger_1 = __importDefault(require("./Logger"));
const APIError_1 = __importDefault(require("../types/APIError"));
const websocket_1 = require("websocket");
console.log('Importing BClient');
class BClient {
    constructor(url) {
        this.ws = null;
        this.connected = false;
        this.url = '';
        this.url = url;
        this.pendingRequests = new Map();
        this.listeners = new Map();
    }
    setOnCloseListener(value) {
        this._onCloseListener = value;
    }
    processIncoming(client) {
        return (msg) => {
            try {
                const parsed = JSON.parse(msg.data.toString());
                console.log("Client got message", parsed, "with id", parsed.id);
                console.log(`There is ${client.pendingRequests.size} pending requests`);
                console.log(`There is ${client.listeners.size} listeners`, this.listeners);
                const pending = client.pendingRequests.get(parsed.id);
                const listener = client.listeners.get(parsed.topic);
                console.log('Listener', listener);
                if (pending) {
                    pending.callback(parsed);
                }
                else if (listener) {
                    console.log(`Got message to process with listener by topic ${parsed.topic}`);
                    listener.function(parsed, undefined).then(() => console.log('Listener compleated'));
                }
                else {
                    return;
                }
            }
            catch (e) {
                console.error("Error in incoming message loop", e);
            }
        };
    }
    async connect() {
        Logger_1.default.log("Connecting client ws");
        console.log('Instatination ws');
        this.ws = new websocket_1.w3cwebsocket(this.url);
        console.log('Awaiting connection');
        // Await connection establishment
        await new Promise((resolve, reject) => {
            this.ws.onopen = (() => {
                console.log('Connection oppened');
                resolve(undefined);
            });
            this.ws.onerror = ((e) => {
                console.log('Connection rejected', e);
                reject(e);
            });
        });
        console.log('Connected to ws');
        // Attach event handlers
        this.ws.onmessage = this.processIncoming(this); // Bind 'this' context
        this.ws.onclose = () => { this.onClose(); };
        this.connected = true;
        console.log("Socket successfully connected");
    }
    async request(config) {
        Logger_1.default.log("Requesting", config);
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                throw new APIError_1.default('WebSocket client is not connected', 404);
            }
            if (!config.topic) {
                throw new APIError_1.default('Topic have to be provided', 400);
            }
            const messageId = (0, uuid_1.v4)();
            const message = {
                data: config.data,
                context: config.context,
                id: messageId,
                topic: config.topic,
                isResponse: false,
                client: undefined,
                isError: false
            };
            const JSONToSend = JSON.stringify(message);
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(messageId); // Clear pending request
                reject(new APIError_1.default('Request timed out', 408));
            }, config.timeout ?? 10000);
            const onResolved = (result) => {
                this.pendingRequests.delete(messageId);
                Logger_1.default.log("Request resolved", result);
                clearTimeout(timeout);
                if (result.isError) {
                    const error = new APIError_1.default(result.data.message, result.data.code, result.data.reason);
                    reject(error);
                }
                resolve(result);
            };
            this.pendingRequests.set(messageId, { request: message, callback: onResolved });
            this.ws.send(JSONToSend);
            Logger_1.default.log("Sent request", JSONToSend);
        });
    }
    subscribeListener(listener) {
        this.listeners.set(listener.topic, listener);
    }
    unsubscribeListener(topic) {
        this.listeners.delete(topic);
    }
    getListener(topic) {
        const listener = this.listeners.get(topic);
        return listener;
    }
    async send(config) {
        if (!this.connected) {
            throw new APIError_1.default('WebSocket client is not connected', 404);
        }
        if (!config.topic) {
            throw new APIError_1.default('Topic have to be provided', 400);
        }
        const messageId = (0, uuid_1.v4)();
        const message = {
            data: config.data,
            context: config.context,
            id: messageId,
            topic: config.topic,
            isResponse: false,
            client: undefined,
            isError: false
        };
        const JSONToSend = JSON.stringify(message);
        this.ws.send(JSONToSend);
    }
    onClose() {
        Logger_1.default.log("Called logging out of WS");
        this.connected = false;
        this._onCloseListener?.call(undefined);
    }
    close() {
        if (this.ws) {
            this.ws.close();
        }
        this.connected = false;
    }
}
exports.BClient = BClient;
console.log('Exporting BClient');
