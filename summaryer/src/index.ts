import {
  Article,
  ArticleService,
} from "../../common/domain/article/ArticleService";
import { SummaryService } from "../../common/domain/summary/SummaryService";
import { VectorSearchService } from "../../common/domain/vector/VectorSearchService";
import { VectorService } from "../../common/domain/vector/VectorService";
import { retryCall } from "../../common/libs/retryCall";
import { getMongoConnection } from "../../common/mongo/connection";
import fs from "fs";

// MongoDBへ接続する
const connectionUri = process.env.MONGO_CONNECTION as string;
console.log("mongodb connection uri: ", connectionUri);
getMongoConnection(connectionUri);

const qdrantConnectionUri = process.env.VECTOR_DB_CONNECTION as string;
console.log("qdrant connection uri: ", qdrantConnectionUri);

// LLMの設定
const aya35bModel = "aya:35b";
const commandRPlusModel = "command-r-plus:104b-q4_0";
const targetModels = [aya35bModel];
const llmUri = process.env.OLLAMA_BASE_URL as string;

// ループ
(async () => {
  // 記事の一覧をベクトル化する
  const embeddingService = new VectorService({
    modelName: aya35bModel,
    baseURL: llmUri,
  });
  const vectorSearchService = new VectorSearchService(qdrantConnectionUri);
  await vectorSearchService.init();

  const urlFile = "urls.json";
  const urlContent = fs.readFileSync(urlFile, "utf-8");
  const urls = JSON.parse(urlContent) as Record<string, string>;

  for (const key in urls) {
    const url = key;
    const title = urls[key];
    const exist = await vectorSearchService.existByFavoriteArticle(url);
    if (exist) {
      continue;
    }

    const vector = await embeddingService.toVector(title);
    console.log({
      url,
      title,
      length: vector.length,
    });
    vectorSearchService.saveFavoriteArticle({
      url,
      title,
      vector,
    });
  }

  // article service
  const articleService = new ArticleService();
  // summary service
  const summaryServices = new Map(
    targetModels.map((modelName) => {
      const service = new SummaryService({
        modelName,
        baseURL: llmUri,
      });
      return [modelName, service];
    }),
  );

  // summary serviceをすべてinitする
  await Promise.all(
    [...summaryServices.values()].map((service) => service.init()),
  );

  while (true) {
    for (const modelName of targetModels) {
      const summaryService = summaryServices.get(modelName);
      if (summaryService === undefined) {
        throw new Error(`summary service not found: ${modelName}`);
      }

      const items = await getByNonSummaryItems(modelName, articleService);
      console.log("items score", items.map((i) => i.score));

      // 過去のお気に入りからスコアをつける
      const scoredItems: Article[] = [];
      let counter = 0;
      for (const item of items) {
        // すでにスコアがあればスキップ
        if (item.score && item.score !== 0) {
          scoredItems.push({ ...item });
          console.log("scoring... %d/%d", counter, items.length);
          counter++;
          continue;
        }

        console.log("title: %s, prevScore: %d", item.title, item.score);
        const vector = await embeddingService.toVector(item.title);
        const limit = 20;
        const similarityItems = await vectorSearchService
          .similaritySearchByFavorite(vector, 20, 10);
        const score = similarityItems.reduce((acc, cur) => acc + cur.score, 0) /
          limit;
        scoredItems.push({ ...item, score });
        articleService.updateSummaryByScore({
          id: item.id!,
          score,
        });
        console.log("scoring.... %d/%d score=%d", counter, items.length, score);
        counter++;
      }

      // スコアが高い順にソートする
      const sortedScoreItems = scoredItems.sort((a, b) => {
        if (a.score > b.score) return -1;
        else if (a.score < b.score) return 0;
        else return 1;
      });

      // LLMに要約をさせ、保存する
      await summaryItems(
        sortedScoreItems,
        modelName,
        summaryService,
        articleService,
      );
    }
  }
})();

async function getByNonSummaryItems(
  modelName: string,
  articleService: ArticleService,
): Promise<Article[]> {
  while (true) {
    const articles = await articleService.getByNonSummaryItems(modelName);
    if (articles.length === 0) {
      await (() => new Promise((resolve) => setTimeout(resolve, 500)))();
      continue;
    }
    return articles;
  }
}

// LLMに要約をさせる
async function summaryItems(
  items: Article[],
  modelName: string,
  summaryService: SummaryService,
  articleService: ArticleService,
) {
  const maxSummaryLength = 10;
  let counter = 0;
  for (const item of items) {
    const start = Date.now();
    try {
      // LLMに要約をさせる
      const summary = await retryCall(async () => {
        return await summaryService.summarize({
          title: item.title,
          uri: item.url,
        });
      }, 5);

      // 保存する
      await articleService.updateSummary({
        id: item.id!,
        text: summary,
        modelName,
      });
    } catch (e) {
      console.error("failed to summarize: ", e);
      console.error("item: ", item);

      await articleService.updateSummary({
        id: item.id!,
        text: `failed to summarize: ${JSON.stringify(e)}`,
        modelName,
      });

      continue;
    }
    const end = Date.now();
    console.log("#############");
    console.log(
      "title: %s, duration: %d s",
      item.title,
      Math.round((end - start) / 100) / 10,
    );
    console.log("#############");
    if (counter + 1 >= maxSummaryLength) {
      break;
    }
    counter++;
  }
}
