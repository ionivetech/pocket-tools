<script setup lang="ts">
import { BrowserActionError, copyText, downloadText } from "~/utils/browser-actions";

const props = withDefaults(
	defineProps<{
		value: string;
		filename?: string;
		disabled?: boolean;
	}>(),
	{ filename: "download.txt", disabled: false },
);

const emit = defineEmits<{
	copy: [];
	download: [];
	error: [error: BrowserActionError];
}>();

const copyPending = ref(false);
const status = ref("");
const statusState = ref<"idle" | "success" | "error">("idle");

function clearStatus(): void {
	status.value = "";
	statusState.value = "idle";
}

function reportError(error: unknown, fallback: BrowserActionError): void {
	const actionError = error instanceof BrowserActionError ? error : fallback;
	statusState.value = "error";

	if (actionError.code === "clipboard_unavailable") {
		status.value = "Copy failed. Check clipboard access and try again.";
	} else if (actionError.code === "invalid_filename") {
		status.value = "Download failed. Choose a valid filename and try again.";
	} else {
		status.value = "Download failed. Try again or choose another browser.";
	}

	emit("error", actionError);
}

async function handleCopy(): Promise<void> {
	if (props.disabled || copyPending.value) {
		return;
	}

	copyPending.value = true;
	clearStatus();

	try {
		const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
		await copyText(props.value, clipboard);
		status.value = "Copied to clipboard.";
		statusState.value = "success";
		emit("copy");
	} catch (error) {
		reportError(error, new BrowserActionError("clipboard_unavailable"));
	} finally {
		copyPending.value = false;
	}
}

function handleDownload(): void {
	if (props.disabled) {
		return;
	}

	clearStatus();

	try {
		downloadText(props.value, props.filename);
		status.value = "Download started.";
		statusState.value = "success";
		emit("download");
	} catch (error) {
		reportError(error, new BrowserActionError("download_unavailable"));
	}
}
</script>

<template>
	<div class="pt-tool-actions" data-testid="tool-actions" :aria-busy="copyPending">
		<Button
			class="pt-tool-actions__button"
			type="button"
			label="Copy"
			aria-label="Copy"
			:disabled="props.disabled || copyPending"
			:aria-busy="copyPending"
			data-testid="tool-actions-copy"
			@click="handleCopy"
		/>
		<Button
			class="pt-tool-actions__button"
			type="button"
			label="Download"
			aria-label="Download"
			:disabled="props.disabled"
			data-testid="tool-actions-download"
			@click="handleDownload"
		/>
		<p
			class="pt-tool-actions__status"
			data-testid="tool-actions-status"
			:data-state="statusState"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			{{ status }}
		</p>
	</div>
</template>
