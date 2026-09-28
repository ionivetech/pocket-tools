<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { encodeBase64Bytes, runBase64Tool } from "./logic";
import type { Base64Direction } from "./schema";

const text = ref("");
const direction = ref<Base64Direction>("auto");
const fileError = ref("");

const directionOptions: readonly { label: string; value: Base64Direction }[] = [
	{ label: "Auto-detect", value: "auto" },
	{ label: "Encode", value: "encode" },
	{ label: "Decode", value: "decode" },
];

const componentId = useId();
const inputId = `base64-input-${componentId}`;

const outcome = computed(() => runBase64Tool({ text: text.value, direction: direction.value }));
const outputText = computed(() => (outcome.value.ok ? outcome.value.value.result : ""));
const isEmpty = computed(() => text.value === "");

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (isEmpty.value) {
		return "empty";
	}
	return outcome.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (statusKind.value === "empty") {
		return "Paste text, or drop a file below, to encode or decode it.";
	}
	if (outcome.value.ok) {
		return outcome.value.value.direction === "encode"
			? "Encoded to base64."
			: "Decoded from base64.";
	}
	return outcome.value.error.message;
});

async function handleFiles(files: File[]): Promise<void> {
	const file = files[0];
	if (!file) {
		return;
	}
	fileError.value = "";
	try {
		const bytes = new Uint8Array(await file.arrayBuffer());
		text.value = encodeBase64Bytes(bytes);
		direction.value = "encode";
	} catch {
		fileError.value = "That file could not be read. Try another file.";
	}
}
</script>

<template>
	<ToolDualPane input-label="Text or base64" output-label="Result">
		<template #input>
			<label class="pt-field-label" :for="inputId">Paste text or base64</label>
			<Textarea
				:id="inputId"
				v-model="text"
				rows="12"
				spellcheck="false"
				class="pt-base64-textarea"
				placeholder="Paste text to encode, or base64 to decode"
				data-testid="base64-input"
			/>

			<Select
				v-model="direction"
				:options="[...directionOptions]"
				option-label="label"
				option-value="value"
				aria-label="Encode or decode direction"
				data-testid="base64-direction"
			/>

			<ToolFileDrop
				heading="Add a file to encode"
				help="Drop a file here or choose one below. It is converted to base64 without leaving this device."
				@files="handleFiles"
			/>
			<p v-if="fileError" role="alert" class="pt-base64-file-error" data-testid="base64-file-error">
				{{ fileError }}
			</p>
		</template>

		<template #output>
			<p
				class="pt-base64-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="base64-status"
			>
				<AppIcon
					v-if="statusKind !== 'empty'"
					:name="statusKind === 'error' ? 'exclamation-circle' : 'check-circle'"
				/>
				{{ statusMessage }}
			</p>

			<Textarea
				readonly
				rows="12"
				class="pt-base64-textarea"
				:model-value="outputText"
				aria-label="Encoded or decoded result"
				data-testid="base64-output"
			/>

			<ToolActions :value="outputText" filename="base64-result.txt" :disabled="!outcome.ok" />
		</template>
	</ToolDualPane>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-base64-textarea {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.875rem;
}

.pt-base64-status {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: var(--pt-ink);
}

.pt-base64-status[data-kind="error"] {
	font-weight: 600;
}

.pt-base64-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}

.pt-base64-file-error {
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--pt-ink);
}
</style>
