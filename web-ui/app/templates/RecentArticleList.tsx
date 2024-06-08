import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { type Article, useArticles } from "~/lib/fetcher/useArticles";
import { Link, useNavigate, useSearchParams } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";

export default function ArticleList() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const articleListDOM = useRef<null | HTMLDivElement>(null);
	const scrollAreaRef = useRef<null | HTMLDivElement>(null);
	const [cacheArticles, setCacheArticles] = useState<Article[]>([]);

	const id = useMemo(() => {
		return searchParams.get("id") ?? undefined;
	}, [searchParams]);

	const [nextPageID, setNextPageID] = useState("");
	const [prevPageID, setPrevPageID] = useState("");

	const { data, isError, isLoading } = useArticles({
		nextPageID,
		prevPageID,
	});

	useEffect(() => {
		if (!id) {
			return;
		}
		setNextPageID(id);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const newArticles = (() => {
			if (data?.articles.at(0)?.id === nextPageID) {
				return [...cacheArticles, ...(data?.articles ?? [])];
			}
			return [...(data?.articles ?? []), ...cacheArticles];
		})();
		const articleMap = new Map(newArticles.map((item) => [item.id, item]));

		setCacheArticles(Array.from(articleMap.values()));
	}, [data]);

	useEffect(() => {
		if (!data) {
			return;
		}
		// 現在のIndexを探す
		const currentIndex = cacheArticles.findIndex(
			(article) => article.id === id,
		);

		console.log("currentIndex", currentIndex);

		if (currentIndex === -1) {
			return;
		}

		// currentIndexが0ならば前のデータを読み込む
		if (currentIndex === 0) {
			console.log("first more load");
			setNextPageID("");
			setPrevPageID(cacheArticles[currentIndex].id);
		}
		// currentIndexが最後ならば次のデータを読み込む
		if (currentIndex === cacheArticles.length - 1) {
			console.log("end more load");
			setPrevPageID("");
			setNextPageID(cacheArticles[currentIndex].id);
		}
	}, [data, id]);

	useEffect(() => {
		const body = document.body;
		const func = (e: KeyboardEvent) => {
			const key = e.key;
			if (key !== "ArrowRight" && key !== "ArrowLeft") {
				return;
			}
			const moveIndexMapping = {
				ArrowLeft: -1,
				ArrowRight: 1,
			};

			const moveIndex = moveIndexMapping[e.key as "ArrowRight" | "ArrowLeft"];

			// 現在のIndexを探す
			const currentIndex = cacheArticles.findIndex(
				(article) => article.id === id,
			);

			const nextIndex = currentIndex + moveIndex;
			// 範囲外のIndexなら終わる
			if (nextIndex < 0 || cacheArticles.length <= nextIndex) {
				return;
			}
			const nextId = cacheArticles[nextIndex].id;
			searchParams.set("id", nextId);
			navigate({ search: searchParams.toString() });
		};
		body.addEventListener("keydown", func);

		return () => {
			body.removeEventListener("keydown", func);
		};
	});

	useEffect(() => {
		// 現在のIndexを探す
		const currentIndex = cacheArticles.findIndex(
			(article) => article.id === id,
		);
		const listDOM = articleListDOM.current;
		const currentSelectedDOM = listDOM?.children.item(currentIndex);
		if (!listDOM || !currentSelectedDOM || !scrollAreaRef.current) {
			return;
		}
		// currentSelectedDOMがlistDOMの表示範囲になければスクロールする
		const listDOMHeight = scrollAreaRef.current.offsetHeight;
		const listDOMScrollY = listDOM.scrollTop;

		const currentSelectedDOMTop =
			currentSelectedDOM.getBoundingClientRect().top;

		if (
			listDOMScrollY > currentSelectedDOMTop ||
			listDOMScrollY + listDOMHeight < currentSelectedDOMTop
		) {
			currentSelectedDOM.scrollIntoView({
				block: "start",
				behavior: "smooth",
			});
		}
	}, [id, data]);

	// if (isLoading) return <div>読み込み中...</div>;
	if (isError) return <div>failed to load</div>;

	return (
		<ScrollArea className="overflow-y-auto h-full py-4" ref={scrollAreaRef}>
			<div ref={articleListDOM}>
				{(cacheArticles ?? []).map((a: Article) => {
					return (
						<div key={a.id}>
							<Link to={`/?id=${a.id}`}>
								<Card
									className={`border-none rounded-none ${
										id === a.id ? "bg-opacity-40 bg-indigo-600" : ""
									}`}
								>
									<CardHeader className="px-4 py-1">
										<CardTitle className="text-sm">{a.title}</CardTitle>
										<CardDescription className="text-xs">
											{a.url}
										</CardDescription>
									</CardHeader>
									<CardFooter className="mt-1">
										<div className="flex">
											{(a.summary ?? []).map((s) => {
												return (
													<Card
														key={`summary-chip__${a.id}__${s.modelName}`}
														className="bg-transparent mr-2 px-2 text-xs"
													>
														{s.modelName}
													</Card>
												);
											})}
										</div>
										<p className="ml-auto mr-0 text-xs">
											{a.view.createdAtDiff} ({a.view.createdAt})
										</p>
									</CardFooter>
								</Card>
							</Link>

							<div className="w-full h-px bg-border" />
						</div>
					);
				})}
			</div>
		</ScrollArea>
	);
}
