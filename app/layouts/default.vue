<template>
	<div class="min-h-dvh">
		<a class="pt-skip-link" href="#main-content">Skip to content</a>
		<PwaStatus />
		<slot />
		<Transition name="pt-top">
			<button
				v-if="showTop"
				class="pt-back-to-top"
				type="button"
				aria-label="Back to top"
				data-testid="back-to-top"
				@click="goTop"
			>
				<AppIcon name="arrow-up" />
			</button>
		</Transition>
		<PaletteDialog v-if="paletteOpen" v-model="paletteOpen" @navigate="goPaletteTool" />
	</div>
</template>

<script setup lang="ts">
import PaletteDialog from "~/components/PaletteDialog.vue";
import { paletteKey } from "~/composables/usePalette";

const router = useRouter();
const paletteOpen = ref(false);
const showTop = ref(false);
let reduceMotion = false;

function openPalette(): void {
	paletteOpen.value = true;
}

function goPaletteTool(slug: string): void {
	paletteOpen.value = false;
	void router.push(`/tools/${slug}`);
}

function onGlobalKey(event: KeyboardEvent): void {
	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
		event.preventDefault();
		if (paletteOpen.value) {
			paletteOpen.value = false;
		} else {
			void openPalette();
		}
	}
}

function revealOnScroll(): void {
	showTop.value = true;
}

function goTop(): void {
	window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

provide(paletteKey, { open: openPalette });

onMounted(() => {
	reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	window.addEventListener("keydown", onGlobalKey);
	window.addEventListener("scroll", revealOnScroll, { once: true, passive: true });
});

onBeforeUnmount(() => {
	window.removeEventListener("keydown", onGlobalKey);
	window.removeEventListener("scroll", revealOnScroll);
});
</script>
