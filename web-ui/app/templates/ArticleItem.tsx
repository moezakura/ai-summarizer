import parse from "html-react-parser";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import TagManageToArticle from "~/components/article/TagManageToArticle";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useArticle } from "~/lib/fetcher/useArticle";
import { useShortcuts } from "~/lib/hook/useShortcut";
import { useReads } from "~/lib/useReads";

interface Props {
	id?: string;
}

export default function ArticleItem(props: Props) {
	const { article, isError, isLoading, mutate } = useArticle(props.id ?? "");
	const addReadCache = useReads((state) => state.addRead);
	const readCache = useReads((state) => state.readIds);
	const [tagManageDialog, setTagManageDialog] = useState(false);

	const shortcut = useShortcuts();

	shortcut.add("t", (e) => {
		if (tagManageDialog) {
			return;
		}
		e.preventDefault();
		setTagManageDialog(true);
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [article]);

	const handleUpdateTags = async (newTagIds: string[]) => {
		const submitData = new FormData();
		// selectedTagsの中身をsubmitDataに詰める
		let index = 0;
		for (const id of newTagIds) {
			submitData.append(`tags[${index}]`, id);
			index++;
		}

		const request = await fetch(`/api/article/${article?.id}/tags`, {
			method: "post",
			body: submitData,
		});
		const response = await request.json();
		console.log("update!", response);

		setTagManageDialog(false);
		await mutate();
	};

	if (props.id === undefined) {
		return <div />;
	}

	if (isError) return <div>エラーです</div>;
	if (isLoading) return <div>読み込み中...</div>;

	return (
		<>
			<Card className="border-none pb-12">
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

				<TagManageToArticle
					tagManageDialog={tagManageDialog}
					selectedTags={article?.tags ?? []}
					setTagManageDialog={setTagManageDialog}
					updateTags={handleUpdateTags}
				/>

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

				<Button
					className="absolute left-2.5 bottom-2.5 opacity-100 disabled:opacity-100"
					variant="secondary"
					disabled
				>
					<span className="i-mdi-pan-left mr-2 text-2xl" />
					Prev article
					<Badge className="ml-2">
						<span className="i-mdi-keyboard-outline mr-1" />
						<span className="i-mdi-arrow-left" />
					</Badge>
				</Button>

				<Button
					className="absolute right-2.5 bottom-2.5 opacity-100 disabled:opacity-100"
					variant="secondary"
					disabled
				>
					<Badge className="mr-2">
						<span className="i-mdi-keyboard-outline mr-1" />
						<span className="i-mdi-arrow-right" />
					</Badge>
					Next article
					<span className="i-mdi-pan-right ml-2 text-2xl" />
				</Button>
			</Card>
		</>
	);
}
