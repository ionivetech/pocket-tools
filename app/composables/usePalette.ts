import { getCurrentInstance, inject, type InjectionKey } from "vue";

export type PaletteApi = Readonly<{
	open: () => void;
}>;

export const paletteKey: InjectionKey<PaletteApi> = Symbol("pockettools-palette");

const noopPalette: PaletteApi = { open: () => undefined };

/**
 * Opens the global quick-search palette. The provider lives in the default
 * layout so Ctrl/⌘+K works on every page; outside a component setup this is
 * a silent noop so stray callers never crash a page.
 *
 * @example
 * ```ts
 * const { open } = usePalette();
 * ```
 */
export function usePalette(): PaletteApi {
	if (!getCurrentInstance()) {
		return noopPalette;
	}
	return inject(paletteKey, noopPalette);
}
