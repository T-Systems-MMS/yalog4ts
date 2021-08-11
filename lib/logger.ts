import { LoggerConsoleOnly } from "./appender/console-appender";

/**
 * A logger class which allows to emit log messages along with a log level.
 * The log level is used to conditionally print the message to the console.
 * See LoggerFactory on how to set the log level at runtime.
 * The capabilities of the `trace`, `debug`, `info`, `warn` and `error` methods strongly resemble
 * the respective console methods (such as console.log, console.warn etc.) regarding allowed parameters and string interpolation.
 * See https://developer.mozilla.org/de/docs/Web/API/console#Usage for reference.
 */
export class Logger {
    private theRootLevel: Level;
    public set rootLevel(value: Level) {
        this.theRootLevel = value;
        this.calculateEffectiveLevel();
    }

    public get rootLevel(): Level {
        return this.theRootLevel;
    }

    /** the level of this logger */
    private theLevel: Level;
    public set level(value: Level) {
        this.theLevel = value;
        this.calculateEffectiveLevel();
    }

    /** get the level */
    public get level(): Level {
        return this.theLevel;
    }

    /** numeric representation of the effective (both root and local level honored) log level */
    private effectiveLevel: number;

    /**
     * The constructor
     *
     * @param name the name
     * @param rootLevel the root level
     * @param level the log level
     */
    constructor(
        public name: string,
        rootLevel: Level,
        level: Level,
        public appenders: Appender[]
    ) {
        this.rootLevel = rootLevel;
        this.level = level;
    }

    /**
     * Guard method to determine whether the logger is configured to log on Level TRACE.
     */
    public isTraceEnabled(): boolean {
        return this.shouldLog(Level.TRACE);
    }

    /**
     * Guard method to determine whether the logger is configured to log on Level DEBUG.
     */
    public isDebugEnabled(): boolean {
        return this.shouldLog(Level.DEBUG);
    }

    /**
     * Guard method to determine whether the logger is configured to log on Level INFO.
     */
    public isInfoEnabled(): boolean {
        return this.shouldLog(Level.INFO);
    }

    /**
     * Guard method to determine whether the logger is configured to log on Level WARN.
     */
    public isWarnEnabled(): boolean {
        return this.shouldLog(Level.WARN);
    }

    /**
     * Guard method to determine whether the logger is configured to log on Level ERROR.
     */
    public isErrorEnabled(): boolean {
        return this.shouldLog(Level.ERROR);
    }

    /**
     * Log the given message on level ERROR.
     *
     * @param msg the message
     * @param optionalParams the optional params
     */
    public error(msg: unknown, ...optionalParams: any[]): void {
        this.log(Level.ERROR, 'error', msg, optionalParams);
    }

    /**
     * Log the given message on level WARN.
     *
     * @param msg the message
     * @param optionalParams the optional params
     */
    public warn(msg: unknown, ...optionalParams: any[]): void {
        this.log(Level.WARN, 'warn', msg, optionalParams);
    }

    /**
     * Log the given message on level INFO.
     *
     * @param msg the message
     * @param optionalParams the optional params
     */
    public info(msg: unknown, ...optionalParams: any[]): void {
         this.log(Level.INFO, 'info', msg, optionalParams);
    }

    /**
     * Log the given message on level DEBUG.
     *
     * @param msg the message
     * @param optionalParams the optional params
     */
    public debug(msg: unknown, ...optionalParams: any[]): void {
        this.log(Level.DEBUG, 'debug', msg, optionalParams);
    }

    /**
     * Log the given message on level TRACE.
     *
     * @param msg the message
     * @param optionalParams the optional params
     */
    public trace(msg: unknown, ...optionalParams: any[]): void {
        this.log(Level.TRACE, 'trace', msg, optionalParams);
    }

    /**
     * Log a readable representation of the given object
     *
     * @param obj the object to log
     * @param level (optional) the level, defaults to DEBUG
     */
    public dir(obj: unknown, level: Level = Level.DEBUG): void {
        this.log(level, 'dir', obj, [], false);
    }

