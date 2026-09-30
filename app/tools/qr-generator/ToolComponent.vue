<script setup lang="ts">
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, nextTick, ref, useId, useTemplateRef, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runQrGenerator } from "./logic";
import { QR_ECC_OPTIONS } from "./schema";
import type { QrErrorCorrection } from "../../utils/qr-encode";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const text = ref(typeof initial.text === "string" ? initial.text : "https://pockettools.app");
const ecc = ref<QrErrorCorrection>(initial.ecc === "L" ? "L" : "M");
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");

const componentId = useId();
const textId = `qr-generator-text-${componentId}`;
const eccId = `qr-generator-ecc-${componentId}`;

const generated = computed(() => runQrGenerator({ text: text.value, ecc: ecc.value }));
const outputText = computed(() => (generated.value.ok ? generated.value.value.svg : ""));

useToolHistoryRecorder("qr-generator", text, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (text.value.trim() === "") {
		return "empty";
	}
	return generated.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (text.value.trim() === "") {
		return "Type a link or text to make a QR code.";
	}
	if (generated.value.ok) {
		const { version, ecc: level, bytes, maxBytes: limit } = generated.value.value;
		return `Version ${version}, error correction ${level} — ${bytes} of ${limit} bytes used.`;
	}
	return generated.value.error.message;
});

// The matrix is the same SVG already rendered as text, so the canvas preview
// and the download can never disagree.
watch(
	[generated, canvas],
	async () => {
		const element = canvas.value;
		const value = generated.value;
		if (!element || !value.ok) {
			return;
		}
		await nextTick();
		const modules = parseQrModules(value.value.svg);
		if (!modules) {
			return;
		}
		const quiet = 4;
		const side = modules.length + quiet * 2;
		const scale = Math.max(4, Math.floor(288 / side));
		element.width = side * scale;
		element.height = side * scale;
		const context = element.getContext("2d");
		if (!context) {
			return;
		}
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, element.width, element.height);
		context.fillStyle = "#000000";
		modules.forEach((row, y) => {
			row.forEach((dark, x) => {
				if (dark) {
					context.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
				}
			});
		});
	},
	{ flush: "post" },
);

function parseQrModules(svg: string): boolean[][] | null {
	const path = /<path d="([^"]+)"/.exec(svg)?.[1];
	if (!path) {
		return null;
	}
	const side = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1] ?? 0) - 8;
	if (side <= 0) {
		return null;
	}
	const grid: boolean[][] = Array.from({ length: side }, () =>
		Array.from({ length: side }, () => false),
	);
	for (const match of path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
		const x = Number(match[1]) - 4;
		const y = Number(match[2]) - 4;
		if (x >= 0 && y >= 0 && x < side && y < side) {
			grid[y]![x] = true;
		}
	}
	return grid;
}

async function downloadPng(): Promise<void> {
	const element = canvas.value;
	if (!element) {
		return;
	}
	const blob = await new Promise<Blob | null>((resolve) => element.toBlob(resolve, "image/png"));
	if (!blob) {
		return;
	}
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = "qr-code.png";
	link.click();
	URL.revokeObjectURL(url);
}

function loadSample(): void {
	text.value = "https://pockettools.app";
}

function clearInput(): void {
	text.value = "";
}

watch(
	[text, ecc],
	() => {
		const encoded = encodeUrlState({ text: text.value, ecc: ecc.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Link or text" output-label="QR code">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Safety margin</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="eccId">Error correction</label>
					<Select
						:id="eccId"
						v-model="ecc"
						:options="[...QR_ECC_OPTIONS]"
						aria-label="Error correction"
						data-testid="qr-generator-ecc"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load a sample link"
						outlined
						data-testid="qr-generator-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the text"
						outlined
						data-testid="qr-generator-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="textId">Link or text</label>
			<InputText
				:id="textId"
				v-model="text"
				placeholder="https://example.com"
				autocomplete="off"
				data-testid="qr-generator-input"
			/>
			<p class="pt-input-hint">
				Makes the code harder to read when damaged. M holds up to 106 bytes.
			</p>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="qr-generator-status"
			>
				{{ statusMessage }}
			</p>
			<canvas
				v-if="generated.ok"
				ref="canvas"
				class="pt-qr-canvas"
				role="img"
				:aria-label="`QR code for ${text}`"
				data-testid="qr-generator-canvas"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="qr-code.svg" :disabled="outputText === ''" />
				<Button
					type="button"
					label="Download PNG"
					aria-label="Download the QR code as a PNG image"
					outlined
					:disabled="!generated.ok"
					data-testid="qr-generator-png"
					@click="downloadPng"
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

.pt-field-label + .p-inputtext {
	width: 100%;
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

.pt-qr-canvas {
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
