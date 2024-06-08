import { type SortOrder, Types } from "mongoose";
import { ArticleItem } from "./ArticleItemModel";

export type Article = {
	id?: string;
	title: string;
	url: string;
	content?: string;
	summary?: {
		modelName: string;
		text: string;
	}[];
	score: number;
	meta: {
		createdAt: Date;
	};
};

export type SummaryItem = {
	id: string;
	modelName: string;
	text: string;
	score?: number;
};

export type SummaryScoreUpdateItem = {
	id: string;
	score: number;
};

export class ArticleService {
	constructor() {}

	async bulkCreate(items: Article[]) {
		if (items.length === 0) {
			throw new Error("items is empty");
		}

		// 対象のURLの一覧
		const targetURLs = items.map((i) => i.url);

		// DBから該当するURLがあるか探す
		const existingItems = await ArticleItem.find({ url: { $in: targetURLs } });
		// 該当したURLのSet
		const existingURLs = new Set(existingItems.map((i) => i.url));

		// URLが一致する物があれば削除する
		const insertItems = items.filter((item) => !existingURLs.has(item.url));

		// insertする物がなければ終了
		if (insertItems.length === 0) {
			return;
		}

		// DBへ格納
		await ArticleItem.insertMany(insertItems);
	}

	async getByNonSummaryItems(modelName: string): Promise<Article[]> {
		// modelnameで一致するものがないもの
		const items = await ArticleItem.find({
			summary: {
				$not: {
					$elemMatch: {
						modelName: modelName,
					},
				},
			},
		});

		console.log("items", items);

		return items.map<Article>((item) => ({
			id: (item._id ?? item.id).toHexString(),
			title: item.title,
			url: item.url,
			content: item.content,
			summary: item.summary ?? [],
			score: item.score ?? 0,
			meta: {
				createdAt: item.meta.createdAt,
			},
		}));
	}

	async getList(arg: {
		limit: number;
		nextOffsetId?: string;
		prevOffcetId?: string;
		sortKey?: string;
		sortOrder?: "asc" | "desc";
		filter?: Record<string, unknown>;
	}): Promise<Article[]> {
		const filter: Record<string, unknown> = {};
		const sort: { [key: string]: SortOrder } = {};
		if (arg.sortKey) {
			sort[arg.sortKey] = arg.sortOrder === "desc" ? -1 : 1;
		}

		if (arg.nextOffsetId) {
			// offsetIdよりも大きい物
			filter["_id"] = {
				$lte: new Types.ObjectId(arg.nextOffsetId),
			};
			sort["_id"] = -1;
		}
		if (arg.prevOffcetId) {
			// offsetIdよりも小さな物
			filter["_id"] = {
				$gte: new Types.ObjectId(arg.prevOffcetId),
			};
			sort["_id"] = 1;
		}

		const items = await ArticleItem.find({
			...filter,
			...(arg.filter ?? {}),
		})
			.sort({
				...sort,
			})
			.limit(arg.limit);

		return items.map<Article>((item) => ({
			id: (item._id ?? item.id).toHexString(),
			title: item.title,
			url: item.url,
			content: item.content,
			summary: item.summary ?? [],
			score: item.score ?? 0,
			meta: {
				createdAt: item.meta.createdAt,
			},
		}));
	}

	async getItem(id: string): Promise<Article | null> {
		const item = await ArticleItem.findById(id);
		if (!item) {
			return null;
		}
		return {
			id: (item._id ?? item.id).toHexString(),
			title: item.title,
			url: item.url,
			content: item.content,
			summary: item.summary ?? [],
			score: item.score ?? 0,
			meta: {
				createdAt: item.meta.createdAt,
			},
		};
	}

	async updateSummary(summary: SummaryItem) {
		// 引数の中身をDBへ格納する
		await ArticleItem.findByIdAndUpdate(summary.id, {
			$push: {
				summary: {
					modelName: summary.modelName,
					text: summary.text,
				},
			},
		});
	}

	async updateSummaryByScore(summary: SummaryScoreUpdateItem) {
		// 引数の中身をDBへ格納する
		await ArticleItem.updateOne(
			{
				_id: new Types.ObjectId(summary.id),
			},
			{
				$set: {
					score: summary.score ?? 0,
				},
			},
		);
	}
}
