<script setup lang="ts">
import Textarea from "primevue/textarea";
import { computed, ref, watch } from "vue";
import { useToolHistoryRecorder } from "~/composables/use-tool-history";
import { decodeUrlState, encodeUrlState } from "~/utils/url-state";
import { decodeJwt } from "./logic";

const sampleToken = [
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
	"eyJzdWIiOiIxMjMiLCJuYW1lIjoiVGVzdCBVc2VyIn0",
	"c2lnbmF0dXJl",
].join(".");

const route = useRoute();
const router = useRouter();

const shared = decodeUrlState(
	Array.isArray(route.query.s) ? (route.query.s[0] ?? null) : (route.query.s ?? null),
);
const initial = shared.ok ? shared.value : {};

const token = ref(typeof initial.token === "string" ? initial.token : "");

const decoded = computed(() => decodeJwt(token.value));
const outputText = computed(() =>
	decoded.value.ok ? JSON.stringify(decoded.value.value.payload, null, 2) : "",
);

useToolHistoryRecorder("jwt-decoder", token, outputText);

const statusKind = computed<"empty" | "error" | "success">(() => {
	if (token.value.trim() === "") {
		return "empty";
	}
	return decoded.value.ok ? "success" : "error";
});

const statusMessage = computed(() => {
	if (statusKind.value === "empty") {
		return "Paste a login token to read its header and payload.";
	}
	if (decoded.value.ok) {
		const { algorithm, signaturePresent } = decoded.value.value;
		const algo = algorithm ? `Signed with ${algorithm}.` : "No signing method listed.";
		return signaturePresent
			? `Valid shape. ${algo} The signature is shown, never checked.`
			: `Valid shape, no signature part. ${algo}`;
	}
	return decoded.value.error.message;
});

const headerText = computed(() =>
	decoded.value.ok ? JSON.stringify(decoded.value.value.header, null, 2) : "",
);

function loadSample(): void {
	token.value = sampleToken;
}

function clearInput(): void {
	token.value = "";
}

watch(
	[token],
	() => {
		const encoded = encodeUrlState({ token: token.value });
		router.replace({ query: { ...route.query, s: encoded.ok ? encoded.value : undefined } });
	},
	{ flush: "post" },
);
</script>

<template>
	<ToolDualPane input-label="Login token" output-label="Decoded content">
		<template #toolbar>
			<fieldset class="pt-option-group">
				<legend>Content</legend>
				<div class="pt-option-group__controls">
					<Button
						type="button"
						label="Load sample"
						aria-label="Load a sample token"
						outlined
						data-testid="jwt-decoder-sample"
						@click="loadSample"
					/>
					<Button
						type="button"
						label="Clear input"
						aria-label="Clear the token input"
						outlined
						data-testid="jwt-decoder-clear"
						@click="clearInput"
					/>
				</div>
			</fieldset>
		</template>

		<template #input>
			<label class="pt-field-label" for="jwt-decoder-input">Paste the token</label>
			<Textarea
				id="jwt-decoder-input"
				v-model="token"
				rows="5"
				auto-resize
				placeholder="eyJhbGciOi…"
				data-testid="jwt-decoder-input"
			/>
		</template>

		<template #output>
			<p
				class="pt-tool-status"
				:data-kind="statusKind"
				:role="statusKind === 'error' ? 'alert' : 'status'"
				:aria-live="statusKind === 'error' ? 'assertive' : 'polite'"
				aria-atomic="true"
				data-testid="jwt-decoder-status"
			>
				{{ statusMessage }}
			</p>

			<div v-if="decoded.ok" class="pt-jwt-parts">
				<div>
					<label class="pt-field-label" for="jwt-decoder-header">Header</label>
					<Textarea
						id="jwt-decoder-header"
						readonly
						rows="3"
						:model-value="headerText"
						aria-label="Token header"
						data-testid="jwt-decoder-header"
					/>
				</div>
				<div>
					<label class="pt-field-label" for="jwt-decoder-payload">Payload</label>
					<Textarea
						id="jwt-decoder-payload"
						readonly
						rows="6"
						:model-value="outputText"
						aria-label="Token payload"
						data-testid="jwt-decoder-payload"
					/>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="pt-output-actions">
				<ToolActions :value="outputText" filename="token-payload.json" :disabled="!decoded.ok" />
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
	margin: 0;
	font-size: 0.875rem;
	color: var(--pt-ink);
}

.pt-tool-status[data-kind="error"] {
	font-weight: 600;
}

.pt-tool-status[data-kind="success"] {
	color: var(--pt-blue-strong);
}

.pt-jwt-parts {
	display: grid;
	gap: 1rem;
}

.pt-jwt-parts .p-textarea {
	width: 100%;
	font-family: var(--font-mono);
	font-size: 0.8rem;
}

.pt-output-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
}
</style>
