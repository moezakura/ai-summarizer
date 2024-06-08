import type { MetaFunction } from "@remix-run/node";
import ArticleList from "~/templates/RssList";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import ArticleItem from "~/templates/ArticleItem";
import { useSearchParams } from "@remix-run/react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import dayjs from "dayjs";

export const meta: MetaFunction = () => {
	return [{ title: "Recommend articles" }];
};

export default function Recommend() {
	const [searchParams] = useSearchParams();
	const itemPanel = useRef<null | HTMLDivElement>(null);
	const [itemPanelWidth, setItemPanelWidth] = useState(0);
	const [targetDate, setTargetDate] = useState<string>(
		dayjs().format("YYYY-MM-DD"),
	);

	const id = () => {
		return searchParams.get("id") ?? undefined;
	};

	const showTargetDate = useMemo(() => {
		// 今日であればtodayと表示する
		if (dayjs().format("YYYY-MM-DD") === targetDate) {
			return "Today";
		}
		// 昨日であればyesterdayと表示する
		if (dayjs().subtract(1, "days").format("YYYY-MM-DD") === targetDate) {
			return "Yesterday";
		}

		// それ以外は日時を表示する
		return dayjs(targetDate).format("YYYY/MM/DD");
	}, [targetDate]);

	const moveDate = (moveDiff: number) => {
		const newDate = dayjs(targetDate).add(moveDiff, "days");
		// 未来は選択できないようにする
		if (dayjs().isBefore(newDate)) {
			return;
		}
		setTargetDate(newDate.format("YYYY-MM-DD"));
	};

	useEffect(() => {
		const id = setInterval(() => {
			if (itemPanel.current === null) {
				return;
			}

			const rect = itemPanel.current.getBoundingClientRect();
			const width = rect.width;
			if (itemPanelWidth === width) {
				return;
			}
			setItemPanelWidth(width);
		}, 1000 / 60);

		return () => {
			clearInterval(id);
		};
	});

	return (
		<div className="h-screen w-full">
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel className="flex flex-col">
					<div className="flex justify-center items-center mt-2">
						<Button
							variant="ghost"
							onClick={() => {
								moveDate(-1);
							}}
						>
							<span className="i-mdi-arrow-left" />
						</Button>
						<div className="mx-3">{showTargetDate}</div>
						<Button
							variant="ghost"
							onClick={() => {
								moveDate(1);
							}}
						>
							<span className="i-mdi-arrow-right" />
						</Button>
					</div>

					<ArticleList kind="recommend" recommendDate={targetDate} />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel>
					<div ref={itemPanel} className="w-full h-full">
						<ScrollArea className="overflow-y-auto h-full">
							<div
								style={{
									width: `${itemPanelWidth}px`,
								}}
							>
								<ArticleItem id={id()} />
							</div>
						</ScrollArea>
					</div>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
