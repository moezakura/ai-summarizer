import mongoose, { model, Schema, type Types } from "mongoose";

export interface IArticleTag {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	name: string;
	shortcut?: string;
	meta: {
		createdAt: Date;
	};
}

export const articleTagSchema = new Schema<IArticleTag>({
	_id: Schema.Types.ObjectId,
	userId: Schema.Types.ObjectId,
	name: { type: String, required: true },
	shortcut: { type: String, required: false },
	meta: {
		createdAt: { type: Date, default: Date.now },
	},
});

export const ArticleTag =
	mongoose.models.articleTag ||
	model<IArticleTag>("articleTag", articleTagSchema);
