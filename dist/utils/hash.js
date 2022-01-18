"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashString = void 0;
const crypto = require("crypto");
const hashString = (str) => {
    return crypto.createHash('md5').update(str).digest('hex');
};
exports.hashString = hashString;
//# sourceMappingURL=hash.js.map