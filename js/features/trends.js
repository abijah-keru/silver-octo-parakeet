// js/features/trends.js
import { getRecords } from '../database.js';

export async function renderTrends() {
    // FIX: Title case instead of ALL CAPS
    document.getElementById('header-title').textContent = 'Trends';
    const root = document.getElementById('app-root');

    const records = await getRecords();
    const measurements = records.filter(r => r.type === 'Measurement');

    const latestBP = measurements.find(m => m.title === 'Blood Pressure');
    const latestHR = measurements.find(m => m.title === 'Heart Rate');

    // FIX: Removed the rogue magnifying glass emoji
    let html = `
        <div class="mb-md">
            <p class="text-muted text-sm font-medium">Track changes in your health measurements.</p>
        </div>
    `;

    // Helper to render a clean, modern trend card
    const renderCard = (title, record) => {
        if (!record) {
            return `
                <div class="card">
                    <h3 class="mb-sm" style="color: var(--color-text-primary); font-size: 1rem;">${title}</h3>
                    <div style="padding: 24px 0; text-align: center; background: var(--color-background); border-radius: var(--radius-md);">
                        <div class="text-muted text-sm">No measurements recorded yet.</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <h3 class="mb-sm" style="color: var(--color-text-primary); font-size: 1rem;">${title}</h3>
                
                <div style="padding: 32px 0; text-align: center; background: var(--color-background); border-radius: var(--radius-md); margin-bottom: 16px;">
                    <div style="font-size: 1.75rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px;">
                        ${record.value} <span style="font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary);">${record.unit}</span>
                    </div>
                    <div class="text-sm text-muted">Not enough data to show a trend.</div>
                    <div class="text-sm text-muted">Record more measurements to see changes over time.</div>
                </div>
                
                <div style="text-align: right;">
                    <a href="#/records?id=${record.id}" style="font-size: 0.875rem; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                        View Record <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
                    </a>
                </div>
            </div>
        `;
    };

    html += renderCard('Blood Pressure', latestBP);
    html += renderCard('Heart Rate', latestHR);

    root.innerHTML = html;
    
    // Initialize the new arrow icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}