<template>
	<section
		class="pt-empty"
		data-testid="uuid-generator-placeholder"
		aria-labelledby="uuid-generator-placeholder-title"
	>
		<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="sparkles" /></span>
		<div>
			<h2 id="uuid-generator-placeholder-title">{{ toolName }}</h2>
			<p>
				The working version is still being built. There is nothing to enter or download here yet.
			</p>
		</div>
	</section>
</template>

<script setup lang="ts">
const toolName = "UUID/ULID generator";
</script>
