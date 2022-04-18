import dotenv from "dotenv";
import Bot from "./bot";
import { Forum } from "./forum";
import { logError } from "./log";
import { startHttp } from "./server";
import moment from "moment";

const thirtyMinutes = 1.8e6;
const threeHours = 1.08e7;

let devServerStates = {
  OPEN: 1,
  OPENING: 2,
  CLOSED: 3,
  UNKNOWN: 4,
};

// flag to check if dev server is open
let devServerState = devServerStates.UNKNOWN;

function loadEnv() {
  dotenv.config();
}

async function fetchForum(posts: string[]): Promise<moment.Moment[]> {
  return new Promise<moment.Moment[]>((resolve, reject) => {
    posts.forEach((p) => {
      const post = p.toLowerCase();

      if (post.indexOf("dev server opening") !== -1) {
        // Extract date interval
        const postSplit = post.split("!");
        const date = postSplit[1];
        const intervals = date.substring(1, 24).split("-");

        // Extracts time data
        const start = intervals[0].trim().replaceAll(".", "/");
        const end = intervals[1].trim().replaceAll(".", "/");

        const nd = moment(moment.now());
        const sd = moment(start, "DD/MM/YYYY");
        const ed = moment(end, "DD/MM/YYYY");

        if (nd.isBetween(sd, ed)) {
          devServerState = devServerStates.OPEN;
        } else if (nd.isBefore(sd)) {
          devServerState = devServerStates.OPENING;
        } else {
          devServerState = devServerStates.CLOSED;
        }

        resolve([nd, sd, ed]);
      }
    });
  });
}

function sendNotifications(
  channelId: string,
  bot: Bot,
  moments: moment.Moment[]
) {
  const [now, start, end] = moments;

  switch (devServerState) {
    case devServerStates.OPEN:
      bot.sendMsg(
        channelId,
        `Dev server is open and will be closed ${end.fromNow()}`
      );
      break;
    case devServerStates.OPENING:
      bot.sendMsg(channelId, `Dev server will be opening ${start.fromNow()}`);
      break;

    case devServerStates.CLOSED:
      break;
  }
}

async function main() {
  // Load environment variables
  loadEnv();

  // Start HTTP server
  startHttp();

  const { CHANNEL_ID } = process.env;

  if (CHANNEL_ID === undefined) {
    logError("channel ID isn't defined");
    process.exit(1);
  }

  // Load telegram bot
  const bot = new Bot();
  bot.setupTriggers();

  // Send ping
  bot.sendMsg(CHANNEL_ID, "Hello, i'm alive");

  // Setup forum parser service (page 1 have been selected)
  const forum = new Forum();

  setInterval(async () => {
    try {
      const posts = await forum.getPostItems();
      const moments = await fetchForum(posts);

      setTimeout(() => {
        sendNotifications(CHANNEL_ID, bot, moments);
      }, threeHours);
    } catch (err) {
      logError(`could not fetch posts: ${err}`);
    }
  }, thirtyMinutes);
}

main();
