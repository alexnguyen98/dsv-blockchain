declare class Logger {
    private context;
    constructor(options: {
        context: string;
    });
    debug(message: string): void;
    info(message: string): void;
    error(message: string): void;
    private log;
}
export default Logger;
