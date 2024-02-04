"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const ws_1 = __importDefault(require("ws"));
const uuid_1 = require("uuid");
const Logger_1 = __importDefault(require("./Logger"));
const APIError_1 = __importDefault(require("../types/APIError"));
class Client {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.pendingRequests = new Map();
    }
    set onCloseListener(value) {
        this._onCloseListener = value;
    }
    processIncoming(client) {
        return (msg) => {
            try {
                // @ts-ignore
                const parsed = JSON.parse(msg.data);
                Logger_1.default.log("Client got message", parsed, "with id", parsed.id);
                Logger_1.default.log(`There is ${client.pendingRequests.size} pending requests`);
                const pending = client.pendingRequests.get(parsed.id);
                const listener = client.listeners.get(parsed.topic);
                if (pending) {
                    pending.callback(parsed);
                }
                else if (listener) {
                    listener.function(parsed, undefined);
                }
                else {
                    return;
                }
            }
            catch (e) {
                Logger_1.default.error("Error in incoming message loop", e);
            }
        };
    }
    async connect() {
        Logger_1.default.log("Connecting client ws");
        this.ws = new ws_1.default(this.url);
        await new Promise((resolve, reject) => {
            this.ws.on('open', resolve);
            this.ws.on('error', reject);
        });
        this.ws.onmessage = this.processIncoming(this);
        this.ws.on('close', this.onClose);
        this.connected = true;
        await Logger_1.default.log("Socket successfully connected");
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
        this._onCloseListener();
    }
    close() {
        if (this.ws) {
            this.ws.close();
        }
        this.connected = false;
    }
}
exports.Client = Client;
