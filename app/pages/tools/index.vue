<script setup lang="ts">
import { filterTools } from "~/data/tool-search";
import { toolCategories, tools, type Tool } from "~/data/tools";

type CategoryFilter = (typeof toolCategories)[number];
type CollectionView = "all" | "favorites" | "recent";

const query = ref("");
const activeCategory = ref<CategoryFilter>("All");
const activeView = ref<CollectionView>("all");
const resultsSection = ref<HTMLElement | null>(null);
const { favoriteTools, recentTools, isFavorite, markRecent, toggleFavorite } = useToolLibrary();

const collection = computed(() => {
	if (activeView.value === "favorites") return favoriteTools.value;
	if (activeView.value === "recent") return recentTools.value;
	return tools;
});

const filteredTools = computed(() =>
	filterTools(collection.value, { query: query.value, category: activeCategory.value }),
);

const pageTitle = computed(() => {
	if (activeView.value === "favorites") return "Favorite tools";
	if (activeView.value === "recent") return "Recent tools";
	return "All tools";
});

const pageDescription = computed(() => {
	if (activeView.value === "favorites")
		return "Keep the shortcuts you reach for most close at hand.";
	if (activeView.value === "recent")
		return "Pick up where you left off without leaving your browser.";
	return "A growing collection of clear helpers for everyday tasks and technical work.";
});

function setView(view: CollectionView) {
	activeView.value = view;
}

function setCategory(category: CategoryFilter) {
	activeCategory.value = category;
}

function clearFilters() {
	query.value = "";
	activeCategory.value = "All";
}

function showResults() {
	resultsSection.value?.focus({ preventScroll: true });
	resultsSection.value?.scrollIntoView({ block: "start" });
}

function openTool(tool: Tool) {
	markRecent(tool.slug);
}
</script>

<template>
	<div class="pt-shell pt-tools-shell">
		<AppHeader />

		<main id="main-content" class="pt-tools-page">
			<section class="pt-tools-hero" aria-labelledby="tools-page-title">
				<NuxtLink class="pt-back-link" to="/" data-testid="tools-back-home-link">
					<AppIcon name="arrow-left" /> Back home
				</NuxtLink>
				<p class="pt-kicker">The tool library</p>
				<h1 id="tools-page-title">Find a better <span>shortcut.</span></h1>
				<p>Search by the thing you want to do, then open a focused tool when you need it.</p>

				<form
					class="pt-search pt-tools-search"
					role="search"
					data-testid="tools-search-form"
					@submit.prevent="showResults"
				>
					<label class="pt-sr-only" for="collection-search">Search the tool library</label>
					<AppIcon name="search" class="pt-search__icon" />
					<InputText
						id="collection-search"
						v-model="query"
						placeholder="Search the collection"
						data-testid="tools-search-input"
					/>
					<Button type="submit" label="Search" data-testid="tools-search-submit" />
				</form>
			</section>

			<section
				ref="resultsSection"
				class="pt-tools-library"
				tabindex="-1"
				aria-labelledby="collection-title"
			>
				<div class="pt-library-heading">
					<div>
						<p class="pt-kicker">Choose your view</p>
						<h2 id="collection-title">{{ pageTitle }}</h2>
						<p>{{ pageDescription }}</p>
					</div>
					<div class="pt-view-tabs" role="group" aria-label="Tool collection views">
						<button
							type="button"
							:aria-pressed="activeView === 'all'"
							:class="{ 'pt-view-tab--active': activeView === 'all' }"
							data-testid="tools-view-all"
							@click="setView('all')"
						>
							All <span>{{ tools.length }}</span>
						</button>
						<button
							type="button"
							:aria-pressed="activeView === 'favorites'"
							:class="{ 'pt-view-tab--active': activeView === 'favorites' }"
							data-testid="tools-view-favorites"
							@click="setView('favorites')"
						>
							Favorites <span>{{ favoriteTools.length }}</span>
						</button>
						<button
							type="button"
							:aria-pressed="activeView === 'recent'"
							:class="{ 'pt-view-tab--active': activeView === 'recent' }"
							data-testid="tools-view-recent"
							@click="setView('recent')"
						>
							Recent <span>{{ recentTools.length }}</span>
						</button>
					</div>
				</div>

				<div class="pt-category-row" role="group">
					<button
						v-for="category in toolCategories"
						:key="category"
						class="pt-category"
						:class="{ 'pt-category--active': activeCategory === category }"
						type="button"
						:aria-pressed="activeCategory === category"
						:data-testid="`tools-category-${category.toLowerCase()}`"
						@click="setCategory(category)"
					>
						{{ category }}
					</button>
				</div>

				<div
					v-if="filteredTools.length"
					class="pt-tool-grid"
					aria-live="polite"
					data-testid="tools-results"
				>
					<ToolCard
						v-for="tool in filteredTools"
						:key="tool.slug"
						:tool="tool"
						show-favorite
						:favorite="isFavorite(tool.slug)"
						@toggle-favorite="toggleFavorite"
						@open="openTool"
					/>
				</div>

				<div v-else class="pt-empty" aria-live="polite" data-testid="tools-empty-state">
					<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="search" /></span>
					<div>
						<h3>
							{{
								activeView === "favorites"
									? "No favorites yet."
									: activeView === "recent"
										? "Nothing recent yet."
										: "No shortcut found."
							}}
						</h3>
						<p>
							{{
								activeView === "favorites"
									? "Tap the star on a tool to keep it close."
									: activeView === "recent"
										? "Open a tool and it will show up here."
										: "Try a broader search or clear the filters."
							}}
						</p>
					</div>
					<Button
						v-if="query || activeCategory !== 'All'"
						type="button"
						label="Clear filters"
						variant="outlined"
						data-testid="tools-clear-filters"
						@click="clearFilters"
					/>
				</div>
			</section>
		</main>

		<AppFooter />
	</div>
</template>
