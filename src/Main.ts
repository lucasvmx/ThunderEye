import dotenv from "dotenv";
import moment from "moment";
import { Bot } from "./Bot";
import { Forum } from "./Forum";
import { logError, logInfo } from "./Log";

interface momentData {
	currentTime: moment.Moment;
	startTime: moment.Moment;
	endTime: moment.Moment;
}

const TIME_1S = 1000;
const TIME_1M = TIME_1S * 60;
const TIME_1H = TIME_1M * 60;
const TIME_12H = TIME_1H * 12;

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

async function checkPosts(posts: Required<string[]>): Promise<Required<momentData>> {
	return new Promise<momentData>((resolve) => {
		const p = posts[0];

		const post = p.toLowerCase();

		// Extract date interval
		const postSplit = post.split("!");

		if (postSplit.length < 2) {
			console.info(`wrong post lenght: ${postSplit.length}`);
			return;
		}

		const date = postSplit[1];
		const intervals = date.substring(1, 24).split("-");

		if (intervals.length < 2) {
			console.info(`wrong len in intervals: ${intervals.length}`);
			return;
		}

		// Extracts time data
		const start = intervals[0].trim().replaceAll(".", "/");
		const end = intervals[1].trim().replaceAll(".", "/");

		logInfo(`date and time extracted (start, end): ${start},${end}`);

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
	});
}

function sendNotifications(channelId: string, bot: Bot, moments: Required<momentData>) {
	const [now, start, end] = [moments.currentTime, moments.startTime, moments.endTime];

	switch (devServerState) {
		case devServerStates.OPEN:
			bot.sendMsg(`Dev server is open and will be closed ${end.fromNow()}`);
			break;
		case devServerStates.OPENING:
			bot.sendMsg(`Dev server will be opening ${start.fromNow()}`);
			break;

		case devServerStates.CLOSED:
			logInfo(`Dev server was closed ${end.toNow(true)} ago`);
			break;
		default:
			logInfo("Unknown server status");
	}
}

function main() {
	// Load environment variables
	loadEnv();

	const { CHANNEL_ID, TOKEN } = process.env;

	if (CHANNEL_ID === undefined || TOKEN === undefined) {
		logError("telegram can't be configured. token or channel ID is invalid");
		process.exit(1);
	}

	// Load telegram bot
	const bot = new Bot(TOKEN, CHANNEL_ID);
	bot.setupTriggers();

	bot.sendMsg(`starting ThunderEye service at ${moment.utc().format()} - UTC`);

	// Setup forum parser service
	const forum = new Forum();

	var runTask = async () => {
		try {
			// fetches all posts from first page
			const posts = await forum.fetchPosts();

			// Extracts time data from posts
			const moments = await checkPosts(posts);

			sendNotifications(CHANNEL_ID, bot, moments);
		} catch (err) {
			logError(`could not fetch posts: ${err}`);
		}

		// Fetches forum two times per day
		setTimeout(() => {
			runTask();
		}, TIME_12H);
	};

	runTask();
}

main();
