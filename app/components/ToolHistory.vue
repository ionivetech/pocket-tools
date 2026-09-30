<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { requestHistoryRestore } from "~/composables/use-tool-history";
import {
	clearHistory,
	deleteHistoryEntry,
	listHistory,
	type ToolHistoryEntry,
} from "~/utils/tool-history";

const props = defineProps<{ toolSlug: string; toolName: string }>();

const entries = ref<ToolHistoryEntry[]>([]);
const open = ref(false);

function refresh(): void {
	entries.value = listHistory(props.toolSlug);
	if (entries.value.length === 0) open.value = false;
}

function restore(entry: ToolHistoryEntry): void {
	requestHistoryRestore(props.toolSlug, entry.input);
}

function remove(id: string): void {
	deleteHistoryEntry(props.toolSlug, id);
	refresh();
}

function clearAll(): void {
	clearHistory(props.toolSlug);
	refresh();
}

function formatTime(at: number): string {
	try {
		return new Date(at).toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return "";
	}
}

onMounted(() => {
	refresh();
	window.addEventListener("pockettools:history-recorded", onRecorded);
});

onBeforeUnmount(() => {
	window.removeEventListener("pockettools:history-recorded", onRecorded);
});

function onRecorded(event: Event): void {
	if ((event as CustomEvent<string>).detail === props.toolSlug) refresh();
}

defineExpose({ refresh });
</script>

<template>
	<section
		v-if="entries.length > 0"
		class="pt-history"
		aria-label="Recent runs on this device"
		data-testid="tool-history"
	>
		<button
			type="button"
			class="pt-history__toggle"
			:aria-expanded="open"
			data-testid="tool-history-toggle"
			@click="open = !open"
		>
			<AppIcon name="refresh" />
			<span>Recent runs on this device ({{ entries.length }})</span>
			<AppIcon :name="open ? 'arrow-up' : 'arrow-right'" />
		</button>

		<div v-if="open" class="pt-history__panel">
			<p class="pt-history__note">Kept only in this browser for 30 days. Nothing is uploaded.</p>
			<ul class="pt-history__list">
				<li v-for="entry in entries" :key="entry.id" class="pt-history__row">
					<div class="pt-history__meta">
						<span>{{ formatTime(entry.at) }}</span>
						<span class="pt-history__preview">{{ entry.input.slice(0, 80) }}</span>
					</div>
					<div class="pt-history__actions">
						<Button
							type="button"
							label="Restore"
							size="small"
							outlined
							:data-testid="`tool-history-restore-${entry.id}`"
							@click="restore(entry)"
						/>
						<Button
							type="button"
							label="Delete"
							size="small"
							text
							:data-testid="`tool-history-delete-${entry.id}`"
							@click="remove(entry.id)"
						/>
					</div>
				</li>
			</ul>
			<Button
				type="button"
				label="Clear history"
				size="small"
				text
				data-testid="tool-history-clear"
				@click="clearAll"
			/>
		</div>
	</section>
</template>
