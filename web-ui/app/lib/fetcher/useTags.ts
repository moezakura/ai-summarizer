import useSWR, { useSWRConfig } from "swr";

export type Tags = {
	name: string;
	shortcut: string;
}[];

type TagsResult = {
	tags: {
		id: string;
		name: string;
		shortcut: string;
	}[];
};

async function fetcher(key: string) {
	return fetch(key)
		.then((res) => res.json() as Promise<unknown>)
		.then((json) => {
			const j = json as TagsResult;

			return j.tags.map((r) => {
				return {
					...r,
				};
			});
		});
}

export const useTags = () => {
	const { data, error, isLoading } = useSWR("/api/tags", fetcher);

	const { mutate } = useSWRConfig();
	const customMutate = () => {
		return mutate("/api/tags");
	};

	return {
		tags: data,
		isLoading,
		isError: error,
		mutate: customMutate,
	};
};
