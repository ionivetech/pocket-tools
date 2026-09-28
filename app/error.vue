<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const errorTitle = ref<HTMLElement | null>(null);
const errorReady = ref(false);
const isNotFound = computed(() => props.error.statusCode === 404);

useSeoMeta({
	title: () => (isNotFound.value ? "Page not found | PocketTools" : "PocketTools error"),
	description: () =>
		isNotFound.value
			? "The requested page could not be found."
			: "PocketTools could not load this page.",
});

function browseTools() {
	void navigateTo("/tools");
}

function handleSecondaryAction() {
	if (!isNotFound.value) {
		window.location.reload();
		return;
	}

	if (window.history.length > 1) {
		window.history.back();
		return;
	}

	void navigateTo("/");
}

onMounted(() => {
	// The recovery buttons are click handlers, so they only work once this page
	// is live. Exposing that state keeps the test from clicking a dead button,
	// exactly like `data-tool-ready` does for tool pages.
	errorReady.value = true;
	errorTitle.value?.focus();
});
</script>

<template>
	<div class="pt-shell" :data-error-ready="errorReady ? 'true' : 'false'">
		<AppHeader />

		<main id="main-content" class="pt-detail-page">
			<section
				class="pt-detail-card"
				aria-labelledby="route-error-title"
				data-testid="route-error-state"
			>
				<span class="pt-tool-icon pt-tool-icon--blue" aria-hidden="true">
					<AppIcon :name="isNotFound ? 'search' : 'exclamation-circle'" />
				</span>
				<p class="pt-kicker">{{ isNotFound ? "Error 404" : "Page error" }}</p>
				<h1 id="route-error-title" ref="errorTitle" tabindex="-1">
					{{ isNotFound ? "We could not find that page." : "Something went wrong." }}
				</h1>
				<p class="pt-detail-card__description">
					{{
						isNotFound
							? "Browse the tool collection or go back to the page you came from."
							: "Try the page again or browse the tool collection."
					}}
				</p>
				<div class="pt-detail-card__actions">
					<Button
						label="Browse tools"
						data-testid="route-error-browse-tools"
						@click="browseTools"
					/>
					<Button
						:label="isNotFound ? 'Go back' : 'Try again'"
						variant="outlined"
						data-testid="route-error-secondary-action"
						@click="handleSecondaryAction"
					/>
				</div>
			</section>
		</main>

		<AppFooter />
	</div>
</template>
