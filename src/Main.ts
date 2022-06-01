import dotenv from "dotenv";
import { Bot } from "./Bot";
import { Forum } from "./Forum";
import { logError } from "./Log";
import { startHttp } from "./Server";
import moment from "moment";

interface momentData {
  currentTime: moment.Moment;
  startTime: moment.Moment;
  endTime: moment.Moment;
}

/**
 * Possible states for dev server
 */
enum devServerStates {
  OPEN = 1,
  OPENING,
  CLOSED,
  UNKNOWN,
}

// flag to check if dev server is open
let devServerState = devServerStates.UNKNOWN;

function loadEnv() {
  dotenv.config();
}

async function fetchForum(posts: string[]): Promise<Required<momentData>> {
  return new Promise<momentData>((resolve) => {
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

        resolve({ startTime: sd, currentTime: nd, endTime: ed });
      }
    });
  });
}

function sendNotifications(
  channelId: string,
  bot: Bot,
  moments: Required<momentData>
) {
  const [now, start, end] = [
    moments.currentTime,
    moments.startTime,
    moments.endTime,
  ];

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
      bot.sendMsg(channelId, `Dev server was closed ${end.toNow(true)} ago`);
      break;
  }
}

function main() {
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

  // Setup forum parser service (page 1 have been selected)
  const forum = new Forum();

  var runTask = async () => {
    try {
      const posts = await forum.getPostItems();

      console.log(posts);

      const moments = await fetchForum(posts);

      sendNotifications(CHANNEL_ID, bot, moments);
    } catch (err) {
      logError(`could not fetch posts: ${err}`);
    }
  };

  runTask();
}

main();
