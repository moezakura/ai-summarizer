import { parseWithZod } from "@conform-to/zod";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { authTokenCookie } from "~/authCookie";
import { auth } from "~/lib/hook/auth";
import { services } from "~/lib/hook/services";

export const createSchema = z.object({
	tags: z.array(z.string()).optional(),
});

export async function action(args: ActionFunctionArgs) {
	const params = args.params;
	// URLからArticleIDを取得する
	const articleId = params.articleId;
	if (!articleId) {
		return json(
			{
				message: "Invalid ID",
			},
			400,
		);
	}

	// 入力を取得する
	const request = args.request;
	const formData = await request.formData();

	// 入力をパースする
	const parsed = await parseWithZod(formData, {
		schema: createSchema,
		async: true,
	});

	if (parsed.status !== "success") {
		return json(
			{
				message: "Invalid object",
			},
			400,
		);
	}

	// 入力をバリデーションする
	const objectParsed = createSchema.safeParse(parsed.payload);
	if (!objectParsed.success) {
		return json(
			{
				message: "Invalid params",
			},
			400,
		);
	}
	const data = objectParsed.data;

	const { articleTagService, authService } = services();

	// ユーザーを取得する
	const cookieHeader = request.headers.get("Cookie");
	const { getUserByCookie } = auth({
		authService,
		cookie: authTokenCookie,
	});
	const user = await getUserByCookie(cookieHeader);

	articleTagService.addArticleTag(
		articleId,
		user._id.toHexString(),
		data.tags ?? [],
	);

	return json({});
}
