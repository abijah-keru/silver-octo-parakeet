// js/router.js

import { renderSummary } from './features/summary.js';
import { renderSearch } from './features/search.js';
import { renderSettings } from './features/settings.js';
import { renderTrends } from './features/trends.js';
import { renderHome } from './features/home.js';
import { renderProfile, renderProfileSetup } from './features/profile.js';
import { getProfile } from './database.js';
import { renderRecords } from './features/records.js';
import { renderDocuments } from './features/documents.js';
import { renderCurrentHealth } from './features/currentHealth.js'; // <-- Added Import

const routes = {
    '/': () => renderHome(),
    '/profile': () => renderProfile(),
    '/profile-setup': () => renderProfileSetup(),
    '/records': () => renderRecords(),
    '/documents': () => renderDocuments(),
    '/trends': () => renderTrends(),
    '/settings': () => renderSettings(),
    '/search': () => renderSearch(),
    '/current-health': () => renderCurrentHealth(), // <-- Added Route
    '/summary': () => renderSummary()
};

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    if (!window.location.hash) {
        window.location.hash = '#/';
    } else {
        handleRoute();
    }
}

async function handleRoute() {
    const path = window.location.hash.replace('#', '') || '/';
    const cleanPath = path.split('?')[0]; 
    
    try {
        const profile = await getProfile();

        if (!profile && cleanPath !== '/profile-setup') {
            window.location.hash = '#/profile-setup';
            return; 
        }
        if (profile && cleanPath === '/profile-setup') {
            window.location.hash = '#/';
            return;
        }
    } catch (error) {
        console.error("Database routing error:", error);
        window.location.hash = '#/profile-setup';
        return;
    }

    const route = routes[cleanPath] || (() => renderPlaceholder('404 NOT FOUND'));
    
    const nav = document.getElementById('bottom-nav');
    if (cleanPath === '/profile-setup') {
        nav.style.display = 'none';
    } else {
        nav.style.display = 'flex';
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-route') === cleanPath);
        });
    }

    route();
}

function renderPlaceholder(title) {
    document.getElementById('header-title').textContent = title;
    const root = document.getElementById('app-root');
    root.innerHTML = `<div class="card"><h2>${title}</h2><p class="text-muted mt-sm">This feature is coming soon.</p></div>`;
}