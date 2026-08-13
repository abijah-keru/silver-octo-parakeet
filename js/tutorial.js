// js/tutorial.js

export function runWalkthrough() {
    // SECURITY LOCK ENABLED: Only run if the flag was set during onboarding
    if (localStorage.getItem('showWalkthrough') !== 'true') return;
    
    // Remove the flag immediately so it NEVER runs again
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
            @keyframes pointDown {
                0%, 100% { transform: translateY(0) rotate(180deg); }
                50% { transform: translateY(8px) rotate(180deg); }
            }
            @keyframes pointUp {
                0%, 100% { transform: translateY(0) rotate(0deg); }
                50% { transform: translateY(-8px) rotate(0deg); }
            }
            .finger-pointer {
                position: fixed;
                z-index: 10002;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                transition: opacity 0.15s ease;
            }
            .tutorial-tooltip {
                position: fixed; 
                z-index: 10002; 
                background: var(--color-surface); 
                padding: var(--space-m); 
                border-radius: var(--radius-md); 
                left: 16px; 
                right: 16px; 
                width: auto; 
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); 
                transition: opacity 0.15s ease;
            }
        `;
        document.head.appendChild(style);
    }

    const blueHandSVG = `<svg viewBox="0 0 24 24" width="40" height="40" fill="var(--color-primary)" stroke="white" stroke-width="1.5"><path d="M14 9V5a2 2 0 0 0-4 0v11L7.5 13.5a2.12 2.12 0 0 0-3 3l5.5 5.5a6.36 6.36 0 0 0 4.5 1.87h2a6 6 0 0 0 6-6v-5.5a2 2 0 0 0-2-2h-1.54V9a2 2 0 0 0-4 0Z"/></svg>`;

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
    tooltip.className = 'tutorial-tooltip';
    document.body.appendChild(tooltip);

    const pointer = document.createElement('div');
    pointer.className = 'finger-pointer';
    pointer.innerHTML = blueHandSVG;
    document.body.appendChild(pointer);

    function showStep(index) {
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

        if (index >= steps.length) {
            closeWalkthrough();
            return;
        }

        const step = steps[index];

        tooltip.style.opacity = '0';
        pointer.style.opacity = '0';

        if (step.isIntro) {
            pointer.style.display = 'none';
            
            tooltip.style.top = '50%';
            tooltip.style.bottom = 'auto';
            tooltip.style.transform = 'translateY(-50%)';
            
            renderTooltipContent(step, index);
            setTimeout(() => { tooltip.style.opacity = '1'; }, 50);

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

                    pointer.style.left = `${rect.left + (rect.width / 2) - 20}px`;

                    if (isTopHalf) {
                        pointer.style.animation = 'pointUp 1.5s infinite ease-in-out';
                        pointer.style.top = `${rect.bottom + 12}px`;
                        pointer.style.bottom = 'auto';

                        // FIX: Ensure tooltip doesn't bleed off the bottom of the screen
                        let calculatedTop = rect.bottom + 70;
                        let maxAllowedTop = window.innerHeight - 200; 
                        tooltip.style.top = `${Math.min(calculatedTop, maxAllowedTop)}px`;
                        tooltip.style.bottom = 'auto';
                    } else {
                        pointer.style.animation = 'pointDown 1.5s infinite ease-in-out';
                        pointer.style.bottom = `${window.innerHeight - rect.top + 8}px`; 
                        pointer.style.top = 'auto';

                        tooltip.style.bottom = `${window.innerHeight - rect.top + 60}px`;
                        tooltip.style.top = 'auto';
                    }

                    renderTooltipContent(step, index);
                    
                    tooltip.style.opacity = '1';
                    pointer.style.opacity = '1';
                }, 150); 
            } else {
                showStep(index + 1);
            }
        }
    }

    function renderTooltipContent(step, index) {
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

    setTimeout(() => showStep(0), 100);
}