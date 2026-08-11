// js/features/home.js
import { getProfile, getRecords, getCurrentHealth } from '../database.js';
import { runWalkthrough } from '../tutorial.js';

function calculateAge(dobString) {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

export async function renderHome() {
    document.getElementById('header-title').textContent = 'Home';
    const root = document.getElementById('app-root');

    const profile = await getProfile();
    const records = await getRecords();
    const health = await getCurrentHealth(); 

    if (!profile || !profile.fullName) {
        root.innerHTML = `
            <div class="card" style="text-align: center; padding: 48px 24px; margin-top: 16px;">
                <div style="margin-bottom: 16px; color: var(--color-primary); display: flex; justify-content: center;">
                    <i data-lucide="user-circle" style="width: 48px; height: 48px; stroke-width: 1.5;"></i>
                </div>
                <h3 style="color: var(--color-text-primary); margin-bottom: 8px;">Your health snapshot is ready</h3>
                <p class="text-muted mb-sm">Add health information to see your summary.</p>
                <div style="margin-top: 32px; text-align: left; background: var(--color-background); padding: 20px; border-radius: var(--radius-md);">
                    <div class="section-title">Suggested next steps</div>
                    <a href="#/profile" style="display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--color-border);"><i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i> Complete Patient Profile</a>
                    <a href="#/records?action=new&type=Measurement" style="display: flex; align-items: center; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--color-border);"><i data-lucide="activity" style="width: 18px; height: 18px;"></i> Record Measurement</a>
                    <a href="#/documents" style="display: flex; align-items: center; gap: 8px; padding: 12px 0;"><i data-lucide="file-up" style="width: 18px; height: 18px;"></i> Upload Document</a>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        runWalkthrough();
        return;
    }
    
    const activeMeds = health.medications || [];
    const chronicConditions = health.conditions || [];
    const allergies = health.allergies || [];

    const measurements = records.filter(r => r.type === 'Measurement');
    const latestBP = measurements.find(m => m.title === 'Blood Pressure');
    const latestHR = measurements.find(m => m.title === 'Heart Rate');

    const age = calculateAge(profile.dob);
    const nameParts = profile.fullName ? profile.fullName.trim().split(' ') : ['?'];
    const initials = nameParts.length > 1 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() 
        : nameParts[0][0].toUpperCase();

    let html = `
        <div class="flex-between mb-sm">
            <p class="text-muted text-sm font-medium">Clinical Snapshot</p>
            <i data-lucide="more-vertical" style="cursor: pointer; color: var(--color-text-secondary); width: 20px; height: 20px;" onclick="location.hash='#/profile'"></i>
        </div>

        <!-- PATIENT IDENTITY -->
        <div id="tour-profile-card" class="card flex-row gap-md" style="cursor: pointer; align-items: center;" onclick="location.hash='#/profile'">
            <div class="avatar" style="background: #EBF8FF; color: var(--color-primary); border: none;">
                ${initials}
            </div>
            <div style="flex: 1;">
                <h3 style="margin: 0;">${profile.fullName}</h3>
                <div class="text-sm text-muted" style="margin-top: 2px;">${age} years • ${profile.sex}</div>
                <div class="text-sm text-muted">Blood Group: <strong>${profile.bloodGroup || 'Unknown'}</strong></div>
            </div>
            <div style="color: var(--color-primary); font-size: 0.875rem; font-weight: 600;">See more</div>
        </div>

        <!-- CURRENT HEALTH -->
        <div id="tour-current-health" class="card" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Current Health</span>
            </div>
            <div style="padding: var(--space-l);">
                
                <div class="mb-md">
                    <div class="section-title" style="margin-bottom: 8px;">Allergies</div>
                    ${allergies.length > 0 
                        ? allergies.map(a => `<div style="padding: 8px 12px; background: var(--color-background); border-radius: var(--radius-sm); margin-bottom: 4px; display: inline-block; margin-right: 8px;">${a.name}</div>`).join('')
                        : '<a href="#/current-health?action=new&type=allergy" class="text-sm" style="color: var(--color-primary); display: flex; align-items: center; gap: 4px;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Allergy</a>'}
                </div>

                <div class="mb-md">
                    <div class="section-title" style="margin-bottom: 8px;">Chronic Conditions</div>
                    ${chronicConditions.length > 0 
                        ? chronicConditions.map(c => `<div style="padding: 8px 12px; background: var(--color-background); border-radius: var(--radius-sm); margin-bottom: 4px;">${c.name}</div>`).join('')
                        : '<a href="#/current-health?action=new&type=condition" class="text-sm" style="color: var(--color-primary); display: flex; align-items: center; gap: 4px;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Condition</a>'}
                </div>

                <div>
                    <div class="section-title" style="margin-bottom: 8px;">Active Medications</div>
                    ${activeMeds.length > 0 
                        ? activeMeds.map(m => `
                            <div style="padding: 12px; background: var(--color-background); border-radius: var(--radius-md); margin-bottom: 8px;">
                                <div class="font-medium">${m.name}</div>
                                <div class="text-sm text-muted">${m.dosage || ''} ${m.frequency || ''}</div>
                            </div>`).join('')
                        : '<a href="#/current-health?action=new&type=medication" class="text-sm" style="color: var(--color-primary); display: flex; align-items: center; gap: 4px;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i> Add Medication</a>'}
                </div>
            </div>
        </div>

        <!-- LATEST MEASUREMENTS -->
        <div id="tour-latest-measurements" class="card" style="padding: 0;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Latest Measurements</span>
            </div>
            <div class="list-group" style="padding: 0 var(--space-l);">
                ${latestBP ? `
                    <a href="#/records?id=${latestBP.id}" class="list-item" style="padding: 16px 0;">
                        <div>
                            <div class="font-medium">Blood Pressure</div>
                            <div class="text-sm text-muted">${latestBP.date}</div>
                        </div>
                        <div style="font-weight: 600; color: var(--color-primary); font-size: 1.1rem;">${latestBP.value} <span style="font-size: 0.8rem; font-weight: normal;">${latestBP.unit}</span></div>
                    </a>
                ` : '<div class="list-item text-sm text-muted" style="padding: 16px 0;">Blood Pressure <span style="margin-left: auto;">--</span></div>'}
                
                ${latestHR ? `
                    <a href="#/records?id=${latestHR.id}" class="list-item" style="padding: 16px 0; border-bottom: none;">
                        <div>
                            <div class="font-medium">Heart Rate</div>
                            <div class="text-sm text-muted">${latestHR.date}</div>
                        </div>
                        <div style="font-weight: 600; color: var(--color-primary); font-size: 1.1rem;">${latestHR.value} <span style="font-size: 0.8rem; font-weight: normal;">${latestHR.unit}</span></div>
                    </a>
                ` : '<div class="list-item text-sm text-muted" style="padding: 16px 0; border-bottom: none;">Heart Rate <span style="margin-left: auto;">--</span></div>'}
            </div>
        </div>
    `;

    root.innerHTML = html;
    if(window.lucide) window.lucide.createIcons(); 
    
    // Launch tutorial
    runWalkthrough(); 
}