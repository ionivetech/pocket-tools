<template>
	<div class="pt-shell">
		<AppHeader />

		<main id="main-content" class="pt-detail-page">
			<section class="pt-detail-card pt-offline-card" aria-labelledby="offline-title">
				<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="wifi" /></span>
				<p class="pt-kicker">A short pause</p>
				<h1 id="offline-title">You are offline.</h1>
				<p class="pt-detail-card__description">
					The shell is still here. Reconnect to load fresh tool data, or try the collection already
					saved on this device.
				</p>
				<div class="pt-detail-card__actions">
					<Button label="Try again" @click="refresh" />
					<Button label="Browse tools" variant="outlined" @click="browse" />
				</div>
			</section>
		</main>

		<AppFooter />
	</div>
</template>

<script setup lang="ts">
function refresh() {
	window.location.reload();
}

function browse() {
	navigateTo("/tools");
}
</script>
