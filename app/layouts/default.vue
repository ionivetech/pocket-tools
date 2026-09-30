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
		<PaletteDialog
			v-if="paletteOpen"
			v-model="paletteOpen"
			@navigate="goPaletteTool"
			@action="runPaletteAction"
		/>
		<ShortcutHelp v-if="helpOpen" v-model="helpOpen" />
	</div>
</template>

<script setup lang="ts">
import PaletteDialog from "~/components/PaletteDialog.vue";
import ShortcutHelp from "~/components/ShortcutHelp.vue";
import { paletteKey } from "~/composables/usePalette";

const router = useRouter();
const route = useRoute();
const paletteOpen = ref(false);
const helpOpen = ref(false);
const showTop = ref(false);
let reduceMotion = false;
let invoker: HTMLElement | null = null;
let pendingKey: string | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;

function openPalette(): void {
	invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	paletteOpen.value = true;
}

function closePaletteRestore(): void {
	paletteOpen.value = false;
	if (invoker && document.contains(invoker)) invoker.focus();
	invoker = null;
}

function goPaletteTool(slug: string): void {
	closePaletteRestore();
	void router.push(`/tools/${slug}`);
}

function runPaletteAction(id: string): void {
	closePaletteRestore();
	if (id === "home") void router.push("/");
	else if (id === "library") void router.push("/tools");
	else if (id === "theme") toggleTheme();
	else if (id === "shortcuts") helpOpen.value = true;
}

const { toggleTheme } = useTheme();

function isTypingContext(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function onGlobalKey(event: KeyboardEvent): void {
	const lower = event.key.toLowerCase();

	if ((event.metaKey || event.ctrlKey) && lower === "k") {
		event.preventDefault();
		if (paletteOpen.value) closePaletteRestore();
		else openPalette();
		return;
	}

	if (event.key === "Escape") {
		if (helpOpen.value) helpOpen.value = false;
		return;
	}

	if (isTypingContext(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

	if (event.key === "/") {
		event.preventDefault();
		const search =
			document.querySelector<HTMLInputElement>('[data-testid="home-search-input"]') ??
			document.querySelector<HTMLInputElement>('[data-testid="tools-search-input"]');
		search?.focus();
		return;
	}

	if (event.key === "?") {
		event.preventDefault();
		helpOpen.value = true;
		return;
	}

	if (lower === "g") {
		pendingKey = "g";
		if (pendingTimer) clearTimeout(pendingTimer);
		pendingTimer = setTimeout(() => {
			pendingKey = null;
		}, 800);
		return;
	}

	if (pendingKey === "g" && (lower === "h" || lower === "t")) {
		pendingKey = null;
		if (pendingTimer) clearTimeout(pendingTimer);
		void router.push(lower === "h" ? "/" : "/tools");
		return;
	}

	pendingKey = null;
}

function revealOnScroll(): void {
	showTop.value = true;
}

function openHelp(): void {
	helpOpen.value = true;
}

function goTop(): void {
	window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

provide(paletteKey, { open: openPalette });

watch(paletteOpen, (value) => {
	if (!value && invoker && document.contains(invoker)) {
		invoker.focus();
		invoker = null;
	}
});

onMounted(() => {
	reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	window.addEventListener("keydown", onGlobalKey);
	window.addEventListener("scroll", revealOnScroll, { once: true, passive: true });
	window.addEventListener("pockettools:open-shortcuts", openHelp);
	// Keep the current route visible for tests that assert app readiness.
	document.documentElement.dataset.route = route.path;
});

onBeforeUnmount(() => {
	window.removeEventListener("keydown", onGlobalKey);
	window.removeEventListener("scroll", revealOnScroll);
	window.removeEventListener("pockettools:open-shortcuts", openHelp);
	if (pendingTimer) clearTimeout(pendingTimer);
});
</script>
