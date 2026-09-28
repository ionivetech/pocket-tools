<script setup lang="ts">
import type { ToolMetadata } from "~/types/tool";

const props = defineProps<{ tool: ToolMetadata }>();
</script>

<template>
	<footer class="pt-footer flex-wrap" data-testid="tool-footer">
		<span class="pt-brand">
			<span class="pt-brand__mark" aria-hidden="true">P</span>
			<span>PocketTools</span>
		</span>
		<span class="inline-flex items-center gap-2">
			<AppIcon name="lock" />
			{{ props.tool.name }} keeps your work on this device.
		</span>
		<span class="inline-flex items-center gap-2">
			<AppIcon name="wifi" />
			Saved tools keep working without a connection.
		</span>
	</footer>
</template>
