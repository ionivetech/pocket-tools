<script setup lang="ts">
import { findTool } from "~/data/tools";

const route = useRoute();
const tool = findTool(String(route.params.slug));

if (!tool) {
	throw createError({ statusCode: 404, statusMessage: "Tool not found" });
}

const { markRecent } = useToolLibrary();

onMounted(() => {
	markRecent(tool.slug);
});
</script>

<template>
	<div class="pt-shell">
		<AppHeader />

		<main id="main-content" class="pt-detail-page">
			<NuxtLink class="pt-back-link" to="/tools">
				<AppIcon name="arrow-left" /> Back to tools
			</NuxtLink>

			<section class="pt-detail-card" aria-labelledby="tool-title">
				<span class="pt-tool-icon" :class="`pt-tool-icon--${tool.accent}`">
					<AppIcon :name="tool.icon" />
				</span>
				<p class="pt-kicker">{{ tool.category }} tool</p>
				<h1 id="tool-title">{{ tool.name }}</h1>
				<p class="pt-detail-card__description">{{ tool.description }}</p>
				<div class="pt-detail-card__status">
					<AppIcon name="sparkles" />
					<span>This focused workspace is next in the collection.</span>
				</div>
			</section>
		</main>

		<AppFooter />
	</div>
</template>
