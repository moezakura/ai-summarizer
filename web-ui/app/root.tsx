import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLocation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import { Button } from "./components/ui/button";
import { useMemo } from "react";

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
						<div className="h-full w-64">
							<Link to="/">
								<Button
									variant="ghost"
									className="w-full h-14 rounded-none py-2"
								>
									<p className="text-lg text-card-foreground text-left block w-full">
										Recently
									</p>
								</Button>
							</Link>

							<div className="w-full h-px bg-border" />

							<Link to="/recommend">
								<Button
									variant="ghost"
									className="w-full h-14 rounded-none py-2"
								>
									<p className="text-lg text-card-foreground text-left block w-full">
										Daily recommend
									</p>
								</Button>
							</Link>
						</div>

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
