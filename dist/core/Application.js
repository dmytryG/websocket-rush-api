"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const ws_1 = __importDefault(require("ws"));
const APIError_1 = __importDefault(require("../types/APIError"));
const Logger_1 = __importDefault(require("../core/Logger"));
const uuid_1 = require("uuid");
class Application {
    constructor(port) {
        this.args = undefined;
        this.wss = undefined;
        this.preProcessors = [];
        this.endpoints = [];
        this.errorProcessor = null;
        this.clients = [];
        this.args = { port };
    }
    addPreprocessor(func) {
        this.preProcessors.push(func);
    }
    addEndpoint(endpoint) {
        this.endpoints.push(endpoint);
    }
    setErrorProcessor(func) {
        this.errorProcessor = func;
    }
    updateClientContext(ws, context) {
        const client = this.clients.find((c) => c.socket === ws);
        if (client) {
            client.context = context;
        }
    }
    // Broadcast message
    async scream(config) {
        const messageId = (0, uuid_1.v4)();
        const message = {
            data: config.data,
            context: config.context,
            id: messageId,
            topic: config.topic,
            isResponse: true,
            client: undefined,
            isError: false
        };
        const JSONToSend = JSON.stringify(message);
        this.wss.send(JSONToSend);
    }
    // Send privately
    async whisper(config, wsc) {
        const messageId = (0, uuid_1.v4)();
        const message = {
            data: config.data,
            context: config.context,
            id: messageId,
            topic: config.topic,
            isResponse: true,
            client: undefined,
            isError: false
        };
        const JSONToSend = JSON.stringify(message);
        wsc.socket.send(JSONToSend);
    }
    async whisperFiltered(config, filter) {
        const clients = this.clients.filter(filter);
        for (const client of clients) {
            const messageId = (0, uuid_1.v4)();
            const message = {
                data: config.data,
                context: config.context,
                id: messageId,
                topic: config.topic,
                isResponse: true,
                client: undefined,
                isError: false
            };
            const JSONToSend = JSON.stringify(message);
            client.socket.send(JSONToSend);
        }
    }
    listen() {
        this.wss = new ws_1.default.Server(this.args);
        this.wss.on('connection', (ws) => {
            this.clients.push({
                socket: ws
            });
            ws.on('message', async (message) => {
                Logger_1.default.log(`Received message: ${message}`);
                try {
                    const incomingMessage = JSON.parse(message);
                    try {
                        incomingMessage.isResponse = false;
                        if (!incomingMessage.topic || !incomingMessage.id) {
                            throw new APIError_1.default("Incoming message have to be provided with topic and id", 400);
                        }
                        const client = this.clients.find((c) => c.socket === ws);
                        if (client) {
                            incomingMessage.client = client;
                        }
                        for (const preprocessor of this.preProcessors) {
                            await preprocessor(incomingMessage, this);
                        }
                        const endponit = this.endpoints.find((e) => e.topic === incomingMessage.topic);
                        if (!endponit) {
                            throw new APIError_1.default("Endpoint not found", 404);
                        }
                        if (endponit.preprocessors && endponit.preprocessors.length > 0) {
                            for (const preprocessor of endponit.preprocessors) {
                                await preprocessor(incomingMessage, this);
                            }
                        }
                        const response = await endponit.function(incomingMessage, this);
                        if (response) {
                            const outcomingMessage = {
                                context: undefined,
                                data: response,
                                id: incomingMessage.id,
                                isResponse: true,
                                topic: incomingMessage.topic,
                                client: null,
                                isError: false
                            };
                            const outcomingMessageJSON = JSON.stringify(outcomingMessage);
                            Logger_1.default.log("Sending response", outcomingMessage);
                            ws.send(outcomingMessageJSON);
                        }
                    }
                    catch (e) {
                        if (this.errorProcessor) {
                            const response = await this.errorProcessor(e);
                            const outcomingMessage = {
                                context: undefined,
                                data: response,
                                id: incomingMessage.id,
                                isResponse: true,
                                topic: incomingMessage.topic,
                                client: null,
                                isError: true
                            };
                            const outcomingMessageJSON = JSON.stringify(outcomingMessage);
                            Logger_1.default.log("Sending response", outcomingMessage);
                            ws.send(outcomingMessageJSON);
                        }
                        else {
                            await Logger_1.default.error('Request error occured, no errorProcessor found, the message in unanswered', e);
                        }
                    }
                }
                catch (e) {
                    await Logger_1.default.error("The server panicked, because of error", e);
                }
            });
            ws.on('close', () => {
                this.clients.filter((c) => c.socket === ws);
            });
            Logger_1.default.log("New client connected!");
        });
        Logger_1.default.log(`The server started on port ${this.args?.port}`);
    }
}
exports.Application = Application;
