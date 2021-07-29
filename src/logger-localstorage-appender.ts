import { PersistenceAppender } from './logger';

/** storage key */
export const LOCAL_STORAGE_KEY = 'log';

/** count of stored log entries */
export const LOG_ENTRY_COUNT = 200;

/**
 * LocalStorage Appender.
 */
export class LocalStorageAppender implements PersistenceAppender {
    // storage
    private localStorage: Storage;
    // log cache
    private logCache: any[];
    /** init appender */
    constructor(localStorage: Storage) {
        this.localStorage = localStorage;
    }
    /** @inheritdoc */
    error(msg: unknown, ...optionalParams: any[]): void {
        this.logAndRotate(msg, optionalParams);
    }
    /** @inheritdoc */
    warn(msg: unknown, ...optionalParams: any[]): void {
        this.logAndRotate(msg, optionalParams);
    }
    /** @inheritdoc */
    info(msg: unknown, ...optionalParams: any[]): void {
        this.logAndRotate(msg, optionalParams);
    }
    /** @inheritdoc */
    debug(msg: unknown, ...optionalParams: any[]): void {
        this.logAndRotate(msg, optionalParams);
    }
    /** @inheritdoc */
    trace(msg: unknown, ...optionalParams: any[]): void {
        this.logAndRotate(msg, optionalParams);
    }
    /** @inheritdoc */
    dir(obj: unknown): void {
        this.logAndRotate(obj);
    }
    /** @inheritdoc */
    dirxml(obj: unknown): void {
        this.logAndRotate(obj);
    }
    group(msg: unknown, ...optionalParams: any[]): void {
        // not supported
    }
    groupEnd(): void {
        // not supported
    }
    /** @inheritdoc */
    getLastLog(): any[] {
        try {
            return JSON.parse(this.localStorage.getItem(LOCAL_STORAGE_KEY));
        } catch (e) {
            return [];
        }
    }

    /**
     * Stores log entries in local storage.
     *
     * @param obj object to store
     * @param optionalObj optional objects
     */
    private logAndRotate(obj: any, optionalObj?: any[]) {
        if (this.localStorage) {
            // fill cache if necessary
            if (!this.logCache) {
                try {
                    this.logCache = JSON.parse(
                        this.localStorage.getItem(LOCAL_STORAGE_KEY)
                    );
                } catch (e) {}
                this.logCache = this.logCache ? this.logCache : [];
            }
            // rotate log
            if (this.logCache.length >= LOG_ENTRY_COUNT) {
                this.logCache.shift();
            }
            // push new log entry
            this.logCache.push([
                `${new Date().toUTCString()} ${obj}`,
                ...(optionalObj ? optionalObj : [])
            ]);
            // store data
            this.localStorage.setItem(
                LOCAL_STORAGE_KEY,
                JSON.stringify(this.logCache)
            );
        } else {
            console.error(
                'LocalStorageAppender not initialized correctly! Please call LocalStorageAppender.init.'
            );
        }
    }
}
