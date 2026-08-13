// js/features/home.js
import { getProfile, getRecords, getCurrentHealth } from '../database.js';
import { runWalkthrough } from '../tutorial.js';

function calculateAge(dobString) {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const now = new Date();
    const diff_ms = now.getTime() - dob.getTime();
    const age_dt = new Date(diff_ms);
    const years = Math.abs(age_dt.getUTCFullYear() - 1970);
    
    if (years === 0) {
        let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
        if (now.getDate() < dob.getDate()) months--;
        if (months <= 0) return 'Newborn';
        return `${months} mo`;
    }
    return `${years} yrs`;
}

export async function renderHome() {
    document.getElementById('header-title').textContent = 'Home';
    const root = document.getElementById('app-root');

    const profile = await getProfile();
    const records = await getRecords();
    const health = await getCurrentHealth(); 

    if (!profile || !profile.fullName) return; 
    
    const activeMeds = health.medications || [];
    const chronicConditions = health.conditions || [];
    const allergies = health.allergies || [];

    const measurements = records.filter(r => r.type === 'Measurement');
    const latestBP = measurements.find(m => m.title === 'Blood Pressure');
    const latestHR = measurements.find(m => m.title === 'Heart Rate');
    const age = calculateAge(profile.dob);

    let html = `
        <!-- PATIENT PROFILE CARD -->
        <div id="tour-profile-card" class="card" style="padding: var(--space-l); cursor: pointer;" onclick="location.hash='#/profile'">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600;">${profile.fullName}</h3>
                <div style="color: var(--color-primary); font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">Edit</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--color-border); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="background: var(--color-surface); padding: 12px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 4px;">Age</div>
                    <div style="font-weight: 500;">${age}</div>
                </div>
                <div style="background: var(--color-surface); padding: 12px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 4px;">Sex</div>
                    <div style="font-weight: 500;">${profile.sex || '--'}</div>
                </div>
                <div style="background: var(--color-surface); padding: 12px; text-align: center;">
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 4px;">Blood Group</div>
                    <div style="font-weight: 500;">${profile.bloodGroup === 'Unknown' ? '--' : (profile.bloodGroup || '--')}</div>
                </div>
            </div>
        </div>

        <!-- CURRENT HEALTH (REDESIGNED TO MATCH MEASUREMENTS) -->
        <div id="tour-current-health" class="card" style="padding: 0; margin-top: 16px;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Current Health</span>
            </div>
            <div class="list-group" style="padding: 0 var(--space-l);">
                
                <!-- Allergies Row -->
                <div class="list-item" style="padding: 16px 0; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; padding-right: 16px;">
                        <div class="font-medium">Allergies</div>
                        <div class="text-sm text-muted" style="line-height: 1.4; margin-top: 2px;">
                            ${allergies.length > 0 ? allergies.map(a => a.name).join(', ') : 'No records'}
                        </div>
                    </div>
                    <a href="#/current-health?action=new&type=allergy" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #EBF8FF; border-radius: 50%; color: var(--color-primary); text-decoration: none; flex-shrink: 0;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></a>
                </div>

                <!-- Conditions Row -->
                <div class="list-item" style="padding: 16px 0; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; padding-right: 16px;">
                        <div class="font-medium">Chronic Conditions</div>
                        <div class="text-sm text-muted" style="line-height: 1.4; margin-top: 2px;">
                            ${chronicConditions.length > 0 ? chronicConditions.map(c => c.name).join(', ') : 'No records'}
                        </div>
                    </div>
                    <a href="#/current-health?action=new&type=condition" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #EBF8FF; border-radius: 50%; color: var(--color-primary); text-decoration: none; flex-shrink: 0;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></a>
                </div>

                <!-- Medications Row -->
                <div class="list-item" style="padding: 16px 0; border-bottom: none; display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; padding-right: 16px;">
                        <div class="font-medium">Active Medications</div>
                        <div class="text-sm text-muted" style="line-height: 1.4; margin-top: 2px;">
                            ${activeMeds.length > 0 ? activeMeds.map(m => m.name).join(', ') : 'No records'}
                        </div>
                    </div>
                    <a href="#/current-health?action=new&type=medication" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #EBF8FF; border-radius: 50%; color: var(--color-primary); text-decoration: none; flex-shrink: 0;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></a>
                </div>

            </div>
        </div>

        <!-- LATEST MEASUREMENTS -->
        <div id="tour-latest-measurements" class="card" style="padding: 0; margin-top: 16px;">
            <div class="card-header" style="padding: var(--space-l); border-bottom: 1px solid var(--color-border); margin: 0;">
                <span class="card-title">Latest Measurements</span>
            </div>
            <div class="list-group" style="padding: 0 var(--space-l);">
                
                <div class="list-item" style="padding: 16px 0; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div class="font-medium">Blood Pressure</div>
                        <div class="text-sm text-muted">${latestBP ? latestBP.date : 'No records'}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        ${latestBP ? `<div style="font-weight: 600; color: var(--color-primary); font-size: 1.1rem;">${latestBP.value} <span style="font-size: 0.8rem; font-weight: normal;">${latestBP.unit}</span></div>` : ''}
                        <!-- Auto-populate parameter added to URL below -->
                        <a href="#/records?action=new&type=Measurement&title=Blood%20Pressure" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #EBF8FF; border-radius: 50%; color: var(--color-primary); text-decoration: none;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></a>
                    </div>
                </div>
                
                <div class="list-item" style="padding: 16px 0; border-bottom: none; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div class="font-medium">Heart Rate</div>
                        <div class="text-sm text-muted">${latestHR ? latestHR.date : 'No records'}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        ${latestHR ? `<div style="font-weight: 600; color: var(--color-primary); font-size: 1.1rem;">${latestHR.value} <span style="font-size: 0.8rem; font-weight: normal;">${latestHR.unit}</span></div>` : ''}
                        <!-- Auto-populate parameter added to URL below -->
                        <a href="#/records?action=new&type=Measurement&title=Heart%20Rate" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #EBF8FF; border-radius: 50%; color: var(--color-primary); text-decoration: none;"><i data-lucide="plus" style="width: 16px; height: 16px;"></i></a>
                    </div>
                </div>
                
            </div>
        </div>
    `;

    root.innerHTML = html;
    if(window.lucide) window.lucide.createIcons(); 
    runWalkthrough(); 
}