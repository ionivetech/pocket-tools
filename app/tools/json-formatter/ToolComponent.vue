<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runJsonFormatter, validateJson } from "./logic";
import type { JsonFormatterIndent, JsonFormatterMode } from "./schema";
import { isJsonFormatterIndent, isJsonFormatterMode } from "./schema";

const sampleJson =
	'{\n  "name": "PocketTools",\n  "offline": true,\n  "tools": ["json", "text"]\n}';

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const text = ref(typeof initial.text === "string" ? initial.text : sampleJson);
const indent = ref<JsonFormatterIndent>(isJsonFormatterIndent(initial.indent) ? initial.indent : 2);
const mode = ref<JsonFormatterMode>(isJsonFormatterMode(initial.mode) ? initial.mode : "format");

const indentOptions = [
	{ label: "2 spaces", value: 2 },
	{ label: "4 spaces", value: 4 },
	{ label: "Tab", value: "tab" },
] as const;

const componentId = useId();
const inputId = `json-formatter-input-${componentId}`;

const formatted = computed(() =>
	runJsonFormatter({ text: text.value, indent: indent.value, mode: mode.value }),
);
const validation = computed(() => validateJson(text.value));
const outputText = computed(() => (formatted.value.ok ? formatted.value.value.result : ""));

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (text.value.trim() === "") {
		return "empty";
	}
	return validation.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (statusKind.value === "empty") {
		return "Paste or type JSON to format, minify, or validate it.";
	}
	if (statusKind.value === "success") {
		return mode.value === "minify" ? "Valid JSON, minified." : "Valid JSON, formatted.";
	}
	const error = !validation.value.ok ? validation.value.error : undefined;
	if (error?.line !== undefined && error.column !== undefined) {
		return `Line ${error.line}, column ${error.column}: ${error.message}`;
	}
	return error?.message ?? "That is not valid JSON yet.";
});

watch(
	[text, indent, mode],
	() => {
		const encoded = encodeUrlState({ text: text.value, indent: indent.value, mode: mode.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="JSON input" output-label="Result">
		<template #input>
			<label class="pt-field-label" :for="inputId">Paste or type JSON</label>
			<Textarea
				:id="inputId"
				v-model="text"
				class="pt-json-textarea"
				rows="16"
				spellcheck="false"
				data-testid="json-formatter-input"
				placeholder="Paste JSON here"
			/>

			<div class="pt-json-controls">
				<Button
					type="button"
					label="Format"
					aria-label="Format JSON"
					:outlined="mode !== 'format'"
					data-testid="json-formatter-format"
					@click="mode = 'format'"
				/>
				<Button
					type="button"
					label="Minify"
					aria-label="Minify JSON"
					:outlined="mode !== 'minify'"
					data-testid="json-formatter-minify"
					@click="mode = 'minify'"
				/>
				<Select
					v-model="indent"
					:options="[...indentOptions]"
					option-label="label"
					option-value="value"
					:disabled="mode === 'minify'"
					aria-label="Indent width"
					data-testid="json-formatter-indent"
				/>
			</div>
		</template>

		<template #output>
			<p
				class="pt-json-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="json-formatter-status"
			>
				<AppIcon
					v-if="statusKind !== 'empty'"
					:name="statusKind === 'error' ? 'exclamation-circle' : 'check-circle'"
				/>
				{{ statusMessage }}
			</p>

			<Textarea
				class="pt-json-textarea"
				readonly
				rows="16"
				spellcheck="false"
				:model-value="outputText"
				aria-label="Formatted JSON result"
				data-testid="json-formatter-output"
			/>

			<ToolActions :value="outputText" filename="formatted.json" :disabled="!formatted.ok" />
		</template>
	</ToolDualPane>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-json-textarea {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.875rem;
}

.pt-json-controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	align-items: center;
}

.pt-json-status {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: var(--pt-ink);
}

.pt-json-status[data-kind="error"] {
	font-weight: 600;
}

.pt-json-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}
</style>
