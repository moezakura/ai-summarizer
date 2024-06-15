import type { authTokenCookie } from "~/authCookie";
import type { AuthService } from "~/common/domain/auth/AuthService";
import type { IUser } from "~/common/domain/auth/UserModel";

export type AuthProps = {
	authService: AuthService;
	cookie: typeof authTokenCookie;
};

export function auth(props: AuthProps) {
	const { authService, cookie } = props;

	const getUserByCookie = async (
		cookieHeader: string | null,
	): Promise<IUser> => {
		const authToken = (await cookie.parse(cookieHeader)) ?? "";
		if (!authToken) {
			throw new Error("invalid auth token");
		}

		const user = await authService.getUserByAccessToken(authToken);

		if (!user || !user._id) {
			throw new Error("invalid user");
		}

		return user;
	};

	return {
		getUserByCookie,
	};
}
