<script setup lang="ts">
const isHydrated = ref(false);

onMounted(() => {
	isHydrated.value = true;
});
</script>

<template>
	<div :data-app-ready="isHydrated ? 'true' : 'false'">
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>
