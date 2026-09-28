<script setup lang="ts">
import { useToast } from "primevue/usetoast";
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

const toast = useToast();
const copyPending = ref(false);

function notifyCopyError(error: unknown): void {
	const actionError = error instanceof BrowserActionError ? error : undefined;
	if (actionError?.code === "clipboard_unavailable") {
		toast.add({
			severity: "error",
			summary: "Copy failed.",
			detail: "Check clipboard access and try again.",
			life: 4000,
		});
	} else {
		toast.add({ severity: "error", summary: "Copy failed.", detail: "Try again.", life: 4000 });
	}
	emit("error", actionError ?? new BrowserActionError("clipboard_unavailable"));
}

async function handleCopy(): Promise<void> {
	if (props.disabled || copyPending.value) {
		return;
	}

	copyPending.value = true;

	try {
		const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
		await copyText(props.value, clipboard);
		toast.add({ severity: "success", summary: "Copied to clipboard.", life: 3000 });
		emit("copy");
	} catch (error) {
		notifyCopyError(error);
	} finally {
		copyPending.value = false;
	}
}

function handleDownload(): void {
	if (props.disabled) {
		return;
	}

	try {
		downloadText(props.value, props.filename);
		toast.add({
			severity: "success",
			summary: "Download started.",
			detail: props.filename,
			life: 3000,
		});
		emit("download");
	} catch (error) {
		const actionError =
			error instanceof BrowserActionError ? error : new BrowserActionError("download_unavailable");
		toast.add({ severity: "error", summary: "Download failed.", detail: "Try again.", life: 4000 });
		emit("error", actionError);
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
	</div>
</template>
