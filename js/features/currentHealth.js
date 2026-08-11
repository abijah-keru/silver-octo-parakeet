// js/features/currentHealth.js
import { getCurrentHealth, saveCurrentHealth, generateId } from '../database.js';

window.deleteHealthItem = async function(type, id) {
    if (confirm('Are you sure you want to remove this item?')) {
        const health = await getCurrentHealth();
        const arrayMap = { 'allergy': 'allergies', 'condition': 'conditions', 'medication': 'medications' };
        const arrayName = arrayMap[type];
        
        if (health[arrayName]) {
            health[arrayName] = health[arrayName].filter(item => item.id !== id);
            await saveCurrentHealth(health);
            renderCurrentHealth();
        }
    }
};

export async function renderCurrentHealth() {
    document.getElementById('header-title').textContent = 'Current Health';
    const root = document.getElementById('app-root');

    const health = await getCurrentHealth();
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const action = urlParams.get('action');
    const type = urlParams.get('type');

    if (action === 'new' && type) {
        return renderHealthForm(root, health, type);
    }

    let html = `
        <div class="flex-between mb-sm">
            <p class="text-muted text-sm font-medium">Manage your living clinical state.</p>
        </div>
    `;

    // 1. Allergies
    html += `
        <div class="card" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Allergies</span>
                <button class="btn-quick" onclick="location.hash='#/current-health?action=new&type=allergy'"><i data-lucide="plus" style="width: 16px; height: 16px;"></i> Add</button>
            </div>
            <div class="list-group" style="padding: 0 var(--space-l);">
                ${health.allergies && health.allergies.length > 0 ? health.allergies.map(a => `
                    <div class="list-item" style="padding-left: 12px; border-left: 2px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
                        <div>
                            <div class="font-medium">${a.name}</div>
                            <div class="text-sm text-muted">${a.severity && a.severity !== 'None' ? a.severity + ' • ' : ''}${a.status}</div>
                        </div>
                        <button onclick="window.deleteHealthItem('allergy', '${a.id}')" class="btn-quick" style="color: var(--color-text-disabled);"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>
                    </div>
                `).join('') : '<div class="list-item text-muted text-sm" style="padding: 16px 0; border: none;">No active allergies.</div>'}
            </div>
        </div>
    `;

    // 2. Chronic Conditions
    html += `
        <div class="card" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Chronic Conditions</span>
                <button class="btn-quick" onclick="location.hash='#/current-health?action=new&type=condition'"><i data-lucide="plus" style="width: 16px; height: 16px;"></i> Add</button>
            </div>
            <div class="list-group" style="padding: 0 var(--space-l);">
                ${health.conditions && health.conditions.length > 0 ? health.conditions.map(c => `
                    <div class="list-item" style="padding-left: 12px; border-left: 2px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
                        <div>
                            <div class="font-medium">${c.name}</div>
                            <div class="text-sm text-muted">Status: ${c.status}</div>
                        </div>
                        <button onclick="window.deleteHealthItem('condition', '${c.id}')" class="btn-quick" style="color: var(--color-text-disabled);"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>
                    </div>
                `).join('') : '<div class="list-item text-muted text-sm" style="padding: 16px 0; border: none;">No chronic conditions.</div>'}
            </div>
        </div>
    `;

    // 3. Active Medications
    html += `
        <div class="card" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Active Medications</span>
                <button class="btn-quick" onclick="location.hash='#/current-health?action=new&type=medication'"><i data-lucide="plus" style="width: 16px; height: 16px;"></i> Add</button>
            </div>
            <div class="list-group" style="padding: 0 var(--space-l);">
                ${health.medications && health.medications.length > 0 ? health.medications.map(m => `
                    <div class="list-item" style="padding-left: 12px; border-left: 2px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
                        <div>
                            <div class="font-medium">${m.name}</div>
                            <div class="text-sm text-muted">${m.dosage || ''} ${m.frequency || ''} ${m.route ? `• ${m.route}` : ''}</div>
                        </div>
                        <button onclick="window.deleteHealthItem('medication', '${m.id}')" class="btn-quick" style="color: var(--color-text-disabled);"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>
                    </div>
                `).join('') : '<div class="list-item text-muted text-sm" style="padding: 16px 0; border: none;">No active medications.</div>'}
            </div>
        </div>
    `;

    root.innerHTML = html;
    
    // Initialize Lucide icons for the newly injected HTML
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// --- FORM VIEW FOR ADDING ITEMS ---
function renderHealthForm(root, health, type) {
    let formTitle = '';
    let fieldsHTML = '';

    if (type === 'allergy') {
        formTitle = 'Add Allergy';
        fieldsHTML = `
            <div class="mb-sm">
                <label class="text-sm text-muted font-medium">Allergen Name *</label>
                <input type="text" name="name" id="itemName" list="allergy-options" required class="form-input" placeholder="Type or select from list..." autocomplete="off">
                <datalist id="allergy-options">
                    <option value="None Known">
                    <option value="Penicillin">
                    <option value="Peanuts">
                    <option value="Latex">
                </datalist>
            </div>
            <div class="mb-sm"><label class="text-sm text-muted font-medium">Severity</label>
                <select name="severity" id="itemSeverity" class="form-input">
                    <option value="None">None</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                </select>
            </div>
            <div class="mb-sm"><label class="text-sm text-muted font-medium">Status</label>
                <select name="status" id="itemStatus" class="form-input">
                    <option value="Active">Active</option>
                    <option value="Resolved">Resolved</option>
                    <option value="N/A">N/A</option>
                </select>
            </div>
        `;
    } else if (type === 'condition') {
        formTitle = 'Add Chronic Condition';
        fieldsHTML = `
            <div class="mb-sm">
                <label class="text-sm text-muted font-medium">Condition Name *</label>
                <input type="text" name="name" id="itemName" list="condition-options" required class="form-input" placeholder="Type or select from list..." autocomplete="off">
                <datalist id="condition-options">
                    <option value="None Known">
                    <option value="Asthma">
                    <option value="Hypertension">
                    <option value="Type 2 Diabetes">
                </datalist>
            </div>
            <div class="mb-sm"><label class="text-sm text-muted font-medium">Status</label>
                <select name="status" id="itemStatus" class="form-input">
                    <option value="Active">Active</option>
                    <option value="Controlled">Controlled</option>
                    <option value="Resolved">Resolved</option>
                    <option value="N/A">N/A</option>
                </select>
            </div>
        `;
    } else if (type === 'medication') {
        formTitle = 'Add Active Medication';
        fieldsHTML = `
            <div class="mb-sm">
                <label class="text-sm text-muted font-medium">Medication Name *</label>
                <input type="text" name="name" id="itemName" list="medication-options" required class="form-input" placeholder="Type or select from list..." autocomplete="off">
                <datalist id="medication-options">
                    <option value="None Currently">
                    <option value="Paracetamol">
                    <option value="Amoxicillin">
                    <option value="Ibuprofen">
                </datalist>
            </div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div><label class="text-sm text-muted font-medium">Dosage</label><input type="text" name="dosage" id="itemDosage" class="form-input" placeholder="e.g. 50mg"></div>
                <div><label class="text-sm text-muted font-medium">Frequency</label><input type="text" name="frequency" id="itemFreq" class="form-input" placeholder="e.g. Daily"></div>
            </div>
            <div class="mb-sm"><label class="text-sm text-muted font-medium">Route</label><input type="text" name="route" id="itemRoute" class="form-input" placeholder="e.g. Oral"></div>
            <input type="hidden" name="status" id="itemStatus" value="Active">
        `;
    }

    root.innerHTML = `
        <div class="card">
            <h3 class="mb-sm">${formTitle}</h3>
            <form id="health-form">
                ${fieldsHTML}
                <div style="display: flex; gap: 8px; margin-top: 32px;">
                    <button type="submit" class="btn-primary" style="flex: 1;">Save</button>
                    <button type="button" class="btn-secondary" onclick="window.history.back()" style="flex: 1;">Cancel</button>
                </div>
            </form>
        </div>
    `;

    // --- UX AUTO-UPDATING LOGIC ---
    const nameInput = document.getElementById('itemName');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val === 'None Known' || val === 'None Currently') {
                const sevInput = document.getElementById('itemSeverity');
                if (sevInput) sevInput.value = 'None';
                
                const statInput = document.getElementById('itemStatus');
                if (statInput) statInput.value = 'N/A';
                
                const dosageInput = document.getElementById('itemDosage');
                if (dosageInput) dosageInput.value = '';
                
                const freqInput = document.getElementById('itemFreq');
                if (freqInput) freqInput.value = '';
                
                const routeInput = document.getElementById('itemRoute');
                if (routeInput) routeInput.value = '';
            }
        });
    }

    document.getElementById('health-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const itemData = Object.fromEntries(formData.entries());
        itemData.id = generateId('health');

        const arrayMap = { 'allergy': 'allergies', 'condition': 'conditions', 'medication': 'medications' };
        const arrayName = arrayMap[type];

        if (!health[arrayName]) health[arrayName] = [];
        health[arrayName].push(itemData);

        await saveCurrentHealth(health);
        window.location.hash = '#/current-health';
    });
}