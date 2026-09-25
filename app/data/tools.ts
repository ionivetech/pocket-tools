export const toolCategories = ["All", "Everyday", "Text", "Developer", "Media"] as const;

export type ToolCategory = (typeof toolCategories)[number];
export type ToolAccent = "blue" | "blue-strong" | "blue-soft" | "blue-muted";

export type Tool = {
	slug: string;
	name: string;
	description: string;
	category: Exclude<ToolCategory, "All">;
	icon: string;
	accent: ToolAccent;
	keywords: string[];
};

export const tools: Tool[] = [
	{
		slug: "json-formatter",
		name: "JSON formatter",
		description: "Tidy messy JSON and spot errors at a glance.",
		category: "Developer",
		icon: "pi pi-code",
		accent: "blue",
		keywords: ["json", "format", "validate", "developer"],
	},
	{
		slug: "password-generator",
		name: "Password generator",
		description: "Create a strong password without leaving your browser.",
		category: "Everyday",
		icon: "pi pi-lock",
		accent: "blue-strong",
		keywords: ["password", "security", "random", "everyday"],
	},
	{
		slug: "color-picker",
		name: "Color picker",
		description: "Find a useful color and copy its values quickly.",
		category: "Media",
		icon: "pi pi-palette",
		accent: "blue-soft",
		keywords: ["color", "hex", "rgb", "media"],
	},
	{
		slug: "text-cleaner",
		name: "Text cleaner",
		description: "Clean up spacing and count what matters.",
		category: "Text",
		icon: "pi pi-align-left",
		accent: "blue-muted",
		keywords: ["text", "clean", "count", "whitespace"],
	},
];

export function findTool(slug: string) {
	return tools.find((tool) => tool.slug === slug);
}
