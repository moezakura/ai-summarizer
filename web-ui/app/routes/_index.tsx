import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { authTokenCookie } from "~/authCookie";
import { AuthService } from "~/common/domain/auth/AuthService";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/components/ui/resizable";
import { ScrollArea } from "~/components/ui/scroll-area";
import ArticleItem from "~/templates/ArticleItem";
import ArticleList from "~/templates/RssList";

export const meta: MetaFunction = () => {
	return [
		{ title: "Recently articles" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const cookieHeader = request.headers.get("Cookie");
	const cookie = (await authTokenCookie.parse(cookieHeader)) ?? "";

	if (!cookie) {
		return redirect("/login?no-cookie");
	}

	try {
		const jwtSecret = process.env.JWT_SECRET as string;
		const jwtExpireSecondStr = process.env.JWT_EXPIRES_IN_SECONDS as string;
		const jwtExpireSecond = Number.parseInt(jwtExpireSecondStr, 10);

		const authService = new AuthService({
			jwtSecret,
			expiresInSecond: jwtExpireSecond,
		});
		const user = await authService.getUserByAccessToken(cookie);

		if (!user || !user._id) {
			return redirect("/login?no-user");
		}
	} catch (e) {
		console.error("failed to check to login", e);
		return redirect("/login?fail");
	}

	return json({}, 200);
}

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
