"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_1 = require("./utils/hash");
class UserKey {
    constructor(addr, id) {
        this.privateKey = (0, hash_1.hashString)(addr.toString() + id);
        this.publicKey = (0, hash_1.hashString)(addr.toString() + id);
    }
    static sign(msg, privateKey) {
        return (0, hash_1.hashString)(msg + privateKey);
    }
    static verify(msg, signature, publicKey) {
        return (0, hash_1.hashString)(msg + publicKey) === signature;
    }
}
exports.default = UserKey;
//# sourceMappingURL=UserKey.js.map