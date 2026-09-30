<script setup lang="ts">
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref, useId, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runCronHelper } from "./logic";

const PRESETS = [
	{ label: "Custom", value: "" },
	{ label: "Every minute", value: "* * * * *" },
	{ label: "Every hour", value: "0 * * * *" },
	{ label: "Daily at 09:00", value: "0 9 * * *" },
	{ label: "Weekdays at 09:30", value: "30 9 * * 1-5" },
	{ label: "Mondays at 09:00", value: "0 9 * * 1" },
	{ label: "Monthly on the 1st", value: "0 9 1 * *" },
] as const;

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const expression = ref(typeof initial.expression === "string" ? initial.expression : "");
const preset = ref("");

const componentId = useId();
const expressionId = `cron-helper-expression-${componentId}`;
const presetId = `cron-helper-preset-${componentId}`;

const parsed = computed(() => runCronHelper({ expression: expression.value }));
const outputText = computed(() =>
	parsed.value.ok
		? `${parsed.value.value.description}\n${parsed.value.value.nextRuns.join("\n")}`
		: "",
);

useToolHistoryRecorder("cron-helper", expression, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (expression.value.trim() === "") {
		return "empty";
	}
	return parsed.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (expression.value.trim() === "") {
		return "Type a schedule, or start from a preset below.";
	}
	if (parsed.value.ok) {
		return parsed.value.value.nextRuns.length > 0
			? "Valid schedule."
			: "Valid schedule, but nothing runs in the next year.";
	}
	return parsed.value.error.message;
});

function applyPreset(value: string): void {
	if (value !== "") {
		expression.value = value;
	}
}

function loadSample(): void {
	expression.value = "30 9 * * 1-5";
	preset.value = "";
}

function clearInput(): void {
	expression.value = "";
	preset.value = "";
}

watch(
	[expression],
	() => {
		const encoded = encodeUrlState({ expression: expression.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Schedule" output-label="Plain words">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Preset</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="presetId">Schedule preset</label>
					<Select
						:id="presetId"
						v-model="preset"
						:options="[...PRESETS]"
						option-label="label"
						option-value="value"
						aria-label="Schedule preset"
						data-testid="cron-helper-preset"
						@change="applyPreset(preset)"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load a sample schedule"
						outlined
						data-testid="cron-helper-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the schedule"
						outlined
						data-testid="cron-helper-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="expressionId">Cron expression</label>
			<InputText
				:id="expressionId"
				v-model="expression"
				placeholder="30 9 * * 1-5"
				autocomplete="off"
				data-testid="cron-helper-expression"
			/>
			<p class="pt-input-hint">Five parts. Use * for any, */15 for steps, 1-5 for ranges.</p>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="cron-helper-status"
			>
				{{ statusMessage }}
			</p>
			<div v-if="parsed.ok" class="pt-cron-result" data-testid="cron-helper-result">
				<p class="pt-cron-description">{{ parsed.value.description }}</p>
				<ul v-if="parsed.value.nextRuns.length > 0" aria-label="Next runs">
					<li v-for="run in parsed.value.nextRuns" :key="run">{{ run }}</li>
				</ul>
				<p class="pt-input-hint">Times shown in {{ parsed.value.timezone }}.</p>
			</div>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="schedule.txt" :disabled="outputText === ''" />
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

.pt-cron-result {
	display: grid;
	gap: 0.5rem;
}

.pt-cron-description {
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
}

.pt-cron-result ul {
	margin: 0;
	padding-left: 1.25rem;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
