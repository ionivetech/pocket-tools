import { type ToolDefinition, validateToolMetadata } from "../types/tool";

export type ToolRegistryErrorCode = "duplicate_tool_slug" | "invalid_tool_definition";

export type ToolRegistryErrorDetails =
	| Readonly<{ slug: string }>
	| Readonly<{ validationCode: string; message: string }>;

export class ToolRegistryError extends Error {
	readonly code: ToolRegistryErrorCode;
	readonly details: ToolRegistryErrorDetails;

	constructor(code: ToolRegistryErrorCode, message: string, details: ToolRegistryErrorDetails) {
		super(message);
		this.name = "ToolRegistryError";
		this.code = code;
		this.details = details;
	}
}

export type ToolRegistryApi = Readonly<{
	register(definition: ToolDefinition): void;
	get(slug: string): ToolDefinition | undefined;
	list(): readonly ToolDefinition[];
}>;

function validatedDefinition(value: unknown): ToolDefinition {
	const validation = validateToolMetadata(value);

	if (!validation.ok) {
		throw new ToolRegistryError("invalid_tool_definition", validation.error.message, {
			validationCode: validation.error.code,
			message: validation.error.message,
		});
	}

	if (
		typeof value !== "object" ||
		value === null ||
		!("loadComponent" in value) ||
		typeof value.loadComponent !== "function"
	) {
		const message = "Tool component loader must be a function";
		throw new ToolRegistryError("invalid_tool_definition", message, {
			validationCode: "invalid_tool_component_loader",
			message,
		});
	}

	const keywords = [...validation.value.keywords];
	Object.freeze(keywords);

	return Object.freeze({
		...validation.value,
		keywords,
		loadComponent: value.loadComponent as ToolDefinition["loadComponent"],
	});
}

/**
 * Creates an isolated registry that preserves registration order.
 *
 * @example
 * ```ts
 * const registry = createToolRegistry();
 * registry.get("missing");
 * ```
 */
export function createToolRegistry(initial: readonly ToolDefinition[] = []): ToolRegistryApi {
	const definitions = new Map<string, ToolDefinition>();

	function register(definition: ToolDefinition): void {
		const validated = validatedDefinition(definition);

		if (definitions.has(validated.slug)) {
			throw new ToolRegistryError(
				"duplicate_tool_slug",
				`Tool already registered: ${validated.slug}`,
				{ slug: validated.slug },
			);
		}

		definitions.set(validated.slug, validated);
	}

	for (const definition of initial) {
		register(definition);
	}

	return {
		register,
		get: (slug) => definitions.get(slug),
		list: () => Object.freeze([...definitions.values()]),
	};
}
