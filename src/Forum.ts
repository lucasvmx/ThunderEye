import { IncomingMessage } from "http";
import * as https from "https";
import jsdom from "jsdom";
import { logInfo } from "./Log";

class Forum {
	url = "https://forum.warthunder.com/c/official-news-and-information/7";

	constructor() {}

	/**
	 * Fetches forum raw html data
	 * @returns a string containing HTML content returned from forum
	 */
	async getRawData(): Promise<string> {
		let rawData: string = "";

		return new Promise<string>((resolve, reject) => {
			https.get(this.url, function (res: IncomingMessage) {
				const { statusCode } = res;

				logInfo(`status code: ${statusCode}`);
				logInfo(`content size: ${res.headers["content-length"]}`);

				if (statusCode !== 200) {
					throw new Error(`unexpected HTTP code: ${statusCode}`);
				}

				res.on("error", () => {
					reject("");
				});
				res.on("data", (chunk) => (rawData += chunk));
				res.on("close", () => {
					logInfo(`request finished with ${rawData.length} bytes received`);
					resolve(rawData);
				});
			});
		});
	}

	/**
	 * Fetches all posts from the first page of forum and returns its titles
	 * @returns
	 */
	async fetchPosts(): Promise<string[]> {
		let forumTitles: string[] = [];

		return new Promise<string[]>(async (resolve, reject) => {
			const rawHtml = await this.getRawData();
			const dom = new jsdom.JSDOM(rawHtml);
			//const $ = cheerio.load(rawHtml);

			const items = dom.window.document.getElementsByClassName("title raw-link raw-topic-link");

			if (items.length === 0) {
				throw new Error("no items found");
			}

			for (let i = 0; i < items.length; i++) {
				let title = items[i].textContent?.toLowerCase();

				if (title === undefined) {
					continue;
				}

				if (title.startsWith("dev server opening")) {
					logInfo(`pushing tag ${title} to forums list`);
					forumTitles.push(title);
				}
			}

			if (forumTitles.length == 0) {
				reject("no dev server tags found");
			} else {
				resolve(forumTitles);
			}
		});
	}
}

export { Forum };
