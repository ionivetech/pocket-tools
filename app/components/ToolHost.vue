<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent, h, ref, shallowRef } from "vue";
import ToolState from "~/components/ToolState.vue";
import type { ToolDefinition } from "~/types/tool";
import { type LocalErrorPhase, reportLocalError } from "~/utils/error-reporting";

const props = defineProps<{ tool: ToolDefinition }>();
const maxRetries = 2;
const retryCount = ref(0);
const instanceKey = ref(0);
const failurePhase = ref<LocalErrorPhase>("render");
const failureReported = ref(false);
const retryLimitReached = computed(() => retryCount.value >= maxRetries);

const ToolLoadingState = defineComponent({
	name: "ToolLoadingState",
	setup() {
		return () =>
			h(ToolState, {
				kind: "loading",
				title: "Opening tool",
				message: "Loading this tool in your browser.",
			});
	},
});

function createToolComponent() {
	return defineAsyncComponent({
		loader: async () => {
			try {
				return await props.tool.loadComponent();
			} catch (error) {
				failurePhase.value = "load";
				reportLocalError(error, { phase: "load", toolSlug: props.tool.slug });
				failureReported.value = true;
				throw error;
			}
		},
		loadingComponent: ToolLoadingState,
		delay: 200,
		suspensible: false,
	});
}

const asyncTool = shallowRef(createToolComponent());

function handleBoundaryError(error: unknown): void {
	if (failureReported.value) {
		return;
	}

	reportLocalError(error, { phase: failurePhase.value, toolSlug: props.tool.slug });
	failureReported.value = true;
}

function retry(clearError: () => void): void {
	if (retryLimitReached.value) {
		return;
	}

	retryCount.value += 1;
	failurePhase.value = "render";
	failureReported.value = false;
	asyncTool.value = createToolComponent();
	instanceKey.value += 1;
	clearError();
}
</script>

<template>
	<div data-testid="tool-host">
		<NuxtErrorBoundary @error="handleBoundaryError">
			<component :is="asyncTool" :key="instanceKey" />

			<template #error="{ clearError }">
				<ToolState
					kind="error"
					title="This tool could not open"
					:message="
						retryLimitReached
							? 'This tool could not open after 3 attempts. Browse the tools and open it again.'
							: 'PocketTools could not open this tool. The rest of the app is still working.'
					"
					:action-label="retryLimitReached ? undefined : 'Try again'"
					@action="retry(clearError)"
				/>
			</template>
		</NuxtErrorBoundary>
	</div>
</template>
