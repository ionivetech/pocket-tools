<script setup lang="ts">
import InputText from "primevue/inputtext";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runColorPicker } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const color = ref(typeof initial.color === "string" ? initial.color : "#1d4ed8");

const converted = computed(() => runColorPicker({ color: color.value }));
const outputText = computed(() =>
	converted.value.ok
		? `${converted.value.value.hex}\n${converted.value.value.rgb}\n${converted.value.value.hsl}`
		: "",
);

useToolHistoryRecorder("color-picker", color, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (color.value.trim() === "") {
		return "empty";
	}
	return converted.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (color.value.trim() === "") {
		return "Type a color or pick one below.";
	}
	if (converted.value.ok) {
		const { contrastWhite, contrastBlack, readableOn } = converted.value.value;
		return `Reads best on ${readableOn} text (${contrastWhite}:1 on white, ${contrastBlack}:1 on black).`;
	}
	return converted.value.error.message;
});

function loadSample(): void {
	color.value = "#1d4ed8";
}

function clearInput(): void {
	color.value = "";
}

watch(
	[color],
	() => {
		const encoded = encodeUrlState({ color: color.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Color" output-label="Values">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load a sample color"
						outlined
						data-testid="color-picker-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the color"
						outlined
						data-testid="color-picker-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="color-picker-input">Type a color</label>
			<InputText
				id="color-picker-input"
				v-model="color"
				placeholder="#1d4ed8 or rgb(29, 78, 216)"
				autocomplete="off"
				data-testid="color-picker-input"
			/>
			<label class="pt-field-label" for="color-picker-native">Or pick one</label>
			<input
				id="color-picker-native"
				v-model="color"
				type="color"
				aria-label="Pick a color"
				data-testid="color-picker-native"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="color-picker-status"
			>
				{{ statusMessage }}
			</p>
			<div v-if="converted.ok" class="pt-color-result" data-testid="color-picker-result">
				<span
					class="pt-color-swatch"
					:style="{ backgroundColor: converted.value.hex }"
					aria-hidden="true"
				/>
				<ul aria-label="Color values">
					<li>
						<span>HEX</span>
						<code>{{ converted.value.hex }}</code>
					</li>
					<li>
						<span>RGB</span>
						<code>{{ converted.value.rgb }}</code>
					</li>
					<li>
						<span>HSL</span>
						<code>{{ converted.value.hsl }}</code>
					</li>
				</ul>
			</div>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="color.txt" :disabled="outputText === ''" />
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

.pt-color-result {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
}

.pt-color-swatch {
	flex: 0 0 3.5rem;
	width: 3.5rem;
	height: 3.5rem;
	border: 1px solid var(--pt-line);
	border-radius: var(--radius-control);
}

.pt-color-result ul {
	display: grid;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.pt-color-result li {
	display: grid;
	grid-template-columns: 3rem 1fr;
	gap: 0.5rem;
	align-items: baseline;
}

.pt-color-result li > span {
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-color-result code {
	font-family: var(--font-mono);
	font-size: 0.85rem;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
