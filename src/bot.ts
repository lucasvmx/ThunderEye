import { Context, Telegraf } from "telegraf";
import { Update } from "typegram";
import { logError, logInfo, logWarn } from "./log";

export default class Bot {
  bot: Telegraf<Context<Update>>;

  Bot() {
    const { BOT_TOKEN } = process.env;

    if (BOT_TOKEN === undefined) {
      logError("token is not set");
      process.exit(1);
    }

    this.bot = new Telegraf(BOT_TOKEN);
    this.bot.launch();

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
   *
   * @param chatId ID of target chat
   * @param msg Message to be sent
   */
  sendMsg(chatId: string | number, msg: string) {
    if (!chatId || !msg) {
      logWarn("chatId or msg not provived");
    }

    this.bot.telegram.sendMessage(chatId, msg);
  }
}
