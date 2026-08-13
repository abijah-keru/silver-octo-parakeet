// js/features/staging.js
import { saveRecord, getDocumentById, saveDocument } from '../database.js';

export function renderStagingArea(rootElement, structuredData, sourceDocumentId) {
    let alertsHtml = '';
    if (structuredData.criticalAlerts && structuredData.criticalAlerts.length > 0) {
        alertsHtml = `
            <div style="background: #FFF5F5; border: 1px solid #FEB2B2; border-radius: 4px; padding: 12px; margin-bottom: 16px;">
                <h4 style="color: #C53030; margin-bottom: 8px; font-size: 0.9rem;">⚠️ Abnormal Findings Detected</h4>
                <ul style="margin: 0; padding-left: 20px; color: #9B2C2C; font-size: 0.85rem;">
                    ${structuredData.criticalAlerts.map(alert => `<li>${alert}</li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        alertsHtml = `
            <div style="background: #F0FFF4; border: 1px solid #9AE6B4; border-radius: 4px; padding: 12px; margin-bottom: 16px;">
                <span style="color: #276749; font-size: 0.85rem;">✓ All extracted values appear to be within normal ranges.</span>
            </div>
        `;
    }

    const totalLabs = structuredData.laboratoryValues ? structuredData.laboratoryValues.length : 0;
    const totalMeds = structuredData.medications ? structuredData.medications.length : 0;

    rootElement.innerHTML = `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #E2E8F0;">
            <h2 style="color: var(--color-primary); margin-bottom: 16px;">AI Analysis Complete</h2>
            
            <!-- The New One-Liner Card -->
            <div class="card" style="margin-bottom: 16px; border-left: 4px solid var(--color-primary);">
                <h4 style="color: #4A5568; margin-bottom: 4px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Doctor's Brief (One-Liner)</h4>
                <p style="font-size: 1.1rem; font-weight: 600; color: #2D3748; line-height: 1.4;">${structuredData.oneLiner || "Clinical summary not available."}</p>
            </div>

            <!-- The Executive Summary -->
            <div class="card" style="margin-bottom: 16px;">
                <h4 style="color: #4A5568; margin-bottom: 8px; font-size: 0.85rem; text-transform: uppercase;">Detailed Summary</h4>
                <p style="font-size: 0.95rem; color: #4A5568; line-height: 1.5;">${structuredData.executiveSummary || "No summary generated."}</p>
            </div>

            ${alertsHtml}

            <div class="text-sm text-muted" style="margin-bottom: 16px; text-align: center;">
                Background Extraction: Found ${totalLabs} lab results and ${totalMeds} medications.
            </div>

            <div style="display: flex; gap: 8px;">
                <button id="btn-approve-all" style="flex: 2; padding: 12px; background: #319795; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                    ✓ Approve & Save Data
                </button>
                <button id="btn-reject-all" style="flex: 1; padding: 12px; background: #E2E8F0; color: #4A5568; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">
                    Discard
                </button>
            </div>
        </div>
    `;

    document.getElementById('btn-approve-all').addEventListener('click', async () => {
        const btn = document.getElementById('btn-approve-all');
        btn.textContent = "Saving...";
        btn.disabled = true;

        // 1. Attach the One-Liner to the original document in the database
        try {
            const originalDoc = await getDocumentById(sourceDocumentId);
            if (originalDoc) {
                originalDoc.aiSummary = structuredData.oneLiner;
                await saveDocument(originalDoc);
            }
        } catch (err) {
            console.error("Failed to update document with summary", err);
        }

        // 2. Save all the individual background data points
        if (structuredData.laboratoryValues) {
            for (const lab of structuredData.laboratoryValues) {
                await saveRecord({
                    type: 'Laboratory Result',
                    title: lab.testName,
                    notes: `${lab.result} ${lab.unit} (Range: ${lab.referenceRange}) - Flag: ${lab.flag}`,
                    date: new Date().toISOString().split('T')[0],
                    linkedDocumentIds: [sourceDocumentId],
                    aiProvenance: { originalExtraction: lab, isEdited: false }
                });
            }
        }
        
        alert(`Successfully saved the Doctor's Brief and background records to your database!`);
        rootElement.innerHTML = ''; 
        window.location.reload(); 
    });

    document.getElementById('btn-reject-all').addEventListener('click', () => {
        rootElement.innerHTML = ''; 
    });
}