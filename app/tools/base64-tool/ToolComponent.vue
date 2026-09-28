<template>
	<section
		class="pt-empty"
		data-testid="base64-tool-placeholder"
		aria-labelledby="base64-tool-placeholder-title"
	>
		<span class="pt-tool-icon pt-tool-icon--blue"><AppIcon name="sparkles" /></span>
		<div>
			<h2 id="base64-tool-placeholder-title">{{ toolName }}</h2>
			<p>
				The working version is still being built. There is nothing to enter or download here yet.
			</p>
		</div>
	</section>
</template>

<script setup lang="ts">
const toolName = "Base64 encoder/decoder";
</script>
