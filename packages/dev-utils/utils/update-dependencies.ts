import { run } from "npm-check-updates";
import { readdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { AstTypes, parseScript, serializeScript } from "@svelte-add/ast-tooling";
import { getJsAstEditor } from "@svelte-add/ast-manipulation";
import { spawnSync } from "child_process";

export async function updateDependencies() {
    await updatePackageJson();
    await updateAdderDependencies();
    spawnSync("pnpm", ["install"], { stdio: "inherit" });
}

async function updateAdderDependencies() {
    const adderFolders = readdirSync("./adders/", { withFileTypes: true })
        .filter((item) => item.isDirectory())
        .map((item) => item.name);

    for (const adderId of adderFolders) {
        const filePath = `./adders/${adderId}/config/adder.js`;
        const content = (await readFile(filePath)).toString();
        const { ast, exports, functions, object, array, variables, common } = await getJsAstEditor(parseScript(content));

        const defineAdderConfig = functions.call("defineAdderConfig", []);
        const assignment = variables.declaration(ast, "const", "adder", defineAdderConfig);
        const namedExport = exports.namedExport(ast, "adder", assignment);
        if (!namedExport) continue;

        const declaration = namedExport.declaration as AstTypes.VariableDeclaration;
        const declarator = declaration.declarations[0] as AstTypes.VariableDeclarator;
        const init = declarator.init as AstTypes.CallExpression;

        const config = functions.argumentByIndex(init, 0, object.createEmpty());
        const integrationType = object.property(config, "integrationType", common.createLiteral());
        if (integrationType.value == "external")
            // external adders do not have packages
            continue;

        const packages = object.property(config, "packages", array.createEmpty());

        for (const packageObject of packages.elements as AstTypes.ObjectExpression[]) {
            const name = object.property(packageObject, "name", common.createLiteral());
            const version = object.property(packageObject, "version", common.createLiteral());

            if (version.value == "next" || version.value == "latest") continue;

            const latestVersion = await getLatestVersion(name.value as string);

            version.value = "^" + latestVersion;
        }

        const newContent = serializeScript(ast);
        await writeFile(filePath, newContent);
    }
}

async function getLatestVersion(name: string) {
    const response = await fetch(`https://registry.npmjs.org/${name}/latest`);
    const json = await response.json();
    return json.version;
}

async function updatePackageJson() {
    const upgraded = await run({
        upgrade: true,
        cwd: process.cwd(),
        deep: true,
        root: true,
    });

    console.log(upgraded);
}
