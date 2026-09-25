import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";
import { AuraBlue } from "./app/theme/aura-blue";

const precacheBudgetBytes = 512 * 1024;

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
			routes: [
				"/",
				"/tools",
				"/tools/json-formatter",
				"/tools/password-generator",
				"/tools/color-picker",
				"/tools/text-cleaner",
			],
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
