import dayjs from "dayjs";
import useSWR, { useSWRConfig } from "swr";
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
	tags: {
		id: string;
		name: string;
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
				read: j.read,
				tags: j.tags,
				view: {
					createdAt: createdAt.format("YYYY-MM-DD HH:mm"),
					createdAtDiff: diff,
				},
			};
		});
}

export const useArticle = (id: string) => {
	const key = `/api/rss-item?id=${id}`;
	const { data, error, isLoading } = useSWR(key, fetcher);

	const { mutate } = useSWRConfig();
	const customMutate = async () => {
		return await mutate(key);
	};

	return {
		article: data,
		isLoading,
		isError: error,
		mutate: customMutate,
	};
};
