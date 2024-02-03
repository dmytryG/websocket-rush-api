import {Application} from "../src/core/Application";
import {Logger} from "../src/core/Logger";
import {Client} from "../src/core/Client";
import APIError from "../src/types/APIError";
import {RequestCallback} from "../src/types/RequestCallback";
import {RequestConfig} from "../src/types/RequestConfig";
import {SocketClient} from "../src/types/SocketClient";
import {Endpoint} from "../src/types/Endpoint";
import {Message} from "../src/types/Message";
import {Preprocessor} from "./types/Preprocessor";



declare module "@dmytryG/websocket-rush-api";

export { Application, APIError, SocketClient, Endpoint, Message, Logger, Client, RequestCallback, RequestConfig, Preprocessor }