import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            // Define multiple entry points
            entry: {
                index: 'src/index.ts',
                react: 'src/react.ts',
                solid: 'src/solid.js',
            },
            name: 'erganQuery',
            fileName: (format, entryName) => `ergan-query.${entryName}.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'solid-js'],
            output: {
                globals: {
                    react: 'React',
                    'solid-js': 'Solid',
                },
            },
        },
    },
    plugins: [
        dts({
            // Generate declaration files for each entry if needed.
            entryRoot: 'src',
        }),
    ],
});
