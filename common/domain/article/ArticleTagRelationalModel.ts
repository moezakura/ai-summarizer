import mongoose, { model, Schema, type Types } from "mongoose";

export interface IArticleTagRelational {
	_id: Types.ObjectId;
	tagId: Types.ObjectId;
	articleId: Types.ObjectId;
	meta: {
		createdAt: Date;
	};
}

export const articleTagRelationalSchema = new Schema<IArticleTagRelational>({
	_id: Schema.Types.ObjectId,
	tagId: Schema.Types.ObjectId,
	articleId: Schema.Types.ObjectId,
	meta: {
		createdAt: { type: Date, default: Date.now },
	},
});

export const ArticleTagRelational =
	mongoose.models.articleTagRelational ||
	model<IArticleTagRelational>(
		"articleTagRelational",
		articleTagRelationalSchema,
	);
