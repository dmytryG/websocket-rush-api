import {Message} from "../types/Message";
import {Preprocessor} from "~/types/Preprocessor";

export interface Endpoint {
    topic: string
    function: (req: Message) => Promise<any>
    preprocessors: Array<Preprocessor> | undefined
}