import {Message} from "../types/Message";
import {Application} from "../core/Application";

export type Preprocessor = (req: Message, application: Application) => Promise<any>;