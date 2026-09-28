<script setup lang="ts">
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed, ref, useId } from "vue";
import { countText, runTextCleaner } from "./logic";
import type { TextCaseTransform } from "./schema";

const text = ref("");
const trim = ref(true);
const collapseWhitespace = ref(true);
const caseTransform = ref<TextCaseTransform>("none");

const caseOptions: readonly { label: string; value: TextCaseTransform }[] = [
	{ label: "Keep as-is", value: "none" },
	{ label: "UPPERCASE", value: "upper" },
	{ label: "lowercase", value: "lower" },
	{ label: "Title Case", value: "title" },
	{ label: "Sentence case", value: "sentence" },
];

const componentId = useId();
const inputId = `text-cleaner-input-${componentId}`;

const cleaned = computed(() =>
	runTextCleaner({
		text: text.value,
		trim: trim.value,
		collapseWhitespace: collapseWhitespace.value,
		caseTransform: caseTransform.value,
	}),
);
const outputText = computed(() => (cleaned.value.ok ? cleaned.value.value.result : ""));
const counts = computed(() => (cleaned.value.ok ? cleaned.value.value.counts : countText("")));
const isEmpty = computed(() => text.value.trim() === "");
</script>

<template>
	<ToolDualPane input-label="Text to clean" output-label="Cleaned result">
		<template #input>
			<label class="pt-field-label" :for="inputId">Paste or type text</label>
			<Textarea
				:id="inputId"
				v-model="text"
				rows="14"
				class="pt-cleaner-textarea"
				placeholder="Paste text here"
				data-testid="text-cleaner-input"
			/>

			<div class="pt-cleaner-options">
				<Button
					type="button"
					label="Trim line edges"
					:aria-pressed="trim"
					:outlined="!trim"
					data-testid="text-cleaner-trim"
					@click="trim = !trim"
				/>
				<Button
					type="button"
					label="Collapse spaces"
					:aria-pressed="collapseWhitespace"
					:outlined="!collapseWhitespace"
					data-testid="text-cleaner-collapse"
					@click="collapseWhitespace = !collapseWhitespace"
				/>
				<Select
					v-model="caseTransform"
					:options="[...caseOptions]"
					option-label="label"
					option-value="value"
					aria-label="Change letter case"
					data-testid="text-cleaner-case"
				/>
			</div>
		</template>

		<template #output>
			<ul class="pt-cleaner-counts" aria-label="Text counts" data-testid="text-cleaner-counts">
				<li>
					<strong>{{ counts.words }}</strong> words
				</li>
				<li>
					<strong>{{ counts.characters }}</strong> characters
				</li>
				<li>
					<strong>{{ counts.charactersNoSpaces }}</strong> without spaces
				</li>
				<li>
					<strong>{{ counts.lines }}</strong> lines
				</li>
			</ul>

			<Textarea
				readonly
				rows="14"
				class="pt-cleaner-textarea"
				:model-value="outputText"
				aria-label="Cleaned text result"
				data-testid="text-cleaner-output"
			/>

			<ToolActions :value="outputText" filename="cleaned-text.txt" :disabled="isEmpty" />
		</template>
	</ToolDualPane>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-cleaner-textarea {
	width: 100%;
}

.pt-cleaner-options {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
}

.pt-cleaner-counts {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	list-style: none;
	padding: 0;
	margin: 0;
	color: var(--pt-muted);
	font-size: 0.875rem;
}

.pt-cleaner-counts strong {
	color: var(--pt-ink);
}
</style>
