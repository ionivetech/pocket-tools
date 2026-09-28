<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref, watch } from "vue";
import { BrowserActionError, copyText } from "~/utils/browser-actions";
import { convertId, formatId, inspectId, runUuidGenerator } from "./logic";
import { uuidGeneratorMaxCount, uuidGeneratorMinCount, type UuidGeneratorVersion } from "./schema";
import type { IdConvertTarget } from "./logic";

const version = ref<UuidGeneratorVersion>("uuid-v4");
const count = ref(10);
const uppercase = ref(false);
const hyphens = ref(true);
const ids = ref<readonly string[]>([]);
const rowStatus = ref<Record<number, string>>({});

const converterInput = ref("");
const converted = ref("");
const converterError = ref("");

const versionOptions: readonly { label: string; value: UuidGeneratorVersion }[] = [
	{ label: "UUID v4 (random)", value: "uuid-v4" },
	{ label: "UUID v7 (time-ordered)", value: "uuid-v7" },
	{ label: "ULID", value: "ulid" },
];

const joinedIds = computed(() => displayedIds.value.join("\n"));
const isEmpty = computed(() => ids.value.length === 0);

const displayedIds = computed(() =>
	ids.value.map((id) => formatId(id, { uppercase: uppercase.value, hyphens: hyphens.value })),
);

const inspection = computed(() =>
	converterInput.value.trim() === "" ? null : inspectId(converterInput.value),
);

const inspectionText = computed(() => {
	if (inspection.value === null) {
		return "Paste a UUID or ULID above to inspect it.";
	}
	switch (inspection.value.kind) {
		case "invalid":
			return "That doesn't look like a UUID or ULID yet.";
		case "nil":
			return "Nil UUID — all zeros, with no timestamp.";
		case "uuid-v4":
			return "UUID version 4 — random, with no timestamp.";
		case "uuid-v7":
			return `UUID version 7 — created ${formatTimestamp(inspection.value.timestampMs)}.`;
		case "ulid":
			return `ULID — created ${formatTimestamp(inspection.value.timestampMs)}.`;
		case "uuid":
			return `UUID version ${inspection.value.version} — with no usable timestamp.`;
		default:
			return "That doesn't look like a UUID or ULID yet.";
	}
});

const showToUlid = computed(() => inspection.value?.kind === "uuid-v7");
const showToUuid = computed(() => inspection.value?.kind === "ulid");
const showTimestampHint = computed(
	() =>
		inspection.value !== null &&
		!showToUlid.value &&
		!showToUuid.value &&
		inspection.value.kind !== "invalid",
);

function formatTimestamp(timestampMs: number | null): string {
	if (timestampMs === null) {
		return "unknown time";
	}
	return new Date(timestampMs).toISOString();
}

function generate(): void {
	const result = runUuidGenerator({ version: version.value, count: count.value });
	ids.value = result.ok ? result.value.ids : [];
	rowStatus.value = {};
}

async function copyRow(index: number, value: string): Promise<void> {
	try {
		await copyText(value, typeof navigator === "undefined" ? undefined : navigator.clipboard);
		rowStatus.value = { ...rowStatus.value, [index]: "Copied." };
	} catch (error) {
		const message = error instanceof BrowserActionError ? error.message : "Copy failed. Try again.";
		rowStatus.value = { ...rowStatus.value, [index]: message };
	}
}

function convert(target: IdConvertTarget): void {
	converterError.value = "";
	const result = convertId(converterInput.value, target);
	if (result.ok) {
		converted.value = formatId(result.value.result, {
			uppercase: uppercase.value,
			hyphens: hyphens.value,
		});
		return;
	}
	converted.value = "";
	converterError.value = result.error.message;
}

watch(converterInput, () => {
	converted.value = "";
	converterError.value = "";
});

generate();
</script>

