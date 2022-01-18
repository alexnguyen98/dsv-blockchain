"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Address {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
    }
    toString() {
        return `${this.ip}:${this.port}`;
    }
}
exports.default = Address;
//# sourceMappingURL=Address.js.map