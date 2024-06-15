import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { authTokenCookie } from "~/authCookie";
import { auth } from "~/lib/hook/auth";
import { services } from "~/lib/hook/services";

export async function loader(args: LoaderFunctionArgs) {
	const request = args.request;
	const { articleTagService, articleService, authService } = services();
	// ユーザーを取得する
	const cookieHeader = request.headers.get("Cookie");
	const { getUserByCookie } = auth({
		authService,
		cookie: authTokenCookie,
	});
	const user = await getUserByCookie(cookieHeader);

	if (!user || !user._id) {
		return json({ message: "no login" }, { status: 401 });
	}

	const uri = new URL(args.request.url);
	const id = uri.searchParams.get("id");

	if (id === null || id === "") {
		return json({ message: "parameter id is required" }, { status: 400 });
	}

	const item = await articleService.getItem(id, user._id.toHexString());

	// タグを取得する
	const tags = await articleTagService.getArticleTags(
		user._id.toHexString(),
		id,
	);

	return json({
		...item,
		tags: tags.map((tag) => ({
			id: tag._id.toHexString(),
			name: tag.name,
		})),
	});
}
