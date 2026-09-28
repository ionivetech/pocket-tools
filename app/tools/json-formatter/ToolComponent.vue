<script setup lang="ts">
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed, nextTick, ref, useId, watch } from "vue";
import { BrowserActionError, copyText } from "~/utils/browser-actions";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { getJsonStats, runJsonFormatter, validateJson } from "./logic";
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
const sortKeys = ref(initial.sortKeys === true);
const escapeStatus = ref("");

const indentOptions = [
	{ label: "2 spaces", value: 2 },
	{ label: "4 spaces", value: 4 },
	{ label: "Tab", value: "tab" },
] as const;

const componentId = useId();
const inputId = `json-formatter-input-${componentId}`;
const indentId = `json-formatter-indent-${componentId}`;
const gutterRef = ref<HTMLElement | null>(null);

const formatted = computed(() =>
	runJsonFormatter({
		text: text.value,
		indent: indent.value,
		mode: mode.value,
		sortKeys: sortKeys.value,
	}),
);
const validation = computed(() => validateJson(text.value));
const stats = computed(() => getJsonStats(text.value));
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

const errorLine = computed(() => {
	if (validation.value.ok) {
		return undefined;
	}
	return validation.value.error.line;
});

const lineCount = computed(() => text.value.split("\n").length);

const statsText = computed(() => {
	if (!stats.value.ok) {
		return "";
	}
	const { lines, bytes, keys, depth } = stats.value.value;
	return `${lines} lines · ${bytes} bytes · ${keys} keys · depth ${depth}`;
});

function syncGutter(event: Event): void {
	const area = event.target as HTMLElement | null;
	if (area && gutterRef.value) {
		gutterRef.value.scrollTop = area.scrollTop;
	}
}

function handleTabIndent(event: KeyboardEvent): void {
	const area = event.target as HTMLTextAreaElement | null;
	if (!area) {
		return;
	}
	const indentText = indent.value === "tab" ? "\t" : " ".repeat(indent.value);
	const { selectionStart, selectionEnd, value } = area;
	text.value = value.slice(0, selectionStart) + indentText + value.slice(selectionEnd);
	const caret = selectionStart + indentText.length;
	void nextTick(() => {
		area.focus();
		area.setSelectionRange(caret, caret);
	});
}

function jumpToErrorLine(): void {
	const line = errorLine.value;
	if (line === undefined) {
		return;
	}
	const area = document.getElementById(inputId) as HTMLTextAreaElement | null;
	if (!area) {
		return;
	}
	const offset = text.value
		.split("\n")
		.slice(0, line - 1)
		.reduce((total, current) => total + current.length + 1, 0);
	area.focus();
	area.setSelectionRange(offset, offset);
}

function loadSample(): void {
	text.value = sampleJson;
	escapeStatus.value = "";
}

function clearInput(): void {
	text.value = "";
	escapeStatus.value = "";
}

async function copyEscaped(): Promise<void> {
	if (!formatted.value.ok) {
		return;
	}
	try {
		const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
		await copyText(JSON.stringify(outputText.value), clipboard);
		escapeStatus.value = "Copied as an escaped string.";
	} catch (error) {
		escapeStatus.value =
			error instanceof BrowserActionError
				? "Copy failed. Check clipboard access and try again."
				: "Copy failed. Try again.";
	}
}

watch(
	[text, indent, mode, sortKeys],
	() => {
		const encoded = encodeUrlState({
			text: text.value,
			indent: indent.value,
			mode: mode.value,
			sortKeys: sortKeys.value,
		});
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="JSON input" output-label="Result">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Action</legend>
				<div class="pt-option-group__controls">
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
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Layout</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="indentId">Indent width</label>
					<Select
						:id="indentId"
						v-model="indent"
						:options="[...indentOptions]"
						option-label="label"
						option-value="value"
						:disabled="mode === 'minify'"
						aria-label="Indent width"
						data-testid="json-formatter-indent"
					/>
					<Button
						type="button"
						label="Sort keys"
						:aria-pressed="sortKeys"
						:outlined="!sortKeys"
						data-testid="json-formatter-sort-keys"
						@click="sortKeys = !sortKeys"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load sample JSON"
						outlined
						data-testid="json-formatter-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear JSON input"
						outlined
						data-testid="json-formatter-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="inputId">Paste or type JSON</label>
			<div class="pt-code-editor">
				<div ref="gutterRef" class="pt-code-gutter" aria-hidden="true">
					<span
						v-for="line in lineCount"
						:key="line"
						:class="{ 'pt-code-gutter__error': line === errorLine }"
						>{{ line }}</span
					>
				</div>
				<Textarea
					:id="inputId"
					v-model="text"
					class="pt-code-editor__input"
					rows="16"
					wrap="off"
					spellcheck="false"
					data-testid="json-formatter-input"
					placeholder="Paste JSON here"
					@scroll="syncGutter"
					@keydown.tab.prevent="handleTabIndent"
				/>
			</div>
			<p class="pt-input-hint">Tab inserts your indent. Line numbers follow your text.</p>
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
			<Button
				v-if="errorLine !== undefined"
				type="button"
				:label="`Go to line ${errorLine}`"
				:aria-label="`Go to line ${errorLine} in the JSON input`"
				size="small"
				outlined
				data-testid="json-formatter-jump"
				@click="jumpToErrorLine"
			/>

			<Textarea
				class="pt-code-editor__input"
				readonly
				rows="16"
				wrap="off"
				spellcheck="false"
				:model-value="outputText"
				aria-label="Formatted JSON result"
				data-testid="json-formatter-output"
			/>

			<p v-if="statsText" class="pt-json-stats" data-testid="json-formatter-stats">
				{{ statsText }}
			</p>

			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="formatted.json" :disabled="!formatted.ok" />
				<Button
					type="button"
					label="Copy escaped"
					aria-label="Copy result as an escaped string"
					outlined
					:disabled="!formatted.ok"
					data-testid="json-formatter-copy-escaped"
					@click="copyEscaped"
				/>
			</div>
			<p
				v-if="escapeStatus"
				class="pt-output-status"
				role="status"
				aria-live="polite"
				aria-atomic="true"
				data-testid="json-formatter-escape-status"
			>
				{{ escapeStatus }}
			</p>
		</template>
	</ToolDualPane>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-input-hint {
	margin: 0;
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-json-status {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
	font-size: 0.875rem;
	color: var(--pt-ink);
}

.pt-json-status[data-kind="error"] {
	font-weight: 600;
}

.pt-json-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}

.pt-json-stats {
	margin: 0;
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}

.pt-output-status {
	margin: 0;
	color: var(--pt-muted);
	font-size: 0.86rem;
}
</style>
