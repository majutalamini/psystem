import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        // Dentro do Docker o Vite escuta em todas as interfaces; o navegador acessa por localhost.
        host: '0.0.0.0',
        port: 5173,
        hmr: { host: 'localhost' },
        watch: {
            // No Docker para Windows os eventos de arquivo não chegam ao container; sem polling o Vite não vê as alterações.
            usePolling: true,
            interval: 300,
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
