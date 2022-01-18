"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
class Logger {
    constructor(options) {
        this.context = options.context;
    }
    debug(message) {
        if (process.env.NODE_ENV !== 'development')
            return;
        this.log('blue', 'DEBUG', message);
    }
    info(message) {
        this.log('green', 'INFO', message);
    }
    error(message) {
        this.log('red', 'ERROR', message);
    }
    log(color, level, message) {
        const date = new Date().toISOString().slice(0, -5);
        console.log(`${chalk[color](`[${level}]`)} - ${date} ${chalk.yellow(`[${this.context}]`)} ${message}`);
    }
}
exports.default = Logger;
//# sourceMappingURL=Logger.js.map