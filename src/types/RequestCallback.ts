import {Message} from "./Message";
// import {Client} from "../core/Client";

export interface RequestCallback {
    callback: any,
    request: Message
    // clientContext: Client
}