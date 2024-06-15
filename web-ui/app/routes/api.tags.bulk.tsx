import { parseWithZod } from "@conform-to/zod";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { z } from "zod";
import { authTokenCookie } from "~/authCookie";
import { auth } from "~/lib/hook/auth";
import { services } from "~/lib/hook/services";

export const createSchema = z.object({
	tags: z
		.array(
			z
				.object({
					name: z.string(),
					shortcut: z.string(),
				})
				.partial({
					shortcut: true,
				}),
		)
		.min(1),
});

// TAGを一括追加する
export async function action(args: ActionFunctionArgs) {
	const { authService, articleTagService } = services();
	const request = args.request;
	const cookieHeader = request.headers.get("Cookie");

	// formDataを取得する
	const formData = await request.formData();

	const parsed = await parseWithZod(formData, {
		schema: createSchema,
		async: true,
	});

	if (parsed.status !== "success") {
		console.log("parsed error", parsed.error, parsed);
		// parseに失敗したら400を返す
		return json({ message: "Invalid request" }, { status: 400 });
	}

	const objectParsed = createSchema.safeParse(parsed.payload);
	if (!objectParsed || objectParsed.error) {
		console.log("parsed conform", objectParsed);
		return json({ message: "Invalid request" }, { status: 400 });
	}
	const data = objectParsed.data;
	if (!data) {
		console.log("parsed conform data is not found", objectParsed);
		return json({ message: "Invalid request" }, { status: 400 });
	}

	const { getUserByCookie } = auth({
		authService,
		cookie: authTokenCookie,
	});

	const user = await getUserByCookie(cookieHeader);

	const isExistTag = await articleTagService.isExistsArticleTags({
		userId: user._id.toHexString(),
		names: data.tags.map((tag) => tag.name),
	});
	// すでに存在していたものは除外して追加する
	const targetTags = data.tags.filter((tag) => !isExistTag.get(tag.name));

	// 追加する
	const created = await articleTagService.createArticleTags(
		user._id.toHexString(),
		targetTags.map((tag) => ({
			name: tag.name,
			shortcut: tag.shortcut ?? "",
		})),
	);

	return json(
		{
			tags: created.map((tag) => ({
				...tag,
				userId: user._id.toHexString(),
			})),
		},
		201,
	);
}
