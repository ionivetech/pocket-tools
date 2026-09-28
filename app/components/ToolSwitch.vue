<script setup lang="ts">
import ToggleSwitch from "primevue/toggleswitch";

const model = defineModel<boolean>({ required: true });

defineProps<{
	label: string;
	testid: string;
}>();
</script>

<template>
	<label class="pt-switch">
		<span class="pt-switch__label">{{ label }}</span>
		<span class="pt-switch__control" :data-testid="testid">
			<ToggleSwitch v-model="model" :aria-label="label" />
		</span>
	</label>
</template>
