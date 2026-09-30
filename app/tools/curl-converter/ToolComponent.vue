<script setup lang="ts">
import Textarea from "primevue/textarea";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runCurlConverter } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const command = ref(typeof initial.command === "string" ? initial.command : "");

const converted = computed(() => runCurlConverter({ command: command.value }));
const outputText = computed(() => (converted.value.ok ? converted.value.value.fetchCode : ""));

useToolHistoryRecorder("curl-converter", command, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (command.value.trim() === "") {
		return "empty";
	}
	return converted.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (command.value.trim() === "") {
		return "Paste a curl command to turn it into fetch code.";
	}
	if (converted.value.ok) {
		const { method, url } = converted.value.value.request;
		const warnings = converted.value.value.warnings;
		const summary = `${method} ${url}.`;
		return warnings.length > 0 ? `${summary} ${warnings.join(" ")}` : summary;
	}
	return converted.value.error.message;
});

function loadSample(): void {
	command.value =
		'curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d \'{"name":"Ada"}\'';
}

function clearInput(): void {
	command.value = "";
}

watch(
	[command],
	() => {
		const encoded = encodeUrlState({ command: command.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="cURL command" output-label="Fetch code">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load a sample curl command"
						outlined
						data-testid="curl-converter-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the command"
						outlined
						data-testid="curl-converter-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="curl-converter-input">Paste the command</label>
			<Textarea
				id="curl-converter-input"
				v-model="command"
				rows="5"
				auto-resize
				placeholder="curl https://…"
				data-testid="curl-converter-input"
			/>
			<p class="pt-input-hint">Supports method, URL, headers, data and basic auth.</p>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="curl-converter-status"
			>
				{{ statusMessage }}
			</p>
			<label class="pt-field-label" for="curl-converter-output">Fetch code</label>
			<Textarea
				id="curl-converter-output"
				readonly
				rows="8"
				:model-value="outputText"
				aria-label="Generated fetch code"
				data-testid="curl-converter-output"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions
					:value="outputText"
					filename="fetch-snippet.js"
					:disabled="outputText === ''"
				/>
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

.pt-input-hint {
	margin: 0.5rem 0 0;
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-tool-status {
	display: flex;
	align-items: center;
	min-height: 1.75rem;
	margin: 0 0 0.5rem;
	font-size: 0.875rem;
	color: var(--pt-ink);
	word-break: break-word;
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
