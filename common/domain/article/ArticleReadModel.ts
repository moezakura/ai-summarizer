import mongoose, { model, Schema, type Types } from "mongoose";

export interface IArticleRead {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	articleId: Types.ObjectId;
	meta: {
		createdAt: Date;
	};
}

export const articleReadSchema = new Schema<IArticleRead>({
	_id: Schema.Types.ObjectId,
	userId: Schema.Types.ObjectId,
	articleId: Schema.Types.ObjectId,
	meta: {
		createdAt: { type: Date, default: Date.now },
	},
});

export const ArticleRead =
	mongoose.models.articleRead ||
	model<IArticleRead>("articleRead", articleReadSchema);
