<script setup lang="ts">
const pwa = usePWA?.();
const isOnline = ref(true);

const hasServiceWorker = computed(() => Boolean(pwa?.swActivated || pwa?.offlineReady));
const updateReady = computed(() => pwa?.needRefresh ?? false);
const registrationError = computed(() => pwa?.registrationError ?? false);

function handleOnline() {
	isOnline.value = true;
}

function handleOffline() {
	isOnline.value = false;
}

function activateUpdate() {
	void pwa?.updateServiceWorker(true);
}

onMounted(() => {
	isOnline.value = navigator.onLine;
	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);
});

onBeforeUnmount(() => {
	window.removeEventListener("online", handleOnline);
	window.removeEventListener("offline", handleOffline);
});
</script>

<template>
	<div
		v-if="!isOnline || updateReady || hasServiceWorker || registrationError"
		class="pt-pwa-status"
		role="status"
		aria-live="polite"
	>
		<span v-if="!isOnline"><AppIcon name="wifi" /> Offline mode</span>
		<span v-else-if="updateReady"><AppIcon name="sparkles" /> Update ready</span>
		<span v-else-if="registrationError"
			><AppIcon name="exclamation-circle" /> Offline setup needs a retry</span
		>
		<span v-else><AppIcon name="check-circle" /> Ready for offline use</span>
		<button v-if="updateReady" type="button" @click="activateUpdate">Refresh</button>
	</div>
</template>
