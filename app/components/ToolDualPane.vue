<script setup lang="ts">
import { useId } from "vue";

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

const sectionId = useId();
const inputHeadingId = `tool-input-${sectionId}`;
const outputHeadingId = `tool-output-${sectionId}`;
</script>

<template>
	<section class="pt-workspace" data-testid="tool-dual-pane" aria-label="Tool workspace">
		<div v-if="$slots.toolbar" class="pt-workspace__toolbar" data-testid="tool-dual-pane-toolbar">
			<slot name="toolbar" />
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
		<div v-if="$slots.footer" class="pt-workspace__footer" data-testid="tool-dual-pane-footer">
			<slot name="footer" />
		</div>
	</section>
</template>
