import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { retryCall } from "../../libs/retryCall";

export type VectorOption = {
	modelName: string;
	baseURL: string;
};

export class VectorService {
	private options: VectorOption;

	constructor(options: VectorOption) {
		this.options = options;
	}

	async toVector(text: string): Promise<number[]> {
		return retryCall(async () => {
			const ollamaLLM = new OllamaEmbeddings({
				baseUrl: this.options.baseURL,
				model: this.options.modelName,
				keepAlive: "120m",
			});

			return await ollamaLLM.embedQuery(text);
		}, 5);
	}
}
