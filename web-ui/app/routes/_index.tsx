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
import { useEffect, useRef, useState } from "react";

export const meta: MetaFunction = () => {
	return [
		{ title: "Recently articles" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export default function Index() {
	const [searchParams] = useSearchParams();
	const itemPanel = useRef<null | HTMLDivElement>(null);
	const [itemPanelWidth, setItemPanelWidth] = useState(0);

	const id = () => {
		return searchParams.get("id") ?? undefined;
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
				<ResizablePanel>
					<ArticleList />
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
