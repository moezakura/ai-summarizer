import type { LinksFunction } from "@remix-run/node";
import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from "@remix-run/react";
import { useMemo } from "react";
import stylesheet from "~/tailwind.css?url";
import { Button } from "./components/ui/button";

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];
//~~~~~~~~~~~~~
export function Layout({ children }: { children: React.ReactNode }) {
	const location = useLocation();

	const hideSidebar = useMemo(() => {
		console.log(location.pathname);
		return location.pathname === "/login";
	}, [location]);

	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="dark">
				{hideSidebar ? (
					<>{children}</>
				) : (
					<div className="flex">
						<nav className="h-full w-64">
							<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
								<span className="i-mdi-star-check" />
								<span className="ml-2">AI Summarized</span>
							</div>

							<Link
								to="/"
								className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
							>
								<span className="i-mdi-clock-time-eight-outline" />
								Recently
							</Link>
							<Link
								to="/recommend"
								className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
							>
								<span className="i-mdi-calendar-today-outline" />
								Daily recommend
							</Link>
						</nav>

						<div className="border-l flex-1 w-auto">{children}</div>
					</div>
				)}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
