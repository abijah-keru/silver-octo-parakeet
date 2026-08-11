// js/features/settings.js
import { getProfile, getRecords, getDocuments } from '../database.js';

export async function renderSettings() {
    document.getElementById('header-title').textContent = 'SETTINGS';
    const root = document.getElementById('app-root');

    let html = `
        <div style="max-width: 600px; margin: 0 auto; padding-bottom: 32px;">
            
            <!-- GENERAL SECTION -->
            <div class="text-sm text-muted mb-sm" style="margin-top: 16px; padding-left: 8px; font-weight: 600; text-transform: uppercase;">General</div>
            <div class="card mb-sm" style="padding: 0;">
                <div class="list-group">
                    <div class="list-item" style="cursor: pointer;" onclick="alert('Language settings coming soon.')">
                        <span>Language</span> <span class="text-muted">English &nbsp; 〉</span>
                    </div>
                    <div class="list-item" style="cursor: pointer;" onclick="alert('Theme selection coming soon.')">
                        <span>Theme</span> <span class="text-muted">System &nbsp; 〉</span>
                    </div>
                    <div class="list-item" style="border-bottom: none; cursor: pointer;" onclick="alert('Notification settings coming soon.')">
                        <span>Notifications</span> <span class="text-muted">On &nbsp; 〉</span>
                    </div>
                </div>
            </div>

            <!-- DATA MANAGEMENT SECTION -->
            <div class="text-sm text-muted mb-sm" style="margin-top: 24px; padding-left: 8px; font-weight: 600; text-transform: uppercase;">Data Management</div>
            <div class="card mb-sm" style="padding: 0;">
                <div class="list-group">
                    <div class="list-item" style="cursor: pointer;" id="btn-export-data">
                        <span>Export My Data</span> <span class="text-muted">〉</span>
                    </div>
                    <div class="list-item" style="cursor: pointer;" onclick="alert('Cloud Backup coming in a future update. All data is currently stored locally on your device.')">
                        <span>Backup (Future)</span> <span class="text-muted">〉</span>
                    </div>
                    <div class="list-item" style="cursor: pointer;" id="btn-storage-usage">
                        <span>Storage Usage</span> <span class="text-muted">〉</span>
                    </div>
                    <div class="list-item" style="border-bottom: none; cursor: pointer; color: #E53E3E;" id="btn-delete-all">
                        <span>Delete Local Data</span> <span class="text-muted">〉</span>
                    </div>
                </div>
            </div>

            <!-- PRIVACY & AI SECTION -->
            <div class="text-sm text-muted mb-sm" style="margin-top: 24px; padding-left: 8px; font-weight: 600; text-transform: uppercase;">Privacy & AI</div>
            <div class="card mb-sm" style="padding: 0;">
                <div class="list-group">
                    <div class="list-item" style="border-bottom: none; cursor: pointer;" onclick="alert('AI features are currently disabled. User consent management coming soon.')">
                        <span>Privacy & AI Settings</span> <span class="text-muted">〉</span>
                    </div>
                </div>
            </div>

            <!-- SUPPORT SECTION -->
            <div class="text-sm text-muted mb-sm" style="margin-top: 24px; padding-left: 8px; font-weight: 600; text-transform: uppercase;">Support</div>
            <div class="card mb-sm" style="padding: 0;">
                <div class="list-group">
                    <div class="list-item" style="cursor: pointer;" onclick="alert('Help & FAQ coming soon.')">
                        <span>Help & FAQ</span> <span class="text-muted">〉</span>
                    </div>
                    <div class="list-item" style="cursor: pointer;" onclick="alert('Contact Support coming soon.')">
                        <span>Contact Support</span> <span class="text-muted">〉</span>
                    </div>
                    <div class="list-item" style="border-bottom: none; cursor: pointer;" onclick="alert('Version 1.0.0\\nLocal-First PHR')">
                        <span>About</span> <span class="text-muted">〉</span>
                    </div>
                </div>
            </div>

        </div>
    `;

    root.innerHTML = html;

    // --- INTERACTIVITY LOGIC ---

    // 1. Export Data Logic (JSON Download)
    document.getElementById('btn-export-data').addEventListener('click', async () => {
        try {
            const profile = await getProfile();
            const records = await getRecords();
            const documents = await getDocuments();

            const exportData = {
                exportDate: new Date().toISOString(),
                version: "1.0",
                profile: profile || {},
                records: records || [],
                documents: documents || []
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "phr_health_data_export.json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data.");
        }
    });

    // 2. Calculate Local Storage Usage
    document.getElementById('btn-storage-usage').addEventListener('click', async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
            const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
            alert(`You are currently using approximately ${usageMB} MB out of your device's available ${quotaMB} MB quota for this application.`);
        } else {
            alert("Storage estimation is not supported on this browser.");
        }
    });

    // 3. Delete Local Data (Nuke Database)
    document.getElementById('btn-delete-all').addEventListener('click', () => {
        const confirm1 = confirm("WARNING: This will permanently delete all your health records, documents, and profile data from this device.");
        if (confirm1) {
            const confirm2 = confirm("Are you absolutely sure? This action cannot be undone.");
            if (confirm2) {
                // Delete the IndexedDB database entirely
                const req = indexedDB.deleteDatabase('phr_database');
                req.onsuccess = function () {
                    alert("All local health data has been deleted. The app will now reload.");
                    window.location.hash = '#/';
                    window.location.reload();
                };
                req.onerror = function () {
                    alert("Failed to delete database.");
                };
            }
        }
    });
}