    /**
     * Log the xml/html representation of the given object. This method should be used for xml/html elements.
     *
     * @param obj the object to log
     * @param level (optional) the level, defaults to DEBUG
     */
    public dirxml(obj: unknown, level: Level = Level.DEBUG): void {
        this.log(level, 'dirxml', obj, [], false);
    }

    /**
     * Start a group.
     *
     * @param msg the message
     * @param optionalParams the optional params
     */
    public group(msg: unknown, ...optionalParams: any[]): void {
        this.log(Level.DEBUG, 'group', msg, optionalParams);
    }

    /**
     * End a group.
     */
    public groupEnd(): void {
        this.log(Level.DEBUG, 'groupEnd');
    }

    /**
     * Calculates the effective log level resulting from both root level and this logger's level.
     */
    private calculateEffectiveLevel() {
        this.effectiveLevel = this.level || this.rootLevel;
    }

    /**
     * Actually log the given message in case the current configuration matches the required log level.
     *
     * @param requiredLevel the level the message is logged on
     * @param logFunction the log function
     * @param msg the message
     * @param format a flag indicating whether the message should be formatted
     */
    private log(
        requiredLevel: Level,
        logFunction: keyof Appender,
        msg?: any,
        optionalParams?: any[],
        format = true
    ) {
        if (this.shouldLog(requiredLevel)) {
            this.appenders.forEach(appender =>
                // {if (appender instanceof LoggerConsoleOnly) {
                //     appender[logFunction].bind(console, [msg, ...optionalParams]);
                // } else {

                    appender[logFunction](
                        format ? this.formatLogMessage(requiredLevel, msg) : msg,
                        ...(optionalParams || [])
                    )
                // }
                // }
            );
        }
    }

    /**
     * Helper for guard methods.
     * Returns whether a message with the given log level should appear in the log.
     * The effective log level is determined based on the root level and this logger's level.
     *
     * @param level the level
     */
    private shouldLog(level: Level): boolean {
        return level <= this.effectiveLevel;
    }

    /**
     * Format the log message (prepend the log level and the logger name to the message)
     *
     * @param level the log level
     * @param msg  the message
     */
    private formatLogMessage(level: Level, msg: string): string {
        return `[${Level[level]}] - ${this.name}: ${msg}`;
    }
}

/**
 * A enum representing the different log levels.
 */
export enum Level {
    OFF,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    TRACE
}

/**
 * Defines a log appender.
 */
export interface Appender {
    /** Log error messages. */
    error(msg: unknown, ...optionalParams: any[]): void;
    /** Log warn messages. */
    warn(msg: unknown, ...optionalParams: any[]): void;
    /** Log info messages. */
    info(msg: unknown, ...optionalParams: any[]): void;
    /** Log debug messages. */
    debug(msg: unknown, ...optionalParams: any[]): void;
    /** Log trace messages. */
    trace(msg: unknown, ...optionalParams: any[]): void;
    /** Log readable representation of the given object. */
    dir(obj: unknown): void;
    /** Log the xml/html representation of the given object. */
    dirxml(obj: unknown): void;
    /** Start a group. */
    group(msg: unknown, ...optionalParams: any[]): void;
    /** End a group. */
    groupEnd(): void;
}

/**
 * Defines cached log appender.
 */
export interface PersistenceAppender extends Appender {
    /** last log */
    getLastLog(): unknown[];
}

/**
 * Turn the given value into a valid log level. Returns null if the value can't be validated.
 *
 * @param level the level to turn into a valid level
 */
export function getValidLevel(level: string | Level | number): Level {
    if (level === null || level === undefined) {
        return null;
    }
    switch (typeof level) {
        case 'string':
            // this is somewhat special. There seems no other way to determine the corresponding enum value
            if (isNaN(+level)) {
                const stringResult = +Level[level];
                return isNaN(stringResult) ? null : stringResult;
            }
            return null;
        case 'number':
            return Level[level] === undefined ? null : level;

        default:
            return level;
    }
}
