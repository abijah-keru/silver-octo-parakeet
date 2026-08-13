// js/features/profile.js
import { getProfile, saveProfile } from '../database.js';

let isEditing = false;

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
        return `${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${years} years`;
}

export function renderProfileSetup(step = 'welcome') {
    const root = document.getElementById('app-root');
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    
    document.getElementById('header-title').textContent = ''; 
    
    if (step === 'welcome') {
        root.innerHTML = `
            <div style="max-width: 480px; margin: 0 auto; padding-top: 24px;">
                <div style="text-align: center; margin-bottom: 48px;">
                    <!-- REPLACE THIS FILENAME WITH YOUR ACTUAL LOGO -->
                    <img src="assets/logo.png" alt="App Logo" style="width: 88px; height: 88px; margin-bottom: 24px; border-radius: 28px; box-shadow: var(--shadow-level-2);">
                    
                    <h2 style="font-size: 2rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 12px; letter-spacing: -0.03em;">Personal Health Record</h2>
                    <p class="text-muted" style="font-size: 1.1rem; line-height: 1.6; padding: 0 16px;">Keep all your health information in one secure, locally-stored place.</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 32px; margin-bottom: 56px; padding: 0 24px;">
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="color: var(--color-primary); padding-top: 4px;"><i data-lucide="clipboard-list" style="width: 28px; height: 28px; stroke-width: 1.5;"></i></div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Record medical history</div>
                            <div class="text-muted" style="font-size: 0.95rem; line-height: 1.5;">Log conditions, allergies, and active medications.</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="color: var(--color-primary); padding-top: 4px;"><i data-lucide="activity" style="width: 28px; height: 28px; stroke-width: 1.5;"></i></div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Track measurements</div>
                            <div class="text-muted" style="font-size: 0.95rem; line-height: 1.5;">Monitor vitals like blood pressure and heart rate over time.</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <div style="color: var(--color-primary); padding-top: 4px;"><i data-lucide="file-text" style="width: 28px; height: 28px; stroke-width: 1.5;"></i></div>
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--color-text-primary); margin-bottom: 4px;">Generate summaries</div>
                            <div class="text-muted" style="font-size: 0.95rem; line-height: 1.5;">Instantly create clean, clinician-ready health reports.</div>
                        </div>
                    </div>
                </div>
                <div style="padding: 0 24px;">
                    <button id="btn-get-started" class="btn-primary" style="font-size: 1.1rem; padding: 16px; border-radius: 16px;">Get Started</button>
                </div>
            </div>
        `;
        lucide.createIcons();
        document.getElementById('btn-get-started').addEventListener('click', () => renderProfileSetup('form'));
        
    } else if (step === 'form') {
        root.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 32px; padding-top: 16px;">
                    <!-- REPLACE THIS FILENAME WITH YOUR ACTUAL LOGO -->
                    <img src="assets/logo.png" alt="App Logo" style="width: 48px; height: 48px; margin-bottom: 16px;">
                    <h2 style="font-size: 1.5rem; color: var(--color-text-primary); margin-bottom: 8px;">Create your profile</h2>
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
        const age = calculateAge(profile.dob);
        root.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto;">
                <div class="card mb-sm" style="margin-top: 16px;">
                    <div class="card-header"><span class="card-title">Personal information</span><button id="btn-edit" class="btn-quick" style="padding: 4px 8px;"><i data-lucide="edit-2" style="width: 16px; height: 16px;"></i> Edit</button></div>
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
            <div class="mb-sm"><label class="text-sm text-muted font-medium">Full Name *</label><input type="text" name="fullName" class="form-input" value="${existingData.fullName || ''}" required></div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label class="text-sm text-muted font-medium">Date of Birth *</label>
                    <input type="date" id="dob" name="dob" class="form-input" max="${new Date().toISOString().split('T')[0]}" value="${existingData.dob || ''}" required onclick="this.showPicker && this.showPicker()">
                </div>
                <div>
                    <label class="text-sm text-muted font-medium">Age</label>
                    <input type="text" id="ageDisplay" class="form-input" value="${calculateAge(existingData.dob)}" readonly>
                </div>
            </div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label class="text-sm text-muted font-medium">Biological Sex *</label>
                    <select name="sex" class="form-input" required>
                        <option value="" disabled ${!existingData.sex ? 'selected' : ''}>Select</option>
                        <option value="Female" ${existingData.sex === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Male" ${existingData.sex === 'Male' ? 'selected' : ''}>Male</option>
                    </select>
                </div>
                <div>
                    <label class="text-sm text-muted font-medium">Blood Group</label>
                    <select name="bloodGroup" class="form-input">
    <option value="Unknown" ${existingData.bloodGroup === 'Unknown' || !existingData.bloodGroup ? 'selected' : ''}>Unknown</option>
    <option value="A+" ${existingData.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
    <option value="A-" ${existingData.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
    <option value="B+" ${existingData.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
    <option value="B-" ${existingData.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
    <option value="AB+" ${existingData.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
    <option value="AB-" ${existingData.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
    <option value="O+" ${existingData.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
    <option value="O-" ${existingData.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
</select>
                </div>
            </div>

            <h3 class="mt-sm mb-sm" style="border-top: 1px solid var(--color-border); padding-top: 24px; margin-top: 32px;">Emergency Contact <span class="text-muted" style="font-size: 0.8rem; font-weight: normal;">(Optional)</span></h3>
            <div class="mb-sm"><label class="text-sm text-muted font-medium">Contact Name</label><input type="text" name="emergencyName" class="form-input" value="${existingData.emergencyName || ''}"></div>
            <div class="mb-sm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div><label class="text-sm text-muted font-medium">Relationship</label><input type="text" name="emergencyRelation" class="form-input" value="${existingData.emergencyRelation || ''}"></div>
                <div><label class="text-sm text-muted font-medium">Phone Number</label><input type="tel" name="emergencyPhone" class="form-input" value="${existingData.emergencyPhone || ''}"></div>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 32px;">
                <button type="submit" id="btn-save" class="btn-primary" style="flex: 1;">${isEditing ? 'Save changes' : 'Continue'}</button>
                ${isEditing ? '<button type="button" class="btn-secondary" style="flex: 1;" onclick="location.reload()">Cancel</button>' : ''}
            </div>
        </form>
    `;
}

function attachFormListeners(mode) {
    const form = document.getElementById('profile-form');
    const dobInput = document.getElementById('dob');
    const btnSave = document.getElementById('btn-save');

    dobInput.addEventListener('change', (e) => { 
        document.getElementById('ageDisplay').value = calculateAge(e.target.value); 
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSave.disabled = true;
        btnSave.innerHTML = '<i data-lucide="loader" style="width: 18px; height: 18px; animation: spin 1s linear infinite;"></i>';
        
        try {
            await saveProfile(Object.fromEntries(new FormData(form).entries()));
            if (mode === 'setup') {
                const bottomNav = document.getElementById('bottom-nav');
                if (bottomNav) bottomNav.style.display = 'flex';
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