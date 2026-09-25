import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";
import { AuraBlue } from "./app/theme/aura-blue";

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	css: ["~/assets/css/main.css", "~/assets/css/primeicons.css"],
	modules: ["@primevue/nuxt-module", "@vite-pwa/nuxt"],
	vite: {
		plugins: [tailwindcss()],
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
		includeAssets: ["icon.svg", "icon-192.png", "icon-512.png", "icon-maskable.svg"],
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
			globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
			navigateFallback: null,
			runtimeCaching: [
				{
					urlPattern: ({ request }) => request.mode === "navigate",
					handler: "NetworkFirst",
					method: "GET",
					options: {
						cacheName: "pockettools-pages",
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
			installPrompt: true,
		},
	},
	app: {
		head: {
			title: "PocketTools",
			htmlAttrs: { lang: "en" },
			meta: [
				{ name: "description", content: "Pocket-sized tools for everyone." },
				{ name: "theme-color", content: "#f6f8fc" },
			],
		},
	},
});
