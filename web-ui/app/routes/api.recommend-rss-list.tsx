import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import dayjs from "dayjs";
import { ArticleService } from "~/common/domain/article/ArticleService";

export async function loader(args: LoaderFunctionArgs) {
	const uri = new URL(args.request.url);
	const nextPageID = uri.searchParams.get("next-page-id");
	const prevPageID = uri.searchParams.get("prev-page-id");
	const targetDate =
		uri.searchParams.get("target-date") ?? dayjs().format("YYYY-MM-DD");

	const targetStart = dayjs(targetDate).startOf("date");
	const targetEnd = dayjs(targetDate).endOf("date");

	const articleService = new ArticleService();
	const allItems = await articleService.getList({
		limit: 5000,
		sortKey: "score",
		sortOrder: "desc",
		filter: {
			// 指定された日付に絞り込む
			"meta.createdAt": {
				$gte: targetStart.toDate(),
				$lte: targetEnd.toDate(),
			},
		},
	});

	const limit = 50;
	const items = [];
	if (nextPageID) {
		let pushFlag = false;
		for (const item of allItems) {
			if (item.id === nextPageID) {
				pushFlag = true;
			}
			if (pushFlag) {
				items.push(item);
			}

			if (items.length >= limit) {
				break;
			}
		}
	}
	if (prevPageID) {
		let pushFlag = false;
		for (const item of allItems.reverse()) {
			if (item.id === prevPageID) {
				pushFlag = true;
			}
			if (pushFlag) {
				items.unshift(item);
			}
			if (items.length >= limit) {
				break;
			}
		}
	}
	if (!nextPageID && !prevPageID) {
		items.push(...allItems.slice(0, limit));
	}

	const newPrevPageID = items.at(0)?.id ?? "";
	const newNextPageID = items.at(-1)?.id ?? "";

	return json({
		items,
		prevPageID: newPrevPageID ?? "",
		nextPageID: newNextPageID ?? "",
	});
}
