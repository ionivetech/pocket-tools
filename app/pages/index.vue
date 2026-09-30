<script setup lang="ts">
import { filterTools } from "~/data/tool-search";
import { toolCategories, tools } from "~/data/tools";

type CategoryFilter = (typeof toolCategories)[number];

const categories = toolCategories;
const { open: openPalette } = usePalette();
const query = ref("");
const pastedText = ref("");
const activeCategory = ref<CategoryFilter>("All");
const resultsSection = ref<HTMLElement | null>(null);

useSeoMeta({
	title: "PocketTools — Small tools, big relief",
	description:
		"Search-first, offline-first helpers for everyday tasks and technical work. No account, no upload — everything stays in your browser.",
	ogTitle: "PocketTools — Small tools, big relief",
	ogDescription:
		"A calm, searchable toolbox that works offline. Open a focused tool when you need it.",
	ogType: "website",
});

useHead({
	script: [
		{
			type: "application/ld+json",
			innerHTML: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "WebSite",
				name: "PocketTools",
				description: "Pocket-sized tools for everyone. Offline-first, privacy-first.",
				url: "/",
			}),
		},
	],
});

const filteredTools = computed(() =>
	filterTools(tools, { query: query.value, category: activeCategory.value }),
);

function clearFilters() {
	query.value = "";
	activeCategory.value = "All";
}

function onSearchPaste(event: ClipboardEvent) {
	const text = event.clipboardData?.getData("text") ?? "";
	if (text.trim().length >= 8) pastedText.value = text;
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

					<form
						class="pt-search"
						role="search"
						data-testid="home-search-form"
						@submit.prevent="showResults"
					>
						<label class="pt-sr-only" for="tool-search">Search tools</label>
						<AppIcon name="search" class="pt-search__icon" />
						<InputText
							id="tool-search"
							v-model="query"
							placeholder="What do you want to do?"
							data-testid="home-search-input"
							@paste="onSearchPaste"
						/>
						<Button type="submit" label="Find a tool" data-testid="home-search-submit" />
					</form>
					<PasteSuggest :pasted-text="pastedText" @dismiss="pastedText = ''" />
					<p class="pt-search-kbd">
						Press
						<button type="button" data-testid="home-palette-hint" @click="openPalette">
							<kbd>Ctrl K</kbd>
						</button>
						for quick search anywhere.
					</p>

					<div class="pt-hero__hint">
						<span>Try</span>
						<button
							type="button"
							data-testid="home-search-hint-passwords"
							@click="query = 'password'"
						>
							passwords
						</button>
						<button type="button" data-testid="home-search-hint-json" @click="query = 'JSON'">
							JSON
						</button>
						<button type="button" data-testid="home-search-hint-colors" @click="query = 'color'">
							colors
						</button>
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
								:data-testid="`home-featured-tool-${tool.slug}`"
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
						:data-testid="`home-category-${category.toLowerCase()}`"
						@click="setCategory(category)"
					>
						{{ category }}
					</button>
				</div>

				<div
					v-if="filteredTools.length"
					class="pt-tool-grid"
					aria-live="polite"
					data-testid="home-tool-results"
				>
					<ToolCard v-for="tool in filteredTools.slice(0, 6)" :key="tool.slug" :tool="tool" />
				</div>

				<div v-else class="pt-empty" aria-live="polite" data-testid="home-tool-empty-state">
					<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="search" /></span>
					<div>
						<h3>No shortcut found yet.</h3>
						<p>Try a broader search, or clear the filters to see the full collection.</p>
					</div>
					<Button
						type="button"
						label="Clear filters"
						variant="outlined"
						data-testid="home-clear-filters"
						@click="clearFilters"
					/>
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
