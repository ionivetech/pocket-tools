import { tools } from "~/data/tools";

function readSlugs(value: string | null): string[] {
	if (!value) return [];

	try {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) return [];
		return parsed;
	} catch {
		return [];
	}
}

export function useToolLibrary() {
	const favoriteSlugs = useState<string[]>("pockettools-favorites", () => []);
	const recentSlugs = useState<string[]>("pockettools-recent", () => []);
	const initialized = useState<boolean>("pockettools-library-initialized", () => false);

	function persist() {
		if (!import.meta.client) return;

		localStorage.setItem("pockettools-favorites", JSON.stringify(favoriteSlugs.value));
		localStorage.setItem("pockettools-recent", JSON.stringify(recentSlugs.value));
	}

	function toggleFavorite(slug: string) {
		favoriteSlugs.value = favoriteSlugs.value.includes(slug)
			? favoriteSlugs.value.filter((item) => item !== slug)
			: [...favoriteSlugs.value, slug];
		persist();
	}

	function markRecent(slug: string) {
		recentSlugs.value = [slug, ...recentSlugs.value.filter((item) => item !== slug)].slice(0, 5);
		persist();
	}

	function isFavorite(slug: string) {
		return favoriteSlugs.value.includes(slug);
	}

	const favoriteTools = computed(() =>
		tools.filter((tool) => favoriteSlugs.value.includes(tool.slug)),
	);
	const recentTools = computed(() =>
		recentSlugs.value.flatMap((slug) => {
			const tool = tools.find((item) => item.slug === slug);
			return tool ? [tool] : [];
		}),
	);

	onMounted(() => {
		if (initialized.value) return;

		favoriteSlugs.value = readSlugs(localStorage.getItem("pockettools-favorites"));
		recentSlugs.value = readSlugs(localStorage.getItem("pockettools-recent"));
		initialized.value = true;
	});

	return {
		favoriteSlugs,
		recentSlugs,
		favoriteTools,
		recentTools,
		isFavorite,
		toggleFavorite,
		markRecent,
	};
}
