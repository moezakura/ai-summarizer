import { QdrantClient } from "@qdrant/js-client-rest";

const urlCollection = "favorite-article";

export type FavoriteArticle = {
	title: string;
	url: string;
	vector: number[];
};

export class VectorSearchService {
	private client: QdrantClient;

	constructor(url: string) {
		this.client = new QdrantClient({ url });
	}

	async init() {
		const collections = await this.client.getCollections();
		const collectionNames = collections.collections.map((c) => c.name);
		// urlCollectionがなければ作成
		if (!collectionNames.includes(urlCollection)) {
			await this.client.createCollection(urlCollection, {
				vectors: {
					size: 8192,
					distance: "Dot",
				},
			});

			await this.client.createPayloadIndex(urlCollection, {
				field_name: "url",
				field_schema: "text",
				wait: true,
			});
		}
	}

	async existByFavoriteArticle(url: string): Promise<Boolean> {
		const searchResult = await this.client.scroll(urlCollection, {
			limit: 1,
			filter: {
				must: [
					{
						key: "url",
						match: {
							value: url,
						},
					},
				],
			},
		});

		if (searchResult.points.length === 0) {
			return false;
		}

		return true;
	}

	async saveFavoriteArticle(article: FavoriteArticle): Promise<void> {
		const id = crypto.randomUUID();
		await this.client.upsert(urlCollection, {
			wait: true,
			points: [
				{
					id,
					vector: article.vector,
					payload: {
						title: article.title,
						url: article.url,
					},
				},
			],
		});
	}

	async similaritySearchByFavorite(
		vector: number[],
		limit: number,
		score_threshold: number | null = null,
	) {
		const searchResult = await this.client.search(urlCollection, {
			vector,
			limit,
			score_threshold,
			params: {
				// hnsw_ef: 128,
				exact: true,
			},
		});
		return searchResult;
	}
}
