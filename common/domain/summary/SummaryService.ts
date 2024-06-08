import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { MozillaReadabilityTransformer } from "@langchain/community/document_transformers/mozilla_readability";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { retryCall } from "../../libs/retryCall";
import { JSDOM } from "jsdom";
import puppeteer, { Browser } from "puppeteer";
import { Readability } from "@mozilla/readability";

export type SummaryOption = {
	modelName: string;
	baseURL: string;
};

export type SummaryItem = {
	title: string;
	uri: string;
};

export class SummaryService {
	private ollamaLLM: ChatOllama;
	private browser?: Browser;

	constructor(options: SummaryOption) {
		this.ollamaLLM = new ChatOllama({
			baseUrl: options.baseURL,
			model: options.modelName,
			numPredict: 1500,
		});
	}

	public async init() {
		const browser = await puppeteer.launch({
			headless: true,
			slowMo: 10,
			defaultViewport: {
				width: 1920,
				height: 1080 * 3,
			},
			args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=ja,en-US,en"],
		});
		this.browser = browser;
	}

	async summarize(item: SummaryItem): Promise<string> {
		const ollamaLlm = this.ollamaLLM;

		const page = await this.browser!.newPage();
		await page.goto(item.uri);
		const html = await page.evaluate(() => {
			return document.documentElement.outerHTML;
		});

		const dom = new JSDOM(html);
		const content = new Readability(dom.window.document).parse();

		// const transformer = new MozillaReadabilityTransformer();
		const splitter = RecursiveCharacterTextSplitter.fromLanguage("html", {
			chunkSize: 6000,
			chunkOverlap: 100,
		});
		if (!content?.content) {
			throw new Error(`failed to get content: ${JSON.stringify(content)}`);
		}

		const newDocuments = await splitter.splitText(content!.content);

		const results: string[] = [];

		for (const doc of newDocuments) {
			const result = await retryCall(async () => {
				const outputParser = new StringOutputParser();

				const summaryPrompt = PromptTemplate.fromTemplate(
					[
						"あなたはWebページの要約の専門家です。\n",
						"あなたの目的はタイトルとWebページのコンテンツから読みやすく要約した文章を作ることです。\n",
						"以下はWebページから抽出した文章です。\n",
						"---------------------\n",
						"Webページのタイトル: {title} \n",
						"Webページのコンテンツ:\n{page_content}\n",
						"---------------------\n",
						"提供された情報のみを要約に含めてください。\n",
						"記事の内容を箇条書きで要約してください。箇条書きの先頭には意味に合う絵文字をつけてください。\n",
						"元のWebページに記載されていない情報を補完してはいけません。\n",
						"必ず日本語で教えてください。\n",
					].join(),
				);

				const chain = summaryPrompt.pipe(ollamaLlm).pipe(outputParser);

				return await chain.invoke({
					title: item.title,
					page_content: doc,
				});
			}, 5);

			console.warn(result);

			results.push(result);
		}

		const mergedResult = results.join("\n");
		if (mergedResult.length < 500) {
			return mergedResult;
		}

		const complessSummaryText = await retryCall(async () => {
			const outputParser = new StringOutputParser();

			const summaryPrompt = PromptTemplate.fromTemplate(
				[
					"あなたはWebページの要約の専門家です。\n",
					"あなたの目的はタイトルとWebページのコンテンツから読みやすく要約した文章を作ることです。\n",
					"以下はWebページから抽出した文章です。\n",
					"---------------------\n",
					"Webページのタイトル: {title} \n",
					"Webページのコンテンツ:\n{page_content}\n",
					"---------------------\n",
					"文体が統一されていない場合は、文体を統一してください。\n",
					"提供された情報のみを要約に含めてください。\n",
					"記事の内容を箇条書きで要約してください。箇条書きの先頭には意味に合う絵文字をつけてください。\n",
					"元のWebページに記載されていない情報を補完してはいけません。\n",
					"必ず日本語で教えてください。\n",
				].join(),
			);

			const chain = summaryPrompt.pipe(ollamaLlm).pipe(outputParser);

			return await chain.invoke({
				title: item.title ?? "不明なタイトル",
				page_content: mergedResult,
			});
		}, 5);

		return complessSummaryText;
	}
}
