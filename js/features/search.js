// js/features/search.js
import { getProfile, getRecords, getDocuments } from '../database.js';

export async function renderSearch() {
    document.getElementById('header-title').textContent = 'SEARCH';
    const root = document.getElementById('app-root');

    // Helper to generate the empty state with clickable chips
    function getEmptyStateHTML() {
        return `
            <div class="card" style="text-align: center; padding: 32px 16px; margin-top: 16px;">
                <p class="text-muted mb-sm">What are you looking for?</p>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 16px;">
                    <span class="text-sm suggestion-chip" style="background: #EDF2F7; padding: 6px 12px; border-radius: 16px; color: #4A5568; cursor: pointer;">Blood pressure</span>
                    <span class="text-sm suggestion-chip" style="background: #EDF2F7; padding: 6px 12px; border-radius: 16px; color: #4A5568; cursor: pointer;">CBC</span>
                    <span class="text-sm suggestion-chip" style="background: #EDF2F7; padding: 6px 12px; border-radius: 16px; color: #4A5568; cursor: pointer;">Medication</span>
                </div>
            </div>
        `;
    }

    // Initial Layout: Search Bar + Results Container
    root.innerHTML = `
        <div style="position: sticky; top: 0; background: #F7FAFC; padding-bottom: 16px; z-index: 10;">
            <div style="position: relative;">
                <span style="position: absolute; left: 12px; top: 10px; color: #A0AEC0;">🔍</span>
                <input type="text" id="search-input" placeholder="Search records, documents, measurements..." 
                    style="width: 100%; padding: 10px 12px 10px 40px; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            </div>
        </div>
        <div id="search-results">
            ${getEmptyStateHTML()}
        </div>
    `;

    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    // Make suggestion chips clickable using Event Delegation
    resultsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-chip')) {
            searchInput.value = e.target.textContent;
            searchInput.focus();
            // Manually trigger the input event to run the search
            searchInput.dispatchEvent(new Event('input'));
        }
    });

    // Fetch all data once when the screen loads for fast client-side filtering
    const profile = await getProfile() || {};
    const records = await getRecords() || [];
    const documents = await getDocuments() || [];

    searchInput.focus();

    // Listen for typing events
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length === 0) {
            resultsContainer.innerHTML = getEmptyStateHTML();
            return;
        }

        // Perform the Search
        const matchedProfile = searchProfile(profile, query);
        const matchedRecords = records.filter(r => searchRecord(r, query));
        const matchedDocs = documents.filter(d => searchDocument(d, query));

        // Render Results
        if (!matchedProfile && matchedRecords.length === 0 && matchedDocs.length === 0) {
            resultsContainer.innerHTML = `
                <div class="card" style="text-align: center; padding: 32px 16px; margin-top: 16px;">
                    <p class="text-muted mb-sm">No matching health information found.</p>
                    <p class="text-sm text-muted">Check the spelling or try a broader search.</p>
                </div>
            `;
            return;
        }

        let html = '';

        // 1. Profile Results
        if (matchedProfile) {
            html += `
                <h3 style="font-size: 0.9rem; color: #718096; text-transform: uppercase; margin: 16px 0 8px 0;">Profile</h3>
                <a href="#/profile" style="text-decoration: none; color: inherit; display: block;">
                    <div class="card mb-sm" style="cursor: pointer; border-left: 4px solid var(--color-primary);">
                        <strong style="color: var(--color-primary);">Patient Profile</strong>
                        <div class="text-sm text-muted mt-sm">Contains matches for: ${highlight(profile.fullName, query)}, ${highlight(profile.bloodGroup, query)}</div>
                    </div>
                </a>
            `;
        }

        // 2. Record Results
        if (matchedRecords.length > 0) {
            html += `<h3 style="font-size: 0.9rem; color: #718096; text-transform: uppercase; margin: 16px 0 8px 0;">Records (${matchedRecords.length})</h3>`;
            matchedRecords.forEach(record => {
                html += `
                    <a href="#/records?id=${record.id}" style="text-decoration: none; color: inherit; display: block;">
                        <div class="card mb-sm" style="cursor: pointer;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong style="color: var(--color-primary);">🏥 ${highlight(record.type, query)}</strong>
                                <span class="text-sm text-muted">${record.date}</span>
                            </div>
                            ${record.title ? `<div class="mt-sm" style="font-weight: 500;">${highlight(record.title, query)}</div>` : ''}
                            ${record.value ? `<div class="mt-sm text-sm text-muted">Value: ${highlight(record.value, query)} ${record.unit || ''}</div>` : ''}
                            ${record.notes ? `<div class="mt-sm text-sm text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${highlight(record.notes, query)}</div>` : ''}
                        </div>
                    </a>
                `;
            });
        }

        // 3. Document Results
        if (matchedDocs.length > 0) {
            html += `<h3 style="font-size: 0.9rem; color: #718096; text-transform: uppercase; margin: 16px 0 8px 0;">Documents (${matchedDocs.length})</h3>`;
            matchedDocs.forEach(doc => {
                html += `
                    <a href="#/documents?id=${doc.id}" style="text-decoration: none; color: inherit; display: block;">
                        <div class="card mb-sm" style="cursor: pointer; display: flex; gap: 12px; align-items: center;">
                            <div style="font-size: 2rem; color: #A0AEC0;">📄</div>
                            <div style="min-width: 0;">
                                <strong style="color: #2B6CB0; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${highlight(doc.title || doc.fileName, query)}</strong>
                                <span class="text-sm text-muted">${highlight(doc.documentType, query)} • ${new Date(doc.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </a>
                `;
            });
        }

        resultsContainer.innerHTML = html;
    });
}

// --- Text Highlighting Helper ---
function highlight(text, query) {
    if (!text) return '';
    if (!query) return text;
    // Escape regex characters in the query to prevent errors
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    // Wrap matched text in a highlighted <mark> tag
    return String(text).replace(regex, '<mark style="background-color: #FEFCBF; color: #975A16; padding: 0 2px; border-radius: 2px; font-weight: bold;">$1</mark>');
}

// --- Search Matching Helpers ---
function searchProfile(profile, query) {
    if (!profile) return false;
    const searchableText = `${profile.fullName || ''} ${profile.bloodGroup || ''} ${profile.sex || ''}`.toLowerCase();
    return searchableText.includes(query);
}

function searchRecord(record, query) {
    const searchableText = `
        ${record.type || ''} 
        ${record.title || ''} 
        ${record.notes || ''} 
        ${record.value || ''} 
        ${record.facility || ''} 
        ${record.clinician || ''}
    `.toLowerCase();
    return searchableText.includes(query);
}

function searchDocument(doc, query) {
    const searchableText = `
        ${doc.fileName || ''} 
        ${doc.title || ''} 
        ${doc.documentType || ''} 
        ${doc.notes || ''} 
        ${doc.facility || ''}
    `.toLowerCase();
    return searchableText.includes(query);
}