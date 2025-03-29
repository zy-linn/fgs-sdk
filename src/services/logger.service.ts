import { Ora } from "ora";
import { ILogger } from "../models/interface";
import { spinner } from "../utils/util";

export class Logger {
    private __logger: ILogger;
    private __spinner: Ora = spinner();
    private __showLog = false;
    private static __instantce: Logger;

    get logger(): ILogger {
        return this.__logger;
    }

    get spinner(): Ora {
        return this.__spinner;
    }

    constructor(showLog) {
        this.__showLog = showLog;
    }

    public static getIns(showLog = false): Logger {
        if (!Logger.__instantce) {
            Logger.__instantce = new Logger(showLog);
        }
        return Logger.__instantce;
    }

    public withLogger(logger: ILogger): Logger {
        this.__logger = logger;
        return this;
    }

    public withSpinner(spin: Ora) {
        this.__spinner = spin;
        return this;
    }

    public spinStart(msg) {
        this.__spinner?.start(msg);
        this.__showLog && this.__logger?.debug(msg);
    }

    public spinSuccess(msg) {
        this.__spinner?.succeed(msg);
        this.__showLog && this.__logger?.success(msg);
    }

    public spinError(msg) {
        this.__spinner?.fail(msg);
        this.__showLog && this.__logger?.error(msg);
    }

    public spinStop() {
        this.__spinner?.stop();
    }

    public debug(msg) {
        this.__logger?.debug(msg);
    }

    public info(msg) {
        this.__logger?.info(msg);
    }

    public success(msg) {
        this.__logger?.success(msg);
    }

    public error(msg) {
        this.__logger?.error(msg);
    }
}