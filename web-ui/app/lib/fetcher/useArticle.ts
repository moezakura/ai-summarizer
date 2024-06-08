import useSWR from "swr";
import dayjs from "dayjs";
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
	view: {
		createdAt: string;
		createdAtDiff: string;
	};
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
	meta: {
		createdAt: Date;
	};
};

async function fetcher(key: string) {
	return fetch(key)
		.then((res) => res.json() as Promise<unknown>)
		.then((json) => {
			const j = json as ArticleResult;
			const createdAt = dayjs(j.meta.createdAt);
			const diff = getDiff(createdAt);
			return {
				id: j.id,
				title: j.title,
				url: j.url,
				content: j.content,
				summary: j.summary,
				createdAt: new Date(j.meta.createdAt),
				view: {
					createdAt: createdAt.format("YYYY-MM-DD HH:mm"),
					createdAtDiff: diff,
				},
			};
		});
}

export const useArticle = (id: string) => {
	const { data, error, isLoading } = useSWR(`/api/rss-item?id=${id}`, fetcher);

	return {
		article: data,
		isLoading,
		isError: error,
	};
};
