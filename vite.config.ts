import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            // The entry point of your library
            entry: 'src/index.ts',
            // Global name for your UMD/IIFE bundle
            name: 'erganQuery',
            // Output file names for different formats
            fileName: (format) => `ergan-query.${format}.js`,
        },
        rollupOptions: {
            // Externalize dependencies that shouldn't be bundled
            external: ['react', 'solid-js'],
            output: {
                globals: {
                    react: 'React',
                    'solid-js': 'Solid',
                },
            },
        },
    },
    plugins: [dts()],
});
