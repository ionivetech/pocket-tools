<script setup lang="ts">
import Textarea from "primevue/textarea";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runMarkdownPreview } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const text = ref(typeof initial.text === "string" ? initial.text : "");

const rendered = computed(() => runMarkdownPreview({ text: text.value }));
const outputText = computed(() => (rendered.value.ok ? rendered.value.value.html : ""));

useToolHistoryRecorder("markdown-preview", text, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (text.value.trim() === "") {
		return "empty";
	}
	return rendered.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (text.value.trim() === "") {
		return "Write some markdown to see it rendered.";
	}
	return rendered.value.ok ? "Preview updated." : rendered.value.error.message;
});

function loadSample(): void {
	text.value =
		"# Shopping list\n\n- **Milk**\n- *Eggs*\n\n> Buy before Friday\n\n[Store](https://example.com)";
}

function clearInput(): void {
	text.value = "";
}

watch(
	[text],
	() => {
		const encoded = encodeUrlState({ text: text.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Markdown" output-label="Preview">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load sample markdown"
						outlined
						data-testid="markdown-preview-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the markdown"
						outlined
						data-testid="markdown-preview-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="markdown-preview-input">Write markdown</label>
			<Textarea
				id="markdown-preview-input"
				v-model="text"
				rows="8"
				auto-resize
				placeholder="# Title, **bold**, - list"
				data-testid="markdown-preview-input"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="markdown-preview-status"
			>
				{{ statusMessage }}
			</p>
			<!-- renderMarkdownSubset escapes HTML and allows http(s) links only,
				so this HTML is safe to inject without a sanitizer. -->
			<div
				v-if="rendered.ok"
				class="pt-markdown-preview"
				data-testid="markdown-preview-output"
				v-html="rendered.value.html"
			/>
			<p class="pt-input-hint">
				Supports {{ rendered.ok ? rendered.value.supported.join(", ") : "a simple subset" }}. Full
				documents stay in your editor.
			</p>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="preview.html" :disabled="outputText === ''" />
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

.pt-input-hint {
	margin: 0.5rem 0 0;
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-markdown-preview {
	display: grid;
	gap: 0.5rem;
}

.pt-markdown-preview :deep(h1),
.pt-markdown-preview :deep(h2),
.pt-markdown-preview :deep(h3) {
	margin: 0;
}

.pt-markdown-preview :deep(pre) {
	margin: 0;
	padding: 0.75rem;
	background: var(--pt-surface);
	border: 1px solid var(--pt-line);
	border-radius: var(--radius-control);
	overflow-x: auto;
	font-family: var(--font-mono);
	font-size: 0.8rem;
}

.pt-markdown-preview :deep(code) {
	font-family: var(--font-mono);
	font-size: 0.85em;
}

.pt-markdown-preview :deep(a) {
	color: var(--pt-blue-strong);
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
