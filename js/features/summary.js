// js/features/summary.js
import { getProfile, getRecords, getCurrentHealth, getDocuments } from '../database.js';

// Helper to calculate age
function calculateAge(dobString) {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

export async function renderSummary() {
    document.getElementById('header-title').textContent = 'PRACTITIONER SUMMARY';
    const root = document.getElementById('app-root');

    const profile = await getProfile();
    
    if (!profile || !profile.fullName) {
        root.innerHTML = `
            <div class="card" style="text-align: center; padding: 32px 16px; margin-top: 16px;">
                <p class="text-muted mb-sm">Complete your patient profile first.</p>
                <button class="btn-quick mt-sm" onclick="location.hash='#/profile'">Complete Profile</button>
            </div>
        `;
        return;
    }

    renderConfigView(root);
}

function renderConfigView(root) {
    document.getElementById('header-title').textContent = 'Generate Summary';
    
    root.innerHTML = `
        <form id="summary-config-form">
            <div class="card mb-sm">
                <h3 class="mb-sm">Who is this summary for?</h3>
                <div class="list-group">
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="practitioner" value="General Practitioner" checked> General Practitioner
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="practitioner" value="Cardiologist"> Cardiologist
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="practitioner" value="Ophthalmologist"> Ophthalmologist
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="practitioner" value="Urologist"> Urologist
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="radio" name="practitioner" value="Emergency Care"> Emergency Care
                    </label>
                </div>
            </div>

            <div class="card mb-sm">
                <h3 class="mb-sm">Include Information</h3>
                <div class="list-group">
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" name="includeProfile" checked disabled> Patient Profile (Required)
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" name="includeHealth" checked> Current Health
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" name="includeHistory" checked> Medical History
                    </label>
                    <!-- NEW: Document Briefs Checkbox -->
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px;">
                        <input type="checkbox" name="includeDocs" checked> Clinical Document Briefs
                    </label>
                    <label class="list-item" style="cursor: pointer; display: flex; align-items: center; gap: 12px; border-bottom: none;">
                        <input type="checkbox" name="includeMeasurements" checked> Measurements
                    </label>
                </div>
            </div>

            <button type="submit" style="width: 100%; padding: 14px; background: var(--color-primary); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1.1rem; cursor: pointer; margin-bottom: 32px;">
                Generate Summary
            </button>
        </form>
    `;

    document.getElementById('summary-config-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const options = {
            practitioner: formData.get('practitioner'),
            includeHealth: formData.get('includeHealth') !== null,
            includeHistory: formData.get('includeHistory') !== null,
            includeDocs: formData.get('includeDocs') !== null, // Capture new option
            includeMeasurements: formData.get('includeMeasurements') !== null
        };
        await renderGeneratedView(root, options);
    });
}

