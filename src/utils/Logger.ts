import * as chalk from 'chalk';

/**
 * A utility logging class.
 */

class Logger {
  private context: string;

  constructor(options: { context: string }) {
    this.context = options.context;
  }

  debug(message: string) {
    if (process.env.NODE_ENV !== 'development') return;
    this.log('blue', 'DEBUG', message);
  }

  info(message: string) {
    this.log('green', 'INFO', message);
  }

  error(message: string) {
    this.log('red', 'ERROR', message);
  }

  private log(color: string, level: string, message: string) {
    const date = new Date().toISOString().slice(0, -5);
    console.log(
      `${chalk[color](`[${level}]`)} - ${date} ${chalk.yellow(
        `[${this.context}]`,
      )} ${message}`,
    );
  }
}

export default Logger;
