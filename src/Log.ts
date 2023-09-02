import moment from "moment";

export function logInfo(msg: string) {
	console.info(`${moment().format("DD/MM/YYYY hh:mm:ss")} - INFO: ${msg}`);
}

export function logError(msg: string) {
	console.info(`${moment().format("DD/MM/YYYY hh:mm:ss")} - ERROR: ${msg}`);
}

export function logWarn(msg: string) {
	console.info(`${moment().format("DD/MM/YYYY hh:mm:ss")} - WARNING: ${msg}`);
}
