import { useEffect } from "react";

type ShortcutEventFunc = (event: KeyboardEvent) => void;
type ShortcutEnvet = {
	ignoreInputs: boolean;
	func: ShortcutEventFunc;
};

type ShortcutOption = {
	ignoreInputs: boolean;
};

export function useShortcuts() {
	const events = new Map<string, ShortcutEnvet>();

	const keyDownEvent = (event: KeyboardEvent) => {
		const action = events.get(event.key);
		if (!action) {
			return;
		}
		console.log("key", event.key, action);

		// 入力ソースがinput/textareaだったら何もしない
		if (
			!action.ignoreInputs &&
			["input", "textarea"].includes(
				(event.target as Element).tagName.toLowerCase(),
			)
		) {
			return;
		}

		action.func(event);
	};

	// documetにKeyDownを登録する
	useEffect(() => {
		document.addEventListener("keydown", keyDownEvent);
		return () => document.removeEventListener("keydown", keyDownEvent);
	});

	const add = (
		key: string,
		func: ShortcutEventFunc,
		options?: ShortcutOption,
	) => {
		if (events.has(key)) {
			throw new Error("same key is already registered");
		}

		events.set(key, {
			func,
			ignoreInputs: options?.ignoreInputs ?? false,
		});
	};

	const remove = (key: string) => {
		if (!events.has(key)) {
			return;
		}
		events.delete(key);
	};

	return {
		add,
		remove,
	};
}
