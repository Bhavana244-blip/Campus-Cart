// Typewriter Effect
const phrases = [
    "Find a Tech Park textbook...",
    "Exchange your old hoodie...",
    "Rent a lab coat for tomorrow...",
    "Sell your dorm furniture...",
    "Buy a used graphics tablet..."
];

let currentPhraseIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function type() {
    const typewriterElement = document.getElementById('typewriter-text');
    const currentPhrase = phrases[currentPhraseIndex];

    if (isDeleting) {
        typewriterElement.textContent = currentPhrase.substring(0, currentCharIndex - 1);
        currentCharIndex--;
        typingSpeed = 50;
    } else {
        typewriterElement.textContent = currentPhrase.substring(0, currentCharIndex + 1);
        currentCharIndex++;
        typingSpeed = 100;
    }

    if (!isDeleting && currentCharIndex === currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2000; // Pause at end
    } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        typingSpeed = 500; // Pause before next word
    }

    setTimeout(type, typingSpeed);
}

// Modal Logic
const modal = document.getElementById('booking-modal');
const modalClose = document.querySelector('.modal-close');
let currentStep = 1;

function openModal() {
    modal.classList.add('active');
    nextStep(1); // Reset to step 1
}

function closeModal() {
    modal.classList.remove('active');
}

modalClose.addEventListener('click', closeModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

function nextStep(step) {
    // Hide all steps
    document.querySelectorAll('.modal-step').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));
    
    // Show current step
    document.getElementById(`step-${step}`).style.display = 'block';
    
    // Update dots
    for(let i=1; i<=step; i++) {
        document.querySelectorAll('.step-dot')[i-1].classList.add('active');
    }
    
    currentStep = step;
}

function completeBooking() {
    const step3 = document.getElementById('step-3');
    step3.innerHTML = `
        <div style="text-align: center; padding: 2rem 0;">
            <div style="width: 80px; height: 80px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem;">
                <i data-lucide="check" style="width: 40px; height: 40px;"></i>
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">Booking Confirmed!</h3>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Syncing with your SRM calendar...</p>
            <button class="cta-button" onclick="closeModal()">Return to Hub</button>
        </div>
    `;
    lucide.createIcons();
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    type();
    
    // Scroll Effects
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.style.padding = '1rem 4rem';
            nav.style.background = 'rgba(10, 10, 11, 0.8)';
        } else {
            nav.style.padding = '1.5rem 4rem';
            nav.style.background = 'transparent';
        }
    });
});
