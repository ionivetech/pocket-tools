<script setup lang="ts">
import Toast from "primevue/toast";
import { resolveToolRoute } from "~/data/tool-route";
import { tools } from "~/data/tools";

const route = useRoute();
const routeResult = resolveToolRoute(route.params.slug, tools);

if (!routeResult.ok) {
	throw createError({
		status: 404,
		statusText: "Tool not found",
		data: { code: routeResult.error.code },
	});
}

const tool = routeResult.value;
const { markRecent } = useToolLibrary();

useSeoMeta({
	title: `${tool.name} | PocketTools`,
	description: tool.description,
});

onMounted(() => {
	markRecent(tool.slug);
});
</script>

<template>
	<div class="pt-shell">
		<AppHeader />

		<main id="main-content" class="pt-detail-page pt-detail-page--wide">
			<NuxtLink class="pt-back-link" to="/tools" data-testid="tool-detail-back-link">
				<AppIcon name="arrow-left" /> Back to tools
			</NuxtLink>

			<ToolHeader :tool="tool" />
			<ToolHost :tool="tool" />
			<Toast position="bottom-right" data-testid="app-toast" />
		</main>

		<AppFooter />
	</div>
</template>
