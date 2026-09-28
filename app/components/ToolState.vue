<script setup lang="ts">
type ToolStateKind = "empty" | "error" | "loading" | "success" | "offline" | "update";

const props = defineProps<{
	kind: ToolStateKind;
	title: string;
	message: string;
	actionLabel?: string;
}>();

const emit = defineEmits<{
	action: [];
}>();

const stateRole = computed(() => (props.kind === "error" ? "alert" : "status"));
const stateLive = computed(() => (props.kind === "error" ? "assertive" : "polite"));
</script>

<template>
	<section
		class="pt-tool-state"
		:class="`pt-tool-state--${props.kind}`"
		data-testid="tool-state"
		:data-kind="props.kind"
		:role="stateRole"
		:aria-live="stateLive"
		:aria-busy="props.kind === 'loading' ? 'true' : undefined"
		aria-atomic="true"
	>
		<div class="pt-tool-state__copy">
			<h2>{{ props.title }}</h2>
			<p>{{ props.message }}</p>
		</div>
		<Button
			v-if="props.actionLabel"
			class="pt-tool-state__action"
			type="button"
			:label="props.actionLabel"
			:aria-label="props.actionLabel"
			data-testid="tool-state-action"
			@click="emit('action')"
		/>
	</section>
</template>
