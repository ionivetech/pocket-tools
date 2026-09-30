import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";
import { listHistory, recordHistory } from "~/utils/tool-history";

export function restoreEventName(toolSlug: string): string {
	return `pockettools:restore:${toolSlug}`;
}

/**
 * Records successful tool runs to local history (debounced).
 * Guards empty input/output and consecutive duplicates.
 *
 * @example
 * ```ts
 * useToolHistoryRecorder("json-formatter", text, outputText);
 * ```
 */
export function useToolHistoryRecorder(
	toolSlug: string,
	input: Ref<string>,
	output: Ref<string>,
): void {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const flush = () => {
		const rawInput = input.value;
		const rawOutput = output.value;
		if (rawInput.trim().length < 3 || rawOutput.length === 0) return;
		const last = listHistory(toolSlug)[0];
		if (last?.input === rawInput && last?.output === rawOutput) return;
		recordHistory(toolSlug, { input: rawInput, output: rawOutput });
	};

	const stop = watch(
		output,
		() => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(flush, 1500);
		},
		{ flush: "post" },
	);

	function onRestore(event: Event): void {
		const detail = (event as CustomEvent<string>).detail;
		if (typeof detail === "string") input.value = detail;
	}

	onMounted(() => {
		window.addEventListener(restoreEventName(toolSlug), onRestore);
	});

	onBeforeUnmount(() => {
		if (timer) clearTimeout(timer);
		stop();
		window.removeEventListener(restoreEventName(toolSlug), onRestore);
	});
}

/**
 * Asks the mounted tool component to restore an input value.
 *
 * @example
 * ```ts
 * requestHistoryRestore("json-formatter", '{"a":1}');
 * ```
 */
export function requestHistoryRestore(toolSlug: string, input: string): void {
	window.dispatchEvent(new CustomEvent(restoreEventName(toolSlug), { detail: input }));
}
