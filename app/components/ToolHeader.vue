<script setup lang="ts">
import { useId } from "vue";
import type { ToolMetadata } from "~/types/tool";

const props = defineProps<{ tool: ToolMetadata }>();
const headingId = `tool-heading-${useId()}`;
</script>

<template>
	<header class="pt-tool-head" :aria-labelledby="headingId" data-testid="tool-header">
		<span class="pt-tool-icon" :class="`pt-tool-icon--${props.tool.accent}`">
			<AppIcon :name="props.tool.icon" />
		</span>
		<p class="pt-kicker">{{ props.tool.category }} tool</p>
		<h1 :id="headingId">{{ props.tool.name }}</h1>
		<p class="pt-tool-head__description">{{ props.tool.description }}</p>
		<div class="pt-tool-head__status">
			<p>
				<AppIcon name="shield" />
				<span>Your work stays in this browser.</span>
			</p>
			<p>
				<AppIcon name="wifi" />
				<span>Saved tools keep working without a connection.</span>
			</p>
		</div>
	</header>
</template>
