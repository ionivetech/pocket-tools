import { describe, expect, test } from "bun:test";
import {
	createResponsivePosition,
	type MediaQueryLike,
} from "../../app/composables/responsive-position";

/** Minimal stand-in for `MediaQueryList` so the wiring is testable without a DOM. */
function fakeMedia(initial: boolean) {
	let listener: ((event: { matches: boolean }) => void) | undefined;
	const media: MediaQueryLike = {
		matches: initial,
		addEventListener: (_type, next) => {
			listener = next;
		},
		removeEventListener: (_type, next) => {
			if (listener === next) {
				listener = undefined;
			}
		},
	};
	return {
		media,
		fire: (matches: boolean) => listener?.({ matches }),
		attached: () => listener !== undefined,
	};
}

describe("createResponsivePosition", () => {
	test("resolves the wide or narrow value from a match", () => {
		const state = createResponsivePosition("center", "bottom");
		expect(state.resolve(false)).toBe("center");
		expect(state.resolve(true)).toBe("bottom");
	});

	test("reports the current value and every later change", () => {
		const state = createResponsivePosition("center", "bottom");
		const query = fakeMedia(false);
		const seen: string[] = [];

		const stop = state.observe(query.media, (value) => seen.push(value));
		query.fire(true);
		query.fire(false);
		stop();
		query.fire(true);

		expect(seen).toEqual(["bottom", "center"]);
	});

	test("detach stops reporting", () => {
		const state = createResponsivePosition("center", "bottom");
		const query = fakeMedia(true);
		const seen: string[] = [];

		state.observe(query.media, (value) => seen.push(value))();
		expect(query.attached()).toBe(false);
		expect(seen).toEqual([]);
	});
});
