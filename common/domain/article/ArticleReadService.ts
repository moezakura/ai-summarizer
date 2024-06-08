import { Types } from "mongoose";
import { ArticleItem } from "./ArticleItemModel";
import { ArticleRead } from "./ArticleReadModel";

export class ArticleReadService {
	private async isRead(articleID: string, userID: string): Promise<boolean> {
		const count = await ArticleRead.countDocuments({
			$and: [
				{ userId: new Types.ObjectId(userID) },
				{ articleId: new Types.ObjectId(articleID) },
			],
		});

		return count > 0;
	}

	private async checkArticleID(articleID: string): Promise<void> {
		try {
			const count = await ArticleItem.countDocuments({
				_id: new Types.ObjectId(articleID),
			});
			if (count === 0) {
				throw new Error("Article not found");
			}
		} catch (e) {
			console.error("failed to search article item", e);
			throw e;
		}
	}

	async read(articleID: string, userID: string) {
		// すでに既読かチェックする
		const isAlreadyRead = await this.isRead(articleID, userID);
		// すでに既読だった場合は何もしない
		if (isAlreadyRead) {
			return;
		}

		// articleIDが存在するかチェック
		await this.checkArticleID(articleID);

		// 既読のレコードを作成
		await ArticleRead.create({
			_id: new Types.ObjectId(),
			userId: new Types.ObjectId(userID),
			articleId: new Types.ObjectId(articleID),
		});
		return;
	}

	async unRead(articleID: string, userID: string) {
		// すでに既読かチェックする
		const isAlreadyRead = await this.isRead(articleID, userID);
		// 未既読だった場合は何もしない
		if (!isAlreadyRead) {
			return;
		}
		// articleIDが存在するかチェック
		await this.checkArticleID(articleID);

		// 既読のレコードを削除
		const query = {
			userId: new Types.ObjectId(userID),
			articleId: new Types.ObjectId(articleID),
		};
		await ArticleRead.deleteOne(query);
		return;
	}
}
