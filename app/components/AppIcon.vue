<script setup lang="ts">
import type { AppIconName } from "~/data/tools";

const props = withDefaults(defineProps<{ name: AppIconName; size?: number }>(), {
	size: 18,
});

const iconPaths: Record<AppIconName, readonly string[]> = {
	"align-left": ["M4 6h16M4 10h11M4 14h16M4 18h9"],
	"arrow-left": ["M20 12H4m6-6-6 6 6 6"],
	"arrow-right": ["M4 12h16m-6-6 6 6-6 6"],
	"arrow-up": ["M12 20V4m-6 6 6-6 6 6"],
	"arrow-up-right": ["M5 19 19 5m-8 0h8v8"],
	bars: ["M4 7h16M4 12h16M4 17h16"],
	"check-circle": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "m8 12 2.5 2.5L16 9"],
	"circle-fill": ["M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"],
	code: ["m8 9-3 3 3 3m8-6 3 3-3 3m-3-9-2 12"],
	"exclamation-circle": ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 8v5", "M12 16h.01"],
	lock: ["M6 10h12v10H6z", "M8 10V7a4 4 0 0 1 8 0v3"],
	moon: ["M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"],
	palette: [
		"M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h3a6 6 0 0 0 6-6c0-2.2-4-4-9-4Z",
		"M7.5 10h.01M9 7.5h.01M14 7h.01M17 9h.01",
	],
	refresh: [
		"M20 11a8 8 0 0 0-14.7-3L4 10",
		"M4 5v5h5",
		"M4 13a8 8 0 0 0 14.7 3L20 14",
		"M20 19v-5h-5",
	],
	search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z", "m16 16 5 5"],
	shield: ["M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z", "m9 12 2 2 4-4"],
	sparkles: [
		"m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z",
		"m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z",
	],
	star: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"],
	"star-fill": ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"],
	sun: [
		"M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
		"M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
	],
	times: ["m6 6 12 12M18 6 6 18"],
	wifi: [
		"M3 8.5a14 14 0 0 1 18 0",
		"M6.5 12a8.5 8.5 0 0 1 11 0",
		"M10 15.5a3.5 3.5 0 0 1 4 0",
		"M12 19h.01",
	],
};

const paths = computed(() => iconPaths[props.name]);
const filled = computed(() => props.name === "star-fill" || props.name === "circle-fill");
</script>

<template>
	<svg
		class="pt-icon"
		:width="props.size"
		:height="props.size"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path
			v-for="(path, index) in paths"
			:key="`${props.name}-${index}`"
			:d="path"
			:fill="filled ? 'currentColor' : 'none'"
		/>
	</svg>
</template>
