import {Message} from "~/types/Message";

export interface Endpoint {
    topic: string
    function: (req: Message) => Promise<any>
}