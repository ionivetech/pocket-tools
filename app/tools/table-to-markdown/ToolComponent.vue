<script setup lang="ts">
import Textarea from "primevue/textarea";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runTableToMarkdown } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const text = ref(typeof initial.text === "string" ? initial.text : "");
const header = ref(initial.header !== false);

const converted = computed(() => runTableToMarkdown({ text: text.value, header: header.value }));
const outputText = computed(() => (converted.value.ok ? converted.value.value.table : ""));

useToolHistoryRecorder("table-to-markdown", text, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (text.value.trim() === "") {
		return "empty";
	}
	return converted.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (text.value.trim() === "") {
		return "Paste spreadsheet cells to get a markdown table.";
	}
	if (converted.value.ok) {
		const { rows, columns, delimiter } = converted.value.value;
		return `${rows} rows, ${columns} columns, read as ${delimiter}-separated.`;
	}
	return converted.value.error.message;
});

function loadSample(): void {
	text.value = "Name,Role\nAda,Engineer\nGrace,Analyst";
	header.value = true;
}

function clearInput(): void {
	text.value = "";
}

watch(
	[text, header],
	() => {
		const encoded = encodeUrlState({ text: text.value, header: header.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Spreadsheet cells" output-label="Markdown table">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Options</legend>
				<div class="pt-option-group__controls">
					<ToolSwitch
						v-model="header"
						label="First row is a header"
						testid="table-to-markdown-header"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load sample cells"
						outlined
						data-testid="table-to-markdown-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the cells"
						outlined
						data-testid="table-to-markdown-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="table-to-markdown-input">Paste cells</label>
			<Textarea
				id="table-to-markdown-input"
				v-model="text"
				rows="6"
				auto-resize
				placeholder="Copy cells from your spreadsheet and paste here"
				data-testid="table-to-markdown-input"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="table-to-markdown-status"
			>
				{{ statusMessage }}
			</p>
			<label class="pt-field-label" for="table-to-markdown-output">Markdown table</label>
			<Textarea
				id="table-to-markdown-output"
				readonly
				rows="7"
				:model-value="outputText"
				aria-label="Markdown table result"
				data-testid="table-to-markdown-output"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="table.md" :disabled="outputText === ''" />
			</div>
		</template>
	</ToolDualPane>
</template>

<style scoped>
.pt-field-label {
	display: flex;
	align-items: center;
	min-height: 1.75rem;
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-tool-status {
	display: flex;
	align-items: center;
	min-height: 1.75rem;
	margin: 0 0 0.5rem;
	font-size: 0.875rem;
	color: var(--pt-ink);
}

.pt-tool-status[data-kind="error"] {
	font-weight: 600;
}

.pt-tool-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
