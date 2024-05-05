export type CategoryInfo = {
    id: string;
    name: string;
    description: string;
};

export type CategoryDetails = {
    [K in "styling" | "tools" | string]: CategoryInfo;
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
