export default {
    // These parameters are set to the same value as Prettier's default
    arrowParens: 'always',
    bracketSpacing: true,
    endOfLine: 'lf',
    bracketSameLine: false,
    useTabs: false,

    // This is where we deviate from the default settings
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    overrides: [
        {
            files: ['*.yml', '*.json'],
            options: {
                tabWidth: 2,
                singleQuote: false,
            },
        },
    ],
};
