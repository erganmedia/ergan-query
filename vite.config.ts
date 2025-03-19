// vite.config.ts
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            // Multiple entry points
            entry: {
                index: 'src/index.ts', // core
                react: 'src/react.ts', // React hooks
                solid: 'src/solid.ts', // Solid hooks
            },
            name: 'erganQuery',
            // File naming scheme for each entry
            fileName: (format, entryName) => `ergan-query.${entryName}.${format}.js`,
        },
        rollupOptions: {
            // Prevent bundling React or Solid into your library
            external: ['react', 'solid-js'],
            output: {
                // UMD global variables if needed
                globals: {
                    react: 'React',
                    'solid-js': 'Solid',
                },
            },
        },
    },
    plugins: [
        dts({
            // Ensures .d.ts files are generated for each entry.
            // If needed, you can specify:
            // entryRoot: 'src'
        }),
    ],
});
