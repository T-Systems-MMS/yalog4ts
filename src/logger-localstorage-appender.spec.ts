
import { Level, Logger } from './logger';
import { LoggerFactory } from './logger-factory';
import { LoggerFactoryConfig } from './logger-factory-config';
import { LocalStorageAppender } from './logger-localstorage-appender';

describe('LocalStorageAppender', () => {
    let logger: Logger;
    const loggerName = 'testLogger';
    const appConfig = new LoggerFactoryConfig();
    LoggerFactory.init(window, localStorage, appConfig);
    const loggerFactoryInstance = (LoggerFactory as any)
        .theInstance as LoggerFactory;
    beforeEach(() => {
        loggerFactoryInstance.clear();
        loggerFactoryInstance.cachedLoggers.clear();
        LoggerFactory.registerAppender('ls', new LocalStorageAppender(localStorage))
        LoggerFactory.init(window, localStorage, appConfig);
        logger = LoggerFactory.getLogger(loggerName);
    });

    afterEach(() => {
        loggerFactoryInstance.clear();
        loggerFactoryInstance.cachedLoggers.clear();
        localStorage.clear();
    });

    it('logAndRotate', () => {
        loggerFactoryInstance.sla('ls');
        loggerFactoryInstance.sll('testLogger', Level.TRACE);
        for (let i = 1; i <= 50; i++) {
            logger.error(`error ${i}`);
            logger.warn(`warn ${i}`);
            logger.info(`info ${i}`);
            logger.debug(`debug ${i}`);
            logger.trace(`trace ${i}`);
            logger.dir(`dir ${i}`);
            logger.dirxml(`dirxml ${i}`);
        }
        const lastLog = loggerFactoryInstance.lastLog;
        const split = lastLog.split('\n');
        expect(split.length).toBe(200);
        expect(split[0].endsWith('debug 22')).toBeTruthy();
        expect(lastLog.endsWith('dirxml 50')).toBeTruthy();
    });
});
