export type CategoryInfo = {
    id: string;
    name: string;
    description: string;
};
export type CategoryKeys = "styling" | "tools" | "asd";
export type CategoryDetails = {
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    [K in CategoryKeys | string]: CategoryInfo;
};

export const categories: CategoryDetails = {
    styling: {
        id: "styling",
        name: "Styling",
        description: "Can be used to style your components",
    },
    tools: {
        id: "tools",
        name: "Tools",
        description: "Different tools",
    },
};
