/* eslint-disable no-console */
import { Appender } from '../logger';

/**
 * Console log appender.
 */
export class ConsoleAppender implements Appender {
    private static instance = new ConsoleAppender();
    /** get instance */
    static getInstance(): ConsoleAppender {
        return ConsoleAppender.instance;
    }
    /** @inheritdoc */
    error(msg: unknown, ...optionalParams: any[]): void {
        console.error(msg, ...optionalParams);
    }
    /** @inheritdoc */
    warn(msg: unknown, ...optionalParams: any[]): void {
        console.warn(msg, ...optionalParams);
    }
    /** @inheritdoc */
    info(msg: unknown, ...optionalParams: any[]): void {
        console.log(msg, ...optionalParams);
    }
    /** @inheritdoc */
    debug(msg: unknown, ...optionalParams: any[]): void {
        console.log.apply(console, [msg, ...optionalParams]);
        // console.log(msg, ...optionalParams);
    }
    /** @inheritdoc */
    trace(msg: unknown, ...optionalParams: any[]): void {
        console.log(msg, ...optionalParams);
    }
    /** @inheritdoc */
    dir(obj: unknown): void {
        console.dir(obj);
    }
    /** @inheritdoc */
    dirxml(obj: unknown): void {
        console.dirxml(obj);
    }
    /** @inheritdoc */
    group(msg: unknown, ...optionalParams: any[]): void {
        console.group(msg, ...optionalParams);
    }
    /** @inheritdoc */
    groupEnd(): void {
        console.groupEnd();
    }
}

export class LoggerConsoleOnly implements Appender {
    // constructor(protected loggerName: string) {
    // //   super(loggerName);
    // }
  
    get trace() {
        return console.log.bind(console);
      }
    get debug() {
      return console.log.bind(console);
    }
  
    get info() {
        return console.info.bind(console);
    }
  
    get warn() {
        return console.warn.bind(console);
    }
  
    get error() {
        return console.error.bind(console);
    }
  
    get group() {
        return console.group.bind(console);
    }

    get groupEnd() {
        return console.groupEnd.bind(console);
    }
  
    get dirxml() {
        return console.dirxml.bind(console);
    }
    get dir() {
        return console.dir.bind(console);
    }

}
