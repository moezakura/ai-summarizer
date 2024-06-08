import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	json,
	redirect,
	useActionData,
	useNavigation,
} from "@remix-run/react";
import { useMemo } from "react";
import { z } from "zod";
import { authTokenCookie } from "~/authCookie";
import { AuthService } from "~/common/domain/auth/AuthService";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

const schema = z.object({
	userName: z.string({ required_error: "User name is required" }),
	userPassword: z.string({ required_error: "User password is required" }),
});

type LoginResult<T> = {
	success: boolean;
	message?: T;
};

export async function action({ request }: ActionFunctionArgs) {
	// formDataを取得する
	const form = await request.formData();

	// formの内容をobjectにする
	const object = Object.fromEntries(form);

	// schemaをもとにobjectをparseする
	const result = schema.safeParse(object);

	// successがfalsyならエラーとして返す
	if (!result.success) {
		const flattenErrors = result.error.flatten();
		const resultJSON: LoginResult<typeof flattenErrors> = {
			success: false,
			message: flattenErrors,
		};
		return json(resultJSON, { status: 400 });
	}

	const jwtSecret = process.env.JWT_SECRET as string;
	const jwtExpireSecondStr = process.env.JWT_EXPIRES_IN_SECONDS as string;
	const jwtExpireSecond = Number.parseInt(jwtExpireSecondStr, 10);

	const authService = new AuthService({
		jwtSecret,
		expiresInSecond: jwtExpireSecond,
	});

	// const created = await authService.register({
	// 	userName: result.data.userName,
	// 	password: result.data.userPassword,
	// });
	// console.log("created", created);

	try {
		// ログインを試行する
		const loginUser = await authService.login({
			userName: result.data.userName,
			password: result.data.userPassword,
		});

		const jwt = await authService.generateAccessToken(loginUser);
		const setCookie = await authTokenCookie.serialize(jwt);
		// cookieにjwtを設定する
		return redirect("/", {
			headers: {
				"Set-Cookie": setCookie,
			},
		});
	} catch (e) {
		console.error("failed to login", e);
		const resultJSON: LoginResult<string> = {
			success: false,
			message: "invalid user name or password",
		};

		return json(resultJSON, { status: 401 });
	}
}

export default function Login() {
	const data = useActionData<typeof action>();
	const navigation = useNavigation();

	const [form, { userName, userPassword }] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
	});

	const errorMessage = useMemo(() => {
		if (data?.success) {
			return;
		}

		// stringならそのまま返す
		if (typeof data?.message === "string") {
			return data.message;
		}

		return JSON.stringify(data?.message);
	}, [data]);

	return (
		<>
			<div className="h-screen w-screen flex justify-center items-center">
				<Card className="w-96">
					<CardHeader>
						<CardTitle>Login</CardTitle>
					</CardHeader>

					<CardContent>
						{errorMessage && (
							<Alert variant="destructive">
								<div className="flex mb-2">
									<span className="i-mdi-alert-outline mr-2" />
									<AlertTitle>Error!!</AlertTitle>
								</div>
								<AlertDescription>{errorMessage}</AlertDescription>
							</Alert>
						)}
					</CardContent>

					<Form method="post" {...getFormProps(form)}>
						<CardContent>
							<div>
								<Input
									autoComplete="off"
									placeholder="User name"
									{...getInputProps(userName, { type: "text" })}
								/>
								{userName.errors && (
									<div>
										{userName.errors.map((e, index) => (
											<p key={index}>{e}</p>
										))}
									</div>
								)}
							</div>
							<div className="mt-2">
								<Input
									autoComplete="off"
									placeholder="User password"
									{...getInputProps(userPassword, { type: "password" })}
								/>
								{userPassword.errors && (
									<div>
										{userPassword.errors.map((e, index) => (
											<p key={index}>{e}</p>
										))}
									</div>
								)}
							</div>
						</CardContent>

						<CardFooter className="flex justify-end">
							<Button type="submit" disabled={navigation.state !== "idle"}>
								{navigation.state !== "idle" ? (
									<div role="status">
										<svg
											aria-hidden="true"
											className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300"
											viewBox="0 0 100 101"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
												fill="currentColor"
											/>
											<path
												d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
												fill="currentFill"
											/>
										</svg>
										<span className="sr-only">Loading...</span>
									</div>
								) : (
									<>Login</>
								)}
							</Button>
						</CardFooter>
					</Form>
				</Card>
			</div>
		</>
	);
}
