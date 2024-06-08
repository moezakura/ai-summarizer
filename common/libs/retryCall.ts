export type CallFunction<T> = () => T | Promise<T>;

export async function retryCall<T>(call: CallFunction<T>, retry: number) {
	for (let i = 0; i < retry; i++) {
		try {
			return await call();
		} catch (e) {
			console.warn(e);
			console.warn("retry", i);
		}
	}

	throw new Error("retry over");
}
