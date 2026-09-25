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
				<span class="pt-status"
					><i class="pi pi-shield" aria-hidden="true" /> Private by default</span
				>
				<button
					class="pt-theme-toggle"
					type="button"
					:aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
					:aria-pressed="isDark"
					@click="toggleTheme"
				>
					<i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'" aria-hidden="true" />
				</button>
				<button
					class="pt-mobile-menu"
					type="button"
					aria-label="Open navigation menu"
					:aria-expanded="drawerOpen"
					@click="drawerOpen = true"
				>
					<i class="pi pi-bars" aria-hidden="true" />
				</button>
			</div>
		</div>
	</header>

	<Drawer v-model:visible="drawerOpen" position="right" header="PocketTools" class="pt-drawer">
		<nav class="pt-drawer__nav" aria-label="Mobile navigation">
			<NuxtLink to="/tools" @click="closeDrawer"
				>Browse tools <i class="pi pi-arrow-right" aria-hidden="true"
			/></NuxtLink>
			<NuxtLink to="/#privacy" @click="closeDrawer"
				>Privacy <i class="pi pi-arrow-right" aria-hidden="true"
			/></NuxtLink>
			<NuxtLink to="/#about" @click="closeDrawer"
				>About <i class="pi pi-arrow-right" aria-hidden="true"
			/></NuxtLink>
		</nav>
		<div class="pt-drawer__footer">
			<i class="pi pi-lock" aria-hidden="true" />
			<span>Your work stays in your browser.</span>
		</div>
	</Drawer>
</template>
