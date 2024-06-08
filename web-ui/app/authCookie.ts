import { createCookie } from "@remix-run/node";

const jwtExpireSecondStr = process.env.JWT_EXPIRES_IN_SECONDS as string;
const jwtExpireSecond = Number.parseInt(jwtExpireSecondStr, 10);

export const authTokenCookie = createCookie("auth_token", {
	maxAge: jwtExpireSecond,
	path: "/",
});
