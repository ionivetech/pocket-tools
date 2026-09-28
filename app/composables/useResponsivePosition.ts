import { onBeforeUnmount, onMounted, shallowRef, type ShallowRef } from "vue";
import { createResponsivePosition } from "./responsive-position";

/**
 * Tracks a media query and returns the value to use above and below the
 * breakpoint. PrimeVue `Dialog` only sizes itself through `breakpoints`, so
 * its position has to follow the viewport in JavaScript.
 *
 * @example
 * ```ts
 * const position = useResponsivePosition("center", "bottom");
 * ```
 */
export function useResponsivePosition(
	wide: string,
	narrow: string,
	query = "(max-width: 767px)",
): ShallowRef<string> {
	const state = createResponsivePosition(wide, narrow);
	const current = shallowRef(state.resolve(false));
	let stop: (() => void) | null = null;

	onMounted(() => {
		const media = window.matchMedia(query);
		current.value = state.resolve(media.matches);
		stop = state.observe(media, (value) => {
			current.value = value;
		});
	});

	onBeforeUnmount(() => {
		stop?.();
		stop = null;
	});

	return current;
}
