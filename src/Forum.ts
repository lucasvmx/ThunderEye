import * as cheerio from "cheerio";
import * as https from "https";
import { logInfo } from "./Log";
import { IncomingMessage } from "http";
import jsdom from "jsdom";

class Forum {
  url = "https://forum.warthunder.com/index.php?/forum/26-project-news";

  constructor() {}

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

  async getPostItems(): Promise<string[]> {
    let forumTitles: string[] = [];

    return new Promise<string[]>(async (resolve, reject) => {
      const rawHtml = await this.getRawData();
      const dom = new jsdom.JSDOM(rawHtml);
      const $ = cheerio.load(rawHtml);

      const items =
        dom.window.document.getElementsByClassName("ipsDataItem_main");

      if (items.length === 0) {
        throw new Error("table not found");
      }

      for (let i = 0; i < items.length; i++) {
        items[i].childNodes.forEach((tag) => {
          // Ignore non h4 tags
          if (tag.nodeName.toLowerCase() !== "h4") return;

          tag.childNodes.forEach((t) => {
            // Ignore non-divs
            if (t.nodeName.toLowerCase() !== "div") return;

            let typeBreakDivChildNodes = t.childNodes;

            typeBreakDivChildNodes.forEach((param) => {
              if (param.nodeType == param.TEXT_NODE) {
                return;
              }

              const content = param.textContent?.toString().trim();
              if (content === undefined) {
                return;
              }

              // Adds posts to array
              if (content.toLowerCase().startsWith("dev server opening")) {
                console.log(content);
                forumTitles.push(content);
              }
            });
          });
        });
      }

      if (forumTitles.length == 0) {
        reject([]);
      } else {
        resolve(forumTitles);
      }
    });
  }
}

export { Forum };
