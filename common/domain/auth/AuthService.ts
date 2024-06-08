import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { type IUser, User } from "./UserModel";

export type AuthServiceInitRequest = {
	// jwtのシークレット
	jwtSecret: string;
	// jwtの有効期限(second)
	expiresInSecond: number;
};

export type LoginRequest = {
	// ユーザー名
	userName: string;
	// パスワード
	password: string;
	// saltRound
	saltRounds?: number;
};

export type RegisterRequest = {
	// ユーザー名
	userName: string;
	// パスワード
	password: string;
};

// 認証サービス
export class AuthService {
	// jwtのシークレット
	private jwtSecret: string;
	// jwtのを有効期限(second)
	private expiresInSecond: number;

	constructor(initRequest: AuthServiceInitRequest) {
		this.jwtSecret = initRequest.jwtSecret;
		this.expiresInSecond = initRequest.expiresInSecond;
	}

	async login(loginRequest: LoginRequest): Promise<IUser> {
		// 対象のユーザー名からユーザーを取得
		const user = await User.findOne({ userName: loginRequest.userName });

		// ハッシュ化したパスワードとUserのパスワードが一致するか検査
		const isPasswordCorrect = await bcrypt.compare(
			loginRequest.password,
			user?.password ?? "",
		);

		if (isPasswordCorrect) {
			return user;
		}

		// 一致しなければ例外
		throw new Error("failed to login");
	}

	// アクセストークンを発行する (JWT)
	async generateAccessToken(user: IUser): Promise<string> {
		console.log("user", user);
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			// userID
			id: user._id.toHexString(),
			// userName
			userName: user.userName,
			// issued at
			iat: now,
		};

		return jwt.sign(payload, this.jwtSecret, {
			algorithm: "HS256",
			expiresIn: this.expiresInSecond,
		});
	}

	async register(registerRequest: RegisterRequest): Promise<IUser> {
		console.log("register request", registerRequest);
		const passwordHash = await bcrypt.hash(registerRequest.password, 8);

		// userNameのかぶりがないかチェック
		const isUserNameDuplicated = await User.countDocuments({
			userName: registerRequest.userName,
		});
		if (isUserNameDuplicated > 0) {
			throw new Error("user name is already registered");
		}

		// Userを生成
		const targetUser = new User({
			userName: registerRequest.userName,
			password: passwordHash,
		});
		const user = await targetUser.save();

		return user;
	}

	async getUserByAccessToken(accessToken: string): Promise<IUser> {
		// JWTをデコック
		const decoded = jwt.verify(accessToken, this.jwtSecret);
		if (!decoded) {
			throw new Error("invalid access token");
		}

		// 期限をチェック
		const exp = (decoded as { exp?: number }).exp;
		if (!exp || exp < Math.floor(Date.now() / 1000)) {
			throw new Error("access token is expired");
		}

		const id = (decoded as { id?: string }).id;
		if (!id) {
			throw new Error("invalid access token (id not found)");
		}

		// Userを検索
		const user = await User.findById(id);
		if (!user) {
			throw new Error("user not found");
		}

		return user;
	}
}
