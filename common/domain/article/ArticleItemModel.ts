import mongoose, { model, Schema, type Types } from "mongoose";

export interface IArticleItem {
	id: Types.ObjectId;
	title: string;
	url: string;
	content?: string;
	summary?: [
		{
			modelName: string;
			text: string;
		},
	];
	score?: number;
	meta: {
		createdAt: Date;
	};
}

export const articleItemSchema = new Schema<IArticleItem>({
	id: Schema.Types.UUID,
	title: { type: String, required: true },
	url: { type: String, required: true },
	content: { type: String, required: false },
	summary: { type: Schema.Types.Mixed, required: false },
	score: { type: Number, required: false },
	meta: {
		createdAt: { type: Date, default: Date.now },
	},
});

export const ArticleItem =
	mongoose.models.articleItem ||
	model<IArticleItem>("articleItem", articleItemSchema);
