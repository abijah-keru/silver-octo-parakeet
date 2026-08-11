// js/features/profile.js
import { getProfile, saveProfile } from '../database.js';

let isEditing = false;
let hasUnsavedChanges = false;

function calculateAge(dobString) {
    if (!dobString) return '';
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

export function renderProfileSetup(step = 'welcome') {
    const root = document.getElementById('app-root');
    
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    
    const headerRight = document.querySelector('#app-header div:last-child');
    if (headerRight) headerRight.style.display = 'none';
    
    if (step === 'welcome') {
        document.getElementById('header-title').textContent = ''; // Clear title for a cleaner hero look
        
        // UPGRADED PROFESSIONAL WELCOME SCREEN
        root.innerHTML = `
            <div style="max-width: 480px; margin: 0 auto; padding-top: 24px;">
                
                <div style="text-align: center; margin-bottom: 48px;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 88px; height: 88px; background: var(--color-surface); color: var(--color-primary); border-radius: 28px; box-shadow: var(--shadow-level-2); margin-bottom: 24px;">
                        <i data-lucide="heart-pulse" style="width: 44px; height: 44px; stroke-width: 1.5;"></i>
                    </div>
                    <h2 style="font-size: 2rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; letter-spacing: -0.03em;">Personal Health Record</h2>
                    <p class="text-muted" style="font-size: 1.1rem; line-height: 1.6; padding: 0 16px;">Take control of your medical data. Keep your history, vitals, and documents in one secure place.</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 32px; margin-bottom: 56px; padding: 0 24px;">
                    
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="color: var(--color-primary); padding-top: 4px;">
                            <i data-lucide="clipboard-list" style="width: 28px; height: 28px; stroke-width: 1.5;"></i>
                        </div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Record medical history</div>
                            <div class="text-muted" style="font-size: 0.95rem; line-height: 1.5;">Log conditions, allergies, and active medications to maintain a living clinical record.</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="color: var(--color-primary); padding-top: 4px;">
                            <i data-lucide="activity" style="width: 28px; height: 28px; stroke-width: 1.5;"></i>
                        </div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Track measurements</div>
                            <div class="text-muted" style="font-size: 0.95rem; line-height: 1.5;">Monitor vital signs like blood pressure and heart rate over time to visualize your health trends.</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="color: var(--color-primary); padding-top: 4px;">
                            <i data-lucide="file-text" style="width: 28px; height: 28px; stroke-width: 1.5;"></i>
                        </div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Generate summaries</div>
                            <div class="text-muted" style="font-size: 0.95rem; line-height: 1.5;">Instantly create clean, clinician-ready health reports to share at your next doctor's visit.</div>
                        </div>
                    </div>
                    
                </div>
                
                <div style="padding: 0 24px;">
                    <button id="btn-get-started" class="btn-primary" style="font-size: 1.1rem; padding: 16px; border-radius: 16px; box-shadow: var(--shadow-level-1);">Get Started</button>
                </div>
            </div>
        `;
        
        lucide.createIcons();

        document.getElementById('btn-get-started').addEventListener('click', () => {
            renderProfileSetup('form');
        });
        
    } else if (step === 'form') {
        document.getElementById('header-title').textContent = 'Setup Profile';
        root.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 32px; padding-top: 16px;">
                    <h2 style="font-size: 1.5rem; color: var(--color-text-primary); margin-bottom: 8px;">Create your profile</h2>
                    <p class="text-muted text-sm">Enter your basic information to get started.</p>
                </div>
                ${getProfileFormHTML()}
            </div>
        `;
        lucide.createIcons();
        attachFormListeners('setup');
    }
}

export async function renderProfile() {
    document.getElementById('header-title').textContent = 'Patient Profile';
    const root = document.getElementById('app-root');
    const profile = await getProfile();

    if (isEditing) {
        root.innerHTML = `<div style="max-width: 600px; margin: 0 auto;">${getProfileFormHTML(profile)}</div>`;
        attachFormListeners('edit');
    } else {
        const nameParts = profile.fullName ? profile.fullName.trim().split(' ') : ['?'];
        const initials = nameParts.length > 1 ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase() : nameParts[0][0].toUpperCase();
        const age = calculateAge(profile.dob);
        const ageDisplay = age ? `${age} years old • ` : '';

        root.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div class="flex-between mb-l" style="margin-bottom: 32px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="avatar" style="width: 64px; height: 64px; background: #EBF8FF; color: var(--color-primary); border: none; font-size: 1.5rem;">${initials}</div>
                        <div>
                            <h2 style="margin: 0; color: var(--color-text-primary); font-size: 1.25rem;">${profile.fullName || 'User'}</h2>
                            <div class="text-sm text-muted">${ageDisplay}${profile.sex || ''}</div>
                        </div>
                    </div>
                    <button aria-label="Settings" class="btn-quick" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-secondary);" onclick="location.hash='#/settings'"><i data-lucide="settings" style="width: 20px; height: 20px;"></i></button>
                </div>

                <div class="card mb-sm">
                    <div class="card-header"><span class="card-title">Personal information</span><button id="btn-edit" class="btn-quick" style="min-width: auto; min-height: auto; padding: 4px 8px;"><i data-lucide="edit-2" style="width: 16px; height: 16px;"></i> Edit</button></div>
                    <div class="list-group">
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Full Name</span> <span class="font-medium">${profile.fullName}</span></div>
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Date of Birth</span> <span class="font-medium">${profile.dob}</span></div>
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Age</span> <span class="font-medium">${age}</span></div>
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Biological Sex</span> <span class="font-medium">${profile.sex}</span></div>
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Blood Group</span> <span class="font-medium">${profile.bloodGroup || 'Unknown'}</span></div>
                    </div>
                </div>

                <div class="card mb-sm">
                    <div class="card-header"><span class="card-title">Emergency contact</span></div>
                    <div class="list-group">
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Name</span> <span class="font-medium">${profile.emergencyName || 'Not provided'}</span></div>
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Relationship</span> <span class="font-medium">${profile.emergencyRelation || 'Not provided'}</span></div>
                        <div class="list-item" style="border: none; padding: 8px 0;"><span class="text-muted">Phone Number</span> <span class="font-medium">${profile.emergencyPhone ? `<a href="tel:${profile.emergencyPhone}">${profile.emergencyPhone}</a>` : 'Not provided'}</span></div>
                    </div>
                </div>

                <a href="#/current-health" class="card flex-between" style="text-decoration: none; border-left: 4px solid var(--color-primary);">
                    <div><h3 style="margin: 0 0 4px 0; color: var(--color-text-primary); font-size: 1rem;">Current Health</h3><div class="text-sm text-muted">Manage allergies, medications, and conditions</div></div>
                    <i data-lucide="chevron-right" style="color: var(--color-text-disabled);"></i>
                </a>
                
                <p class="text-sm text-muted mt-sm" style="text-align: center; margin-top: 32px;">Keep this information up to date so your health records and summaries remain accurate.</p>
                <div id="toast-container" class="mt-sm" style="text-align: center; color: var(--color-success); font-weight: 500;"></div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('btn-edit').addEventListener('click', () => { isEditing = true; renderProfile(); });
    }
}

function getProfileFormHTML(existingData = {}) {
    return `
        <form id="profile-form" class="card">
            <h3 class="mb-sm">About You</h3>
            <div class="mb-sm"><label for="fullName" class="text-sm text-muted font-medium">Full Name *</label><input type="text" id="fullName" name="fullName" class="form-input" value="${existingData.fullName || ''}" required></div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div><label for="dob" class="text-sm text-muted font-medium">Date of Birth *</label><input type="date" id="dob" name="dob" class="form-input" max="${new Date().toISOString().split('T')[0]}" value="${existingData.dob || ''}" required></div>
                <div><label for="ageDisplay" class="text-sm text-muted font-medium">Age</label><input type="text" id="ageDisplay" class="form-input" value="${calculateAge(existingData.dob)}" readonly></div>
            </div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label for="sex" class="text-sm text-muted font-medium">Biological Sex *</label>
                    <select id="sex" name="sex" class="form-input" required>
                        <option value="" disabled ${!existingData.sex ? 'selected' : ''}>Select</option>
                        <option value="Female" ${existingData.sex === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Male" ${existingData.sex === 'Male' ? 'selected' : ''}>Male</option>
                    </select>
                </div>
                <div>
                    <label for="bloodGroup" class="text-sm text-muted font-medium">Blood Group</label>
                    <select id="bloodGroup" name="bloodGroup" class="form-input">
                        <option value="Unknown" ${existingData.bloodGroup === 'Unknown' || !existingData.bloodGroup ? 'selected' : ''}>Unknown</option>
                        <option value="A+" ${existingData.bloodGroup === 'A+' ? 'selected' : ''}>A+</option><option value="O+" ${existingData.bloodGroup === 'O+' ? 'selected' : ''}>O+</option><option value="O-" ${existingData.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
                    </select>
                </div>
            </div>
            <h3 class="mt-sm mb-sm" style="border-top: 1px solid var(--color-border); padding-top: 24px; margin-top: 32px;">Emergency Contact <span class="text-muted" style="font-size: 0.8rem; font-weight: normal;">(Optional)</span></h3>
            <div class="mb-sm"><label for="emergencyName" class="text-sm text-muted font-medium">Contact Name</label><input type="text" id="emergencyName" name="emergencyName" class="form-input" value="${existingData.emergencyName || ''}"></div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div><label for="emergencyRelation" class="text-sm text-muted font-medium">Relationship</label><input type="text" id="emergencyRelation" name="emergencyRelation" class="form-input" value="${existingData.emergencyRelation || ''}"></div>
                <div><label for="emergencyPhone" class="text-sm text-muted font-medium">Phone Number</label><input type="tel" id="emergencyPhone" name="emergencyPhone" class="form-input" value="${existingData.emergencyPhone || ''}"></div>
            </div>
            <div id="form-error" class="mb-sm" style="color: var(--color-error); font-size: 0.85rem; display: none;"></div>
            <div style="display: flex; gap: 12px; margin-top: 32px;">
                <button type="submit" id="btn-save" class="btn-primary" style="flex: 1;">${isEditing ? 'Save changes' : 'Continue'}</button>
                ${isEditing ? '<button type="button" id="btn-cancel" class="btn-secondary" style="flex: 1;">Cancel</button>' : ''}
            </div>
        </form>
    `;
}

function attachFormListeners(mode) {
    const form = document.getElementById('profile-form');
    const dobInput = document.getElementById('dob');
    const btnSave = document.getElementById('btn-save');

    dobInput.addEventListener('change', (e) => { document.getElementById('ageDisplay').value = calculateAge(e.target.value); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSave.disabled = true;
        btnSave.innerHTML = '<i data-lucide="loader" style="width: 18px; height: 18px; animation: spin 1s linear infinite;"></i>';
        
        try {
            await saveProfile(Object.fromEntries(new FormData(form).entries()));
            
            if (mode === 'setup') {
                const bottomNav = document.getElementById('bottom-nav');
                if (bottomNav) bottomNav.style.display = 'flex';
                const headerRight = document.querySelector('#app-header div:last-child');
                if (headerRight) headerRight.style.display = 'flex';
                
                // Set a flag to show the interactive walkthrough!
                localStorage.setItem('showWalkthrough', 'true');
                window.location.hash = '#/'; 
            } else {
                isEditing = false;
                await renderProfile(); 
            }
        } catch (error) {
            btnSave.disabled = false;
            btnSave.textContent = isEditing ? 'Save changes' : 'Continue';
        }
    });
}