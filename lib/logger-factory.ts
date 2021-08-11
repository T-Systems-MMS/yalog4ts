/* eslint-disable no-console */
import {
    Appender,
    getValidLevel,
    Level,
    Logger,
    PersistenceAppender,
} from './logger';
import { ConsoleAppender } from './appender/console-appender';
import { LoggerFactoryConfig } from './logger-factory-config';
import { set, get } from 'lodash-es';

/** the default root log level of the logging system */
export const DEFAULT_ROOT_LEVEL = Level.INFO;

/** default log appenders */
export const DEFAULT_APPENDERS = [];



/**
 * A factory for retrieving a logger by name.
 * It also makes itself available on the console and provides means to set log levels at runtime.
 * Type `lf.help` on the browser console for details.
 */
export class LoggerFactory {

    // a simple object where log levels get stored by logger name
    storedLevels: { [key: string]: Level } = { __root: DEFAULT_ROOT_LEVEL };

    /**
     *  A cache containing all initialized loggers.
     * This allows us to always return the same logger instance for subsequent requests with the same identifier
     */
    cachedLoggers: Map<string, Logger> = new Map();

    // the root level of the factory
    theRootLevel: Level;

    // log appenders
    appenders: { [key: string]: Appender };

    // the storage to store log levels to
    storage: Storage;

    consoleContext: string;

    private static theInstance = new LoggerFactory();

    private registeredAppenders: Map<string, Appender | (() => Appender)> = new Map();

    /**
     * Private constructor, should only be used from within LoggerFactory.
     */
    private constructor() {
        this.initLevels();

    }

    /**
     * Initialize the logger factory.
     * Also, it makes logger factory available on the window object.
     *
     * @param window the window object
     * @param storage the storage object
     * @param config the config
     */
    public static init(
        window: Window,
        storage: Storage,
        config: LoggerFactoryConfig
    ): void {
        LoggerFactory.registerAppender('console', new ConsoleAppender());
        this.theInstance.setLogAppenders('console');
        this.theInstance.storage = storage;
        if (config.rootLevel) {
            this.theInstance.theRootLevel = config.rootLevel;
        }
        this.theInstance.restoreConfig();
        if (! config.suppressBootstrapLogging) {
            console.log(`Logging system initialized with root level '${Level[this.theInstance.theRootLevel]}'.`);
        }
        // make ourselves available on the console if allowed by app config
        if (config.consoleFeature) {
            const consoleContext = config.consoleContext ? config.consoleContext : 'lf';
            this.theInstance.consoleContext = consoleContext;
            if (window) {
                set(window, consoleContext, this.theInstance);
                const context = get(window, consoleContext);

                Object.keys(Level)
                    .filter(level => isNaN(+level))
                    .forEach(level => context[level] = level);
                if (! config.suppressBootstrapLogging) {
                    console.log(`Logging cli is available at '${consoleContext}'.`);
                    }
            } else {
                if (! config.suppressBootstrapLogging) {
                    console.log(
                        'No window object available, reduced functionality.'
                    );
                }
            }
        }


    }

    /**
     * Get the help string.
     */
    public get help(): string {
        return this.buildHelpString();
    }

    private buildHelpString(): string {
        const consoleContext = this.consoleContext;
        /* tslint:disable:max-line-length */
        const helpString = `To set the root log level, type '${consoleContext}.level=<level>', where <level> is one of [${consoleContext}.TRACE, ${consoleContext}.DEBUG, ${consoleContext}.INFO, ${consoleContext}.WARN, ${consoleContext}.ERROR].
    To set the log level for a specific logger, type '${consoleContext}.setLogLevel(<arg>, <level>)' or '${consoleContext}.sll(<arg>, <level>)', where <arg> is either the name of the logger (wildcard supported) or a logger's index and <level> is one of [lf${consoleContext}.TRACE, ${consoleContext}.DEBUG, ${consoleContext}.INFO, ${consoleContext}.WARN, ${consoleContext}.ERROR].
    To view loggers and their indices, type '${consoleContext}.listLoggers()' or '${consoleContext}.ll()'`;
        return helpString
    }

    /**
     * Get a logger for the given identifier.
     * If a logger with that name has already been created, it is returned. Otherwise a new one will be instantiated.
     *
     * @param identifier the loggerÄs identifier, can be a class or a string
     */
    public static getLogger(identifier: string): Logger {
        let theName = identifier;
        if (typeof theName !== 'string' || theName === '') {
            console.error(
                'invalid argument to getLogger: ',
                new Error(String(identifier))
            );
            // fall back to a default name
            theName = 'default';
        }
        const factory: LoggerFactory = LoggerFactory.getInstance();
        // cache hit?
        if (factory.cachedLoggers.has(theName)) {
            return factory.cachedLoggers.get(theName);
        }
        let level: Level = null;
        // see if we have a stored log level for that name
        if (factory.storedLevels[theName]) {
            // if so, we want to create the new logger with that level
            level = factory.storedLevels[theName];
        }
        // build the new logger
        const logger = new Logger(
            theName,
            factory.theRootLevel,
            level,
            factory.appenders ? Object.values(factory.appenders) : []
        );
        factory.cachedLoggers.set(theName, logger);
        return logger;
    }

