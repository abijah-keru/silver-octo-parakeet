// js/features/records.js
import { getRecords, saveRecord, getRecordById, getDocuments, linkDocumentAndRecord, getDocumentById } from '../database.js';

export async function renderRecords() {
    document.getElementById('header-title').textContent = 'Records';
    const root = document.getElementById('app-root');
    
    // Mini-router for the records feature
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const action = urlParams.get('action');
    const id = urlParams.get('id');

    if (action === 'new') {
        return renderRecordForm(root);
    } else if (action === 'edit' && id) {
        const record = await getRecordById(id);
        return renderRecordForm(root, record);
    } else if (id) {
        const record = await getRecordById(id);
        return renderRecordDetails(root, record);
    }

    // --- TIMELINE VIEW ---
    const records = await getRecords();
    
    // Check for success messages in session storage (Toast notification)
    const toastMsg = sessionStorage.getItem('toastMessage');
    let toastHTML = '';
    if (toastMsg) {
        toastHTML = `
            <div id="toast-message" style="background: #E6FFFA; color: #2C7A7B; padding: 12px; border: 1px solid #B2F5EA; border-radius: 4px; margin-bottom: 16px; font-weight: 500; text-align: center;">
                ${toastMsg}
            </div>
        `;
        sessionStorage.removeItem('toastMessage'); // Clear it so it only shows once
    }
    
    let html = `
        ${toastHTML}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 style="font-size: 1.1rem; color: var(--color-primary);">Timeline</h2>
            <button class="btn-quick" onclick="location.hash='#/records?action=new'">+ Add Record</button>
        </div>
    `;

    if (records.length === 0) {
        html += `
            <div class="card" style="text-align: center; padding: 32px 16px;">
                <p class="text-muted mb-sm">Your medical timeline is empty.</p>
                <p class="text-sm text-muted mb-sm">Start building your lifelong health history by adding your first record.</p>
            </div>
        `;
    } else {
        html += `<div class="list-group">`;
        records.forEach(record => {
            const hasAttachments = record.linkedDocumentIds && record.linkedDocumentIds.length > 0;
            html += `
                <a href="#/records?id=${record.id}" style="text-decoration: none; color: inherit; display: block;">
                    <div class="card mb-sm" style="cursor: pointer;">
                        <div style="display: flex; justify-content: space-between;">
                            <strong style="color: var(--color-primary);">${record.type}</strong>
                            <span class="text-sm text-muted">${record.date}</span>
                        </div>
                        ${record.title ? `<div class="mt-sm" style="font-weight: 500;">${record.title}</div>` : ''}
                        ${record.notes ? `<div class="mt-sm text-sm text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${record.notes}</div>` : ''}
                        ${hasAttachments ? `<div class="mt-sm text-sm" style="color: #3182CE;">📎 ${record.linkedDocumentIds.length} Document(s) Linked</div>` : ''}
                    </div>
                </a>
            `;
        });
        html += `</div>`;
    }

    root.innerHTML = html;

    // Auto-hide the toast message after 3 seconds
    if (toastMsg) {
        setTimeout(() => {
            const toastEl = document.getElementById('toast-message');
            if (toastEl) toastEl.style.display = 'none';
        }, 3000);
    }
}

// --- DETAILS VIEW ---
async function renderRecordDetails(root, record) {
    if (!record || record.isDeleted) {
        root.innerHTML = `<div class="card"><p>Record not found or has been deleted.</p><a href="#/records" class="link-primary">← Back</a></div>`;
        return;
    }

    document.getElementById('header-title').textContent = 'RECORD DETAILS';

    let detailsHTML = `
        <div class="card mb-sm">
            <div style="margin-bottom: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">
                <h3 style="margin: 0 0 4px 0; color: var(--color-primary);">${record.title || record.type}</h3>
                <div class="text-sm text-muted">${record.type} • ${record.date}</div>
            </div>
            <div class="list-group">
    `;

    const skipKeys = ['id', 'isDeleted', 'version', 'createdAt', 'updatedAt', 'type', 'title', 'date', 'notes', 'linkedDocumentIds'];
    for (const [key, value] of Object.entries(record)) {
        if (!skipKeys.includes(key) && value) {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            detailsHTML += `<div class="list-item"><span class="text-muted">${formattedKey}</span> <span>${value}</span></div>`;
        }
    }

    if (record.notes) {
         detailsHTML += `<div class="list-item" style="flex-direction: column; align-items: flex-start; border-bottom: none;"><span class="text-muted mb-sm">Notes</span> <span style="line-height: 1.5;">${record.notes}</span></div>`;
    }
    
    // Render Linked Documents List
    if (record.linkedDocumentIds && record.linkedDocumentIds.length > 0) {
        detailsHTML += `<div class="mt-sm" style="border-top: 1px solid #E2E8F0; padding-top: 12px;"><span class="text-sm text-muted" style="display: block; margin-bottom: 8px;">Linked Supporting Documents</span>`;
        for (const docId of record.linkedDocumentIds) {
            const doc = await getDocumentById(docId);
            if (doc && !doc.isDeleted) {
                detailsHTML += `
                    <a href="#/documents?id=${doc.id}" style="text-decoration: none; display: block; background: #EBF8FF; padding: 8px 12px; border-radius: 4px; margin-bottom: 4px; color: #2B6CB0; font-size: 0.9rem;">
                        📄 ${doc.title || doc.fileName} (${doc.documentType}) →
                    </a>
                `;
            }
        }
        detailsHTML += `</div>`;
    }

    detailsHTML += `
            </div>
            <div class="text-sm text-muted mt-sm" style="text-align: right; font-size: 0.75rem;">Version: ${record.version || 1}</div>
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 16px;">
            <button onclick="location.hash='#/records?action=edit&id=${record.id}'" style="flex: 1; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Edit Record</button>
            <button id="btn-delete" style="flex: 1; padding: 12px; background: #FFF5F5; color: #E53E3E; border: 1px solid #FEB2B2; border-radius: 4px; font-weight: 600; cursor: pointer;">Delete</button>
        </div>
        <div class="mt-sm" style="text-align: center;">
            <a href="#/records" class="text-sm link-primary">← Back to Timeline</a>
        </div>
    `;

    root.innerHTML = detailsHTML;

    // Handle Soft Delete with Toast
    document.getElementById('btn-delete').addEventListener('click', async () => {
        if(confirm('Are you sure you want to delete this record?')) {
            record.isDeleted = true;
            await saveRecord(record);
            sessionStorage.setItem('toastMessage', 'Record successfully deleted.');
            window.location.hash = '#/records';
        }
    });
}

// --- FORM VIEW (CREATE & EDIT) ---
async function renderRecordForm(root, existingData = {}) {
    const isEdit = !!existingData.id;
    document.getElementById('header-title').textContent = isEdit ? 'EDIT RECORD' : 'ADD RECORD';

    root.innerHTML = `
        <div class="card mb-sm">
            <h3 class="mb-sm">${isEdit ? 'Edit Record' : 'Add New Record'}</h3>
            <form id="record-form">
                ${isEdit ? `<input type="hidden" name="id" value="${existingData.id}">
                            <input type="hidden" name="version" value="${existingData.version}">
                            <input type="hidden" name="createdAt" value="${existingData.createdAt}">` : ''}
                
                <div class="mb-sm">
                    <label class="text-sm text-muted">Record Type *</label>
                    <select id="recordType" name="type" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        <option value="" disabled selected>Select a type...</option>
                        <option value="Medical Visit">Medical Visit</option>
                        <option value="Symptom">Symptom</option>
                        <option value="Diagnosis">Diagnosis</option>
                        <option value="Medication">Medication</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Vaccination">Vaccination</option>
                        <option value="Laboratory Result">Laboratory Result</option>
                        <option value="Imaging">Imaging</option>
                        <option value="Measurement">Measurement</option>
                        <option value="Family History">Family History</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="mb-sm">
                    <label class="text-sm text-muted" id="date-label">Date *</label>
                    <input type="date" name="date" max="${new Date().toISOString().split('T')[0]}" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                </div>

                <div id="dynamic-fields"></div>

                <div class="mb-sm mt-sm" style="border-top: 1px solid #E2E8F0; padding-top: 16px;">
                    <label class="text-sm text-muted">Notes (Optional)</label>
                    <textarea name="notes" rows="3" placeholder="Add any additional context..." style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;"></textarea>
                </div>

                <!-- RELATIONAL M:N DOCUMENT CHECKLIST -->
                <div class="mb-sm mt-sm" style="border-top: 1px solid #E2E8F0; padding-top: 16px;">
                    <label class="text-sm text-muted mb-sm" style="display: block;">Link Supporting Documents (Optional)</label>
                    <div id="document-checklist" style="max-height: 150px; overflow-y: auto; background: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 8px;">
                        Loading library...
                    </div>
                    <div class="text-sm text-muted" style="margin-top: 4px; font-size: 0.75rem;">Select files from your Document Library.</div>
                </div>

                <div style="display: flex; gap: 8px; margin-top: 24px;">
                    <button type="submit" id="btn-save-record" style="flex: 1; padding: 12px; background: var(--color-primary); color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Save Record</button>
                    <button type="button" onclick="window.history.back()" style="flex: 1; padding: 12px; background: #E2E8F0; color: #1A202C; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // Populate Document Library checklist checkboxes
    const docs = await getDocuments();
    const checklist = document.getElementById('document-checklist');
    if (docs.length === 0) {
        checklist.innerHTML = `<span class="text-sm text-muted">No documents found. Upload files in the Documents tab first.</span>`;
    } else {
        let chkHTML = '';
        docs.forEach(doc => {
            const isChecked = existingData.linkedDocumentIds?.includes(doc.id) ? 'checked' : '';
            chkHTML += `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.9rem; cursor: pointer;">
                    <input type="checkbox" name="linkedDocumentIds" value="${doc.id}" ${isChecked}>
                    📄 ${doc.title || doc.fileName} (${doc.documentType})
                </label>
            `;
        });
        checklist.innerHTML = chkHTML;
    }

    const typeSelect = document.getElementById('recordType');
    const dynamicContainer = document.getElementById('dynamic-fields');
    const dateLabel = document.getElementById('date-label');

    function renderDynamicFields(type) {
        dateLabel.textContent = (type === 'Symptom' || type === 'Medication') ? 'Start Date *' : 'Date *';
        let fieldsHTML = '';
        
        switch(type) {
            case 'Medical Visit':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Reason for Visit *</label>
                        <input type="text" name="title" placeholder="e.g. Annual Checkup" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <label class="text-sm text-muted">Visit Type</label>
                            <select name="visitType" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                                <option value="">Select...</option>
                                <option value="Wellness Check-up">Wellness Check-up</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Emergency Visit">Emergency Visit</option>
                                <option value="Specialist Consultation">Specialist Consultation</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-sm text-muted">Clinician</label>
                            <input type="text" name="clinician" placeholder="e.g. Dr. Smith" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Healthcare Facility</label>
                        <input type="text" name="facility" placeholder="e.g. City General Hospital" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Symptom':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Symptom *</label>
                        <input type="text" name="title" placeholder="e.g. Persistent Headache" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Severity</label>
                        <select name="severity" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                            <option value="">Select...</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                        </select>
                    </div>
                `;
                break;
            case 'Diagnosis':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Diagnosis *</label>
                        <input type="text" name="title" placeholder="e.g. Type 2 Diabetes" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Linked Medical Visit</label>
                        <input type="text" name="linkedVisit" placeholder="Optional reference to a past visit" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Medication':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Medication Name *</label>
                        <input type="text" name="title" placeholder="e.g. Amoxicillin" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <label class="text-sm text-muted">Strength</label>
                            <input type="text" name="strength" placeholder="e.g. 500mg" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                        <div>
                            <label class="text-sm text-muted">Dosage</label>
                            <input type="text" name="dosage" placeholder="e.g. 2 pills" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                    </div>
                    <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <label class="text-sm text-muted">Frequency</label>
                            <input type="text" name="frequency" placeholder="e.g. Twice Daily" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                        <div>
                            <label class="text-sm text-muted">Route</label>
                            <input type="text" name="route" placeholder="e.g. Oral" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">End Date</label>
                        <input type="date" name="endDate" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Procedure':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Procedure *</label>
                        <input type="text" name="title" placeholder="e.g. Appendectomy" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Facility</label>
                        <input type="text" name="facility" placeholder="e.g. St. Jude Hospital" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Vaccination':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Vaccine Name *</label>
                        <input type="text" name="title" placeholder="e.g. COVID-19, Flu" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Dose</label>
                        <input type="text" name="dose" placeholder="e.g. Booster, Dose 1" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Laboratory Result':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Laboratory Panel *</label>
                        <input type="text" name="title" placeholder="e.g. Complete Blood Count (CBC)" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Imaging':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Imaging Type *</label>
                        <input type="text" name="title" placeholder="e.g. X-Ray, MRI" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Body Area</label>
                        <input type="text" name="bodyArea" placeholder="e.g. Chest, Lower Back" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Measurement':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Measurement Type *</label>
                        <select name="title" id="meas-type-select" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                            <option value="">Select...</option>
                            <option value="Blood Pressure">Blood Pressure</option>
                            <option value="Heart Rate">Heart Rate</option>
                            <option value="Weight">Weight</option>
                            <option value="Temperature">Temperature</option>
                            <option value="Blood Glucose">Blood Glucose</option>
                            <option value="Custom Measurement">Custom Measurement</option>
                        </select>
                    </div>
                    <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                            <label class="text-sm text-muted">Value *</label>
                            <input type="text" name="value" id="meas-value" placeholder="e.g. 120/80" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                        <div>
                            <label class="text-sm text-muted">Unit *</label>
                            <input type="text" name="unit" id="meas-unit" placeholder="e.g. mmHg" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                        </div>
                    </div>
                    <!-- NEW: Linked Visit Field -->
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Linked Medical Visit (Optional)</label>
                        <input type="text" name="linkedVisit" placeholder="e.g. Annual Checkup with Dr. Smith" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Family History':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Condition *</label>
                        <input type="text" name="title" placeholder="e.g. Hypertension" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Relationship *</label>
                        <input type="text" name="relationship" placeholder="e.g. Mother, Paternal Grandfather" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
            case 'Other':
                fieldsHTML = `
                    <div class="mb-sm">
                        <label class="text-sm text-muted">Record Title *</label>
                        <input type="text" name="title" placeholder="e.g. Started new diet plan" required style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #E2E8F0; border-radius: 4px;">
                    </div>
                `;
                break;
        }
        
        dynamicContainer.innerHTML = fieldsHTML;

        if (type === 'Measurement') {
            const measTypeSelect = document.getElementById('meas-type-select');
            const measValue = document.getElementById('meas-value');
            const measUnit = document.getElementById('meas-unit');

            function setUnitOptions(unitValue, isLocked) {
                measUnit.value = unitValue;
                measUnit.readOnly = isLocked;
                
                if (isLocked) {
                    measUnit.style.backgroundColor = '#F7FAFC';
                    measUnit.style.color = '#A0AEC0';
                    measUnit.style.borderColor = '#E2E8F0';
                    measUnit.tabIndex = -1; 
                } else {
                    measUnit.style.backgroundColor = '#FFFFFF';
                    measUnit.style.color = '#1A202C';
                    measUnit.style.borderColor = '#E2E8F0';
                    measUnit.tabIndex = 0;
                }
            }

            measTypeSelect.addEventListener('change', (e) => {
                const selected = e.target.value;
                if (selected === 'Blood Pressure') {
                    measValue.placeholder = 'e.g. 120/80';
                    setUnitOptions('mmHg', true); 
                } else if (selected === 'Heart Rate') {
                    measValue.placeholder = 'e.g. 72';
                    setUnitOptions('bpm', true); 
                } else if (selected === 'Weight') {
                    measValue.placeholder = 'e.g. 70.5';
                    setUnitOptions('kg', false); 
                } else if (selected === 'Temperature') {
                    measValue.placeholder = 'e.g. 36.5';
                    setUnitOptions('°C', false); 
                } else if (selected === 'Blood Glucose') {
                    measValue.placeholder = 'e.g. 5.5';
                    setUnitOptions('mmol/L', false); 
                } else {
                    measValue.placeholder = 'e.g. 10';
                    measUnit.placeholder = 'e.g. units';
                    setUnitOptions('', false); 
                }
            });
        }
    }

    typeSelect.addEventListener('change', (e) => renderDynamicFields(e.target.value));

    // If Editing, Pre-fill Data. Otherwise, check for query parameters (e.g. from Trends)
    if (isEdit) {
        typeSelect.value = existingData.type;
        renderDynamicFields(existingData.type);
        
        for (const [key, value] of Object.entries(existingData)) {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) input.value = value;
        }
    } else {
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        const passedType = urlParams.get('type');
        if (passedType) {
            typeSelect.value = passedType;
            renderDynamicFields(passedType);
        }
    }

    // Handle form submission and bidirectional M:N link generation
    document.getElementById('record-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-record');
        btnSave.disabled = true;
        btnSave.textContent = 'Saving...';

        const formData = new FormData(e.target);
        const recordData = Object.fromEntries(formData.entries());
        
        // Grab all checked document IDs from the M:N relationship checklist
        recordData.linkedDocumentIds = formData.getAll('linkedDocumentIds');

        try {
            await saveRecord(recordData);
            
            // Loop through checked IDs and establish the 2-way database relationship
            for (const docId of recordData.linkedDocumentIds) {
                await linkDocumentAndRecord(docId, recordData.id);
            }

            sessionStorage.setItem('toastMessage', 'Record successfully saved!');
            window.location.hash = '#/records'; 
        } catch (error) {
            console.error("Failed to save record:", error);
            alert("Could not save record.");
            btnSave.disabled = false;
            btnSave.textContent = 'Save Record';
        }
    });
}