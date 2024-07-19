import { create } from "template-factory";
import * as util from "template-factory/util/index";

const main = async () => {
    await create({
        appName: "adders:create",
        version: "1.0.0",
        templates: [
            {
                name: "custom-adder",
                path: util.relative("./adders/template", import.meta.url),
                flag: "custom-adder",
                excludeFiles: ["README.md"],
            },
        ],
    });
};

void main();