    /**
     * Shortcut for 'listLoggers'.
     */
    public ll(): void {
        this.listLoggers();
    }

    /**
     * List all configured loggers and their log levels on the console.
     */
    public listLoggers(): void {
        const result = [];
        let index = 0;
        const loggers = LoggerFactory.getInstance().cachedLoggers;
        loggers.forEach((logger, value) => {
            result.push(
                `    [${index}]: ${logger.name} (level: ${Level[logger.level]
                }), (root: ${Level[logger.rootLevel]})`
            );
            index++;
        });
        if (result.length > 0) {
            console.group('Available loggers');
            result.forEach(line => console.log(line));
            console.groupEnd();
        } else {
            console.log('Found no loggers');
        }
    }

    /**
     * Clear all configured log levels, reset the root level to @see DEFAULT_ROOT_LEVEL.
     */
    public clear(): string {
        this.initLevels();
        LoggerFactory.getInstance().cachedLoggers.forEach((logger, _) => {
            logger.level = null;
            logger.rootLevel = this.theRootLevel;
        });

        this.storeConfig();
        this.appenders = {};
        return `Cleared log levels and appenders. New root level is '${Level[this.theRootLevel]
            }'.`;
    }

    /**
     * Shortcut for setLogLevel
     *
     * @param arg the logger name or index
     * @param level the level
     */
    public sll(arg: string | number, level: Level): string {
        return this.setLogLevel(arg, level);
    }

    /**
     * Sets the log level for the selected logger(s).
     * If the argument is a number, it is expected to indicate the index in the logger list returned by `listLoggers`.
     * If the argument is a string, it is expected to a (part of a) name of a logger.
     * Wildcards (*) are supported for string-based logger selection.
     *
     * @param arg the logger name or index
     * @param theLevel the level
     */
    public setLogLevel(arg: string | number, level: Level): string {
        const theLevel = getValidLevel(level);
        if (theLevel == null) {
            console.log('Invalid level: ' + theLevel);
            return '';
        }
        let nameMode: boolean;
        if (typeof arg === 'string') {
            arg = arg.replace('*', '.*');
            nameMode = true;
        } else if (typeof arg === 'number') {
            nameMode = false;
        } else {
            return `Unsupported argument: '${arg}'. Must be number or string.`;
        }
        const regexp = new RegExp('^' + arg + '$');
        const matches: string[] = [];
        let index = 0;
        // iterate over the cached loggers and modify the matching ones
        LoggerFactory.getInstance().cachedLoggers.forEach(
            (logger, loggerName) => {
                if (
                    (nameMode && regexp.test(loggerName))
                    || (!nameMode && arg === index)
                ) {
                    logger.level = theLevel;
                    this.storedLevels[loggerName] = theLevel;
                    matches.push(loggerName);
                }
                index++;
            }
        );
        this.storeConfig();
        if (matches.length > 0) {
            // inform about the changed log level(s)
            switch (nameMode) {
                case true:
                    return `Successfully set ${matches.length} logger(s) whose name matches /${arg}/ to level ${Level[theLevel]}: ${matches}`;
                case false:
                    return `Successfully set logger with index ${arg} to level ${Level[theLevel]}: ${matches}`;
            }
        } else {
            // there were no matches, print an info to the console
            switch (nameMode) {
                case true:
                    return `No loggers matched /${arg}/. You might want to use a wildcard? Type 'lf.help' for help.`;
                case false:
                    return `Found no logger with index ${arg}. Type 'lf.ll' to view the indices.`;
            }
        }
    }

    /**
     * Shortcut for setLogAppenders.
     */
    public sla(...appenderTypes: string[]): string {
        return this.setLogAppenders(...appenderTypes);
    }

