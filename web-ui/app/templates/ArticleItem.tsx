import parse from "html-react-parser";
import { useEffect } from "react";
import Markdown from "react-markdown";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useArticle } from "~/lib/fetcher/useArticle";
import { useReads } from "~/lib/useReads";

interface Props {
	id?: string;
}

export default function ArticleItem(props: Props) {
	const { article, isError, isLoading } = useArticle(props.id ?? "");
	const addReadCache = useReads((state) => state.addRead);
	const readCache = useReads((state) => state.readIds);

	useEffect(() => {
		if (!article) {
			return;
		}
		// 既読であれば何もしない
		if (article.read) {
			return;
		}
		(async (articleId: string) => {
			// 既読を付ける
			const req = await fetch(`/api/read?id=${articleId}`, {
				method: "PATCH",
				body: "true",
			});
			await req.text();
			// readCacheに含まれていなければaddReadCacheで追加する
			const hasCache = readCache.includes(articleId);
			if (!hasCache) {
				addReadCache(articleId);
			}
		})(article.id);
	}, [article]);

	if (props.id === undefined) {
		return <div />;
	}

	if (isError) return <div>エラーです</div>;
	if (isLoading) return <div>読み込み中...</div>;

	return (
		<>
			<Card className="border-none">
				<CardHeader>
					<a href={article?.url} target="_blank" rel="noreferrer">
						<CardTitle>
							<p className="text-center">{article?.title}</p>
						</CardTitle>
						<CardDescription className="mt-2">
							<p className="ml-auto mr-0 text-right">{article?.url}</p>
							<p className="ml-auto mr-0 text-right">
								{article?.view.createdAt} ({article?.view.createdAtDiff})
							</p>
						</CardDescription>
					</a>
				</CardHeader>
				{article?.summary ? (
					<CardContent>
						<Tabs defaultValue="article_aya:35b" className="w-full">
							<div className="flex items-center">
								<p className="font-bold">AIによる要約</p>
								<TabsList className="ml-auto">
									{article?.summary?.map((as) => {
										return (
											<TabsTrigger
												key={`tab__${props.id}__${as.modelName}`}
												value={`article_${as.modelName}`}
											>
												{as.modelName}
											</TabsTrigger>
										);
									})}
								</TabsList>
							</div>
							<div className="w-full h-px bg-border my-3" />

							{article?.summary?.map((as) => {
								return (
									<TabsContent
										value={`article_${as.modelName}`}
										key={`tab-item__${props.id}__${as.modelName}`}
									>
										<Markdown className="break-all whitespace-break-spaces">
											{as.text}
										</Markdown>
									</TabsContent>
								);
							})}
						</Tabs>
					</CardContent>
				) : (
					<CardContent>
						<p className="font-bold">AIによる要約</p>
						<p className="text-center">AIによる要約はまだありません。</p>
					</CardContent>
				)}
				<CardContent>
					<p className="font-bold">フィードの情報</p>
					<div className="w-full h-px bg-border my-3" />
					<div className="break-all break-words">
						{parse(article?.content ?? "")}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
