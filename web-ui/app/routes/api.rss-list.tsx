import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { ArticleService } from "~/common/domain/article/ArticleService";

export async function loader(args: LoaderFunctionArgs) {
	const uri = new URL(args.request.url);
	const nextPageID = uri.searchParams.get("next-page-id");
	const prevPageID = uri.searchParams.get("prev-page-id");

	const sortOption = {
		key: undefined,
		order: undefined,
	};
	if (!nextPageID && !prevPageID) {
		sortOption.key = "_id";
		sortOption.order = "desc";
	}

	const articleService = new ArticleService();
	let items = await articleService.getList({
		limit: 100,
		nextOffsetId: nextPageID ?? undefined,
		prevOffcetId: prevPageID ?? undefined,
		sortKey: sortOption.key,
		sortOrder: sortOption.order,
	});

	if (prevPageID) {
		items = items.reverse();
	}

	const newPrevPageID = items.at(0)?.id ?? "";
	const newNextPageID = items.at(-1)?.id ?? "";

	return json({
		items,
		prevPageID: newPrevPageID ?? "",
		nextPageID: newNextPageID ?? "",
	});
}
