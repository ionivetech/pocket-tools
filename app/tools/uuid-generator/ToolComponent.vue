<script setup lang="ts">
import { computed, ref } from "vue";
import { BrowserActionError, copyText } from "~/utils/browser-actions";
import { runUuidGenerator } from "./logic";
import { uuidGeneratorMaxCount, uuidGeneratorMinCount, type UuidGeneratorVersion } from "./schema";

const version = ref<UuidGeneratorVersion>("uuid-v4");
const count = ref(10);
const ids = ref<readonly string[]>([]);
const rowStatus = ref<Record<number, string>>({});

const versionOptions: readonly { label: string; value: UuidGeneratorVersion }[] = [
	{ label: "UUID v4 (random)", value: "uuid-v4" },
	{ label: "UUID v7 (time-ordered)", value: "uuid-v7" },
	{ label: "ULID", value: "ulid" },
];

const joinedIds = computed(() => ids.value.join("\n"));
const isEmpty = computed(() => ids.value.length === 0);

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

generate();
</script>

<template>
	<section class="pt-uuid-tool" data-testid="uuid-generator">
		<div class="pt-uuid-controls">
			<label class="pt-field-label" for="uuid-version">Identifier type</label>
			<Select
				id="uuid-version"
				v-model="version"
				:options="[...versionOptions]"
				option-label="label"
				option-value="value"
				data-testid="uuid-version"
			/>

			<label class="pt-field-label" for="uuid-count">How many</label>
			<InputNumber
				id="uuid-count"
				v-model="count"
				:min="uuidGeneratorMinCount"
				:max="uuidGeneratorMaxCount"
				show-buttons
				button-layout="horizontal"
				data-testid="uuid-count"
			/>

			<Button
				type="button"
				label="Generate"
				aria-label="Generate identifiers"
				data-testid="uuid-generate"
				@click="generate"
			/>
		</div>

		<p v-if="isEmpty" class="pt-uuid-empty" data-testid="uuid-generator-empty">
			Choose a type and count, then generate identifiers.
		</p>

		<template v-else>
			<ol class="pt-uuid-list" data-testid="uuid-generator-list">
				<li v-for="(id, index) in ids" :key="id" class="pt-uuid-row">
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
	</section>
</template>

<style scoped>
.pt-field-label {
	font-weight: 600;
	color: var(--pt-ink);
}

.pt-uuid-controls {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	align-items: center;
	margin-bottom: 1.25rem;
}

.pt-uuid-empty {
	color: var(--pt-muted);
}

.pt-uuid-list {
	display: grid;
	gap: 0.5rem;
	list-style: none;
	padding: 0;
	margin: 0 0 1rem 0;
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
</style>
