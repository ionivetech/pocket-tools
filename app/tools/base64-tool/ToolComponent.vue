<script setup lang="ts">
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed, ref, useId } from "vue";
import { encodeBase64Bytes, formatBase64Encoded, runBase64Tool } from "./logic";
import type { Base64Direction, Base64Newline, Base64WrapAt } from "./schema";

const text = ref("");
const direction = ref<Base64Direction>("auto");
const urlSafe = ref(false);
const wrapAt = ref<Base64WrapAt>(0);
const newline = ref<Base64Newline>("lf");
const fileError = ref("");
// A dropped file's base64 is already a final result, not more input to feed back through
// encode/decode -- keeping the raw payload separate from `text` is what stops a file's
// output from being re-encoded the next time `outcome` recomputes.
const fileRaw = ref<string | undefined>(undefined);

const directionOptions: readonly { label: string; value: Base64Direction }[] = [
	{ label: "Auto-detect", value: "auto" },
	{ label: "Encode", value: "encode" },
	{ label: "Decode", value: "decode" },
];

const wrapOptions: readonly { label: string; value: Base64WrapAt }[] = [
	{ label: "No wrapping", value: 0 },
	{ label: "Wrap at 64", value: 64 },
	{ label: "Wrap at 76", value: 76 },
];

const newlineOptions: readonly { label: string; value: Base64Newline }[] = [
	{ label: "LF line breaks", value: "lf" },
	{ label: "CRLF line breaks", value: "crlf" },
];

const componentId = useId();
const inputId = `base64-input-${componentId}`;
const directionId = `base64-direction-${componentId}`;
const wrapId = `base64-wrap-${componentId}`;
const newlineId = `base64-newline-${componentId}`;

const outcome = computed(() =>
	runBase64Tool({
		text: text.value,
		direction: direction.value,
		urlSafe: urlSafe.value,
		wrapAt: wrapAt.value,
		newline: newline.value,
	}),
);
const fileDisplay = computed(() =>
	fileRaw.value === undefined
		? undefined
		: formatBase64Encoded(fileRaw.value, {
				urlSafe: urlSafe.value,
				wrapAt: wrapAt.value,
				newline: newline.value,
			}),
);
const outputText = computed(() =>
	fileDisplay.value !== undefined
		? fileDisplay.value
		: outcome.value.ok
			? outcome.value.value.result
			: "",
);
const isEmpty = computed(() => text.value === "" && fileRaw.value === undefined);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (isEmpty.value) {
		return "empty";
	}
	if (fileRaw.value !== undefined) {
		return "success";
	}
	return outcome.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (statusKind.value === "empty") {
		return "Paste text, or drop a file below, to encode or decode it.";
	}
	if (fileRaw.value !== undefined) {
		return "File encoded to base64.";
	}
	if (outcome.value.ok) {
		return outcome.value.value.direction === "encode"
			? "Encoded to base64."
			: "Decoded from base64.";
	}
	return outcome.value.error.message;
});

const sizeText = computed(() => {
	if (statusKind.value !== "success" || outputText.value === "") {
		return "";
	}
	const chars = [...outputText.value].length;
	const bytes = new TextEncoder().encode(outputText.value).length;
	return `${chars} characters · ${bytes} bytes`;
});

function handleTextInput(value: string): void {
	text.value = value;
	fileRaw.value = undefined;
}

async function handleFiles(files: File[]): Promise<void> {
	const file = files[0];
	if (!file) {
		return;
	}
	fileError.value = "";
	try {
		const bytes = new Uint8Array(await file.arrayBuffer());
		fileRaw.value = encodeBase64Bytes(bytes);
	} catch {
		fileError.value = "That file could not be read. Try another file.";
	}
}
</script>

<template>
	<ToolDualPane input-label="Text or base64" output-label="Result">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Direction</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="directionId">Encode or decode direction</label>
					<Select
						:id="directionId"
						v-model="direction"
						:options="[...directionOptions]"
						option-label="label"
						option-value="value"
						aria-label="Encode or decode direction"
						data-testid="base64-direction"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Format</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="URL-safe"
						:aria-pressed="urlSafe"
						:outlined="!urlSafe"
						data-testid="base64-url-safe"
						@click="urlSafe = !urlSafe"
					/>
					<label class="pt-sr-only" :for="wrapId">Wrap encoded output</label>
					<Select
						:id="wrapId"
						v-model="wrapAt"
						:options="[...wrapOptions]"
						option-label="label"
						option-value="value"
						aria-label="Wrap encoded output"
						data-testid="base64-wrap"
					/>
					<label class="pt-sr-only" :for="newlineId">Wrapped line breaks</label>
					<Select
						:id="newlineId"
						v-model="newline"
						:options="[...newlineOptions]"
						option-label="label"
						option-value="value"
						:disabled="wrapAt === 0"
						aria-label="Wrapped line breaks"
						data-testid="base64-newline"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="inputId">Paste text or base64</label>
			<Textarea
				:id="inputId"
				:model-value="text"
				rows="12"
				spellcheck="false"
				class="pt-base64-textarea"
				placeholder="Paste text to encode, or base64 to decode"
				data-testid="base64-input"
				@update:model-value="handleTextInput"
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
				<span v-if="sizeText" class="pt-base64-size">{{ sizeText }}</span>
			</p>

			<Textarea
				readonly
				rows="12"
				class="pt-base64-textarea"
				:model-value="outputText"
				aria-label="Encoded or decoded result"
				data-testid="base64-output"
			/>

			<ToolActions :value="outputText" filename="base64-result.txt" :disabled="isEmpty" />
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
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
	font-size: 0.875rem;
	color: var(--pt-ink);
}

.pt-base64-status[data-kind="error"] {
	font-weight: 600;
}

.pt-base64-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}

.pt-base64-size {
	color: var(--pt-muted);
	font-size: 0.8rem;
	font-weight: 400;
}

.pt-base64-file-error {
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--pt-ink);
}
</style>
