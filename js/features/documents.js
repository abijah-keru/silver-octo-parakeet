// js/features/documents.js
import { getDocuments, saveDocument, getDocumentById } from '../database.js';

export async function renderDocuments() {
    document.getElementById('header-title').textContent = 'DOCUMENTS';
    const root = document.getElementById('app-root');
    
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const action = urlParams.get('action');
    const id = urlParams.get('id');

    if (action === 'new') {
        return renderUploadForm(root);
    } else if (id) {
        const doc = await getDocumentById(id);
        return renderDocumentDetails(root, doc);
    }

    // --- LIBRARY VIEW ---
    const documents = await getDocuments();
    
    // Success Toast
    const toastMsg = sessionStorage.getItem('docToastMessage');
    let toastHTML = '';
    if (toastMsg) {
        toastHTML = `<div id="toast-message" style="background: #E6FFFA; color: #2C7A7B; padding: 12px; border: 1px solid #B2F5EA; border-radius: 4px; margin-bottom: 16px; font-weight: 500; text-align: center;">${toastMsg}</div>`;
        sessionStorage.removeItem('docToastMessage'); 
    }

    let html = `
        ${toastHTML}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 1.1rem; color: var(--color-primary);">Library</h2>
            <button class="btn-quick" onclick="location.hash='#/documents?action=new'">+ Upload Document</button>
        </div>
    `;

    if (documents.length === 0) {
        html += `
            <div class="card" style="text-align: center; padding: 32px 16px;">
                <p class="text-muted mb-sm">Your medical documents will appear here.</p>
                <p class="text-sm text-muted mb-sm">Upload laboratory reports, prescriptions, scans, discharge summaries, and other medical documents to build your lifelong health archive.</p>
                <button class="btn-quick mt-sm" onclick="location.hash='#/documents?action=new'">Upload your first document</button>
            </div>
        `;
    } else {
        html += `<div class="list-group">`;
        documents.forEach(doc => {
            html += `
                <a href="#/documents?id=${doc.id}" style="text-decoration: none; color: inherit; display: block;">
                    <div class="card mb-sm" style="cursor: pointer; display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 2rem; color: #A0AEC0;">
                            ${doc.fileType.includes('pdf') ? '📄' : '🖼'}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <strong style="color: var(--color-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.title || doc.fileName}</strong>
                            <span class="text-sm text-muted">${doc.documentType} • ${new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </a>
            `;
        });
        html += `</div>`;
    }

    root.innerHTML = html;

    if (toastMsg) {
        setTimeout(() => {
            const toastEl = document.getElementById('toast-message');
            if (toastEl) toastEl.style.display = 'none';
        }, 3000);
    }
}

// --- DETAILS VIEW ---
function renderDocumentDetails(root, doc) {
    if (!doc || doc.isDeleted) {
        root.innerHTML = `<div class="card"><p>Document not found or has been deleted.</p><a href="#/documents" class="link-primary">← Back</a></div>`;
        return;
    }

    document.getElementById('header-title').textContent = 'DOCUMENT DETAILS';

    // Basic Preview Logic for MVP (Images inline, PDFs as embedded objects)
    let previewHTML = '';
    if (doc.fileType.includes('image')) {
        previewHTML = `<img src="${doc.fileData}" style="width: 100%; border-radius: 4px; border: 1px solid #E2E8F0;" alt="${doc.fileName}" />`;
    } else if (doc.fileType.includes('pdf')) {
        previewHTML = `<object data="${doc.fileData}" type="application/pdf" width="100%" height="400px" style="border: 1px solid #E2E8F0; border-radius: 4px;">
            <p>PDF preview not available on this device. <a href="${doc.fileData}" download="${doc.fileName}">Download here</a>.</p>
        </object>`;
    }

    root.innerHTML = `
        <div class="card mb-sm">
            <h3 class="mb-sm" style="word-wrap: break-word; color: var(--color-primary);">${doc.title || doc.fileName}</h3>
            ${previewHTML}
        </div>
        <div class="card mb-sm">
            <div class="list-group">
                <div class="list-item"><span class="text-muted">Type</span> <span>${doc.documentType}</span></div>
                ${doc.documentDate ? `<div class="list-item"><span class="text-muted">Document Date</span> <span>${doc.documentDate}</span></div>` : ''}
                ${doc.facility ? `<div class="list-item"><span class="text-muted">Facility</span> <span>${doc.facility}</span></div>` : ''}
                <div class="list-item"><span class="text-muted">Uploaded</span> <span>${new Date(doc.createdAt).toLocaleDateString()}</span></div>
                ${doc.notes ? `<div class="list-item" style="flex-direction: column; align-items: flex-start; border-bottom: none;"><span class="text-muted mb-sm">Notes</span> <span style="line-height: 1.5;">${doc.notes}</span></div>` : ''}
            </div>
        </div>
        <div class="card mb-sm text-center" style="background: #F7FAFC; border: 1px dashed #CBD5E0;">
            <p class="text-sm text-muted mb-sm">OCR Extraction (Optional)</p>
            <button class="btn-quick" disabled style="opacity: 0.5;">Extract Text (AI Coming Soon)</button>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button id="btn-delete-doc" style="flex: 1; padding: 12px; background: #FFF5F5; color: #E53E3E; border: 1px solid #FEB2B2; border-radius: 4px; font-weight: 600; cursor: pointer;">Delete Document</button>
        </div>
        <div class="mt-sm" style="text-align: center;">
            <a href="#/documents" class="text-sm link-primary">← Back to Library</a>
        </div>
    `;

    document.getElementById('btn-delete-doc').addEventListener('click', async () => {
        if(confirm('Delete this original document? Linked records will flag the document as unavailable.')) {
            doc.isDeleted = true;
            await saveDocument(doc);
            sessionStorage.setItem('docToastMessage', 'Document permanently deleted.');
            window.location.hash = '#/documents';
        }
    });
}

