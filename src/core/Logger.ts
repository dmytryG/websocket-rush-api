import * as console from "console";

export default class Logger {
    static async log(...args: any[]): Promise<void> {
        console.log((new Date()).toISOString(), ...args)
    }
    static async error(...args: any[]): Promise<void> {
        console.error((new Date()).toISOString(), ...args)
    }
}