import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";
import { generatedToolSlugs } from "./app/data/tool-routes.generated";
import { AuraBlue } from "./app/theme/aura-blue";

// Phase 0 measured 512 KiB for the shell alone. Phase 2 adds four real tools; each tool's
// PrimeVue components (Select, InputNumber, Textarea) are imported locally inside that
// tool's own lazy ToolComponent.vue rather than globally via `primevue.components.include`,
// so they land in that tool's chunk instead of every route's initial payload. Total precache
// still grows with real tool content: measured 598.2 KiB on 2026-09-28, commit range from
// 07b3f59. Re-measure and raise again, deliberately, as more tools land.
// ADR 001 (2026-09-28) adds CodeMirror 6 to the lazy json-formatter chunk: precache measured
// 951.2 KiB, largest single chunk 223.8 KiB (under the 256 KiB per-file cap, so the JSON
// tool still works offline). Budget raised to 1024 KiB on that evidence.
// ADR 002 (2026-09-28) adds Dialog (palette), Toast, and ToggleSwitch to lazy chunks:
// precache measured 1025.6 KiB, per-file max unchanged. Budget raised to 1088 KiB.
// Measured 2026-09-30 (Phase 4, 12 tools): ~1094 KiB with lazy tool CSS
// excluded below; marginal cost ≈ 2–3 KiB JS per tool. A 22-tool catalog
// projects ≈ 1110–1120 KiB. Re-measure at Phase 5 PWA polish; a bump past
// this needs the same per-tool accounting, never a blind raise.
const precacheBudgetBytes = 1160 * 1024;

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	css: ["~/assets/css/main.css"],
	modules: ["@primevue/nuxt-module", "@vite-pwa/nuxt"],
	vite: {
		plugins: [tailwindcss()],
	},
	nitro: {
		compressPublicAssets: true,
		prerender: {
			routes: ["/", "/tools", ...generatedToolSlugs.map((slug) => `/tools/${slug}`)],
		},
	},
	routeRules: {
		"/**": {
			headers: {
				"Content-Security-Policy":
					"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'",
				"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
				"Referrer-Policy": "strict-origin-when-cross-origin",
				"X-Content-Type-Options": "nosniff",
				"X-Frame-Options": "DENY",
			},
		},
	},
	primevue: {
		autoImport: false,
		components: {
			// ponytail: Textarea/Select/InputNumber/Message are used by exactly one tool's
			// lazy-loaded ToolComponent.vue each, so they are imported locally in those files
			// instead of listed here. The PrimeVue Nuxt module registers `include`d components
			// globally, which bundles them into every route's initial payload (this repo's home
			// page JS budget e2e test caught the 27 KiB regression from adding them here);
			// importing them inside the already-lazy tool component keeps them in that tool's
			// own chunk instead.
			include: ["Button", "InputText", "Drawer"],
		},
		options: {
			theme: {
				preset: AuraBlue,
				options: {
					darkModeSelector: ".app-dark",
				},
			},
		},
	},
	pwa: {
		registerType: "prompt",
		injectRegister: "auto",
		manifest: {
			name: "PocketTools",
			short_name: "PocketTools",
			description: "Pocket-sized tools for everyone.",
			theme_color: "#1d4ed8",
			background_color: "#f6f8fc",
			display: "standalone",
			start_url: "/",
			icons: [
				{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
				{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
				{ src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
			],
		},
		workbox: {
			navigateFallback: undefined,
			globPatterns: [
				"offline.html",
				"manifest.webmanifest",
				"icon.svg",
				"icon-192.png",
				"icon-512.png",
				"icon-maskable.svg",
				"theme-bootstrap.js",
				"**/_nuxt/*.{js,css}",
			],
			// Tool CSS is precached anyway, which is the point of ignoring it: Nuxt
			// names these assets after the component (`ToolComponent.<hash>.css`),
			// so the pattern is matchable by name. Tool JS is NOT matchable —
			// Nuxt emits hash-only chunk names (`2uch8Usm.js`) with no component
			// name in them, so there is no glob for it. Verified against
			// `.output/public/_nuxt` on 2026-09-30: 20 dot-named ToolComponent CSS
			// files, zero matching JS. The JS half of this list used to be
			// `**/ToolComponent.*.js`, which matched nothing and read as if it
			// worked. Tool JS is excluded by `maximumFileSizeToCacheInBytes` and
			// served on demand from pockettools-assets (CacheFirst) instead.
			globIgnores: ["**/ToolComponent.*.css"],
			maximumFileSizeToCacheInBytes: 256 * 1024,
			manifestTransforms: [
				(entries) => {
					const totalBytes = entries.reduce((total, entry) => total + entry.size, 0);
					if (totalBytes > precacheBudgetBytes) {
						throw new Error(
							`PWA precache is ${(totalBytes / 1024).toFixed(1)} KiB; budget is ${precacheBudgetBytes / 1024} KiB`,
						);
					}
					return { manifest: entries };
				},
			],
			runtimeCaching: [
				{
					urlPattern: ({ request }) => request.mode === "navigate",
					handler: "NetworkFirst",
					method: "GET",
					options: {
						cacheName: "pockettools-pages",
						// `app/utils/url-state.ts` will put tool state in the query, but no
						// route reads the query yet, so all query variants of a path serve
						// the same response. Keying by path keeps that from fragmenting this
						// 12-entry cache once it does.
						matchOptions: { ignoreSearch: true },
						plugins: [
							{
								cacheKeyWillBeUsed: async ({ request }) => {
									const url = new URL(request.url);
									url.search = "";
									return url.toString();
								},
							},
						],
						cacheableResponse: { statuses: [0, 200] },
						expiration: { maxEntries: 12, maxAgeSeconds: 86_400 },
						networkTimeoutSeconds: 3,
						precacheFallback: { fallbackURL: "/offline.html" },
					},
				},
				{
					urlPattern: ({ request }) =>
						["style", "script", "font", "image"].includes(request.destination),
					handler: "CacheFirst",
					options: {
						cacheName: "pockettools-assets",
						cacheableResponse: { statuses: [0, 200] },
						expiration: { maxEntries: 60, maxAgeSeconds: 2_592_000 },
					},
				},
			],
			cleanupOutdatedCaches: true,
			skipWaiting: false,
			clientsClaim: true,
		},
		devOptions: {
			enabled: false,
		},
		client: {
			registerPlugin: process.env.NODE_ENV !== "development",
			installPrompt: true,
		},
	},
	devServerHandlers: [
		{
			route: "/dev-sw.js",
			handler: () => new Response(null, { status: 204 }),
		},
	],
	app: {
		head: {
			title: "PocketTools",
			htmlAttrs: { lang: "en" },
			meta: [
				{ name: "description", content: "Pocket-sized tools for everyone." },
				{ name: "theme-color", content: "#f6f8fc" },
			],
			script: [{ src: "/theme-bootstrap.js", type: "text/javascript" }],
		},
	},
});
