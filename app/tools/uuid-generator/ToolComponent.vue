<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { computed, ref } from "vue";
import { convertId, formatId, inspectId, runUuidGenerator } from "./logic";
import { uuidGeneratorMaxCount, uuidGeneratorMinCount, type UuidGeneratorVersion } from "./schema";
import type { IdConvertTarget } from "./logic";

const version = ref<UuidGeneratorVersion>("uuid-v4");
const count = ref(1);
const uppercase = ref(false);
const hyphens = ref(true);
const ids = ref<readonly string[]>([]);

const toUlidInput = ref("");
const toUuidInput = ref("");

const versionOptions: readonly { label: string; value: UuidGeneratorVersion }[] = [
	{ label: "UUID v4 (random)", value: "uuid-v4" },
	{ label: "UUID v7 (time-ordered)", value: "uuid-v7" },
	{ label: "ULID", value: "ulid" },
];

const displayOptions = computed(() => ({ uppercase: uppercase.value, hyphens: hyphens.value }));
const displayedIds = computed(() => ids.value.map((id) => formatId(id, displayOptions.value)));
const joinedIds = computed(() => displayedIds.value.join("\n"));
const resultRows = computed(() => Math.min(Math.max(displayedIds.value.length, 1), 10));

function formatTimestamp(timestampMs: number | null): string {
	if (timestampMs === null) {
		return "unknown time";
	}
	return new Date(timestampMs).toISOString();
}

function generate(): void {
	const result = runUuidGenerator({ version: version.value, count: count.value });
	ids.value = result.ok ? result.value.ids : [];
}

type Conversion = Readonly<{ text: string; info: string; error: string }>;

function convert(input: string, target: IdConvertTarget): Conversion {
	const trimmed = input.trim();
	if (trimmed === "") {
		return {
			text: "",
			info:
				target === "ulid"
					? "Paste a UUID v7 above to convert it."
					: "Paste a ULID above to convert it.",
			error: "",
		};
	}
	const inspected = inspectId(trimmed);
	if (inspected.kind === "invalid") {
		return { text: "", info: "", error: "That doesn't look like a UUID or ULID yet." };
	}
	if (inspected.kind !== "uuid-v7" && inspected.kind !== "ulid") {
		return {
			text: "",
			info: "",
			error: "Conversion needs a UUID v7 or a ULID — only they carry a timestamp.",
		};
	}
	const result = convertId(trimmed, target);
	if (!result.ok) {
		return { text: "", info: "", error: result.error.message };
	}
	const label = target === "ulid" ? "ULID" : "UUID v7";
	return {
		text: formatId(result.value.result, displayOptions.value),
		info: `${label} · created ${formatTimestamp(result.value.timestampMs)} · timestamp preserved, randomness is fresh.`,
		error: "",
	};
}

const toUlid = computed(() => convert(toUlidInput.value, "ulid"));
const toUuid = computed(() => convert(toUuidInput.value, "uuid-v7"));

generate();
</script>

