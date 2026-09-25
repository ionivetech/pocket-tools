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
	<section class="pt-tool-state min-w-0" data-testid="tool-dual-pane" aria-label="Tool workspace">
		<div class="grid gap-6 md:grid-cols-2">
			<section
				class="grid min-w-0 gap-4"
				:aria-labelledby="inputHeadingId"
				data-testid="tool-dual-pane-input"
			>
				<h2 :id="inputHeadingId">{{ inputLabel }}</h2>
				<slot name="input" />
			</section>
			<section
				class="grid min-w-0 gap-4"
				:aria-labelledby="outputHeadingId"
				data-testid="tool-dual-pane-output"
			>
				<h2 :id="outputHeadingId">{{ outputLabel }}</h2>
				<slot name="output" />
			</section>
		</div>
	</section>
</template>
