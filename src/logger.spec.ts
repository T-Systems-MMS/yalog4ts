import { getValidLevel, Level, Logger } from './logger';
import { ConsoleAppender } from './logger-appender';

describe('Logger', () => {
    const defaultLevel = Level.INFO;
    let logger: Logger;
    beforeEach(() => {
        logger = new Logger('testLogger', defaultLevel, null, [
            ConsoleAppender.getInstance()
        ]);
    });

    it('should convert levels properly', () => {
        const table = [
            { level: Level.TRACE, num: 5, str: 'TRACE' },
            { level: Level.DEBUG, num: 4, str: 'DEBUG' },
            { level: Level.INFO, num: 3, str: 'INFO' },
            { level: Level.WARN, num: 2, str: 'WARN' },
            { level: Level.ERROR, num: 1, str: 'ERROR' }
        ];
        for (const test of table) {
            expect(getValidLevel(test.str)).toBe(test.num);
            expect(getValidLevel(test.level)).toBe(test.num);
            expect(getValidLevel(test.num)).toBe(test.num);
        }

        // some more tests for getValidLevel
        expect(getValidLevel('bogus')).toBeNull();
        expect(getValidLevel(100)).toBeNull();
        expect(getValidLevel('100')).toBeNull();
        expect(getValidLevel(null)).toBeNull();
        expect(getValidLevel(undefined)).toBeNull();
        expect(getValidLevel(Level.WARN)).toBe(Level.WARN);
    });

    it('should honor the root level', () => {
        expect(logger.isTraceEnabled()).toBeFalsy();
        logger.level = null;
        logger.rootLevel = Level.TRACE;
        expect(logger.isTraceEnabled()).toBeTruthy();
    });

    it('should honor the individual logger level', () => {
        expect(logger.isTraceEnabled()).toBeFalsy();
        // set the individual logger's level
        logger.level = Level.TRACE;
        // effectively, trace should be enabled
        expect(logger.isTraceEnabled()).toBeTruthy();
        logger.level = Level.WARN;
        // set the logger's level to warn and expect the effective level to be 'warn'
        expect(logger.isTraceEnabled()).toBeFalsy();
        expect(logger.isWarnEnabled()).toBeTruthy();
    });

    it('should print to the console on all levels', () => {
        let consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        logger.level = Level.TRACE;

        expect(logger.isTraceEnabled()).toBeTruthy();
        logger.trace('traceMsg');
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('traceMsg');

        expect(logger.isDebugEnabled()).toBeTruthy();
        logger.debug('debugMsg');
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('debugMsg');

        expect(logger.isInfoEnabled()).toBeTruthy();
        logger.info('infoMsg');
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('infoMsg');

        expect(logger.isWarnEnabled()).toBeTruthy();
        consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('warnMsg');
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('warnMsg');

        expect(logger.isErrorEnabled()).toBeTruthy();
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('errorMsg');
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toContain('errorMsg');
    });

    it('should write xml', () => {
        logger.level = Level.TRACE;
        const consoleSpy = jest.spyOn(console, 'dirxml').mockImplementation(() => {});
        const node = window.document.createElement('a');
        logger.dirxml(node);
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1]).toEqual([node]);
    });

    it('should write dir', () => {
        logger.level = Level.TRACE;
        const consoleSpy = jest.spyOn(console, 'dir').mockImplementation(() => {});
        const anObject = { some: 'object' };
        logger.dir(anObject);
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1]).toEqual([anObject]);
    });

    it('should pass additional args to the console function', () => {
        logger.level = Level.TRACE;

        const theArg1 = { a: 'b' };
        const theArg2 = { c: 3 };

        let theSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        logger.trace('Bogus', theArg1, theArg2);
        expect(theSpy).toHaveBeenCalledTimes(1);
        expect(theSpy).toHaveBeenCalledWith(
            '[TRACE] - testLogger: Bogus',
            theArg1,
            theArg2
        );

        theSpy.mockClear();
        logger.debug('Bogus', theArg1, theArg2);
        expect(theSpy).toHaveBeenCalledTimes(1);
        expect(theSpy).toHaveBeenCalledWith(
            '[DEBUG] - testLogger: Bogus',
            theArg1,
            theArg2
        );

        theSpy.mockClear();
        logger.info('Bogus', theArg1, theArg2);
        expect(theSpy).toHaveBeenCalledTimes(1);
        expect(theSpy).toHaveBeenCalledWith(
            '[INFO] - testLogger: Bogus',
            theArg1,
            theArg2
        );

        theSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        logger.warn('Bogus', theArg1, theArg2);
        expect(theSpy).toHaveBeenCalledTimes(1);
        expect(theSpy).toHaveBeenCalledWith(
            '[WARN] - testLogger: Bogus',
            theArg1,
            theArg2
        );

        theSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        logger.error('Bogus', theArg1, theArg2);
        expect(theSpy).toHaveBeenCalledTimes(1);
        expect(theSpy).toHaveBeenCalledWith(
            '[ERROR] - testLogger: Bogus',
            theArg1,
            theArg2
        );
    });
});
