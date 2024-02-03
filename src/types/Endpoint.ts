import {Message} from "../types/Message";
import {Preprocessor} from "~/types/Preprocessor";
import {Application} from "~/core/Application";

export interface Endpoint {
    topic: string
    function: (req: Message, application: Application | undefined) => Promise<any>
    preprocessors: Array<Preprocessor> | undefined
}