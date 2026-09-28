/** The slice of `MediaQueryList` this composable needs, so tests can supply a fake. */
export type MediaQueryLike = Readonly<{
	matches: boolean;
	addEventListener: (type: "change", listener: (event: { matches: boolean }) => void) => void;
	removeEventListener: (type: "change", listener: (event: { matches: boolean }) => void) => void;
}>;

/**
 * Position state that follows a media query. Split out of the Vue composable
 * so the wiring can be unit-tested without a DOM.
 *
 * @example
 * ```ts
 * const state = createResponsivePosition("center", "bottom");
 * const stop = state.observe(fakeMedia, (value) => console.log(value)); // "center"
 * ```
 */
export function createResponsivePosition(
	wide: string,
	narrow: string,
): Readonly<{
	/** The value for the query's current match. */
	resolve: (matches: boolean) => string;
	/** Observes the query, reporting every change; returns the disposer. */
	observe: (media: MediaQueryLike, onChange: (value: string) => void) => () => void;
}> {
	const resolve = (matches: boolean): string => (matches ? narrow : wide);

	return {
		resolve,
		observe(media, onChange) {
			const listener = (event: { matches: boolean }) => {
				onChange(resolve(event.matches));
			};
			media.addEventListener("change", listener);
			return () => media.removeEventListener("change", listener);
		},
	};
}
