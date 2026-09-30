<script setup lang="ts">
import Dialog from "primevue/dialog";
import { shortcuts } from "~/data/shortcuts";

const open = defineModel<boolean>({ required: true });
</script>

<template>
	<Dialog
		v-model:visible="open"
		modal
		header="Keyboard shortcuts"
		:style="{ width: 'min(28rem, calc(100vw - 2rem))' }"
		data-testid="shortcut-help"
		aria-label="Keyboard shortcuts"
	>
		<ul class="pt-shortcut-list">
			<li v-for="shortcut in shortcuts" :key="shortcut.id" class="pt-shortcut-row">
				<span>
					<strong>{{ shortcut.label }}</strong>
					<small>{{ shortcut.hint }}</small>
				</span>
				<kbd>{{ shortcut.keys }}</kbd>
			</li>
		</ul>
		<p class="pt-shortcut-note">
			Every core action stays keyboard reachable. Nothing leaves your browser.
		</p>
	</Dialog>
</template>
