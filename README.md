# yalog4ts

This is is yet another log4j-like logging framework for typescript. Base features:

* named loggers
* ability to add custom appenders
* console interface to modify log levels at runtime

## Installation

Install it with `npm install --save yalog4ts`.

## Usage

First of all, in your app bootstrap, configure the logging system with 
```
import { Loggerfactory, LoggerFactoryConfig } from 'yalog4ts';

[...]

Loggerfactory.init(
    window: Window, 
    storage: Storage, 
    config: LoggerFactoryConfig)
```

In your code, grab a logger with 
```
const logger = LoggerFactory.getLogger('aLoggerName')
```
and use it, e.g. 
```
logger.info('this is some info message');
logger.info('this is some info message', someObject);
```

### Console interface

If enabled via configuration, yalog4ts registers some console features to set the level either globally or for certain loggers. Open the browser's developer tools, and enter `lf.help` to get some help (however, the context `lf` may be configured differently).

Basic features are: 
* `lf.listloggers()` or its short equivalent `lf.ll()` to list all registered loggers along with their log levels
* `lf.setLogLevel(loggerIndexOrName, level)` or its short equivalent `lf.sll()` to set the log level for specific loggers, e.g. `lf.sll('loggerName', lf.DEBUG)` or `lf.sll(1, lf.DEBUG)` (index determined using `lf.ll()`)
* Set the overall root level e.g. `lf.level = lf.DEBUG` 