<template>
	<section class="pt-workspace" data-testid="uuid-generator" aria-label="Identifier generator">
		<div class="pt-workspace__toolbar">
			<fieldset class="pt-option-group">
				<legend>Generate identifiers</legend>
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
					<label class="pt-sr-only" for="uuid-count">How many</label>
					<InputNumber
						input-id="uuid-count"
						v-model="count"
						:min="uuidGeneratorMinCount"
						:max="uuidGeneratorMaxCount"
						show-buttons
						button-layout="horizontal"
						aria-label="How many identifiers"
						data-testid="uuid-count"
					/>
					<ToolSwitch v-model="uppercase" label="Uppercase letters" testid="uuid-uppercase" />
					<ToolSwitch v-model="hyphens" label="Hyphen separators" testid="uuid-hyphens" />
					<Button
						type="button"
						label="Generate"
						aria-label="Generate identifiers"
						data-testid="uuid-generate"
						@click="generate"
					/>
				</div>
			</fieldset>
		</div>

		<div class="pt-workspace__single">
			<div class="pt-uuid-results">
				<label class="pt-field-label" for="uuid-generator-output">Generated identifiers</label>
				<Textarea
					id="uuid-generator-output"
					readonly
					:rows="resultRows"
					class="pt-uuid-output"
					:model-value="joinedIds"
					aria-label="Generated identifiers"
					data-testid="uuid-generator-output"
				/>
				<ToolActions :value="joinedIds" filename="identifiers.txt" />
			</div>

			<div class="pt-convert-grid">
				<section class="pt-convert-card" aria-labelledby="uuid-to-ulid-title">
					<h3 id="uuid-to-ulid-title">UUID to ULID</h3>
					<label class="pt-field-label" for="uuid-to-ulid-input">Paste a UUID v7</label>
					<InputText
						id="uuid-to-ulid-input"
						v-model="toUlidInput"
						class="pt-convert-card__input"
						spellcheck="false"
						placeholder="Paste a UUID v7 here"
						data-testid="uuid-to-ulid-input"
					/>
					<p
						class="pt-convert-card__info"
						role="status"
						aria-live="polite"
						aria-atomic="true"
						data-testid="uuid-to-ulid-info"
					>
						{{ toUlid.info }}
					</p>
					<p
						v-if="toUlid.error"
						class="pt-convert-card__error"
						role="alert"
						data-testid="uuid-to-ulid-error"
					>
						{{ toUlid.error }}
					</p>
					<code v-if="toUlid.text" class="pt-uuid-value" data-testid="uuid-to-ulid-output">{{
						toUlid.text
					}}</code>
				</section>

				<section class="pt-convert-card" aria-labelledby="ulid-to-uuid-title">
					<h3 id="ulid-to-uuid-title">ULID to UUID</h3>
					<label class="pt-field-label" for="ulid-to-uuid-input">Paste a ULID</label>
					<InputText
						id="ulid-to-uuid-input"
						v-model="toUuidInput"
						class="pt-convert-card__input"
						spellcheck="false"
						placeholder="Paste a ULID here"
						data-testid="ulid-to-uuid-input"
					/>
					<p
						class="pt-convert-card__info"
						role="status"
						aria-live="polite"
						aria-atomic="true"
						data-testid="ulid-to-uuid-info"
					>
						{{ toUuid.info }}
					</p>
					<p
						v-if="toUuid.error"
						class="pt-convert-card__error"
						role="alert"
						data-testid="ulid-to-uuid-error"
					>
						{{ toUuid.error }}
					</p>
					<code v-if="toUuid.text" class="pt-uuid-value" data-testid="ulid-to-uuid-output">{{
						toUuid.text
					}}</code>
				</section>
			</div>
			<p class="pt-converter-hint">
				Conversion keeps the timestamp and generates fresh randomness.
			</p>
		</div>
	</section>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-uuid-results {
	display: grid;
	gap: 0.75rem;
}

.pt-uuid-output {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.875rem;
}

.pt-convert-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1rem;
}

.pt-convert-card {
	display: grid;
	gap: 0.75rem;
	align-content: start;
	padding: 1.25rem;
	border: 1px solid var(--pt-line);
	border-radius: var(--radius-control);
	background: color-mix(in srgb, var(--pt-blue) 3%, var(--pt-surface));
}

.pt-convert-card h3 {
	margin: 0;
	font-family: var(--font-display);
	font-size: 1.05rem;
	letter-spacing: -0.02em;
}

.pt-convert-card__input {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.875rem;
}

.pt-convert-card__info {
	margin: 0;
	color: var(--pt-blue-strong);
	font-size: 0.82rem;
	font-weight: 600;
}

.pt-convert-card__error {
	margin: 0;
	font-size: 0.82rem;
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-converter-hint {
	margin: 0;
	color: var(--pt-muted);
	font-size: 0.8rem;
}

.pt-uuid-value {
	font-family: var(--font-mono);
	font-size: 0.875rem;
	word-break: break-all;
	color: var(--pt-ink);
}

@media (max-width: 767px) {
	.pt-convert-grid {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
