import dayjs from "dayjs";
import useSWR from "swr";
import { getDiff } from "../getDiff";

export type Article = {
	id: string;
	title: string;
	url: string;
	content?: string;
	summary?: {
		modelName: string;
		text: string;
	}[];
	createdAt: Date;
	read?: boolean;
	view: {
		createdAt: string;
		createdAtDiff: string;
	};
};

export type ArticleWrapper = {
	nextPageID: string;
	prevPageID: string;
	articles: Article[];
};

type ArticleResult = {
	id: string;
	title: string;
	url: string;
	content?: string;
	summary?: {
		modelName: string;
		text: string;
	}[];
	read?: boolean;
	meta: {
		createdAt: Date;
	};
};

export type ArticleRequestKind = "recent" | "recommend";

async function fetcher(key: string) {
	return fetch(key)
		.then((res) => res.json() as Promise<unknown>)
		.then((json): ArticleWrapper => {
			if (json === null) {
				return {
					prevPageID: "",
					nextPageID: "",
					articles: [],
				};
			}
			const typedJSON = json as {
				prevPageID?: string;
				nextPageID?: string;
				items: Array<ArticleResult>;
			};
			const items = (typedJSON.items as Array<ArticleResult>).map((j) => {
				const createdAt = dayjs(j.meta.createdAt);
				const diff = getDiff(createdAt);

				return {
					id: j.id,
					title: j.title,
					url: j.url,
					content: j.content,
					summary: j.summary,
					createdAt: new Date(j.meta.createdAt),
					read: j.read,
					view: {
						createdAt: createdAt.format("YYYY-MM-DD HH:mm"),
						createdAtDiff: diff,
					},
				};
			});

			return {
				prevPageID: typedJSON.prevPageID ?? "",
				nextPageID: typedJSON.nextPageID ?? "",
				articles: items,
			};
		});
}

export const useArticles = (arg: {
	prevPageID?: string;
	nextPageID?: string;
	kind?: ArticleRequestKind;
	recommendTargetDate?: string;
}) => {
	const params = new URLSearchParams();
	if (arg.nextPageID && arg.nextPageID !== "") {
		params.set("next-page-id", arg.nextPageID);
	}
	if (arg.prevPageID && arg.prevPageID !== "") {
		params.set("prev-page-id", arg.prevPageID);
	}

	const key = (() => {
		if (!arg.kind || arg.kind === "recent") {
			return `/api/rss-list?${params.toString()}`;
		}
		if (arg.kind === "recommend") {
			if (arg.recommendTargetDate) {
				params.set("target-date", arg.recommendTargetDate);
			}

			return `/api/recommend-rss-list?${params.toString()}`;
		}
	})();

	const { data, error, isLoading } = useSWR(key, fetcher);

	return {
		data,
		isLoading,
		isError: error,
	};
};
