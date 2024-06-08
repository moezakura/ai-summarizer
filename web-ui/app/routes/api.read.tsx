import { type ActionFunctionArgs, json } from "@remix-run/node";
import { authTokenCookie } from "~/authCookie";
import { ArticleReadService } from "~/common/domain/article/ArticleReadService";
import { AuthService } from "~/common/domain/auth/AuthService";

type ArticleReadResult = {
	success: boolean;
	message?: string;
};

export async function action(args: ActionFunctionArgs) {
	// HTTPで受け取ったリクエスト
	const request = args.request;

	// HTTP cookie
	const cookieHeader = request.headers.get("Cookie");
	// authToken
	const cookie = (await authTokenCookie.parse(cookieHeader)) ?? "";

	// authTokenが取得できなければ401
	if (!cookie) {
		const result: ArticleReadResult = {
			success: false,
			message: "not login header",
		};
		return json(result, { status: 401 });
	}

	// 設定値を読み取る
	const jwtSecret = process.env.JWT_SECRET as string;
	const jwtExpireSecondStr = process.env.JWT_EXPIRES_IN_SECONDS as string;
	const jwtExpireSecond = Number.parseInt(jwtExpireSecondStr, 10);

	// authService
	const authService = new AuthService({
		jwtSecret,
		expiresInSecond: jwtExpireSecond,
	});

	// authTokenからUSERIDを復号する
	const user = await authService.getUserByAccessToken(cookie);

	// USERIDがなければ401
	if (!user || !user._id) {
		const result: ArticleReadResult = {
			success: false,
			message: "not login",
		};
		return json(result, { status: 401 });
	}

	// HTTPがPATCHでなければ405
	if (request.method !== "PATCH") {
		const result: ArticleReadResult = {
			success: false,
			message: "method not allowed",
		};
		return json(result, { status: 405 });
	}

	// URLをパース
	const url = new URL(request.url);
	// URLからarticleのIDを取得
	const articleID = url.searchParams.get("id") ?? "";
	// BodyからBooleanを取得
	const readFlag = await (async () => {
		const body = await request.text();
		switch (body) {
			case "true":
				return true;
			case "false":
				return false;
			default:
				return null;
		}
	})();

	if (readFlag === null) {
		const result: ArticleReadResult = {
			success: false,
			message: "body is invalid",
		};
		return json(result, { status: 405 });
	}

	// articleの既読を管理するサービス
	const articleReadService = new ArticleReadService();

	try {
		if (readFlag) {
			// 指定された記事を既読にする
			await articleReadService.read(articleID, user._id.toHexString());
		} else {
			// 指定された記事を既読を外す
			await articleReadService.unRead(articleID, user._id.toHexString());
		}
		const result: ArticleReadResult = {
			success: true,
			message: "ok",
		};
		return json(result, { status: 200 });
	} catch (e) {
		console.error("faield to read/unread", e);
	}

	const result: ArticleReadResult = {
		success: false,
		message: "internal server error",
	};
	return json(result, { status: 500 });
}
