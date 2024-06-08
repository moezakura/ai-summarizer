import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import { Button } from "./components/ui/button";

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesheet },
];
//~~~~~~~~~~~~~
export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="dark">
				<div className="flex ">
					<div className="h-full w-75">
						<Link to="/">
							<Button variant="ghost" className="w-full h-14 rounded-none py-2">
								<span className="text-lg text-card-foreground">Recently</span>
							</Button>
						</Link>

						<div className="w-full h-px bg-border" />

						<Link to="/recommend">
							<Button variant="ghost" className="w-full h-14 rounded-none py-2">
								<span className="text-lg text-card-foreground">
									Daily recommend
								</span>
							</Button>
						</Link>
					</div>

					<div className="border-l">{children}</div>
				</div>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
