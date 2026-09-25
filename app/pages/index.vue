<script setup lang="ts">
import { toolCategories, tools } from "~/data/tools";

type CategoryFilter = (typeof toolCategories)[number];

const categories = toolCategories;
const query = ref("");
const activeCategory = ref<CategoryFilter>("All");
const resultsSection = ref<HTMLElement | null>(null);

const filteredTools = computed(() => {
	const normalizedQuery = query.value.trim().toLowerCase();

	return tools.filter((tool) => {
		const matchesCategory =
			activeCategory.value === "All" || tool.category === activeCategory.value;
		const matchesQuery =
			normalizedQuery.length === 0 ||
			`${tool.name} ${tool.description} ${tool.category} ${tool.keywords.join(" ")}`
				.toLowerCase()
				.includes(normalizedQuery);

		return matchesCategory && matchesQuery;
	});
});

function clearFilters() {
	query.value = "";
	activeCategory.value = "All";
}

function showResults() {
	resultsSection.value?.focus({ preventScroll: true });
	resultsSection.value?.scrollIntoView({ block: "start" });
}

function setCategory(category: CategoryFilter) {
	activeCategory.value = category;
}
</script>

<template>
	<div class="pt-shell">
		<AppHeader />

		<main id="main-content">
			<section class="pt-hero" aria-labelledby="hero-title">
				<div class="pt-hero__copy pt-rise">
					<p class="pt-kicker">A calmer way to get things done</p>
					<h1 id="hero-title">Small tools.<br /><span>Big relief.</span></h1>
					<p class="pt-hero__lead">
						Useful little helpers for the everyday moments, projects, and ideas that need a little
						momentum.
					</p>

					<form class="pt-search" role="search" @submit.prevent="showResults">
						<label class="pt-sr-only" for="tool-search">Search tools</label>
						<AppIcon name="search" class="pt-search__icon" />
						<InputText id="tool-search" v-model="query" placeholder="What do you want to do?" />
						<Button type="submit" label="Find a tool" />
					</form>

					<div class="pt-hero__hint">
						<span>Try</span>
						<button type="button" @click="query = 'password'">passwords</button>
						<button type="button" @click="query = 'JSON'">JSON</button>
						<button type="button" @click="query = 'color'">colors</button>
					</div>
				</div>

				<div class="pt-hero__visual pt-rise pt-rise--delay">
					<div class="pt-orbit pt-orbit--one" aria-hidden="true"></div>
					<div class="pt-orbit pt-orbit--two" aria-hidden="true"></div>
					<div class="pt-launcher">
						<div class="pt-launcher__topline">
							<span class="pt-launcher__label">Tool collection</span>
							<span class="pt-live-dot"><AppIcon name="circle-fill" :size="8" /> Open now</span>
						</div>
						<div class="pt-launcher__search">
							<AppIcon name="sparkles" />
							<span>Open a real tool below</span>
						</div>
						<div class="pt-launcher__list">
							<NuxtLink
								v-for="tool in tools.slice(0, 3)"
								:key="tool.slug"
								class="pt-launcher__row"
								:to="`/tools/${tool.slug}`"
							>
								<span class="pt-tool-icon" :class="`pt-tool-icon--${tool.accent}`">
									<AppIcon :name="tool.icon" />
								</span>
								<span
									><strong>{{ tool.name }}</strong
									><small>{{ tool.category }}</small></span
								>
								<AppIcon name="arrow-up-right" />
							</NuxtLink>
						</div>
						<div class="pt-launcher__footer">
							<AppIcon name="lock" /> Everything stays in your browser
						</div>
					</div>
				</div>
			</section>

			<section
				id="tools"
				ref="resultsSection"
				class="pt-section"
				tabindex="-1"
				aria-labelledby="tools-title"
			>
				<div class="pt-section__heading">
					<div>
						<p class="pt-kicker">Find your shortcut</p>
						<h2 id="tools-title">Start with something useful.</h2>
					</div>
					<p>Search by what you need, not by what a tool is called.</p>
				</div>

				<div class="pt-category-row" role="group">
					<button
						v-for="category in categories"
						:key="category"
						class="pt-category"
						:class="{ 'pt-category--active': activeCategory === category }"
						type="button"
						:aria-pressed="activeCategory === category"
						@click="setCategory(category)"
					>
						{{ category }}
					</button>
				</div>

				<div v-if="filteredTools.length" class="pt-tool-grid" aria-live="polite">
					<ToolCard v-for="tool in filteredTools" :key="tool.slug" :tool="tool" />
				</div>

				<div v-else class="pt-empty" aria-live="polite">
					<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="search" /></span>
					<div>
						<h3>No shortcut found yet.</h3>
						<p>Try a broader search, or clear the filters to see the full collection.</p>
					</div>
					<Button type="button" label="Clear filters" variant="outlined" @click="clearFilters" />
				</div>
			</section>

			<section id="privacy" class="pt-principle" aria-labelledby="privacy-title">
				<div class="pt-principle__mark" aria-hidden="true"><AppIcon name="shield" /></div>
				<div>
					<p class="pt-kicker">A quieter promise</p>
					<h2 id="privacy-title">Your work stays yours.</h2>
					<p>
						Tools run in your browser. No account, no upload, no surprise tracking. Just a small
						place to get unstuck.
					</p>
				</div>
				<div class="pt-principle__aside">
					<span>01</span>
					<span>Built for focus</span>
				</div>
			</section>

			<section id="about" class="pt-about" aria-labelledby="about-title">
				<div>
					<p class="pt-kicker">Made to grow with you</p>
					<h2 id="about-title">Start small.<br /><span>Find what you need.</span></h2>
				</div>
				<p>
					PocketTools is a growing collection of clear, focused helpers for everyday tasks and
					technical work alike.
				</p>
			</section>
		</main>

		<AppFooter />
	</div>
</template>
