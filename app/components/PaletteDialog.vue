<script setup lang="ts">
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import { computed, ref, watch } from "vue";
import { useDialogFocus } from "~/composables/use-dialog-focus";
import { useResponsivePosition } from "~/composables/useResponsivePosition";
import { useToolLibrary } from "~/composables/use-tool-library";
import { tools } from "~/data/tools";
import { fuzzyFilterTools } from "~/utils/fuzzy-search";
import type { Tool } from "~/data/tools";

type PaletteRow =
	| { kind: "tool"; tool: Tool; label: string; hint: string }
	| { kind: "action"; id: string; label: string; hint: string };

const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{
	navigate: [slug: string];
	action: [id: string];
}>();

const query = ref("");
const active = ref(0);
useDialogFocus(open, "home-palette");
const { favoriteSlugs, recentSlugs } = useToolLibrary();

// Modal centered on desktop, bottom sheet on a phone.
const position = useResponsivePosition("center", "bottom", "(max-width: 767px)");

const rankedTools = computed<Tool[]>(() => {
	const q = query.value.trim();
	if (q.length === 0) {
		// Empty query: recents first, then favorites, then the rest.
		const ordered: Tool[] = [];
		const seen = new Set<string>();
		for (const slug of [...recentSlugs.value, ...favoriteSlugs.value]) {
			const tool = tools.find((item) => item.slug === slug);
			if (tool && !seen.has(slug)) {
				ordered.push(tool);
				seen.add(slug);
			}
		}
		for (const tool of tools) {
			if (!seen.has(tool.slug)) ordered.push(tool);
		}
		return ordered.slice(0, 8);
	}
	return fuzzyFilterTools(tools, q).slice(0, 6);
});

const actionRows = computed<PaletteRow[]>(() => {
	const q = query.value.trim().toLowerCase();
	const all: PaletteRow[] = [
		{ kind: "action", id: "home", label: "Go home", hint: "Back to the start" },
		{ kind: "action", id: "library", label: "Open tool library", hint: "Browse every tool" },
		{
			kind: "action",
			id: "theme",
			label: "Toggle light / dark",
			hint: "Keep your eyes comfortable",
		},
		{ kind: "action", id: "shortcuts", label: "Show shortcuts", hint: "Keyboard help (?)" },
	];
	if (q.length === 0) return all;
	return all.filter((row) => row.label.toLowerCase().includes(q));
});

const rows = computed<PaletteRow[]>(() => {
	const toolRows: PaletteRow[] = rankedTools.value.map((tool) => ({
		kind: "tool",
		tool,
		label: tool.name,
		hint: tool.description,
	}));
	// When searching, tools come first; on empty query, suggestions then actions.
	if (query.value.trim().length === 0) return [...toolRows, ...actionRows.value.slice(0, 2)];
	return [...toolRows, ...actionRows.value];
});

const suggestionLabel = computed(() =>
	query.value.trim().length === 0 ? "Suggestions — recent and favorites first" : "Tools",
);

function go(row: PaletteRow): void {
	open.value = false;
	if (row.kind === "tool") emit("navigate", row.tool.slug);
	else emit("action", row.id);
}

function move(step: 1 | -1): void {
	const total = rows.value.length;
	if (total === 0) return;
	active.value = (active.value + step + total) % total;
}

function confirm(): void {
	const row = rows.value[active.value];
	if (row) go(row);
}

watch(query, () => {
	active.value = 0;
});

watch(open, (value) => {
	if (value) {
		query.value = "";
		active.value = 0;
	}
});
</script>

<template>
	<!-- tabindex on the dialog content: the results can overflow on short
		viewports, and axe `scrollable-region-focusable` requires a scrollable
		region to be keyboard reachable. -->
	<Dialog
		v-model:visible="open"
		modal
		:position="position"
		:draggable="false"
		:style="{ width: 'min(38rem, calc(100vw - 2rem))' }"
		class="pt-palette"
		data-testid="home-palette"
		aria-label="Quick search tools and actions"
		:pt="{ content: { tabindex: 0 } }"
	>
		<template #header>
			<div class="pt-palette__search">
				<label class="pt-sr-only" for="palette-search">Search tools by name or task</label>
				<AppIcon name="search" class="pt-palette__search-icon" />
				<InputText
					id="palette-search"
					v-model="query"
					placeholder="Type a task, like “clean text” — try “jsn”"
					autocomplete="off"
					role="combobox"
					aria-expanded="true"
					aria-controls="palette-results"
					:aria-activedescendant="`palette-option-${active}`"
					data-autofocus-target
					data-testid="home-palette-input"
					@keydown.down.prevent="move(1)"
					@keydown.up.prevent="move(-1)"
					@keydown.enter.prevent="confirm"
				/>
			</div>
		</template>

		<p class="pt-palette__section" data-testid="home-palette-section">{{ suggestionLabel }}</p>
		<ul
			id="palette-results"
			class="pt-palette__list"
			role="listbox"
			aria-label="Matching tools and actions"
			data-testid="home-palette-results"
		>
			<li
				v-for="(row, index) in rows"
				:id="`palette-option-${index}`"
				:key="row.kind === 'tool' ? row.tool.slug : `action-${row.id}`"
				role="option"
				:aria-selected="index === active"
				:class="{ 'pt-palette__option--active': index === active }"
				class="pt-palette__option"
				@click="go(row)"
				@mousemove="active = index"
			>
				<span
					v-if="row.kind === 'tool'"
					class="pt-tool-icon"
					:class="`pt-tool-icon--${row.tool.accent}`"
				>
					<AppIcon :name="row.tool.icon" />
				</span>
				<span v-else class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="sparkles" /></span>
				<span class="pt-palette__text">
					<strong>{{ row.label }}</strong>
					<small>{{ row.hint }}</small>
				</span>
			</li>
		</ul>
		<p v-if="rows.length === 0" class="pt-palette__empty">
			No match yet. Try “json”, “text”, or “color” — or browse the full library.
		</p>
		<footer class="pt-palette__footer" aria-hidden="true">
			<span><kbd>↑↓</kbd> move</span>
			<span><kbd>Enter</kbd> open</span>
			<span><kbd>Esc</kbd> close</span>
		</footer>
	</Dialog>
</template>
