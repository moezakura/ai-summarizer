import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { authTokenCookie } from "~/authCookie";
import { auth } from "~/lib/hook/auth";
import { services } from "~/lib/hook/services";

// TAGを取得する
export async function loader(args: LoaderFunctionArgs) {
	const { authService, articleTagService } = services();
	const request = args.request;
	const cookieHeader = request.headers.get("Cookie");

	const { getUserByCookie } = auth({
		authService,
		cookie: authTokenCookie,
	});

	const user = await getUserByCookie(cookieHeader);

	const tags = await articleTagService.getArticleTagsByUserId(
		user._id.toHexString(),
	);

	return json({
		tags,
	});
}
