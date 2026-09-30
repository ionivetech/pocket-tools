<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { computed, onMounted, ref } from "vue";
import { PASSWORD_LENGTH_MAX, PASSWORD_LENGTH_MIN } from "./schema";
import { runPasswordGenerator } from "./logic";

const length = ref(16);
const lower = ref(true);
const upper = ref(true);
const digits = ref(true);
const symbols = ref(false);
const excludeAmbiguous = ref(true);

const password = ref("");
const error = ref<string | null>(null);

let lastEntropy = 0;
let lastStrength = "";

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (error.value !== null) {
		return "error";
	}
	return password.value === "" ? "empty" : "success";
});

const statusMessage = computed(() => {
	if (error.value !== null) {
		return error.value;
	}
	if (password.value === "") {
		return "Choose the mix and press Generate.";
	}
	return `Ready — ${lastEntropy} bits of randomness (${lastStrength}). Nothing is stored or shared.`;
});

function generate(): void {
	const result = runPasswordGenerator({
		length: length.value,
		lower: lower.value,
		upper: upper.value,
		digits: digits.value,
		symbols: symbols.value,
		excludeAmbiguous: excludeAmbiguous.value,
	});
	if (result.ok) {
		password.value = result.value.password;
		lastEntropy = result.value.entropyBits;
		lastStrength = result.value.strength === "ok" ? "solid" : result.value.strength;
		error.value = null;
	} else {
		error.value = result.error.message;
		password.value = "";
	}
}

onMounted(generate);
</script>

<template>
	<ToolDualPane input-label="Recipe" output-label="Password">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Length</legend>
				<div class="pt-option-group__controls">
					<label class="pt-sr-only" for="password-generator-length">Password length</label>
					<InputNumber
						id="password-generator-length"
						v-model="length"
						:min="PASSWORD_LENGTH_MIN"
						:max="PASSWORD_LENGTH_MAX"
						aria-label="Password length"
						data-testid="password-generator-length"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Characters</legend>
				<div class="pt-option-group__controls">
					<ToolSwitch v-model="lower" label="Lowercase" testid="password-generator-lower" />
					<ToolSwitch v-model="upper" label="Uppercase" testid="password-generator-upper" />
					<ToolSwitch v-model="digits" label="Digits" testid="password-generator-digits" />
					<ToolSwitch v-model="symbols" label="Symbols" testid="password-generator-symbols" />
					<ToolSwitch
						v-model="excludeAmbiguous"
						label="Skip lookalikes"
						testid="password-generator-no-ambiguous"
					/>
				</div>
			</fieldset>

			<fieldset class="pt-option-group">
				<legend>Action</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Generate"
						aria-label="Generate a password"
						data-testid="password-generator-generate"
						@click="generate"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<p class="pt-input-hint">
				Everything happens in this browser. Generated passwords are never saved, logged, or shared.
			</p>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				aria-atomic="true"
				data-testid="password-generator-status"
			>
				{{ statusMessage }}
			</p>
			<label class="pt-field-label" for="password-generator-output">Generated password</label>
			<InputText
				id="password-generator-output"
				readonly
				:model-value="password"
				aria-label="Generated password"
				data-testid="password-generator-output"
			/>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="password" filename="password.txt" :disabled="password === ''" />
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
	word-break: break-word;
}

.pt-tool-status[data-kind="error"] {
	font-weight: 600;
}

.pt-tool-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
