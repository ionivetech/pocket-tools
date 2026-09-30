<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import { computed, ref, useId, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { listUnitCategories, listUnits, runUnitConverter, type UnitCategory } from "./logic";

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const categories = listUnitCategories();
const category = ref<UnitCategory>(
	categories.includes(initial.category as UnitCategory)
		? (initial.category as UnitCategory)
		: "length",
);
const amount = ref(typeof initial.amount === "number" ? initial.amount : 1);
const from = ref(typeof initial.from === "string" ? initial.from : "km");
const to = ref(typeof initial.to === "string" ? initial.to : "m");

const componentId = useId();
const categoryId = `unit-converter-category-${componentId}`;
const amountId = `unit-converter-amount-${componentId}`;
const fromId = `unit-converter-from-${componentId}`;
const toId = `unit-converter-to-${componentId}`;

const unitOptions = computed(() => listUnits(category.value));

const converted = computed(() =>
	runUnitConverter({ amount: amount.value ?? 0, from: from.value, to: to.value }),
);
const inputText = computed(() => `${amount.value ?? 0} ${from.value} to ${to.value}`);
const outputText = computed(() => (converted.value.ok ? converted.value.value.formula : ""));

useToolHistoryRecorder("unit-converter", inputText, outputText);

const statusKind = computed<"empty" | "error" | "success">(() =>
	converted.value.ok ? "success" : "error",
);

const statusMessage = computed(() =>
	converted.value.ok ? "Converted." : converted.value.error.message,
);

function resetUnits(): void {
	const options = listUnits(category.value);
	from.value = options[0]?.unit ?? "";
	to.value = options[1]?.unit ?? options[0]?.unit ?? "";
}

function swapUnits(): void {
	const previous = from.value;
	from.value = to.value;
	to.value = previous;
}

watch(category, resetUnits);

watch(
	[amount, from, to, category],
	() => {
		const encoded = encodeUrlState({
			amount: amount.value ?? 0,
			from: from.value,
			to: to.value,
			category: category.value,
		});
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Amount and units" output-label="Result">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Group</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" :for="categoryId">Unit group</label>
					<Select
						:id="categoryId"
						v-model="category"
						:options="categories"
						aria-label="Unit group"
						data-testid="unit-converter-category"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Action</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Swap units"
						aria-label="Swap from and to units"
						outlined
						data-testid="unit-converter-swap"
						@click="swapUnits"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" :for="amountId">Amount</label>
			<InputNumber
				:id="amountId"
				v-model="amount"
				aria-label="Amount to convert"
				data-testid="unit-converter-amount"
			/>
			<div class="pt-unit-picks">
				<div>
					<label class="pt-field-label" :for="fromId">From</label>
					<Select
						:id="fromId"
						v-model="from"
						:options="unitOptions"
						option-label="label"
						option-value="unit"
						aria-label="From unit"
						data-testid="unit-converter-from"
					/>
				</div>
				<div>
					<label class="pt-field-label" :for="toId">To</label>
					<Select
						:id="toId"
						v-model="to"
						:options="unitOptions"
						option-label="label"
						option-value="unit"
						aria-label="To unit"
						data-testid="unit-converter-to"
					/>
				</div>
			</div>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="unit-converter-status"
			>
				{{ statusMessage }}
			</p>
			<p v-if="converted.ok" class="pt-unit-formula" data-testid="unit-converter-result">
				{{ converted.value.formula }}
			</p>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="conversion.txt" :disabled="outputText === ''" />
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

.pt-unit-picks {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.75rem;
	margin-top: 0.75rem;
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

.pt-unit-formula {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 700;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
