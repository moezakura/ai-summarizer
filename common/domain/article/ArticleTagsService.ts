import { Types } from "mongoose";
import {
	ArticleTagRelational,
	type IArticleTagRelational,
} from "./ArticleTagRelationalModel";
import { ArticleTag, type IArticleTag } from "./ArticleTagsModel";

export type Tag = {
	id: string;
	userId: string;
	name: string;
	shortcut?: string;
};

export type existTagRequest = {
	userId: string;
	name: string;
};

export type existTagsRequest = {
	userId: string;
	names: string[];
};

export class ArticleTagsService {
	/**
	 * 指定したユーザーに紐付いているタグ一覧を取得する
	 * @param userId ユーザーのID
	 */
	async getArticleTagsByUserId(userId: string): Promise<Tag[]> {
		const tags = await ArticleTag.find<IArticleTag>({
			$and: [{ userId: userId }],
		});

		return tags.map<Tag>((tag) => {
			return {
				id: tag._id.toHexString(),
				userId: tag.userId.toHexString(),
				name: tag.name,
				shortcut: tag.shortcut,
			};
		});
	}

	/**
	 * 指定したユーザーに紐付いているかつ、指定した名前のタグが存在するかどうかを調べる
	 * @param userId ユーザーID
	 * @param name タグ名
	 */
	async isExistsArticleTag({
		userId,
		name,
	}: existTagRequest): Promise<boolean> {
		const count = await ArticleTag.countDocuments({
			$and: [{ userId: userId }, { name: name }],
		});

		return count > 0;
	}

	/**
	 * 指定したユーザーに紐付いているかつ、指定した名前のタグが存在するか一括で調べる
	 * @param userId ユーザーID
	 * @param names タグ名
	 */
	async isExistsArticleTags({
		userId,
		names,
	}: existTagsRequest): Promise<Map<string, boolean>> {
		const tags = await ArticleTag.find<IArticleTag>({
			$and: [{ userId: userId }, { name: { $in: names } }],
		});

		const result = new Map<string, boolean>();
		for (const tag of tags) {
			result.set(tag.name, true);
		}
		for (const name of names) {
			if (result.has(name)) {
				continue;
			}
			result.set(name, false);
		}

		return result;
	}

	/**
	 * 指定したユーザーに紐付けたタグを一括作成する
	 * @param userId ユーザーID
	 * @param tags タグの配列
	 */
	async createArticleTags(
		userId: string,
		tags: {
			name: string;
			shortcut?: string;
		}[],
	): Promise<Tag[]> {
		const userIdObject = new Types.ObjectId(userId);

		const addTargets = tags.map((tag) => {
			const articleTag = new ArticleTag<IArticleTag>();
			articleTag.userId = userIdObject;
			articleTag.name = tag.name;
			if (tag.shortcut) {
				articleTag.shortcut = tag.shortcut;
			}
			return articleTag;
		});

		await ArticleTag.insertMany<IArticleTag>(addTargets);

		const result = await ArticleTag.find<IArticleTag>({
			$and: [
				{ userId: userIdObject },
				{ name: { $in: tags.map((tag) => tag.name) } },
			],
		});

		const tagsResult: Tag[] = result.map((tag) => {
			return {
				id: tag._id.toHexString(),
				userId: tag.userId.toHexString(),
				name: tag.name,
				shortcut: tag.shortcut,
			};
		});
		return tagsResult;
	}

	/**
	 * 記事をタグに紐付ける
	 * @param articleId 記事ID
	 * @param tagIds タグIDの配列
	 */
	async addArticleTag(articleId: string, userId: string, tagIds: string[]) {
		const articleIdObject = new Types.ObjectId(articleId);
		const userIdObject = new Types.ObjectId(userId);
		const addTarget: IArticleTagRelational[] = [];

		// articleIDに紐付くすべてのTagを取得する
		const currentTags = await ArticleTagRelational.find<IArticleTagRelational>({
			articleId: articleIdObject,
		});
		const currentRelationalTags = currentTags.map((tag) => {
			return tag.tagId.toHexString();
		});

		const removeTarget = new Set(
			currentTags.map((tag) => tag.tagId.toHexString()),
		);

		// tagIdsごとに処理する
		for (const tagId of tagIds) {
			const tagIdObject = new Types.ObjectId(tagId);
			// removeTargetから除外する
			removeTarget.delete(tagId);

			// すでに紐付いていればスキップ
			if (currentRelationalTags.includes(tagId)) {
				continue;
			}

			// すでに紐付いているかチェック
			const isExist = await ArticleTagRelational.findOne<IArticleTagRelational>(
				{
					$and: [{ articleId: articleIdObject }, { tagId: tagIdObject }],
				},
			);
			if (isExist) {
				continue;
			}

			// 紐付けをする
			addTarget.push({
				_id: new Types.ObjectId(),
				articleId: articleIdObject,
				tagId: tagIdObject,
				meta: {
					createdAt: new Date(),
				},
			});
		}

		if (addTarget.length > 0) {
			await ArticleTagRelational.insertMany<IArticleTagRelational>(addTarget);
		}

		if (removeTarget.size > 0) {
			const removeArray = Array.from(removeTarget);
			await ArticleTagRelational.deleteMany({
				articleId: articleIdObject,
				tagId: {
					$in: removeArray.map((id) => new Types.ObjectId(id)),
				},
			});
		}
	}

	/**
	 * 指定したユーザーの指定した記事に紐付いているタグ一覧を取得する
	 * @param userId ユーザーID
	 * @param articleId 記事ID
	 */
	async getArticleTags(
		userId: string,
		articleId: string,
	): Promise<IArticleTag[]> {
		const articleTagRelational =
			await ArticleTagRelational.find<IArticleTagRelational>({
				articleId: new Types.ObjectId(articleId),
			});

		const tagIds = articleTagRelational.map((a) => a.tagId);
		const tags = await ArticleTag.find<IArticleTag>({
			_id: { $in: tagIds },
		});

		return tags;
	}
}
