<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from "vue";

withDefaults(
	defineProps<{
		inputLabel?: string;
		outputLabel?: string;
	}>(),
	{
		inputLabel: "Input",
		outputLabel: "Output",
	},
);

const slots = defineSlots<{
	toolbar?: () => unknown;
	input?: () => unknown;
	output?: () => unknown;
	footer?: () => unknown;
}>();

const sectionId = useId();
const inputHeadingId = `tool-input-${sectionId}`;
const outputHeadingId = `tool-output-${sectionId}`;

const drawerOpen = ref(false);
const inlineHost = useTemplateRef<HTMLElement>("inlineHost");
const drawerHost = useTemplateRef<HTMLElement>("drawerHost");
const toolbarNode = useTemplateRef<HTMLElement>("toolbarNode");

let mediaQuery: MediaQueryList | null = null;

function placeToolbar(): void {
	if (!inlineHost.value || !drawerHost.value || !toolbarNode.value) {
		return;
	}
	if (mediaQuery?.matches) {
		drawerHost.value.appendChild(toolbarNode.value);
	} else {
		inlineHost.value.appendChild(toolbarNode.value);
		drawerOpen.value = false;
	}
}

function onMediaChange(): void {
	placeToolbar();
}

watch(drawerOpen, (open) => {
	// The drawer renders its body lazily, so the host may not exist on the
	// first tick after opening: retry on animation frames (bounded) until the
	// toolbar has a home, instead of leaving a tiny empty drawer behind.
	if (open) {
		const started = Date.now();
		const settle = (): void => {
			placeToolbar();
			const parked = toolbarNode.value?.parentElement === drawerHost.value || !drawerHost.value;
			if (!parked && Date.now() - started < 500) {
				requestAnimationFrame(settle);
			}
		};
		requestAnimationFrame(settle);
	}
});

onMounted(() => {
	mediaQuery = window.matchMedia("(max-width: 767px)");
	mediaQuery.addEventListener("change", onMediaChange);
	placeToolbar();
});

onBeforeUnmount(() => {
	mediaQuery?.removeEventListener("change", onMediaChange);
	mediaQuery = null;
});
</script>

<template>
	<section class="pt-workspace" data-testid="tool-dual-pane" aria-label="Tool workspace">
		<div ref="inlineHost" class="pt-workspace__toolbar-host">
			<div
				v-if="slots.toolbar"
				ref="toolbarNode"
				class="pt-workspace__toolbar"
				data-testid="tool-dual-pane-toolbar"
			>
				<slot name="toolbar" />
			</div>
		</div>
		<div class="pt-workspace__body">
			<section
				class="pt-workspace__pane"
				:aria-labelledby="inputHeadingId"
				data-testid="tool-dual-pane-input"
			>
				<h2 :id="inputHeadingId">{{ inputLabel }}</h2>
				<slot name="input" />
			</section>
			<section
				class="pt-workspace__pane pt-workspace__pane--output"
				:aria-labelledby="outputHeadingId"
				data-testid="tool-dual-pane-output"
			>
				<h2 :id="outputHeadingId">{{ outputLabel }}</h2>
				<slot name="output" />
			</section>
		</div>
		<div v-if="slots.footer" class="pt-workspace__footer" data-testid="tool-dual-pane-footer">
			<slot name="footer" />
		</div>
	</section>

	<Button
		v-if="slots.toolbar"
		class="pt-options-fab"
		type="button"
		label="Options"
		aria-label="Open tool options"
		aria-haspopup="dialog"
		data-testid="tool-options-fab"
		@click="drawerOpen = true"
	/>
	<Drawer
		v-model:visible="drawerOpen"
		position="bottom"
		header="Tool options"
		class="pt-options-drawer"
		data-testid="tool-options-drawer"
	>
		<div ref="drawerHost" class="pt-options-drawer__body" />
		<template #footer>
			<Button
				class="pt-options-drawer__done"
				type="button"
				label="Done"
				aria-label="Close tool options"
				data-testid="tool-options-done"
				@click="drawerOpen = false"
			/>
		</template>
	</Drawer>
</template>
