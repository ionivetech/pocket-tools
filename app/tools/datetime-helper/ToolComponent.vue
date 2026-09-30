<script setup lang="ts">
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref, useId, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { DATETIME_MODES, runDatetimeHelper } from "./logic";
import type { DatetimeMode } from "./schema";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const value = ref(typeof initial.value === "string" ? initial.value : "");
const mode = ref<DatetimeMode>(initial.mode === "iso" ? "iso" : "timestamp");

const componentId = useId();
const valueId = `datetime-helper-value-${componentId}`;
const modeId = `datetime-helper-mode-${componentId}`;

const converted = computed(() => runDatetimeHelper({ value: value.value, mode: mode.value }));
const outputText = computed(() =>
	converted.value.ok
		? `${converted.value.value.local}\n${converted.value.value.utc}\n${converted.value.value.relative}`
		: "",
);

useToolHistoryRecorder("datetime-helper", value, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (value.value.trim() === "") {
		return "empty";
	}
	return converted.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (value.value.trim() === "") {
		return mode.value === "timestamp"
			? "Type a timestamp in seconds or milliseconds."
			: "Type a date, like 2026-09-30.";
	}
	return converted.value.ok ? "Date read." : converted.value.error.message;
});

function useNow(): void {
	value.value = mode.value === "timestamp" ? String(Date.now()) : new Date().toISOString();
}

function clearInput(): void {
	value.value = "";
}

watch(
	[value, mode],
	() => {
		const encoded = encodeUrlState({ value: value.value, mode: mode.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Timestamp or date" output-label="Plain reading">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Reading</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="modeId">Input kind</label>
					<Select
						:id="modeId"
						v-model="mode"
						:options="[...DATETIME_MODES]"
						aria-label="Input kind"
						data-testid="datetime-helper-mode"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Use now"
						aria-label="Fill in the current moment"
						outlined
						data-testid="datetime-helper-now"
						@click="useNow"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the input"
						outlined
						data-testid="datetime-helper-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="valueId">Type a value</label>
			<InputText
				:id="valueId"
				v-model="value"
				placeholder="1759190400 or 2026-09-30"
				autocomplete="off"
				data-testid="datetime-helper-input"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="datetime-helper-status"
			>
				{{ statusMessage }}
			</p>
			<dl v-if="converted.ok" class="pt-datetime-result" data-testid="datetime-helper-result">
				<div>
					<dt>Local time</dt>
					<dd>{{ converted.value.local }}</dd>
				</div>
				<div>
					<dt>UTC</dt>
					<dd>{{ converted.value.utc }}</dd>
				</div>
				<div>
					<dt>Relative</dt>
					<dd>{{ converted.value.relative }}</dd>
				</div>
				<div>
					<dt>Zone</dt>
					<dd>{{ converted.value.timezone }}</dd>
				</div>
			</dl>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="date.txt" :disabled="outputText === ''" />
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

.pt-datetime-result {
	display: grid;
	gap: 0.5rem;
	margin: 0;
}

.pt-datetime-result > div {
	display: grid;
	grid-template-columns: 6rem 1fr;
	gap: 0.5rem;
}

.pt-datetime-result dt {
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-datetime-result dd {
	margin: 0;
	font-weight: 600;
	word-break: break-word;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
