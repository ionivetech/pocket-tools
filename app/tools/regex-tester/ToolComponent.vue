<script setup lang="ts">
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import { computed, ref, useId, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { runRegexTester } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const pattern = ref(typeof initial.pattern === "string" ? initial.pattern : "");
const flags = ref(typeof initial.flags === "string" ? initial.flags : "");
const sample = ref(typeof initial.sample === "string" ? initial.sample : "");

const componentId = useId();
const patternId = `regex-tester-pattern-${componentId}`;
const flagsId = `regex-tester-flags-${componentId}`;

const tested = computed(() =>
	runRegexTester({ pattern: pattern.value, flags: flags.value, sample: sample.value }),
);
const matchText = computed(() =>
	tested.value.ok ? tested.value.value.matches.map((match) => match.text).join("\n") : "",
);

useToolHistoryRecorder("regex-tester", sample, matchText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (pattern.value === "") {
		return "empty";
	}
	return tested.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (pattern.value === "") {
		return "Type a search pattern to test it live.";
	}
	if (tested.value.ok) {
		const { matches, truncated } = tested.value.value;
		const count = matches.length === 1 ? "1 match" : `${matches.length} matches`;
		return truncated ? `${count} (showing the first 100).` : `${count}.`;
	}
	return tested.value.error.message;
});

function loadSample(): void {
	pattern.value = "Order #(\\d+)";
	flags.value = "";
	sample.value = "Order #42 ships Monday. Order #7 ships Friday.";
}

function clearInput(): void {
	pattern.value = "";
	flags.value = "";
	sample.value = "";
}

watch(
	[pattern, flags, sample],
	() => {
		const encoded = encodeUrlState({
			pattern: pattern.value,
			flags: flags.value,
			sample: sample.value,
		});
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Pattern and sample" output-label="Matches">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load a sample pattern"
						outlined
						data-testid="regex-tester-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear pattern and sample"
						outlined
						data-testid="regex-tester-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="patternId">Search pattern</label>
			<InputText
				:id="patternId"
				v-model="pattern"
				placeholder="Order #(\d+)"
				autocomplete="off"
				data-testid="regex-tester-pattern"
			/>
			<label class="pt-field-label" :for="flagsId">Option letters</label>
			<InputText
				:id="flagsId"
				v-model="flags"
				placeholder="i for any case, m for every line"
				autocomplete="off"
				data-testid="regex-tester-flags"
			/>
			<p class="pt-input-hint">Letters allowed: d g i m s u y. JavaScript patterns only.</p>
			<label class="pt-field-label" for="regex-tester-sample">Text to search</label>
			<Textarea
				id="regex-tester-sample"
				v-model="sample"
				rows="5"
				auto-resize
				placeholder="Paste the text to search here"
				data-testid="regex-tester-sample-input"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="regex-tester-status"
			>
				{{ statusMessage }}
			</p>
			<ol
				v-if="tested.ok && tested.value.matches.length > 0"
				class="pt-regex-matches"
				data-testid="regex-tester-matches"
			>
				<li v-for="(match, index) in tested.value.matches" :key="`${match.index}-${index}`">
					<code class="pt-regex-hit">{{ match.text }}</code>
					<small>at {{ match.index }}</small>
					<span v-if="match.groups.length > 0" class="pt-regex-groups">
						<code v-for="(group, groupIndex) in match.groups" :key="groupIndex">{{
							group ?? "—"
						}}</code>
					</span>
				</li>
			</ol>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="matchText" filename="regex-matches.txt" :disabled="matchText === ''" />
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

.pt-field-label + .p-inputtext,
.pt-field-label + .p-textarea {
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

.pt-regex-matches {
	display: grid;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.pt-regex-matches li {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 0.5rem;
}

.pt-regex-matches small {
	color: var(--pt-muted);
}

.pt-regex-hit {
	font-family: var(--font-mono);
	font-size: 0.85rem;
}

.pt-regex-groups {
	display: inline-flex;
	gap: 0.25rem;
}

.pt-regex-groups code {
	font-family: var(--font-mono);
	font-size: 0.75rem;
	color: var(--pt-muted);
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
