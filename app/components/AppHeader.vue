<script setup lang="ts">
const drawerOpen = ref(false);
const { isDark, toggleTheme } = useTheme();

function closeDrawer() {
	drawerOpen.value = false;
}
</script>

<template>
	<header id="top" class="pt-topbar">
		<div class="pt-topbar__inner">
			<NuxtLink class="pt-brand" to="/">
				<span class="pt-brand__mark" aria-hidden="true">P</span>
				<span>PocketTools</span>
			</NuxtLink>

			<nav class="pt-nav" aria-label="Primary navigation">
				<NuxtLink to="/tools">Tools</NuxtLink>
				<NuxtLink to="/#privacy">Privacy</NuxtLink>
				<NuxtLink to="/#about">About</NuxtLink>
			</nav>

			<div class="pt-topbar__actions">
				<span class="pt-status"> <AppIcon name="shield" /> Private by default</span>
				<button
					class="pt-theme-toggle"
					type="button"
					aria-label="Dark theme"
					:aria-pressed="isDark"
					@click="toggleTheme"
				>
					<AppIcon :name="isDark ? 'sun' : 'moon'" />
				</button>
				<button
					class="pt-mobile-menu"
					type="button"
					aria-label="Open navigation menu"
					:aria-expanded="drawerOpen"
					@click="drawerOpen = true"
				>
					<AppIcon name="bars" />
				</button>
			</div>
		</div>
	</header>

	<Drawer v-model:visible="drawerOpen" position="right" header="PocketTools" class="pt-drawer">
		<nav class="pt-drawer__nav" aria-label="Mobile navigation">
			<NuxtLink to="/tools" @click="closeDrawer"
				>Browse tools <AppIcon name="arrow-right"
			/></NuxtLink>
			<NuxtLink to="/#privacy" @click="closeDrawer"
				>Privacy <AppIcon name="arrow-right"
			/></NuxtLink>
			<NuxtLink to="/#about" @click="closeDrawer">About <AppIcon name="arrow-right" /></NuxtLink>
		</nav>
		<div class="pt-drawer__footer">
			<AppIcon name="lock" />
			<span>Your work stays in your browser.</span>
		</div>
	</Drawer>
</template>
