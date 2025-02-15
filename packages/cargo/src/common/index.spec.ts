import { ExecutorContext, Tree } from "@nrwl/devkit";
import { createTreeWithEmptyWorkspace } from "@nrwl/devkit/testing";
import { CargoOptions, normalizeGeneratorOptions, parseCargoArgs, Target } from ".";

describe("common utils", () => {
	describe("parseCargoArgs", () => {
		it("should support --target argument", () => {
			let ctx = mockExecutorContext("test-app:build");
			let opts: CargoOptions = {
				target: "86_64-pc-windows-gnu",
			};
			let args = parseCargoArgs(Target.Build, opts, ctx);
			args.unshift("cargo");

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --target 86_64-pc-windows-gnu"
			);
		});

		it("should ignore the Nx-config-specified target name", () => {
			let ctx = mockExecutorContext("test-app:flooptydoopty");
			let opts: CargoOptions = {};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)];

			expect(args.join(" ")).toEqual("cargo build --bin test-app");
		});

		it("should not pass falsely arguments to cargo", () => {
			let ctx = mockExecutorContext("test-app:build");

			let opts: CargoOptions = {
				release: false,
				target: undefined,
			};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)];

			expect(args.join(" ")).toEqual("cargo build --bin test-app");
		});

		it("should pass through unknown arguments to cargo", () => {
			let ctx = mockExecutorContext("test-app:build");

			let opts: CargoOptions & { [key: string]: string } = {
				profile: "dev-custom",
			};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)];

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --profile dev-custom",
			);

			opts = { unknownArg: "lorem-ipsum" };
			args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)];

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --unknown-arg lorem-ipsum",
			);
		});

		it("allows specifying a custom binary target", () => {
			let ctx = mockExecutorContext("test-app:build");

			let opts: CargoOptions = {
				bin: "custom-bin-name",
			};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)];

			expect(args.join(" ")).toEqual(
				"cargo build -p test-app --bin custom-bin-name",
			);
		});
	});

	describe("normalizeGeneratorOptions", () => {
		let appTree: Tree;

		beforeAll(() => {
			appTree = createTreeWithEmptyWorkspace();
		});

		it("should respect kebab-case project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "my-app" });
			expect(opts.projectName).toBe("my-app");
		});

		it("should respect snake_case project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "my_app" });
			expect(opts.projectName).toBe("my_app");
		});

		it("should respect PascalCase project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "MyApp" });
			expect(opts.projectName).toBe("MyApp");
		});

		it("should respect camelCase project names (you monster)", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "myApp" });
			expect(opts.projectName).toBe("myApp");
		});
	});
});

function mockExecutorContext(command: string): ExecutorContext {
	let [projectName, targetName] = command.split(":");

	return {
		cwd: "C:/test",
		root: "C:/test",
		isVerbose: false,
		workspace: {
			npmScope: "@test",
			projects: {
				"test-app": {
					root: "apps/test-app",
					projectType: "application",
				},
				"test-lib": {
					root: "libs/test-lib",
					projectType: "library",
				},
			},
			version: 2,
		},
		projectName,
		targetName,
	};
}
