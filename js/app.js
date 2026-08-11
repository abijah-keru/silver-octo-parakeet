// js/app.js
import { initRouter } from './router.js';
import { initDatabase } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Personal Health Record MVP...');

    // 1. Initialize IndexedDB
    try {
        await initDatabase();
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        document.getElementById('app-root').innerHTML = '<p>Error loading database. Please ensure you have sufficient storage space.</p>';
        return;
    }

    // 2. Initialize Routing
    initRouter();

    // 3. Register Service Worker for Offline PWA Support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker registered', reg))
                .catch(err => console.warn('Service Worker registration failed', err));
        });
    }
});