import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { ArticleService } from "~/common/domain/article/ArticleService";

export async function loader(args: LoaderFunctionArgs) {
	const uri = new URL(args.request.url);
	const id = uri.searchParams.get("id");

	if (id === null || id === "") {
		return json({ message: "parameter id is required" }, { status: 400 });
	}

	const articleService = new ArticleService();
	const item = await articleService.getItem(id);

	return json(item);
}
