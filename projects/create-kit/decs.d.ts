declare module "create-svelte" {
	export type Options = {
		name: string;
		template: "default" | "skeleton";
		typescript: boolean;
		prettier: boolean;
		eslint: boolean;
	};

	export const create: (cwd: string, options: Options) => Promise<void>;
}
