import {Message} from "./Message";

export interface RequestCallback {
    callback: any,
    request: Message
}