async function renderGeneratedView(root, options) {
    document.getElementById('header-title').textContent = 'PATIENT SUMMARY';
    
    const profile = await getProfile();
    const health = await getCurrentHealth();
    const records = await getRecords();
    const documents = await getDocuments(); // Fetch documents

    const age = calculateAge(profile.dob);
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <p class="text-muted text-sm">Prepared for: <strong>${options.practitioner}</strong></p>
            <button class="btn-quick" onclick="window.print()" style="background: #EBF8FF; color: #3182CE; border-color: #BEE3F8;">🖨️ Print / Save PDF</button>
        </div>

        <div id="print-area">
            <!-- 1. PATIENT INFO -->
            <div class="card mb-sm">
                <h3 class="mb-sm" style="color: var(--color-primary); border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Patient Information</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div><span class="text-muted text-sm">Name:</span> <span style="font-weight:500;">${profile.fullName}</span></div>
                    <div><span class="text-muted text-sm">DOB:</span> <span style="font-weight:500;">${profile.dob}</span></div>
                    <div><span class="text-muted text-sm">Age:</span> <span style="font-weight:500;">${age}</span></div>
                    <div><span class="text-muted text-sm">Sex:</span> <span style="font-weight:500;">${profile.sex}</span></div>
                    <div><span class="text-muted text-sm">Blood Group:</span> <span style="font-weight:500;">${profile.bloodGroup || 'Unknown'}</span></div>
                </div>
            </div>
    `;

    let missingData = [];

    // 2. CURRENT HEALTH
    if (options.includeHealth) {
        html += `<div class="card mb-sm">
                    <h3 class="mb-sm" style="color: var(--color-primary); border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Current Health</h3>`;
        
        if (health.allergies && health.allergies.length > 0) {
            html += `<div class="text-sm text-muted mb-sm" style="font-weight: 600; text-transform: uppercase;">Allergies</div>`;
            health.allergies.forEach(a => {
                html += `<div style="margin-bottom: 8px;"><strong>${a.name}</strong> <span class="text-sm text-muted">(${a.severity && a.severity !== 'None' ? a.severity + ', ' : ''}${a.status})</span></div>`;
            });
        } else {
            missingData.push("No allergy information recorded.");
        }

        if (health.conditions && health.conditions.length > 0) {
            html += `<div class="text-sm text-muted mb-sm mt-sm" style="font-weight: 600; text-transform: uppercase;">Active Conditions</div>`;
            health.conditions.forEach(c => {
                html += `<div style="margin-bottom: 8px;"><strong>${c.name}</strong> <span class="text-sm text-muted">(${c.status})</span></div>`;
            });
        } else {
            missingData.push("No chronic conditions recorded.");
        }

        if (health.medications && health.medications.length > 0) {
            html += `<div class="text-sm text-muted mb-sm mt-sm" style="font-weight: 600; text-transform: uppercase;">Active Medications</div>`;
            health.medications.forEach(m => {
                html += `<div style="margin-bottom: 8px;"><strong>${m.name}</strong> <span class="text-sm text-muted">${m.dosage || ''} ${m.frequency || ''} ${m.route ? `(${m.route})` : ''}</span></div>`;
            });
        } else {
            missingData.push("No active medications recorded.");
        }
        
        html += `</div>`;
    }

    // 3. RECENT MEDICAL HISTORY
    if (options.includeHistory) {
        const historyRecords = records.filter(r => ['Medical Visit', 'Procedure', 'Diagnosis', 'Vaccination'].includes(r.type));
        
        html += `<div class="card mb-sm">
                    <h3 class="mb-sm" style="color: var(--color-primary); border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Recent Medical History</h3>`;
        
        if (historyRecords.length > 0) {
            historyRecords.slice(0, 5).forEach(r => { 
                html += `
                    <div style="margin-bottom: 12px;">
                        <div style="font-weight: 600;">${r.title || r.type}</div>
                        <div class="text-sm text-muted" style="margin-bottom: 2px;">Date: ${r.date}</div>
                        <div class="text-sm" style="background: #F7FAFC; padding: 4px 8px; border-radius: 4px; display: inline-block; color: #4A5568;">Source: Record (${r.type})</div>
                    </div>
                `;
            });
        } else {
            html += `<div class="text-sm text-muted">No medical history records found.</div>`;
            missingData.push("No medical visits or procedures recorded.");
        }
        html += `</div>`;
    }

    // 4. NEW: CLINICAL DOCUMENT BRIEFS TIMELINE
    if (options.includeDocs) {
        const activeDocs = documents.filter(doc => !doc.isDeleted).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        html += `<div class="card mb-sm">
                    <h3 class="mb-sm" style="color: var(--color-primary); border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Clinical Document Briefs</h3>`;
        
        if (activeDocs.length > 0) {
            html += `<div style="position: relative; padding-left: 16px; border-left: 2px solid #E2E8F0; margin-left: 8px; margin-top: 16px;">`;
            
            activeDocs.forEach(doc => {
                const dateStr = new Date(doc.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                const summaryText = doc.aiSummary || "No AI brief generated. Extract data in the Documents tab.";
                
                html += `
                    <div style="margin-bottom: 24px; position: relative;">
                        <!-- Timeline Dot -->
                        <div style="position: absolute; left: -21px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary); border: 2px solid white;"></div>
                        
                        <div class="text-sm text-muted" style="margin-bottom: 4px; font-weight: 500;">${dateStr}</div>
                        <div style="font-weight: 600; color: #2D3748; margin-bottom: 6px;">${doc.title || doc.documentType}</div>
                        
                        <!-- The AI One-Liner Display -->
                        <div style="font-size: 0.95rem; color: #4A5568; line-height: 1.5; background: #F7FAFC; padding: 12px; border-radius: 6px; border: 1px solid #E2E8F0;">
                            ${summaryText}
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        } else {
            html += `<div class="text-sm text-muted">No documents available.</div>`;
            missingData.push("No clinical documents uploaded.");
        }
        
        html += `</div>`;
    }

    // 5. MEASUREMENTS
    if (options.includeMeasurements) {
        const measurements = records.filter(r => r.type === 'Measurement');
        const latestBP = measurements.find(m => m.title === 'Blood Pressure');
        const latestHR = measurements.find(m => m.title === 'Heart Rate');
        const latestWeight = measurements.find(m => m.title === 'Weight');

        html += `<div class="card mb-sm">
                    <h3 class="mb-sm" style="color: var(--color-primary); border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Latest Measurements</h3>`;
        
        if (latestBP || latestHR || latestWeight) {
            if (latestBP) html += `<div style="margin-bottom: 8px;"><strong>Blood Pressure:</strong> ${latestBP.value} ${latestBP.unit} <span class="text-sm text-muted ml-sm">(Source: Record, ${latestBP.date})</span></div>`;
            if (latestHR) html += `<div style="margin-bottom: 8px;"><strong>Heart Rate:</strong> ${latestHR.value} ${latestHR.unit} <span class="text-sm text-muted ml-sm">(Source: Record, ${latestHR.date})</span></div>`;
            if (latestWeight) html += `<div style="margin-bottom: 8px;"><strong>Weight:</strong> ${latestWeight.value} ${latestWeight.unit} <span class="text-sm text-muted ml-sm">(Source: Record, ${latestWeight.date})</span></div>`;
        } else {
            html += `<div class="text-sm text-muted">No recent measurements found.</div>`;
            missingData.push("No vital measurements recorded.");
        }
        html += `</div>`;
    }

    // 6. DATA GAPS
    if (missingData.length > 0) {
        html += `
            <div class="card mb-sm" style="background: #FFF5F5; border: 1px solid #FEB2B2;">
                <h3 class="mb-sm" style="color: #C53030;">Data Gaps</h3>
                <ul style="margin: 0; padding-left: 20px; color: #C53030; font-size: 0.9rem;">
                    ${missingData.map(gap => `<li>${gap}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // DISCLAIMER
    html += `
            <div style="margin-top: 24px; padding: 16px; font-size: 0.8rem; color: #718096; text-align: center; border-top: 1px dashed #E2E8F0;">
                <strong>Disclaimer:</strong> This summary is automatically generated from patient-owned records and uploaded documents. It is intended to support clinical conversations and does not replace professional medical judgment. Generated on: ${new Date().toLocaleDateString()}
            </div>
        </div>
        
        <div style="text-align: center; margin: 24px 0 48px 0;">
            <button class="btn-quick" onclick="location.hash='#/summary'">← Generate New Summary</button>
        </div>
    `;

    root.innerHTML = html;
}