// --- UPLOAD FORM ---
function renderUploadForm(root) {
    document.getElementById('header-title').textContent = 'UPLOAD DOCUMENT';

    root.innerHTML = `
        <div class="card mb-sm">
            <h3 class="mb-sm">Add Medical Document</h3>
            <form id="document-form">
                
                <div class="mb-sm">
                    <label class="text-sm text-muted">Select File *</label>
                    <input type="file" id="fileInput" accept="image/*,.pdf" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px dashed #CBD5E0; border-radius: 4px; background: #F7FAFC;">
                    <div class="text-sm text-muted" style="margin-top: 4px; font-size: 0.75rem;">Supported: PDF, JPG, PNG</div>
                </div>

                <div class="mb-sm">
                    <label class="text-sm text-muted">Document Type *</label>
                    <select name="documentType" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        <option value="" disabled selected>Select...</option>
                        <option value="Laboratory Report">Laboratory Report</option>
                        <option value="Imaging Report">Imaging Report</option>
                        <option value="Prescription">Prescription</option>
                        <option value="Consultation Notes">Consultation Notes</option>
                        <option value="Discharge Summary">Discharge Summary</option>
                        <option value="Referral Letter">Referral Letter</option>
                        <option value="Vaccination Record">Vaccination Record</option>
                        <option value="Insurance Document">Insurance Document</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="mb-sm">
                    <label class="text-sm text-muted">Title (Optional)</label>
                    <input type="text" name="title" placeholder="e.g. June Blood Test" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                </div>

                <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label class="text-sm text-muted">Document Date (Optional)</label>
                        <input type="date" name="documentDate" max="${new Date().toISOString().split('T')[0]}" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div>
                        <label class="text-sm text-muted">Facility (Optional)</label>
                        <input type="text" name="facility" placeholder="e.g. City Lab" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                </div>

                <div class="mb-sm mt-sm">
                    <label class="text-sm text-muted">Notes (Optional)</label>
                    <textarea name="notes" rows="2" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;"></textarea>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 24px;">
                    <button type="submit" id="btn-save-doc" style="flex: 1; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Save Document</button>
                    <button type="button" onclick="window.history.back()" style="flex: 1; padding: 12px; background: #E2E8F0; color: #1A202C; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Cancel</button>
                </div>
            </form>
        </div>
    `;

    const form = document.getElementById('document-form');
    const fileInput = document.getElementById('fileInput');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (fileInput.files.length === 0) {
            alert("Please select a file to upload.");
            return;
        }

        const btnSave = document.getElementById('btn-save-doc');
        btnSave.disabled = true;
        btnSave.textContent = 'Processing...';

        const file = fileInput.files[0];
        const formData = new FormData(e.target);
        const docData = Object.fromEntries(formData.entries());

        // File Reader logic to convert the physical file to a Base64 string for local DB storage
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64String = event.target.result;
            
            docData.fileData = base64String;
            docData.fileName = file.name;
            docData.fileType = file.type;

            try {
                await saveDocument(docData);
                
                // Show Blueprint 15 Success Screen logic (We use toast + redirect to Library for fluid UX)
                sessionStorage.setItem('docToastMessage', '✓ Document Uploaded Successfully');
                window.location.hash = '#/documents'; 
            } catch (error) {
                console.error("Failed to save document:", error);
                alert("Could not save document. It may be too large for local storage.");
                btnSave.disabled = false;
                btnSave.textContent = 'Save Document';
            }
        };

        // If it's a massive file, this prevents the browser from crashing
        reader.onerror = function() {
            alert("Error reading file.");
            btnSave.disabled = false;
            btnSave.textContent = 'Save Document';
        };

        reader.readAsDataURL(file);
    });
}