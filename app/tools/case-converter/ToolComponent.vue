<script setup lang="ts">
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { BrowserActionError, copyText } from "~/utils/browser-actions";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runCaseConverter } from "./logic";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const text = ref(typeof initial.text === "string" ? initial.text : "");

const converted = computed(() => runCaseConverter({ text: text.value }));
const outputText = computed(() =>
	converted.value.ok
		? converted.value.value.variants.map((variant) => variant.value).join("\n")
		: "",
);

useToolHistoryRecorder("case-converter", text, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (text.value.trim() === "") {
		return "empty";
	}
	return converted.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (text.value.trim() === "") {
		return "Type some text to see every case at once.";
	}
	return converted.value.ok ? "Seven cases ready." : converted.value.error.message;
});

async function copyVariant(label: string, value: string): Promise<void> {
	try {
		const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
		await copyText(value, clipboard);
		toast.add({ severity: "success", summary: `Copied ${label}.`, life: 3000 });
	} catch (error) {
		toast.add({
			severity: "error",
			summary: "Copy failed.",
			detail:
				error instanceof BrowserActionError
					? "Check clipboard access and try again."
					: "Try again.",
			life: 4000,
		});
	}
}

function loadSample(): void {
	text.value = "hello world example";
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
	<ToolDualPane input-label="Text" output-label="Every case">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load sample text"
						outlined
						data-testid="case-converter-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the text"
						outlined
						data-testid="case-converter-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="case-converter-input">Type or paste text</label>
			<Textarea
				id="case-converter-input"
				v-model="text"
				rows="4"
				auto-resize
				placeholder="hello world"
				data-testid="case-converter-input"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="case-converter-status"
			>
				{{ statusMessage }}
			</p>
			<ul
				v-if="converted.ok"
				class="pt-case-rows"
				aria-label="Case variants"
				data-testid="case-converter-variants"
			>
				<li v-for="variant in converted.value.variants" :key="variant.id" class="pt-case-row">
					<span class="pt-case-label">{{ variant.label }}</span>
					<code class="pt-case-value">{{ variant.value }}</code>
					<Button
						type="button"
						:label="`Copy ${variant.label}`"
						:aria-label="`Copy ${variant.label}`"
						size="small"
						outlined
						:data-testid="`case-converter-copy-${variant.id}`"
						@click="copyVariant(variant.label, variant.value)"
					/>
				</li>
			</ul>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="cases.txt" :disabled="outputText === ''" />
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

.pt-case-rows {
	display: grid;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.pt-case-row {
	display: grid;
	grid-template-columns: 7rem 1fr auto;
	gap: 0.5rem;
	align-items: center;
}

.pt-case-label {
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-case-value {
	font-family: var(--font-mono);
	font-size: 0.8rem;
	word-break: break-word;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
