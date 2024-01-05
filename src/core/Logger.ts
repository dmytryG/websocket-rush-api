import * as console from "console";

export default class Logger {
    static async log(...args: any[]): Promise<void> {
        console.log(Date.now().toString(), ...args)
    }
    static async error(...args: any[]): Promise<void> {
        console.error(Date.now().toString(), ...args)
    }
}