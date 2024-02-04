"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    static { this._isEnabled = true; }
    static get isEnabled() {
        return this._isEnabled;
    }
    static set isEnabled(value) {
        this._isEnabled = value;
    }
    static async log(...args) {
        if (!Logger.isEnabled)
            return;
        console.log((new Date()).toISOString(), ...args);
    }
    static async error(...args) {
        if (!Logger.isEnabled)
            return;
        console.error((new Date()).toISOString(), ...args);
    }
}
exports.default = Logger;
