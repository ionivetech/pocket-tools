import { computed, onBeforeUnmount, onMounted, ref, type ComputedRef } from "vue";

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
): ComputedRef<string> {
	const narrowMatch = ref(false);
	let media: MediaQueryList | null = null;

	function onMediaChange(event: MediaQueryListEvent): void {
		narrowMatch.value = event.matches;
	}

	onMounted(() => {
		media = window.matchMedia(query);
		narrowMatch.value = media.matches;
		media.addEventListener("change", onMediaChange);
	});

	onBeforeUnmount(() => {
		media?.removeEventListener("change", onMediaChange);
		media = null;
	});

	return computed(() => (narrowMatch.value ? narrow : wide));
}
