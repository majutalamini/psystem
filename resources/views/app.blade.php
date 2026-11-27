<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Psystem</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <script>
            try { if (localStorage.getItem('psystem-tema') === 'dark') document.documentElement.dataset.theme = 'dark'; } catch (e) {}
        </script>
        @viteReactRefresh
        @vite('resources/js/app.jsx')
        <x-inertia::head />
    </head>
    <body>
        <x-inertia::app />
    </body>
</html>
