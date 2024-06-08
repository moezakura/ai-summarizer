import mongoose, { model, Schema, type Types } from "mongoose";

export interface IUser {
	_id: Types.ObjectId;
	// ユーザー名
	userName: string;
	// ハッシュ化済みのパスワード
	password: string;
	// meta
	meta: {
		createdAt: Date;
	};
}

export const userScheme = new Schema<IUser>({
	id: Schema.Types.UUID,
	// ユーザー名
	userName: { type: String, required: true },
	// ハッシュ化済みのパスワード
	password: { type: String, required: true },
	// meta
	meta: {
		createdAt: { type: Date, default: Date.now },
	},
});

export const User = mongoose.models.user || model<IUser>("user", userScheme);
