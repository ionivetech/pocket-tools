<script setup lang="ts">
import Textarea from "primevue/textarea";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runDiffChecker } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const original = ref(typeof initial.original === "string" ? initial.original : "");
const changed = ref(typeof initial.changed === "string" ? initial.changed : "");
const ignoreWhitespace = ref(initial.ignoreWhitespace === true);

const compared = computed(() =>
	runDiffChecker({
		original: original.value,
		changed: changed.value,
		ignoreWhitespace: ignoreWhitespace.value,
	}),
);
const outputText = computed(() =>
	compared.value.ok
		? compared.value.value.rows
				.filter((row) => row.type !== "same")
				.map((row) => `${row.type === "del" ? "− " : "+ "}${row.text}`)
				.join("\n")
		: "",
);

useToolHistoryRecorder("diff-checker", original, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (original.value === "" && changed.value === "") {
		return "empty";
	}
	return compared.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (original.value === "" && changed.value === "") {
		return "Paste both versions to compare them line by line.";
	}
	if (compared.value.ok) {
		const { added, removed } = compared.value.value;
		if (added === 0 && removed === 0) {
			return "No differences. The two texts match.";
		}
		const parts: string[] = [];
		if (removed > 0) {
			parts.push(`${removed} removed`);
		}
		if (added > 0) {
			parts.push(`${added} added`);
		}
		return `${parts.join(", ")}.`;
	}
	return compared.value.error.message;
});

function loadSample(): void {
	original.value = "Buy milk\nBuy eggs\nCall mom";
	changed.value = "Buy milk\nBuy bread\nCall mom";
}

function clearInput(): void {
	original.value = "";
	changed.value = "";
}

watch(
	[original, changed, ignoreWhitespace],
	() => {
		const encoded = encodeUrlState({
			original: original.value,
			changed: changed.value,
			ignoreWhitespace: ignoreWhitespace.value,
		});
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Two versions" output-label="Differences">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Options</legend>
				<div class="pt-option-group__controls">
					<ToolSwitch
						v-model="ignoreWhitespace"
						label="Ignore spacing"
						testid="diff-checker-ignore-whitespace"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load sample texts"
						outlined
						data-testid="diff-checker-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear both texts"
						outlined
						data-testid="diff-checker-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="diff-checker-original">Original text</label>
			<Textarea
				id="diff-checker-original"
				v-model="original"
				rows="5"
				auto-resize
				placeholder="The older version"
				data-testid="diff-checker-original"
			/>
			<label class="pt-field-label" for="diff-checker-changed">Changed text</label>
			<Textarea
				id="diff-checker-changed"
				v-model="changed"
				rows="5"
				auto-resize
				placeholder="The newer version"
				data-testid="diff-checker-changed"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="diff-checker-status"
			>
				{{ statusMessage }}
			</p>
			<ul
				v-if="compared.ok && compared.value.rows.length > 0"
				class="pt-diff-rows"
				aria-label="Line differences"
				data-testid="diff-checker-rows"
			>
				<li
					v-for="(row, index) in compared.value.rows"
					:key="index"
					class="pt-diff-row"
					:data-type="row.type"
				>
					<span class="pt-diff-marker" aria-hidden="true">{{
						row.type === "del" ? "−" : row.type === "add" ? "+" : "·"
					}}</span>
					<code>{{ row.text === "" ? "∅" : row.text }}</code>
				</li>
			</ul>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="diff.txt" :disabled="outputText === ''" />
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

.pt-diff-rows {
	display: grid;
	gap: 0.25rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.pt-diff-row {
	display: flex;
	gap: 0.5rem;
	align-items: baseline;
}

.pt-diff-row code {
	font-family: var(--font-mono);
	font-size: 0.8rem;
	word-break: break-word;
}

.pt-diff-row[data-type="del"] code {
	font-weight: 600;
	text-decoration: line-through;
}

.pt-diff-row[data-type="add"] code {
	font-weight: 700;
}

.pt-diff-marker {
	flex: 0 0 1rem;
	font-weight: 700;
	color: var(--pt-muted);
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
