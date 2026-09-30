<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { detectPasteTools, type PasteSuggestion } from "~/utils/paste-detect";

const props = defineProps<{ pastedText: string }>();
const emit = defineEmits<{ dismiss: [] }>();

const dismissed = ref(false);
const optOut = ref(false);

const suggestions = computed<PasteSuggestion[]>(() =>
	dismissed.value || optOut.value ? [] : detectPasteTools(props.pastedText),
);

watch(
	() => props.pastedText,
	() => {
		dismissed.value = false;
	},
);

function disableForever(): void {
	try {
		localStorage.setItem("pockettools-paste-optout", "1");
	} catch {
		// Best-effort only.
	}
	optOut.value = true;
	emit("dismiss");
}

function dismiss(): void {
	dismissed.value = true;
	emit("dismiss");
}

try {
	optOut.value = localStorage.getItem("pockettools-paste-optout") === "1";
} catch {
	optOut.value = false;
}
</script>

<template>
	<div
		v-if="suggestions.length > 0"
		class="pt-paste-suggest"
		role="status"
		aria-live="polite"
		data-testid="paste-suggest"
	>
		<AppIcon name="sparkles" />
		<p>
			<strong>{{ suggestions[0]?.reason }}.</strong>
			<NuxtLink :to="`/tools/${suggestions[0]?.toolSlug}`">
				{{ suggestions[0]?.label }}
			</NuxtLink>
		</p>
		<div class="pt-paste-suggest__actions">
			<Button type="button" label="Dismiss" size="small" text @click="dismiss" />
			<Button type="button" label="Don't suggest again" size="small" text @click="disableForever" />
		</div>
	</div>
</template>
