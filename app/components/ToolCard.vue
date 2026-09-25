<script setup lang="ts">
import type { Tool } from "~/data/tools";

const props = withDefaults(
	defineProps<{
		tool: Tool;
		showFavorite?: boolean;
		favorite?: boolean;
	}>(),
	{ showFavorite: false, favorite: false },
);

const emit = defineEmits<{
	open: [tool: Tool];
	toggleFavorite: [slug: string];
}>();
</script>

<template>
	<article class="pt-tool-card">
		<div class="pt-tool-card__topline">
			<span class="pt-tool-icon" :class="`pt-tool-icon--${props.tool.accent}`">
				<AppIcon :name="props.tool.icon" />
			</span>
			<span class="pt-tool-card__category">{{ props.tool.category }}</span>
			<button
				v-if="props.showFavorite"
				class="pt-favorite"
				type="button"
				:aria-label="
					props.favorite
						? `Remove ${props.tool.name} from favorites`
						: `Add ${props.tool.name} to favorites`
				"
				:aria-pressed="props.favorite"
				@click="emit('toggleFavorite', props.tool.slug)"
			>
				<AppIcon :name="props.favorite ? 'star-fill' : 'star'" />
			</button>
		</div>
		<h3>{{ props.tool.name }}</h3>
		<p>{{ props.tool.description }}</p>
		<NuxtLink
			class="pt-tool-card__link"
			:to="`/tools/${props.tool.slug}`"
			@click="emit('open', props.tool)"
		>
			Open tool <AppIcon name="arrow-right" />
		</NuxtLink>
	</article>
</template>
