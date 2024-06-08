import mongoose from "mongoose";

/**
 * mongoDBのコネクションを設定する
 * @param uri 設定するコネクションURI (mongodb://localhost:27017/test_db)
 */
export async function getMongoConnection(uri: string) {
	await mongoose.connect(uri);
}
