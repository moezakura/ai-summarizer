import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

export function getDiff(date: Dayjs): string {
	const diffSec = dayjs().unix() - date.unix();

	// 1時間未満であれば分表示
	if (diffSec < 3600) {
		const diffMinute = Math.floor(diffSec / 60);
		return `${diffMinute}m ago`;
	}

	// 24時間未満であれば時間表示
	if (diffSec < 3600 * 24) {
		const diffHour = Math.floor(diffSec / 3600);
		return `${diffHour}h ago`;
	}

	// どれでもなければ日表示
	const diffDay = Math.floor(diffSec / 3600 / 24);
	return `${diffDay}d ago`;
}
