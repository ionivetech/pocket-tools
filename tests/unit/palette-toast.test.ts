import { describe, expect, test } from "bun:test";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { paletteKey, usePalette, type PaletteApi } from "../../app/composables/usePalette";

describe("usePalette", () => {
	test("returns the provided opener inside the layout", async () => {
		let opened = false;
		const api: PaletteApi = {
			open: () => {
				opened = true;
			},
		};
		let resolved: PaletteApi | undefined;
		const app = createSSRApp({
			setup() {
				resolved = usePalette();
				return () => h("div");
			},
		});
		app.provide(paletteKey, api);
		await renderToString(app);
		expect(resolved).toBe(api);
		resolved?.open();
		expect(opened).toBe(true);
	});

	test("returns a callable noop outside a component setup", () => {
		const { open } = usePalette();
		expect(() => open()).not.toThrow();
	});
});

describe("primevue-toast plugin", () => {
	test("registers ToastService on the Vue app", async () => {
		const used: unknown[] = [];
		(globalThis as Record<string, unknown>).defineNuxtPlugin = (
			setup: (nuxtApp: unknown) => void,
		) => {
			setup({ vueApp: { use: (plugin: unknown) => used.push(plugin) } });
			return {};
		};

		await import("../../app/plugins/primevue-toast");
		const ToastService = (await import("primevue/toastservice")).default;
		expect(used).toEqual([ToastService]);

		delete (globalThis as Record<string, unknown>).defineNuxtPlugin;
	});
});
