"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class APIError {
    constructor(message, code = 500, reason = null) {
        this.message = null;
        this.code = null;
        this.reason = null;
        this.message = message;
        this.code = code;
        this.reason = reason;
    }
}
exports.default = APIError;
