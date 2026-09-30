<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import { computed, onBeforeUnmount, ref } from "vue";
import {
	formatBytes,
	outputExtension,
	outputLabel,
	savingsLabel,
	IMAGE_OUTPUT_TYPES,
	type ImageOutputType,
} from "../../utils/image-metrics";
import { planImageCompression } from "./logic";

const quality = ref(70);
const outputType = ref<ImageOutputType>("image/jpeg");

const file = ref<File | null>(null);
const originalBytes = ref(0);
const outputBytes = ref(0);
const error = ref<string | null>(null);
const busy = ref(false);
const previewUrl = ref("");

const formatOptions = IMAGE_OUTPUT_TYPES.map((type) => ({ value: type, label: outputLabel(type) }));

const plan = computed(() =>
	file.value
		? planImageCompression({
				fileName: file.value.name,
				fileType: file.value.type,
				fileSize: file.value.size,
				quality: quality.value / 100,
				outputType: outputType.value,
			})
		: undefined,
);

const statusKind = computed<"empty" | "error" | "success" | "loading">(() => {
	if (busy.value) {
		return "loading";
	}
	if (error.value !== null) {
		return "error";
	}
	return outputBytes.value > 0 ? "success" : "empty";
});

const statusMessage = computed(() => {
	if (busy.value) {
		return "Compressing on this device…";
	}
	if (error.value !== null) {
		return error.value;
	}
	if (outputBytes.value === 0) {
		return "Add a photo to see the smaller file.";
	}
	return savingsLabel(originalBytes.value, outputBytes.value);
});

const downloadName = computed(() => {
	const base = (file.value?.name ?? "image").replace(/\.[^.]+$/, "");
	return `${base}.${outputExtension(outputType.value)}`;
});

function releasePreview(): void {
	if (previewUrl.value !== "") {
		URL.revokeObjectURL(previewUrl.value);
		previewUrl.value = "";
	}
}

async function compress(): Promise<void> {
	const current = file.value;
	const approved = plan.value;
	if (!current || !approved?.ok || busy.value) {
		return;
	}
	busy.value = true;
	error.value = null;
	try {
		const bitmap = await createImageBitmap(current);
		const canvas = document.createElement("canvas");
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const context = canvas.getContext("2d");
		if (!context) {
			error.value = "This browser could not read the image. Try another file.";
			return;
		}
		if (outputType.value === "image/jpeg") {
			// JPEG has no alpha: without a matte, transparent areas turn black.
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
		}
		context.drawImage(bitmap, 0, 0);
		bitmap.close();
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, outputType.value, quality.value / 100),
		);
		if (!blob) {
			error.value = "This browser could not re-encode the image. Try another file.";
			return;
		}
		outputBytes.value = blob.size;
		releasePreview();
		previewUrl.value = URL.createObjectURL(blob);
	} catch {
		error.value = "That image could not be read. Try a different file.";
	} finally {
		busy.value = false;
	}
}

function onFiles(files: File[]): void {
	const first = files[0];
	file.value = first ?? null;
	originalBytes.value = first?.size ?? 0;
	outputBytes.value = 0;
	releasePreview();
	const approved = plan.value;
	if (!approved?.ok) {
		error.value = approved?.error.message ?? "Choose an image first.";
		return;
	}
	void compress();
}

function download(): void {
	if (previewUrl.value === "") {
		return;
	}
	const link = document.createElement("a");
	link.href = previewUrl.value;
	link.download = downloadName.value;
	link.click();
}

onBeforeUnmount(releasePreview);
</script>

<template>
	<ToolDualPane input-label="Photo" output-label="Smaller file">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Quality</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" for="image-compressor-quality">Quality percent</label>
					<InputNumber
						id="image-compressor-quality"
						v-model="quality"
						:min="10"
						:max="100"
						:step="5"
						suffix="%"
						aria-label="Quality percent"
						data-testid="image-compressor-quality"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Format</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" for="image-compressor-type">Output format</label>
					<Select
						id="image-compressor-type"
						v-model="outputType"
						:options="formatOptions"
						option-label="label"
						option-value="value"
						aria-label="Output format"
						data-testid="image-compressor-type"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<ToolFileDrop
				accept="image/*"
				heading="Add a photo"
				help="Drop an image here or choose a file. It stays on this device."
				@files="onFiles"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-busy="busy"
				aria-atomic="true"
				data-testid="image-compressor-status"
			>
				{{ statusMessage }}
			</p>
			<dl v-if="outputBytes > 0" class="pt-image-stats" data-testid="image-compressor-stats">
				<div>
					<dt>Original</dt>
					<dd>{{ formatBytes(originalBytes) }}</dd>
				</div>
				<div>
					<dt>Compressed</dt>
					<dd>{{ formatBytes(outputBytes) }}</dd>
				</div>
				<div>
					<dt>Name</dt>
					<dd>{{ downloadName }}</dd>
				</div>
			</dl>
			<img
				v-if="previewUrl !== ''"
				class="pt-image-preview"
				:src="previewUrl"
				alt="Compressed result preview"
				data-testid="image-compressor-preview"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<Button
					type="button"
					label="Download compressed"
					aria-label="Download the compressed image"
					:disabled="outputBytes === 0"
					data-testid="image-compressor-download"
					@click="download"
				/>
			</div>
		</template>
	</ToolDualPane>
</template>

<style scoped>
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

.pt-image-stats {
	display: grid;
	gap: 0.5rem;
	margin: 0 0 0.75rem;
}

.pt-image-stats > div {
	display: grid;
	grid-template-columns: 7rem 1fr;
	gap: 0.5rem;
}

.pt-image-stats dt {
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-image-stats dd {
	margin: 0;
	font-weight: 600;
	word-break: break-all;
}

.pt-image-preview {
	max-width: 100%;
	height: auto;
	border: 1px solid var(--pt-line);
	border-radius: var(--radius-control);
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
