import { Level } from "./logger";

/** Defines serializes log factory config */
export class LoggerFactoryConfig {
    /** levels */
    rootLevel: Level;
    levels: { [key: string]: string };
    /** appenders */
    appenders: string[];
    consoleFeature?: boolean;
    consoleContext?: string
}