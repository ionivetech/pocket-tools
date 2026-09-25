<script setup lang="ts">
import { useId } from "vue";
import type { ToolMetadata } from "~/types/tool";

const props = defineProps<{ tool: ToolMetadata }>();
const headingId = `tool-heading-${useId()}`;
</script>

<template>
	<header class="pt-detail-card" :aria-labelledby="headingId" data-testid="tool-header">
		<span class="pt-tool-icon" :class="`pt-tool-icon--${props.tool.accent}`">
			<AppIcon :name="props.tool.icon" />
		</span>
		<p class="pt-kicker">{{ props.tool.category }} tool</p>
		<h1 :id="headingId">{{ props.tool.name }}</h1>
		<p class="pt-detail-card__description">{{ props.tool.description }}</p>
		<div class="pt-detail-card__status">
			<AppIcon name="shield" />
			<span>Your work stays in this browser.</span>
		</div>
	</header>
</template>
