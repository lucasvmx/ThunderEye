import { Telegraf } from "telegraf";
import { logInfo, logWarn } from "./Log";

class Bot {
	bot;

	chatId: string;

	constructor(token: string, chatId: string) {
		// Initializes bot
		this.bot = new Telegraf(token);
		this.bot.launch();

		this.chatId = chatId;

		logInfo("bot loading completed");
	}

	/**
	 * Configure triggers to enable graceful bot shutdown
	 */
	setupTriggers() {
		process.once("SIGINT", () => this.bot.stop("SIGINT"));
		process.once("SIGTERM", () => this.bot.stop("SIGTERM"));
		logInfo("signal handlers configured");
	}

	/**
	 * Sends message to telegram
	 * @param msg Message to be sent
	 */
	sendMsg(msg: string) {
		if (!msg) {
			logWarn("empty msg");
			return;
		}

		this.bot.telegram.sendMessage(this.chatId, msg);
	}
}

export { Bot };
