<script setup lang="ts">
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed, ref, useId, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runHashGenerator } from "./logic";
import {
	HASH_ALGORITHMS,
	HASH_ENCODINGS,
	isHashAlgorithm,
	isHashEncoding,
	type HashAlgorithm,
	type HashEncoding,
} from "./schema";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const text = ref(typeof initial.text === "string" ? initial.text : "");
const algorithm = ref<HashAlgorithm>(
	isHashAlgorithm(initial.algorithm) ? initial.algorithm : "SHA-256",
);
const encoding = ref<HashEncoding>(isHashEncoding(initial.encoding) ? initial.encoding : "hex");
const digest = ref("");
const error = ref<string | null>(null);
const generating = ref(false);

const componentId = useId();
const algorithmId = `hash-generator-algorithm-${componentId}`;
const encodingId = `hash-generator-encoding-${componentId}`;

useToolHistoryRecorder("hash-generator", text, digest);

const statusKind = computed<"empty" | "error" | "success" | "loading">(() => {
	if (generating.value) {
		return "loading";
	}
	if (text.value === "") {
		return "empty";
	}
	if (error.value !== null) {
		return "error";
	}
	return digest.value === "" ? "empty" : "success";
});

const statusMessage = computed(() => {
	if (generating.value) {
		return "Computing the fingerprint…";
	}
	if (text.value === "") {
		return "Type some text to fingerprint it.";
	}
	if (error.value !== null) {
		return error.value;
	}
	return digest.value === "" ? "Press Generate to compute." : "Fingerprint ready.";
});

async function generate(): Promise<void> {
	if (text.value === "" || generating.value) {
		return;
	}
	generating.value = true;
	error.value = null;
	try {
		const result = await runHashGenerator({
			text: text.value,
			algorithm: algorithm.value,
			encoding: encoding.value,
		});
		if (result.ok) {
			digest.value = result.value.digest;
		} else {
			error.value = result.error.message;
			digest.value = "";
		}
	} finally {
		generating.value = false;
	}
}

function clearInput(): void {
	text.value = "";
	digest.value = "";
	error.value = null;
}

watch([text, algorithm, encoding], () => {
	error.value = null;
});

watch(
	[text, algorithm, encoding],
	() => {
		const encoded = encodeUrlState({
			text: text.value,
			algorithm: algorithm.value,
			encoding: encoding.value,
		});
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Text to fingerprint" output-label="Fingerprint">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Method</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="algorithmId">Hash method</label>
					<Select
						:id="algorithmId"
						v-model="algorithm"
						:options="[...HASH_ALGORITHMS]"
						aria-label="Hash method"
						data-testid="hash-generator-algorithm"
					/>
					<label class="pt-sr-only" :for="encodingId">Output encoding</label>
					<Select
						:id="encodingId"
						v-model="encoding"
						:options="[...HASH_ENCODINGS]"
						aria-label="Output encoding"
						data-testid="hash-generator-encoding"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Action</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Generate"
						aria-label="Generate fingerprint"
						:loading="generating"
						:disabled="text === ''"
						data-testid="hash-generator-generate"
						@click="generate"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the text input"
						outlined
						data-testid="hash-generator-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="hash-generator-input">Type or paste text</label>
			<Textarea
				id="hash-generator-input"
				v-model="text"
				rows="5"
				auto-resize
				placeholder="Anything worth fingerprinting"
				data-testid="hash-generator-input"
			/>
			<p class="pt-input-hint">SHA-1 is listed for old checksums only. Prefer SHA-256.</p>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				aria-busy="false"
				data-testid="hash-generator-status"
			>
				{{ statusMessage }}
			</p>
			<label class="pt-field-label" for="hash-generator-output">Fingerprint</label>
			<Textarea
				id="hash-generator-output"
				readonly
				rows="4"
				:model-value="digest"
				aria-label="Fingerprint result"
				data-testid="hash-generator-output"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="digest" filename="hash.txt" :disabled="digest === ''" />
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
