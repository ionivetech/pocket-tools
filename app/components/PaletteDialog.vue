<script setup lang="ts">
import Drawer from "primevue/drawer";
import InputText from "primevue/inputtext";
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { filterTools } from "~/data/tool-search";
import { tools } from "~/data/tools";

const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{
	navigate: [slug: string];
}>();

const query = ref("");
const active = ref(0);
const input = useTemplateRef<{ $el?: HTMLElement }>("input");

const matches = computed(() =>
	filterTools(tools, { query: query.value, category: "All" }).slice(0, 8),
);

function go(slug: string): void {
	open.value = false;
	emit("navigate", slug);
}

function move(step: 1 | -1): void {
	const total = matches.value.length;
	if (total === 0) {
		return;
	}
	active.value = (active.value + step + total) % total;
}

function confirm(): void {
	const tool = matches.value[active.value];
	if (tool) {
		go(tool.slug);
	}
}

function focusInput(): void {
	nextTick(() => {
		const element = input.value?.$el;
		if (element instanceof HTMLInputElement) {
			element.focus();
		}
	});
}

watch(query, () => {
	active.value = 0;
});

onMounted(() => {
	focusInput();
});
</script>

<template>
	<Drawer
		v-model:visible="open"
		position="bottom"
		data-testid="home-palette"
		aria-label="Quick search tools"
	>
		<template #header>
			<div class="pt-palette__search">
				<label class="pt-sr-only" for="palette-search">Search tools by name or task</label>
				<AppIcon name="search" class="pt-palette__search-icon" />
				<InputText
					id="palette-search"
					ref="input"
					v-model="query"
					placeholder="Type a task, like “clean text”"
					autocomplete="off"
					role="combobox"
					aria-expanded="true"
					aria-controls="palette-results"
					:aria-activedescendant="`palette-option-${active}`"
					data-testid="home-palette-input"
					@keydown.down.prevent="move(1)"
					@keydown.up.prevent="move(-1)"
					@keydown.enter.prevent="confirm"
				/>
			</div>
		</template>

		<ul
			id="palette-results"
			class="pt-palette__list"
			role="listbox"
			aria-label="Matching tools"
			data-testid="home-palette-results"
		>
			<li
				v-for="(tool, index) in matches"
				:id="`palette-option-${index}`"
				:key="tool.slug"
				role="option"
				:aria-selected="index === active"
				:class="{ 'pt-palette__option--active': index === active }"
				class="pt-palette__option"
				@click="go(tool.slug)"
				@mousemove="active = index"
			>
				<span class="pt-tool-icon" :class="`pt-tool-icon--${tool.accent}`">
					<AppIcon :name="tool.icon" />
				</span>
				<span class="pt-palette__text">
					<strong>{{ tool.name }}</strong>
					<small>{{ tool.description }}</small>
				</span>
			</li>
		</ul>
		<p v-if="matches.length === 0" class="pt-palette__empty">
			No tool matches that yet. Try “json”, “text”, or “uuid”.
		</p>
	</Drawer>
</template>
