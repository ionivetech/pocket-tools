<script setup lang="ts">
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed, ref, useId } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { countText, readingTimeLabel, runTextCleaner } from "./logic";
import type { TextCaseTransform, TextLineEnding } from "./schema";

const text = ref("");
const trim = ref(true);
const collapseWhitespace = ref(true);
const caseTransform = ref<TextCaseTransform>("none");
const removeEmptyLines = ref(false);
const removeDuplicateLines = ref(false);
const lineEnding = ref<TextLineEnding>("keep");
const stripHtml = ref(false);

const caseOptions: readonly { label: string; value: TextCaseTransform }[] = [
	{ label: "Keep as-is", value: "none" },
	{ label: "UPPERCASE", value: "upper" },
	{ label: "lowercase", value: "lower" },
	{ label: "Title Case", value: "title" },
	{ label: "Sentence case", value: "sentence" },
];

const lineEndingOptions: readonly { label: string; value: TextLineEnding }[] = [
	{ label: "Keep line breaks", value: "keep" },
	{ label: "LF (Unix)", value: "lf" },
	{ label: "CRLF (Windows)", value: "crlf" },
];

const componentId = useId();
const inputId = `text-cleaner-input-${componentId}`;
const caseId = `text-cleaner-case-${componentId}`;
const lineEndingId = `text-cleaner-line-ending-${componentId}`;

const cleaned = computed(() =>
	runTextCleaner({
		text: text.value,
		trim: trim.value,
		collapseWhitespace: collapseWhitespace.value,
		caseTransform: caseTransform.value,
		removeEmptyLines: removeEmptyLines.value,
		removeDuplicateLines: removeDuplicateLines.value,
		lineEnding: lineEnding.value,
		stripHtml: stripHtml.value,
	}),
);
const outputText = computed(() => (cleaned.value.ok ? cleaned.value.value.result : ""));

useToolHistoryRecorder("text-cleaner", text, outputText);
const counts = computed(() => (cleaned.value.ok ? cleaned.value.value.counts : countText("")));
const readingTime = computed(() => readingTimeLabel(counts.value.words));
const removedChars = computed(() => [...text.value].length - [...outputText.value].length);
const isEmpty = computed(() => text.value.trim() === "");
</script>

<template>
	<ToolDualPane input-label="Text to clean" output-label="Cleaned result">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Spacing</legend>
				<div class="pt-option-group__controls">
					<ToolSwitch v-model="trim" label="Trim line edges" testid="text-cleaner-trim" />
					<ToolSwitch
						v-model="collapseWhitespace"
						label="Collapse spaces"
						testid="text-cleaner-collapse"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Lines</legend>
				<div class="pt-option-group__controls">
					<ToolSwitch
						v-model="removeEmptyLines"
						label="Remove empty lines"
						testid="text-cleaner-empty-lines"
					/>
					<ToolSwitch
						v-model="removeDuplicateLines"
						label="Remove duplicate lines"
						testid="text-cleaner-duplicate-lines"
					/>
					<label class="pt-sr-only" :for="lineEndingId">Line breaks</label>
					<Select
						:id="lineEndingId"
						v-model="lineEnding"
						:options="[...lineEndingOptions]"
						option-label="label"
						option-value="value"
						aria-label="Line breaks"
						data-testid="text-cleaner-line-ending"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Words</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="caseId">Change letter case</label>
					<Select
						:id="caseId"
						v-model="caseTransform"
						:options="[...caseOptions]"
						option-label="label"
						option-value="value"
						aria-label="Change letter case"
						data-testid="text-cleaner-case"
					/>
					<ToolSwitch
						v-model="stripHtml"
						label="Strip HTML tags"
						testid="text-cleaner-strip-html"
					/>
				</div>
			</fieldset>
		</template>

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
				<li>{{ readingTime }}</li>
				<li v-if="removedChars > 0">
					<strong>{{ removedChars }}</strong> removed
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