    /**
     * Sets appender.
     *
     * @param appenderTypes appender types to set
     */
    public setLogAppenders(...appenderTypes: string[]): string {
        const appenders = appenderTypes.reduce<
            { [key: string]: Appender }
        >((memo, type) => {
            const appender = this.getValidAppender(type);
            if (appender) {
                memo = memo ? memo : {};
                memo[type] = appender;
            }
            return memo;
        }, undefined);
        if (appenders) {
            this.appenders = appenders;
            LoggerFactory.getInstance().cachedLoggers.forEach(logger => {
                logger.appenders = appenders ? Object.values(appenders) : [];
            });
            this.storeConfig();
            return `Appenders "${Object.keys(appenders).join(
                ', '
            )}" successfully set!`;
        } else {
            return `No valid Appenders given: "${appenderTypes.join(', ')}"!`;
        }
    }

    /**
     * Returns last log entries, if appender with persistence exists.
     */
    public get lastLog(): string {
        const appender = (this.appenders ? Object.values(this.appenders) : []).find(
            (a: any) => typeof a.getLastLog === 'function'
        ) as PersistenceAppender;
        const log = appender ? appender.getLastLog() : undefined;
        if (log) {
            return log.join('\n');
        }
        return 'No log entry exists!';
    }

    public static registerAppender(name: string, appender: Appender | (() => Appender)) {
        LoggerFactory.theInstance.registeredAppenders.set(name, appender);

    }

    /**
     * Get the singleton instance of the logger factory.
     */
    public static getInstance(): LoggerFactory {
        return LoggerFactory.theInstance;
    }

    /**
     * Set the root level to DEFAULT_ROOT_LEVEL, init the stored levels.
     */
    private initLevels() {
        this.storedLevels = { __root: DEFAULT_ROOT_LEVEL };
        this.theRootLevel = getValidLevel(DEFAULT_ROOT_LEVEL);
    }

    /**
     * Write the config to the storage.
     */
    private storeConfig() {
        if (this.storage) {
            this.storage.setItem(
                'loggerfactory',
                JSON.stringify({
                    levels: Object.keys(this.storedLevels).reduce<{
                        [key: string]: string;
                    }>((memo, name) => {
                        memo[name] = Level[this.storedLevels[name]];
                        return memo;
                    }, {}),
                    appenders: Object.keys(this.appenders)
                })
            );
        }
    }

    /**
     * Load the config from the storage.
     */
    private restoreConfig() {
        const item: string = this.storage
            ? this.storage.getItem('loggerfactory')
            : undefined;
        if (item) {
            let levels: { [key: string]: Level };
            let appenders: { [key: string]: Appender };
            let rootLevel: Level;
            try {
                const parsed: LoggerFactoryConfig = JSON.parse(item);
                if (parsed && parsed.levels) {
                    levels = Object.keys(parsed.levels).reduce<
                        { [key: string]: Level } | undefined
                    >((memo, name) => {
                        const level = getValidLevel(parsed.levels[name]);
                        if (level) {
                            memo = memo ? memo : {};
                            memo[name] = level;
                        }
                        return memo;
                    }, undefined);
                }
                rootLevel
                    = parsed && parsed.levels && parsed.levels.__root
                        ? getValidLevel(parsed.levels.__root)
                        : undefined;
                if (parsed && parsed.appenders) {
                    appenders = parsed.appenders.reduce<
                        { [key: string]: Appender } | undefined
                    >((memo, name) => {
                        const appender = this.getValidAppender(name);
                        if (appender) {
                            memo = memo ? memo : {};
                            memo[name] = appender;
                        }
                        return memo;
                    }, undefined);
                }
            } catch (error) {}

            if (levels && rootLevel && appenders) {
                this.storedLevels = levels;
                this.theRootLevel = rootLevel;
                this.appenders = appenders;
            } else {
                this.initLevels();
            }
        }
        // now update all loggers which already have been initialized
        this.cachedLoggers.forEach((logger, name) => {
            logger.level = this.storedLevels[name]
                ? this.storedLevels[name]
                : undefined;
            logger.rootLevel = this.theRootLevel;
            logger.appenders = this.appenders ? Object.values(this.appenders) : []
        });
    }

    /**
     * Set the (root) level of the logging system.
     */
    set level(level: Level) {
        const theLevel = getValidLevel(level);
        if (theLevel === null) {
            return;
        }
        this.theRootLevel = theLevel;
        this.cachedLoggers.forEach((logger, _) => {
            logger.rootLevel = theLevel;
        });
        this.storedLevels.__root = theLevel;
        this.storeConfig();
    }
    get level(): Level {
        return this.theRootLevel;
    }


    /**
     * Returns appender identified by name, if not found ConsoleAppender.
     *
     * @param name name of appender
     */
    getValidAppender(name: string): Appender {
        if (this.registeredAppenders.has(name)) {
            const entry = this.registeredAppenders.get(name);
            if (typeof entry === 'function') {
                return entry();
            } else {
                return entry;
            }
        }
        return undefined;
        // throw new Error(`found no appender with name '${name}'`);
    }

}

