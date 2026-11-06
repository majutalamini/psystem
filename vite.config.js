import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

// Redireciona acessos de navegador na porta 5173 diretamente para o Laravel na 8000
const redirectToLaravel = {
    name: 'redirect-to-laravel',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            const accept = req.headers.accept || '';
            const isHtmlRequest = accept.includes('text/html');
            const isAsset = req.url.startsWith('/@') || req.url.startsWith('/resources/') || req.url.startsWith('/node_modules/') || req.url.includes('.');

            if (req.url === '/' || req.url === '/index.html' || (isHtmlRequest && !isAsset)) {
                res.writeHead(302, { Location: `http://localhost:8000${req.url === '/index.html' ? '/' : (req.url || '/')}` });
                res.end();
                return;
            }
            next();
        });
    },
};

export default defineConfig(({ mode }) => ({
    // Build separado: o custo do React Profiler nunca entra no baseline normal.
    resolve: ['profiling', 'component-profiling'].includes(mode) ? { alias: { 'react-dom/client': 'react-dom/profiling' } } : {},
    define: { __PSYSTEM_PROFILING__: JSON.stringify(['profiling', 'component-profiling'].includes(mode)) },
    // Nomes legíveis para o coletor de componentes, apenas nesta medição separada.
    build: mode === 'component-profiling' ? { minify: false, sourcemap: true } : {},
    plugins: [
        redirectToLaravel,
        laravel({
            input: ['resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    server: {
        // O Vite roda na máquina e entrega os arquivos para o Laravel no Docker.
        host: '0.0.0.0',
        port: 5173,
        hmr: { host: 'localhost' },
        watch: {
            // Polling mantém a atualização automática estável em pastas compartilhadas no Windows.
            usePolling: true,
            interval: 300,
            ignored: ['**/storage/framework/views/**'],
        },
    },
}));
