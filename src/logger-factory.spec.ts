import { Appender, Level, Logger } from './logger';
import {
    DEFAULT_ROOT_LEVEL,
    LoggerFactory
} from './logger-factory';
import { LoggerFactoryConfig } from './logger-factory-config';
import { LocalStorageAppender } from './logger-localstorage-appender';

describe('Logging system', () => {
    // this is the logger "under test"
    let logger: Logger;
    const loggerName = 'testLogger';
    const config = new LoggerFactoryConfig();
    config.consoleContext = 'lf-test';
    config.consoleFeature = false;
    LoggerFactory.init(window, localStorage, config);
    const loggerFactoryInstance = (LoggerFactory as any).theInstance;
    beforeEach(() => {
        loggerFactoryInstance.clear();
        loggerFactoryInstance.cachedLoggers.clear();
        LoggerFactory.init(window, localStorage, config);
        logger = LoggerFactory.getLogger(loggerName);
    });

    afterEach(() => {
        loggerFactoryInstance.clear();
        loggerFactoryInstance.cachedLoggers.clear();
        localStorage.clear();
    });

    it('should use the identifier as logger name', () => {
        expect(LoggerFactory.getLogger('LoggerFactory').name).toBe(
            'LoggerFactory'
        );
        expect(LoggerFactory.getLogger('').name).toBe('default');
    });

    it('should provide a logger', () => {
        expect(logger).not.toBeNull();
        expect(logger.level).toBeNull();
        expect(logger.rootLevel).toBe(DEFAULT_ROOT_LEVEL);
    });

    it('should store and load the levels', () => {
        // ensure there is no level for the test logger in the store
        let store = JSON.parse(
            localStorage.getItem('loggerfactory')
        ) as LoggerFactoryConfig;
        expect(store.levels.testLogger).toBeUndefined();
        const oldLogger = logger;

        // set a level via logger factory
        loggerFactoryInstance.sll(loggerName, Level.TRACE);
        store = JSON.parse(localStorage.getItem('loggerfactory'));
        // ensure the level got stored as string
        expect(store.levels[loggerName]).toBe(Level[Level.TRACE]);

        // clear the cached loggers in the factory
        loggerFactoryInstance.cachedLoggers.clear();
        // restore the levels from the store
        loggerFactoryInstance.restoreConfig();
        // retrieve a new logger
        logger = LoggerFactory.getLogger(loggerName);
        expect(logger).not.toBeNull();
        // ensure it is a new instance
        expect(logger).not.toBe(oldLogger);
        // and has the correct level
        expect(logger.level).toBe(Level.TRACE);
    });

    it('should clear the log levels', () => {
        loggerFactoryInstance.level = Level.TRACE;
        logger.level = Level.DEBUG;
        // clear the log levels
        loggerFactoryInstance.clear();
        // check both root and logger level
        expect(loggerFactoryInstance.level as any).toBe(DEFAULT_ROOT_LEVEL);
        expect(logger.level).toBeNull();
        // info is the default level
        expect(logger.isInfoEnabled()).toBeTruthy();
    });

    it('should handle invalid log levels from the store', () => {
        const mock = jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation(()  =>
        `{"levels": {"__root": "INFO", "${loggerName}": "bogus"}, "appenders": ["console"]}`
        
        );

        // clear the log levels
        loggerFactoryInstance.restoreConfig();

        expect(loggerFactoryInstance.storedLevels[loggerName]).toBeUndefined();
        // check both root and logger level
        expect(logger.level).toBeUndefined();
        expect(logger.isInfoEnabled()).toBe(true);
        mock.mockRestore();
    });

    it('should set the log level', () => {
        // assert preconditions
        logger.level = Level.INFO;
        expect((logger as any).effectiveLevel).toBe(Level.INFO);

        // setting with an invalid ordinal
        loggerFactoryInstance.setLogLevel(loggerName, 500);
        expect((logger as any).effectiveLevel).toBe(Level.INFO);

        // setting with null-level
        loggerFactoryInstance.setLogLevel(loggerName, null);
        expect((logger as any).effectiveLevel).toBe(Level.INFO);

        // setting with valid level
        loggerFactoryInstance.setLogLevel(loggerName, Level.TRACE);
        expect((logger as any).effectiveLevel).toBe(Level.TRACE);

        // setting with non-existing index
        loggerFactoryInstance.setLogLevel(12, Level.ERROR);
        expect((logger as any).effectiveLevel).toBe(Level.TRACE);

        // setting with index 0 (since there is only one logger)
        loggerFactoryInstance.setLogLevel(0, Level.WARN);
        expect((logger as any).effectiveLevel).toBe(Level.WARN);

        // setting wildcard (since there is only one logger)
        loggerFactoryInstance.setLogLevel('testL*', Level.INFO);
        expect((logger as any).effectiveLevel).toBe(Level.INFO);

        // setting with wrong name
        loggerFactoryInstance.setLogLevel('nonexistinglogger', Level.ERROR);
        expect((logger as any).effectiveLevel).toBe(Level.INFO);
    });

    it('should list the loggers', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        loggerFactoryInstance.ll();
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain(loggerName);
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('[0]');
    });

    it('should set appenders', () => {
        let config: LoggerFactoryConfig = JSON.parse(
            localStorage.getItem('loggerfactory')
        );
        expect(config.appenders).toEqual(['console']);
        LoggerFactory.registerAppender('ls', new LocalStorageAppender(localStorage));
        loggerFactoryInstance.sla('ls');
        config = JSON.parse(
            localStorage.getItem('loggerfactory')
        );
        expect(config.appenders).toEqual(['ls']);
    });

    it('should not set appenders', () => {
        let config: LoggerFactoryConfig = JSON.parse(
            localStorage.getItem('loggerfactory')
        );
        expect(config.appenders).toEqual(['console']);
        const result = loggerFactoryInstance.sla('blob');
        expect(result.startsWith('No valid Appenders')).toBeTruthy();
        config = JSON.parse(
            localStorage.getItem('loggerfactory')
        );
        expect(config.appenders).toEqual(['console']);
    });

    it('should log persistent', () => {
        LoggerFactory.registerAppender('ls', new LocalStorageAppender(localStorage));
        loggerFactoryInstance.sla('ls');
        expect(loggerFactoryInstance.lastLog).toBe('No log entry exists!');
        logger.info('my message');
        expect(
            loggerFactoryInstance.lastLog.endsWith('my message')
        ).toBeTruthy();
    });
});

export class InMemoryAppender implements Appender {
    private errors: unknown[] = [];
    private warns: unknown[] = [];
    private infos: unknown[] = [];
    private debugs: unknown[] = [];
    private traces: unknown[] = [];
    error(msg: unknown, ...optionalParams: any[]): void {
        this.errors.push(msg);
    }
    warn(msg: unknown, ...optionalParams: any[]): void {
        this.warns.push(msg);
    }
    info(msg: unknown, ...optionalParams: any[]): void {
        this.infos.push(msg);
    }
    debug(msg: unknown, ...optionalParams: any[]): void {
        this.debugs.push(msg);
    }
    trace(msg: unknown, ...optionalParams: any[]): void {
        this.traces.push(msg);
    }
    dir(obj: unknown): void {
        
    }
    dirxml(obj: unknown): void {
        
    }
    group(msg: unknown, ...optionalParams: any[]): void {
        
    }
    groupEnd(): void {
        
    }
    
}
