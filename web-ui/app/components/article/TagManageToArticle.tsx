import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { useTags } from "~/lib/fetcher/useTags";
import { useShortcuts } from "~/lib/hook/useShortcut";

export const createSchema = z.object({
	tags: z
		.array(
			z.object({
				name: z.string(),
				shortcut: z.string().optional(),
			}),
		)
		.min(1),
});

type TagManageToArticleProps = {
	tagManageDialog: boolean;
	selectedTags: { id: string; name: string }[];
	setTagManageDialog: (value: boolean) => void;
	updateTags: (newTagIds: string[]) => void;
};

export default function TagManageToArticle(props: TagManageToArticleProps) {
	const shortcut = useShortcuts();
	const [createTags, setCreateTags] = useState<string[]>([]);
	const { tags, isError, isLoading, mutate } = useTags();
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const manageTagForm = useRef<HTMLFormElement | null>(null);

	shortcut.add("a", (e) => {
		if (!props.tagManageDialog) {
			return;
		}
		e.preventDefault();
		addTag();
	});
	shortcut.add(
		"Enter",
		(e) => {
			if (!props.tagManageDialog || !e.ctrlKey || !manageTagForm.current) {
				return;
			}
			e.preventDefault();
			submit(manageTagForm.current);
		},
		{
			ignoreInputs: true,
		},
	);

	useEffect(() => {
		// ダイアログを閉じるときに入力フォームを初期化する
		if (props.tagManageDialog) {
			return;
		}
		setCreateTags([]);
	}, [props.tagManageDialog]);

	useEffect(() => {
		// 親で選択されている物が変更されたら追従する
		setSelectedTags(props.selectedTags.map((tag) => tag.id));
	}, [props.selectedTags]);

	useEffect(() => {
		if (!tags) {
			return;
		}

		// ショートカットを持っているTags
		const shortcutTags = tags.filter((tag) => tag.shortcut);
		// shortcutを削除して登録し直す
		for (const tag of shortcutTags) {
			shortcut.remove(tag.shortcut);
			shortcut.add(tag.shortcut, (e) => {
				e.preventDefault();
				handleTagShortcut(tag.id);
			});
		}
	}, [shortcut, tags]);

	const addTag = () => {
		// 空のタグを1つ追加する
		setCreateTags([...createTags, ""]);
	};

	const removeTag = (index: number) => {
		// 指定したIndexのタグを削除する
		const newCreateTags = [...createTags];
		newCreateTags.splice(index, 1);
		setCreateTags(newCreateTags);
	};

	const changeValue = (index: number, value: string) => {
		const newCreateTags = [...createTags];
		newCreateTags[index] = value;
		setCreateTags(newCreateTags);
	};

	const formSubmitHandle = (event: SubmitEvent) => {
		event.preventDefault();
		const submitForm = event.target as HTMLFormElement;
		submit(submitForm);
	};

	const submit = async (submitForm: HTMLFormElement) => {
		// 値が空入力項目を除去する
		const nonEmptyCreateTags = createTags.filter((value) => value !== "");
		// 値の重複を除去する
		const uniqueCreateTags = [...new Set(nonEmptyCreateTags)];
		setCreateTags(uniqueCreateTags);

		// 空入力項目が除去された物を取得する
		const formData = await (async () => {
			for (let i = 0; i < 100; i++) {
				// フォームのデータ
				const formData = new FormData(submitForm);
				const formObject = Object.fromEntries(formData.entries());
				// 空の物がないか検査, 空の物があればcontine
				if (Object.values(formObject).some((value) => value === "")) {
					// 30msまつ
					await new Promise((resolve) => setTimeout(resolve, 30));
					continue;
				}
				return formData;
			}
		})();
		if (!formData) {
			return;
		}

		const itemCount = Array.from(formData.keys()).length;
		if (itemCount > 0) {
			// tagを作成する
			const request = await fetch("/api/tags/bulk", {
				method: "POST",
				headers: {
					ContentType: "application/x-www-form-urlencoded",
				},
				body: formData,
			});
			const response = (await request.json()) as {
				tags: {
					id: string;
				}[];
			};
			await mutate();
			setCreateTags([]);
			setSelectedTags((current) => [
				...current,
				...response.tags.map((t) => t.id),
			]);

			console.log(response);
		}

		props.updateTags(selectedTags);
	};

	const handleRemoveTag = (removeTagId: string) => {
		const newTagIds = selectedTags.filter((tagId) => tagId !== removeTagId);
		props.updateTags(newTagIds);
	};

	const handleTagShortcut = (id: string) => {
		if (!props.tagManageDialog) {
			return;
		}
		// すでにチェック済みか
		const isChecked = selectedTags.includes(id);
		if (isChecked) {
			// すでにチェック済みなら外す
			const newSelectedTags = selectedTags.filter(
				(selectedTag) => selectedTag !== id,
			);
			setSelectedTags(newSelectedTags);
		} else {
			// 未チェックならONにする
			setSelectedTags([...selectedTags, id]);
		}
	};

	const handleTagChange = (checked: boolean, id: string) => {
		if (checked) {
			setSelectedTags([...selectedTags, id]);
			return;
		}
		setSelectedTags(selectedTags.filter((tag) => tag !== id));
	};

	if (isLoading) return <div>loading...</div>;
	if (isError) return <div>error</div>;

	return (
		<>
			<CardContent className="flex">
				{props.selectedTags.map((tag) => (
					<Card className="bg-transparent mr-2 pl-3 font-bold" key={tag.id}>
						{tag.name}
						<Button
							className="ml-1"
							variant="ghost"
							size="sm"
							onClick={() => handleRemoveTag(tag.id)}
						>
							<span className="i-mdi-close" />
						</Button>
					</Card>
				))}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<Button
								className=""
								variant="ghost"
								size="sm"
								onClick={() => props.setTagManageDialog(true)}
							>
								<span className="i-mdi-plus" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								Add tags
								<Badge className="ml-2" variant="secondary">
									<span className="i-mdi-keyboard-outline mr-1" />T
								</Badge>
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</CardContent>

			<Dialog
				open={props.tagManageDialog}
				onOpenChange={(open) => props.setTagManageDialog(open)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Manage tags</DialogTitle>
						<DialogDescription>
							<form
								className="mt-4"
								ref={manageTagForm}
								onSubmit={formSubmitHandle}
							>
								{tags?.map((t) => (
									<div className="flex items-center space-x-2 mt-2" key={t.id}>
										<Checkbox
											id={t.id}
											checked={selectedTags.includes(t.id)}
											onCheckedChange={(e) => handleTagChange(e, t.id)}
										/>
										<label
											htmlFor={t.id}
											className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										>
											{t.name}
											{t.shortcut && (
												<Badge className="ml-2" variant="secondary">
													<span className="i-mdi-keyboard-outline mr-1" />
													{t.shortcut}
												</Badge>
											)}
										</label>
									</div>
								))}
								{createTags.map((tag, index) => (
									<div
										key={`create_tag_${
											// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
											index
										}`}
										className="flex items-center space-x-2 mt-2"
									>
										<Input
											placeholder="Add tag"
											value={tag}
											onChange={(e) => {
												changeValue(index, e.target.value);
											}}
											name={`tags[${index}].name`}
										/>
										{(tags?.length ?? 0) + index < 10 && (
											<input
												name={`tags[${index}].shortcut`}
												value={`${((tags?.length ?? 0) + 1 + index) % 10}`}
												type="hidden"
											/>
										)}
										<Button
											variant="secondary"
											size="sm"
											type="button"
											onClick={() => {
												removeTag(index);
											}}
										>
											<span className="i-mdi-close" />
										</Button>
									</div>
								))}
								<div className="flex items-center mt-4">
									<Button
										className="mx-auto w-full"
										variant="secondary"
										size="sm"
										type="button"
										onClick={() => addTag()}
									>
										<span className="i-mdi-plus mr-1" />
										<span>
											Add a new Tag
											<Badge className="ml-2">
												<span className="i-mdi-keyboard-outline mr-1" />A
											</Badge>
										</span>
									</Button>
								</div>
								<div className="flex justify-end mt-4">
									<Button type="submit">
										Save
										<Badge variant="secondary" className="ml-2">
											<span className="i-mdi-apple-keyboard-control" />
											Enter
										</Badge>
									</Button>
								</div>
							</form>
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</>
	);
}
