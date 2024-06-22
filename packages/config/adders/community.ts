export type CommunityAdder = {
    id: string;
    displayName: string;
    description: string;
    package: string;
};

export type CommunityAdders = CommunityAdder[];

export const communityAdders: CommunityAdders = [
    {
        id: "test",
        displayName: "Test",
        description: "Test description",
        package: "@test/setup",
    },
];
