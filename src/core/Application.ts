import WebSocket from 'ws';
import {Message} from "../types/Message";
import {SocketClient} from "../types/SocketClient";
import APIError from "../types/APIError";
import {Endpoint} from "../types/Endpoint";
import Logger from "../core/Logger";

export class Application {
    private args: any = undefined;
    private wss: any = undefined;
    private preProcessors: Array<(req: Message, application: Application) => Promise<any>> = [];
    private endpoints: Array<Endpoint> = [];
    private errorProcessor: ((e: any) => Promise<any>) | null = null;
    private clients: Array<SocketClient> = [];

    constructor(port: number) {
        this.args = { port }
    }

    public addPreprocessor(func: (req: Message, application: Application) => Promise<any>): void {
        this.preProcessors.push(func)
    }

    public addEndpoint(endpoint: Endpoint): void {
        this.endpoints.push(endpoint)
    }

    public setErrorProcessor(func: (e: any) => Promise<any>): void {
        this.errorProcessor = func
    }

    public listen() {
        this.wss = new WebSocket.Server(this.args);
        this.wss.on('connection', (ws: WebSocket) => {
            this.clients.push({
                socket: ws
            } as SocketClient)

            ws.on('message', async (message: string) => {
                Logger.log(`Received message: ${message}`);
                try {
                    const incomingMessage: Message = JSON.parse(message)
                    try {
                        incomingMessage.isResponse = false;
                        if (!incomingMessage.topic || !incomingMessage.id) {
                            throw new APIError("Incoming message have to be provided with topic and id", 400)
                        }
                        const client = this.clients.find((c) => c.socket === ws)
                        if (client) {
                            incomingMessage.client = client
                        }
                        for (const preprocessor of this.preProcessors) {
                            await preprocessor(incomingMessage, this)
                        }
                        const endponit = this.endpoints.find((e) => e.topic === incomingMessage.topic)
                        if (!endponit) {
                            throw new APIError("Endpoint not found", 404)
                        }
                        const response = await endponit.function(incomingMessage)
                        if (response) {
                            const outcomingMessage: Message = {
                                context: undefined,
                                data: response,
                                id: incomingMessage.id,
                                isResponse: true,
                                topic: incomingMessage.topic,
                                client: null,
                                isError: false
                            }
                            const outcomingMessageJSON = JSON.stringify(outcomingMessage)
                            Logger.log("Sending response", outcomingMessage)
                            ws.send(outcomingMessageJSON);
                        }
                    } catch (e) {
                        if (this.errorProcessor) {
                            const response = await this.errorProcessor(e)
                            const outcomingMessage: Message = {
                                context: undefined,
                                data: response,
                                id: incomingMessage.id,
                                isResponse: true,
                                topic: incomingMessage.topic,
                                client: null,
                                isError: true
                            }
                            const outcomingMessageJSON = JSON.stringify(outcomingMessage)
                            Logger.log("Sending response", outcomingMessage)
                            ws.send(outcomingMessageJSON);
                        } else {
                            await Logger.error('Request error occured, no errorProcessor found, the message in unanswered', e)
                        }
                    }
                } catch (e) {
                    await Logger.error("The server panicked, because of error", e)
                }
            });

            ws.on('close', () => {
                this.clients.filter((c) => c.socket === ws)
            });
            Logger.log("New client connected!")
        });
        Logger.log(`The server started on port ${this.args?.port}`)
    }
}