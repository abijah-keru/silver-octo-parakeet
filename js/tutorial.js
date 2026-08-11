// js/tutorial.js

export function runWalkthrough() {
    // SECURITY LOCK: Check if the flag is set. If not, stop immediately.
    if (localStorage.getItem('showWalkthrough') !== 'true') return;
    
    // Remove the flag so it NEVER runs again unless they reset their profile
    localStorage.removeItem('showWalkthrough');

    if (!document.getElementById('tutorial-styles')) {
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.innerHTML = `
            .tutorial-highlight { 
                position: relative !important; 
                z-index: 10001 !important; 
                background: var(--color-surface); 
                border-radius: var(--radius-sm);
                pointer-events: none;
            }
            @keyframes bounceDown {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(8px); }
            }
            @keyframes bounceUp {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
            }
            .finger-pointer {
                position: fixed;
                z-index: 10002;
                color: var(--color-primary);
                pointer-events: none;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
        `;
        document.head.appendChild(style);
    }

    // THE COMPLETE 8-STEP CHRONOLOGICAL FLOW
    const steps = [
        { 
            isIntro: true, 
            title: 'Welcome to your Dashboard', 
            text: 'Your profile is set up! Let\'s take a quick 30-second tour to show you where everything is.' 
        },
        { 
            selector: '#tour-profile-card', 
            title: 'Patient Profile', 
            text: 'Tap here anytime to update your details or emergency contacts.' 
        },
        { 
            selector: '#tour-current-health', 
            title: 'Current Health', 
            text: 'Keep your active medications, allergies, and conditions updated right here on your dashboard.' 
        },
        { 
            selector: '#tour-latest-measurements', 
            title: 'Latest Measurements', 
            text: 'Your vital measurements like blood pressure and heart rate will be recorded and displayed right here.' 
        },
        { 
            selector: '[data-route="/records"]', 
            title: 'Medical Records', 
            text: 'Build your chronological timeline. Log doctor visits and procedures here.' 
        },
        { 
            selector: '[data-route="/documents"]', 
            title: 'Documents Library', 
            text: 'Keep your raw evidence safe. Upload and store PDFs, lab reports, and imaging files.' 
        },
        { 
            selector: '[data-route="/trends"]', 
            title: 'Health Trends', 
            text: 'Visualize your progress. Track your vital measurements over time on charts.' 
        },
        { 
            selector: '[data-route="/summary"]', 
            title: 'Practitioner Summary', 
            text: 'Generate an instant, clean report to hand directly to your doctor during a visit.' 
        }
    ];

    let current = 0;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(17, 24, 39, 0.75); z-index: 10000; transition: opacity 0.3s;';
    document.body.appendChild(overlay);

    const tooltip = document.createElement('div');
    tooltip.style.cssText = 'position: fixed; z-index: 10002; background: var(--color-surface); padding: var(--space-m); border-radius: var(--radius-md); width: 320px; max-width: 90vw; box-shadow: var(--shadow-level-2); transition: all 0.3s ease;';
    document.body.appendChild(tooltip);

    const pointer = document.createElement('div');
    pointer.className = 'finger-pointer';
    document.body.appendChild(pointer);

    function showStep(index) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

        if (index >= steps.length) {
            closeWalkthrough();
            return;
        }

        const step = steps[index];

        if (step.isIntro) {
            pointer.style.display = 'none';
            tooltip.style.left = '50%';
            tooltip.style.top = '50%';
            tooltip.style.bottom = 'auto';
            tooltip.style.transform = 'translate(-50%, -50%)';
        } else {
            pointer.style.display = 'flex';
            tooltip.style.transform = 'none'; 
            
            const targetElement = document.querySelector(step.selector);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                targetElement.classList.add('tutorial-highlight');
                
                setTimeout(() => {
                    const rect = targetElement.getBoundingClientRect();
                    const isTopHalf = rect.top < (window.innerHeight / 2);

                    let tooltipLeft = rect.left + (rect.width / 2) - 160; 
                    if (tooltipLeft < 16) tooltipLeft = 16;
                    if (tooltipLeft + 320 > window.innerWidth - 16) tooltipLeft = window.innerWidth - 336;
                    tooltip.style.left = `${tooltipLeft}px`;

                    if (isTopHalf) {
                        pointer.innerHTML = '<i data-lucide="hand" style="width: 32px; height: 32px; fill: var(--color-primary); transform: rotate(0deg);"></i>';
                        pointer.style.animation = 'bounceUp 1.5s infinite ease-in-out';
                        pointer.style.left = `${rect.left + (rect.width / 2) - 16}px`;
                        pointer.style.top = `${rect.bottom + 8}px`;
                        pointer.style.bottom = 'auto';

                        tooltip.style.top = `${rect.bottom + 60}px`;
                        tooltip.style.bottom = 'auto';
                    } else {
                        pointer.innerHTML = '<i data-lucide="hand" style="width: 32px; height: 32px; fill: var(--color-primary); transform: rotate(180deg);"></i>';
                        pointer.style.animation = 'bounceDown 1.5s infinite ease-in-out';
                        pointer.style.left = `${rect.left + (rect.width / 2) - 16}px`;
                        pointer.style.bottom = `${window.innerHeight - rect.top + 8}px`;
                        pointer.style.top = 'auto';

                        tooltip.style.bottom = `${window.innerHeight - rect.top + 60}px`;
                        tooltip.style.top = 'auto';
                    }
                }, 300); 
            }
        }

        tooltip.innerHTML = `
            <div style="margin-bottom: 16px; ${step.isIntro ? 'text-align: center;' : ''}">
                <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; color: var(--color-primary); display: flex; align-items: center; gap: 8px; ${step.isIntro ? 'justify-content: center;' : ''}">
                    ${step.title}
                </h3>
                <p style="margin: 0; font-size: 0.95rem; color: var(--color-text-secondary); line-height: 1.5;">${step.text}</p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 12px;">
                <div style="font-size: 0.8rem; font-weight: 500; color: var(--color-text-disabled);">${index + 1} of ${steps.length}</div>
                <div style="display: flex; gap: 8px;">
                    <button id="walkthrough-skip" style="background: none; border: none; font-weight: 500; font-size: 0.9rem; color: var(--color-text-secondary); cursor: pointer; padding: 8px;">Skip</button>
                    <button id="walkthrough-next" class="btn-primary" style="min-height: 36px; padding: 6px 16px; font-size: 0.9rem; width: auto; border-radius: 8px;">${index === steps.length - 1 ? 'Finish' : 'Next'}</button>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }

        setTimeout(() => {
            document.getElementById('walkthrough-next').onclick = () => showStep(index + 1);
            document.getElementById('walkthrough-skip').onclick = closeWalkthrough;
        }, 0);
    }

    function closeWalkthrough() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        overlay.remove();
        tooltip.remove();
        pointer.remove();
    }

    setTimeout(() => showStep(0), 150);
}