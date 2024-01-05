import WebSocket from 'ws';
import {Message} from "~/types/Message";
import {Client} from "~/types/Client";
import APIError from "~/types/APIError";
import {Endpoint} from "~/types/Endpoint";

export class Application {
    private args: any;
    private wss: WebSocket.Server;
    private preProcessors: Array<(req: Message, application: Application) => Promise<any>> = [];
    private endpoints: Array<Endpoint> = [];
    private errorProcessor: ((e: any) => Promise<any>) | null = null;
    private clients: Array<Client>;

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
            } as Client)

            ws.on('message', async (message: string) => {
                console.log(`Received message: ${message}`);
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
                        console.log("Sending response", outcomingMessage)
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
                        console.log("Sending response", outcomingMessage)
                        ws.send(outcomingMessageJSON);
                    } else {
                        console.error('Request error occured, no errorProcessor found, the message in unanswered', e)
                    }
                }
            });

            ws.on('close', () => {
                this.clients.filter((c) => c.socket === ws)
            });
        });
    }
}