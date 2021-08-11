/* eslint-disable no-console */
import { Appender } from './logger';

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

