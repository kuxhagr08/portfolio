// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Change icon based on state
    const icon = hamburger.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
    }
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = hamburger.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        document.body.style.overflow = 'auto';
    });
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 100; // Trigger point

    let delay = 0;
    revealElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - revealPoint) {
            if (!element.classList.contains('active')) {
                setTimeout(() => {
                    element.classList.add('active');
                }, delay);
                delay += 150; // Stagger effect
            }
        }
    });
};

// Initial check
revealOnScroll();

// Check on scroll
window.addEventListener('scroll', revealOnScroll);

// Navbar styling on scroll
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.7)';
        navbar.style.borderBottom = '1px solid transparent';
    }
});

// 3D Tilt effect for project cards
const cards = document.querySelectorAll('.project-card');

cards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.transition = 'none';
        
        // Add dynamic glow to border
        card.style.borderColor = `rgba(165, 180, 252, 0.4)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        card.style.transition = 'transform 0.5s ease, border-color 0.5s ease';
        card.style.borderColor = `rgba(255, 255, 255, 0.05)`;
    });
});

// Contact Form Handler
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const inputs = this.querySelectorAll('input');
        const textarea = this.querySelector('textarea');
        
        const name = inputs[0].value;
        const email = inputs[1].value;
        const subject = inputs[2].value;
        const message = textarea.value;
        
        const body = `Name: ${name}%0AEmail: ${email}%0A%0A${message}`;
        
        window.location.href = `mailto:shrivastavakushagra22@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
        
        // Clear form
        this.reset();
    });
}

// Draggable Skills Carousel (Appinventiv Style)
const initSkillsSlider = () => {
    const slider = document.querySelector('.skills-slider-container');
    if (!slider) return;

    // Create custom drag badge cursor
    const dragBadge = document.createElement('div');
    dragBadge.className = 'skills-drag-badge';
    dragBadge.innerText = 'DRAG';
    document.body.appendChild(dragBadge);

    let isDown = false;
    let startX;
    let scrollLeftVal;

    // Position custom drag badge
    const updateBadgePosition = (e) => {
        dragBadge.style.left = `${e.clientX}px`;
        dragBadge.style.top = `${e.clientY}px`;
    };

    // Show/hide drag badge on hover
    slider.addEventListener('mouseenter', (e) => {
        dragBadge.classList.add('visible');
        updateBadgePosition(e);
    });

    slider.addEventListener('mouseleave', () => {
        dragBadge.classList.remove('visible');
        isDown = false;
        slider.classList.remove('active');
        dragBadge.classList.remove('dragging');
    });

    slider.addEventListener('mousemove', (e) => {
        updateBadgePosition(e);
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed factor
        slider.scrollLeft = scrollLeftVal - walk;
    });

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        dragBadge.classList.add('dragging');
        startX = e.pageX - slider.offsetLeft;
        scrollLeftVal = slider.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
        isDown = false;
        if (slider) {
            slider.classList.remove('active');
        }
        dragBadge.classList.remove('dragging');
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkillsSlider);
} else {
    initSkillsSlider();
}
