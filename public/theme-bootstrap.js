(function () {
	try {
		var savedTheme = window.localStorage.getItem("pockettools-theme");
		var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		document.documentElement.classList.toggle(
			"app-dark",
			savedTheme ? savedTheme === "dark" : prefersDark,
		);
	} catch {
		// Storage can be unavailable in private browsing; the app remains usable.
	}
})();
