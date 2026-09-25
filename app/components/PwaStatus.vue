<script setup lang="ts">
const pwa = usePWA();
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
		<span v-if="!isOnline"><i class="pi pi-wifi" aria-hidden="true" /> Offline mode</span>
		<span v-else-if="updateReady"
			><i class="pi pi-sparkles" aria-hidden="true" /> Update ready</span
		>
		<span v-else-if="registrationError"
			><i class="pi pi-exclamation-circle" aria-hidden="true" /> Offline setup needs a retry</span
		>
		<span v-else><i class="pi pi-check-circle" aria-hidden="true" /> Ready for offline use</span>
		<button v-if="updateReady" type="button" @click="activateUpdate">Refresh</button>
	</div>
</template>
