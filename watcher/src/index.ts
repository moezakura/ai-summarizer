import Parser from "rss-parser";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getMongoConnection } from "../../common/mongo/connection";
import { ArticleService } from "../../common/domain/article/ArticleService";

const parser: Parser = new Parser({});
const app = new Hono();

const connectionUri = process.env.MONGO_CONNECTION as string;
console.log("mongodb connection uri: ", connectionUri);
getMongoConnection(connectionUri);

const articleService = new ArticleService();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/feed", async (c) => {
  const feed = await parser.parseURL(
    "https://www.inoreader.com/stream/user/1005147396/tag/all-articles",
  );
  console.log(feed.title);

  console.log("---------------------------");
  for (const item of feed.items) {
    console.log(item.title + ":" + item.link);
  }
  // 保存対象のデータ
  const saveItems = feed.items.map((item) => {
    // 作成日時
    let createdAt = new Date();
    // createdAtがstringであればパースを試みる
    if (typeof item.pubDate === "string") {
      const date = new Date(item.pubDate);
      if (!isNaN(date.getTime())) {
        // NaNでなければパース成功
        createdAt = date;
      }
    }

    return {
      title: item.title!,
      url: item.link!,
      content: item.content ?? item.contentSnippet,
      score: 0,
      meta: {
        createdAt,
      },
    };
  });

  // DBに保存
  articleService.bulkCreate(saveItems);

  return c.json(feed);
});

const port = 6301;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
