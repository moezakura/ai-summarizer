import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { authTokenCookie } from "~/authCookie";
import { ArticleService } from "~/common/domain/article/ArticleService";
import { AuthService } from "~/common/domain/auth/AuthService";

export async function loader(args: LoaderFunctionArgs) {
	const request = args.request;
	const cookieHeader = request.headers.get("Cookie");
	const cookie = (await authTokenCookie.parse(cookieHeader)) ?? "";
	if (!cookie) {
		return json({ message: "invalid auth token" }, { status: 401 });
	}

	const jwtSecret = process.env.JWT_SECRET as string;
	const jwtExpireSecondStr = process.env.JWT_EXPIRES_IN_SECONDS as string;
	const jwtExpireSecond = Number.parseInt(jwtExpireSecondStr, 10);

	const authService = new AuthService({
		jwtSecret,
		expiresInSecond: jwtExpireSecond,
	});
	const user = await authService.getUserByAccessToken(cookie);

	if (!user || !user._id) {
		return json({ message: "no login" }, { status: 401 });
	}

	const uri = new URL(args.request.url);
	const id = uri.searchParams.get("id");

	if (id === null || id === "") {
		return json({ message: "parameter id is required" }, { status: 400 });
	}

	const articleService = new ArticleService();
	const item = await articleService.getItem(id, user._id.toHexString());

	return json(item);
}
