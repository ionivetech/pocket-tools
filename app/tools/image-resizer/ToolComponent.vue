<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import { computed, onBeforeUnmount, ref } from "vue";
import {
	formatBytes,
	outputExtension,
	outputLabel,
	savingsLabel,
	targetSize,
	IMAGE_OUTPUT_TYPES,
	type ImageOutputType,
	withinPixelBudget,
	pixelBudgetMessage,
} from "../../utils/image-metrics";
import { planImageResize } from "./logic";

const targetWidth = ref(1200);
const keepRatio = ref(true);
const outputType = ref<ImageOutputType>("image/jpeg");

const formatOptions = IMAGE_OUTPUT_TYPES.map((type) => ({ value: type, label: outputLabel(type) }));

const file = ref<File | null>(null);
const originalBytes = ref(0);
const sourceSize = ref<{ width: number; height: number } | null>(null);
const outputBytes = ref(0);
const outputSize = ref<{ width: number; height: number } | null>(null);
const error = ref<string | null>(null);
const busy = ref(false);
const previewUrl = ref("");

const plan = computed(() =>
	file.value
		? planImageResize({
				fileName: file.value.name,
				fileType: file.value.type,
				fileSize: file.value.size,
				targetWidth: targetWidth.value,
				keepRatio: keepRatio.value,
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
		return "Resizing on this device…";
	}
	if (error.value !== null) {
		return error.value;
	}
	if (outputBytes.value === 0 || !outputSize.value) {
		return "Add a photo to resize it.";
	}
	return `${outputSize.value.width} × ${outputSize.value.height} px — ${savingsLabel(originalBytes.value, outputBytes.value)}`;
});

const downloadName = computed(() => {
	const base = (file.value?.name ?? "image").replace(/\.[^.]+$/, "");
	return `${base}-${outputSize.value?.width ?? targetWidth.value}w.${outputExtension(outputType.value)}`;
});

function releasePreview(): void {
	if (previewUrl.value !== "") {
		URL.revokeObjectURL(previewUrl.value);
		previewUrl.value = "";
	}
}

async function resize(): Promise<void> {
	const current = file.value;
	const approved = plan.value;
	if (!current || !approved?.ok || busy.value || !sourceSize.value) {
		return;
	}
	busy.value = true;
	error.value = null;
	try {
		const bitmap = await createImageBitmap(current);
		if (!withinPixelBudget(bitmap.width, bitmap.height)) {
			bitmap.close();
			error.value = pixelBudgetMessage();
			return;
		}
		const size = targetSize(
			bitmap.width,
			bitmap.height,
			approved.value.targetWidth,
			approved.value.keepRatio,
		);
		const canvas = document.createElement("canvas");
		canvas.width = size.width;
		canvas.height = size.height;
		const context = canvas.getContext("2d");
		if (!context) {
			error.value = "This browser could not read the image. Try another file.";
			return;
		}
		if (outputType.value === "image/jpeg") {
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
		}
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, outputType.value, 0.9),
		);
		if (!blob) {
			error.value = "This browser could not re-encode the image. Try another file.";
			return;
		}
		outputBytes.value = blob.size;
		outputSize.value = size;
		releasePreview();
		previewUrl.value = URL.createObjectURL(blob);
	} catch {
		error.value = "That image could not be read. Try a different file.";
	} finally {
		busy.value = false;
	}
}

async function onFiles(files: File[]): Promise<void> {
	const first = files[0];
	file.value = first ?? null;
	originalBytes.value = first?.size ?? 0;
	outputBytes.value = 0;
	sourceSize.value = null;
	releasePreview();
	const approved = plan.value;
	if (!approved?.ok) {
		error.value = approved?.error.message ?? "Choose an image first.";
		return;
	}
	try {
		const bitmap = await createImageBitmap(first as File);
		sourceSize.value = { width: bitmap.width, height: bitmap.height };
		bitmap.close();
	} catch {
		error.value = "That image could not be read. Try a different file.";
		return;
	}
	await resize();
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
	<ToolDualPane input-label="Photo" output-label="Resized copy">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Size</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" for="image-resizer-width">Target width</label>
					<InputNumber
						id="image-resizer-width"
						v-model="targetWidth"
						:min="1"
						:max="8000"
						:step="100"
						suffix="px"
						aria-label="Target width in pixels"
						data-testid="image-resizer-width"
					/>
					<ToolSwitch
						v-model="keepRatio"
						label="Keep proportions"
						testid="image-resizer-keep-ratio"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Format</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" for="image-resizer-type">Output format</label>
					<Select
						id="image-resizer-type"
						v-model="outputType"
						:options="formatOptions"
						option-label="label"
						option-value="value"
						aria-label="Output format"
						data-testid="image-resizer-type"
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
				data-testid="image-resizer-status"
			>
				{{ statusMessage }}
			</p>
			<dl v-if="sourceSize" class="pt-image-stats" data-testid="image-resizer-stats">
				<div>
					<dt>Original</dt>
					<dd>
						{{ sourceSize.width }} × {{ sourceSize.height }} px · {{ formatBytes(originalBytes) }}
					</dd>
				</div>
				<div v-if="outputSize">
					<dt>Resized</dt>
					<dd>
						{{ outputSize.width }} × {{ outputSize.height }} px · {{ formatBytes(outputBytes) }}
					</dd>
				</div>
				<div v-if="outputSize">
					<dt>Name</dt>
					<dd>{{ downloadName }}</dd>
				</div>
			</dl>
			<img
				v-if="previewUrl !== ''"
				class="pt-image-preview"
				:src="previewUrl"
				alt="Resized result preview"
				data-testid="image-resizer-preview"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<Button
					type="button"
					label="Download resized"
					aria-label="Download the resized image"
					:disabled="outputBytes === 0"
					data-testid="image-resizer-download"
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
	word-break: break-word;
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
	grid-template-columns: 6rem 1fr;
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
