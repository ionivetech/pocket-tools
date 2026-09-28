<script setup lang="ts">
import { computed, ref, useId } from "vue";

const props = withDefaults(
	defineProps<{
		accept?: string;
		heading?: string;
		help?: string;
	}>(),
	{
		accept: "",
		heading: "Add files",
		help: "Drop files here or choose files below. Files stay on this device.",
	},
);

const emit = defineEmits<{
	files: [files: File[]];
}>();

const componentId = useId();
const inputId = `tool-file-input-${componentId}`;
const helpId = `tool-file-help-${componentId}`;
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const status = ref("");
const acceptRules = computed(() =>
	props.accept
		.split(",")
		.map((rule) => rule.trim().toLowerCase())
		.filter(Boolean),
);

function isAccepted(file: File): boolean {
	if (acceptRules.value.length === 0) {
		return true;
	}

	const mimeType = file.type.toLowerCase();
	const fileName = file.name.toLowerCase();

	return acceptRules.value.some((rule) => {
		if (rule.startsWith(".")) {
			return fileName.endsWith(rule);
		}

		if (rule.endsWith("/*")) {
			return mimeType.startsWith(rule.slice(0, -1));
		}

		return mimeType === rule;
	});
}

function selectFiles(candidates: File[] | FileList): void {
	const files = Array.from(candidates);
	const acceptedFiles = files.filter(isAccepted);

	if (acceptedFiles.length === 0) {
		status.value = props.accept
			? "Choose a supported file and try again."
			: "Choose a file and try again.";
		return;
	}

	const selectedCount = acceptedFiles.length;
	const skippedCount = files.length - acceptedFiles.length;
	const selectedLabel = `${selectedCount} ${selectedCount === 1 ? "file" : "files"} selected.`;
	status.value =
		skippedCount > 0
			? `${selectedLabel} ${skippedCount} unsupported ${skippedCount === 1 ? "file was" : "files were"} skipped. Files stay on this device.`
			: `${selectedLabel} Files stay on this device.`;
	emit("files", acceptedFiles);
}

function openFilePicker(): void {
	fileInput.value?.click();
}

function handleInputChange(event: Event): void {
	if (!(event.currentTarget instanceof HTMLInputElement)) {
		return;
	}

	const files = Array.from(event.currentTarget.files ?? []);
	event.currentTarget.value = "";
	selectFiles(files);
}

function handleDrop(event: DragEvent): void {
	isDragging.value = false;
	if (event.dataTransfer) {
		selectFiles(event.dataTransfer.files);
	}
}
</script>

<template>
	<section
		class="pt-tool-state"
		:class="{ 'pt-tool-state--loading': isDragging }"
		:aria-describedby="helpId"
		:data-dragging="isDragging"
		data-testid="tool-file-drop"
		@dragenter.prevent="isDragging = true"
		@dragover.prevent="isDragging = true"
		@dragleave.prevent="isDragging = false"
		@drop.prevent="handleDrop"
	>
		<div class="pt-tool-state__copy">
			<h2>{{ props.heading }}</h2>
			<p :id="helpId">{{ props.help }}</p>
		</div>

		<input
			:id="inputId"
			ref="fileInput"
			class="pt-sr-only"
			type="file"
			tabindex="-1"
			:accept="props.accept"
			multiple
			:aria-describedby="helpId"
			data-testid="tool-file-input"
			@change="handleInputChange"
		/>
		<label class="pt-sr-only" :for="inputId" data-testid="tool-file-label">
			Choose files to add to this tool
		</label>
		<Button
			class="pt-tool-state__action"
			type="button"
			label="Choose files"
			aria-label="Choose files to add to this tool"
			:aria-describedby="helpId"
			data-testid="tool-file-choose"
			@click="openFilePicker"
		/>

		<p
			class="pt-tool-state__copy"
			role="status"
			aria-live="polite"
			aria-atomic="true"
			data-testid="tool-file-status"
		>
			{{ status }}
		</p>
	</section>
</template>
