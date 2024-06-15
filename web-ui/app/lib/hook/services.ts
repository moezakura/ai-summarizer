import { ArticleService } from "~/common/domain/article/ArticleService";
import { ArticleTagsService } from "~/common/domain/article/ArticleTagsService";
import { AuthService } from "~/common/domain/auth/AuthService";

const jwtSecret = process.env.JWT_SECRET as string;
const jwtExpireSecondStr = process.env.JWT_EXPIRES_IN_SECONDS as string;
const jwtExpireSecond = Number.parseInt(jwtExpireSecondStr, 10);

// 認証に関わるサービス
const authService = new AuthService({
	jwtSecret,
	expiresInSecond: jwtExpireSecond,
});

// 記事に関わるサービス
const articleService = new ArticleService();

// 記事のタグに関わるサービス
const articleTagService = new ArticleTagsService();

export function services() {
	return {
		authService,
		articleService,
		articleTagService,
	};
}
