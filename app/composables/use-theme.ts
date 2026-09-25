export function useTheme() {
	const isDark = useState<boolean>("pockettools-dark", () => false);
	const initialized = useState<boolean>("pockettools-theme-initialized", () => false);

	function applyTheme(dark: boolean) {
		isDark.value = dark;
		if (!import.meta.client) return;

		document.documentElement.classList.toggle("app-dark", dark);
		localStorage.setItem("pockettools-theme", dark ? "dark" : "light");
	}

	function toggleTheme() {
		applyTheme(!isDark.value);
	}

	onMounted(() => {
		if (initialized.value) return;

		const savedTheme = localStorage.getItem("pockettools-theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);
		initialized.value = true;
	});

	return { isDark, toggleTheme };
}