<template>
	<section class="pt-workspace" data-testid="uuid-generator" aria-label="Identifier generator">
		<div class="pt-workspace__toolbar">
			<fieldset class="pt-option-group">
				<legend>Generate</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" for="uuid-version">Identifier type</label>
					<Select
						id="uuid-version"
						v-model="version"
						:options="[...versionOptions]"
						option-label="label"
						option-value="value"
						data-testid="uuid-version"
					/>
					<div class="pt-uuid-count">
						<label class="pt-field-label" for="uuid-count">How many</label>
						<InputNumber
							input-id="uuid-count"
							v-model="count"
							:min="uuidGeneratorMinCount"
							:max="uuidGeneratorMaxCount"
							show-buttons
							button-layout="horizontal"
							data-testid="uuid-count"
						/>
					</div>
					<Button
						type="button"
						label="Generate"
						aria-label="Generate identifiers"
						data-testid="uuid-generate"
						@click="generate"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Display</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Uppercase letters"
						:aria-pressed="uppercase"
						:outlined="!uppercase"
						data-testid="uuid-uppercase"
						@click="uppercase = !uppercase"
					/>
					<Button
						type="button"
						label="Hyphen separators"
						:aria-pressed="hyphens"
						:outlined="!hyphens"
						data-testid="uuid-hyphens"
						@click="hyphens = !hyphens"
					/>
				</div>
			</fieldset>
		</div>

		<div class="pt-workspace__single">
			<div class="pt-uuid-results" aria-live="polite" aria-atomic="false">
				<p v-if="isEmpty" class="pt-uuid-empty" data-testid="uuid-generator-empty">
					Choose a type and count, then generate identifiers.
				</p>

				<template v-else>
					<ol class="pt-uuid-list" data-testid="uuid-generator-list">
						<li v-for="(id, index) in displayedIds" :key="ids[index]" class="pt-uuid-row">
							<code class="pt-uuid-value">{{ id }}</code>
							<Button
								type="button"
								label="Copy"
								:aria-label="`Copy identifier ${index + 1}`"
								size="small"
								outlined
								:data-testid="`uuid-copy-${index}`"
								@click="copyRow(index, id)"
							/>
							<span
								class="pt-sr-only"
								role="status"
								aria-live="polite"
								:data-testid="`uuid-copy-status-${index}`"
								>{{ rowStatus[index] }}</span
							>
						</li>
					</ol>

					<ToolActions :value="joinedIds" filename="identifiers.txt" />
				</template>
			</div>

			<fieldset class="pt-option-group">
				<legend>Convert between UUID v7 and ULID</legend>
				<label class="pt-field-label" for="uuid-converter-input">Paste an identifier</label>
				<InputText
					id="uuid-converter-input"
					v-model="converterInput"
					class="pt-converter-input"
					spellcheck="false"
					placeholder="Paste a UUID v7 or ULID here"
					data-testid="uuid-converter-input"
				/>
				<p
					class="pt-converter-info"
					role="status"
					aria-live="polite"
					aria-atomic="true"
					data-testid="uuid-converter-info"
				>
					{{ inspectionText }}
				</p>
				<div v-if="showToUlid || showToUuid" class="pt-option-group__controls">
					<Button
						v-if="showToUlid"
						type="button"
						label="Convert to ULID"
						aria-label="Convert to ULID keeping the timestamp"
						data-testid="uuid-convert-to-ulid"
						@click="convert('ulid')"
					/>
					<Button
						v-if="showToUuid"
						type="button"
						label="Convert to UUID v7"
						aria-label="Convert to UUID v7 keeping the timestamp"
						data-testid="uuid-convert-to-uuid"
						@click="convert('uuid-v7')"
					/>
				</div>
				<p v-if="showTimestampHint" class="pt-converter-hint">
					Conversion needs a UUID v7 or a ULID — only they carry a timestamp.
				</p>
				<p class="pt-converter-hint">
					Conversion keeps the timestamp and generates fresh randomness.
				</p>
				<p
					v-if="converterError"
					role="alert"
					class="pt-converter-error"
					data-testid="uuid-converter-error"
				>
					{{ converterError }}
				</p>
				<template v-if="converted">
					<code class="pt-uuid-value" data-testid="uuid-converter-output">{{ converted }}</code>
					<ToolActions :value="converted" filename="converted-id.txt" />
				</template>
			</fieldset>
		</div>
	</section>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-uuid-count {
	display: grid;
	gap: 0.4rem;
}

.pt-uuid-results {
	display: grid;
	gap: 1rem;
}

.pt-uuid-empty {
	margin: 0;
	color: var(--pt-muted);
}

.pt-uuid-list {
	display: grid;
	gap: 0.5rem;
	list-style: none;
	padding: 0;
	margin: 0;
}

.pt-uuid-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	min-height: 2.75rem;
}

.pt-uuid-value {
	font-family: var(--font-mono);
	font-size: 0.875rem;
	word-break: break-all;
	color: var(--pt-ink);
}

.pt-converter-input {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.875rem;
}

.pt-converter-info {
	margin: 0;
	color: var(--pt-blue-strong);
	font-size: 0.875rem;
	font-weight: 600;
}

.pt-converter-hint {
	margin: 0;
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-converter-error {
	margin: 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--pt-ink);
}
</style>
