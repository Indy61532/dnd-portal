// HeroVault - Particle System

class ParticleSystem {
    constructor(options = {}) {
        this.options = {
            container: document.body,
            particleCount: 20,
            minSize: 1,
            maxSize: 6,
            minOpacity: 0.1,
            maxOpacity: 0.8,
            minSpeed: 3,
            maxSpeed: 6,
            colors: ['var(--primary-gold)', '#ff8c00', '#ffa500', '#ff7f50'],
            glowIntensity: 2,
            zIndex: 2,
            ...options
        };
        
        this.particles = [];
        this.container = null;
        this.isActive = false;
        this.init();
    }

    init() {
        this.createContainer();
        this.createParticles();
        this.startAnimation();
        console.log('ParticleSystem initialized with', this.options.particleCount, 'particles');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'particle-system';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${this.options.zIndex};
            overflow: hidden;
        `;
        
        this.options.container.appendChild(this.container);
    }

    createParticles() {
        for (let i = 0; i < this.options.particleCount; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        const size = this.randomBetween(this.options.minSize, this.options.maxSize);
        const opacity = this.randomBetween(this.options.minOpacity, this.options.maxOpacity);
        const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
        const speed = this.randomBetween(this.options.minSpeed, this.options.maxSpeed);
        
        // Náhodná počáteční pozice
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        
        // Náhodný směr pohybu (8 směrů)
        const directions = [
            'particleFloat-up', 'particleFloat-down', 'particleFloat-left', 'particleFloat-right',
            'particleFloat-upLeft', 'particleFloat-upRight', 'particleFloat-downLeft', 'particleFloat-downRight'
        ];
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            opacity: ${opacity};
            box-shadow: 0 0 ${size * this.options.glowIntensity}px ${color};
            left: ${startX}%;
            top: ${startY}%;
            animation: ${direction} ${speed}s infinite linear;
            animation-delay: ${Math.random() * speed}s;
        `;
        
        // Přidat data pro interaktivitu
        particle.dataset.speed = speed;
        particle.dataset.size = size;
        particle.dataset.direction = direction;
        
        this.container.appendChild(particle);
        this.particles.push(particle);
    }

    startAnimation() {
        this.isActive = true;
        this.addAnimationStyles();
        this.startMouseInteraction();
    }

    addAnimationStyles() {
        if (document.getElementById('particle-animations')) return;
        
        const style = document.createElement('style');
        style.id = 'particle-animations';
        style.textContent = `
            @keyframes particleFloat-up {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(-30px) translateX(5px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(-60px) translateX(-5px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(-30px) translateX(10px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-down {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(30px) translateX(-5px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(60px) translateX(5px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(30px) translateX(-10px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-left {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(-5px) translateX(-30px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(5px) translateX(-60px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(-10px) translateX(-30px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-right {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(5px) translateX(30px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(-5px) translateX(60px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(10px) translateX(30px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-upLeft {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(-25px) translateX(-25px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(-50px) translateX(-50px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(-25px) translateX(-25px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-upRight {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(-25px) translateX(25px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(-50px) translateX(50px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(-25px) translateX(25px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-downLeft {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(25px) translateX(-25px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(50px) translateX(-50px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(25px) translateX(-25px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particleFloat-downRight {
                0% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
                25% { transform: translateY(25px) translateX(25px) rotate(90deg); opacity: 0.8; }
                50% { transform: translateY(50px) translateX(50px) rotate(180deg); opacity: 0.6; }
                75% { transform: translateY(25px) translateX(25px) rotate(270deg); opacity: 0.9; }
                100% { transform: translateY(0px) translateX(0px) rotate(360deg); opacity: 0.3; }
            }
            
            @keyframes particlePulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 0.6;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 1;
                }
            }
            
            @keyframes particleGlow {
                0%, 100% {
                    box-shadow: 0 0 4px currentColor;
                }
                50% {
                    box-shadow: 0 0 12px currentColor, 0 0 20px currentColor;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    startMouseInteraction() {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            this.reactToMouse(mouseX, mouseY);
        });
        
        // Přidat touch support pro mobilní zařízení
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            mouseX = touch.clientX;
            mouseY = touch.clientY;
            this.reactToMouse(mouseX, mouseY);
        });
    }

    reactToMouse(x, y) {
        this.particles.forEach(particle => {
            const rect = particle.getBoundingClientRect();
            const particleX = rect.left + rect.width / 2;
            const particleY = rect.top + rect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(x - particleX, 2) + Math.pow(y - particleY, 2)
            );
            
            if (distance < 100) {
                const intensity = 1 - (distance / 100);
                particle.style.transform = `scale(${1 + intensity * 0.3})`;
                particle.style.filter = `brightness(${1 + intensity * 0.5})`;
            } else {
                particle.style.transform = 'scale(1)';
                particle.style.filter = 'brightness(1)';
            }
        });
    }

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Metody pro ovládání systému
    pause() {
        this.isActive = false;
        this.particles.forEach(particle => {
            particle.style.animationPlayState = 'paused';
        });
    }

    resume() {
        this.isActive = true;
        this.particles.forEach(particle => {
            particle.style.animationPlayState = 'running';
        });
    }

    setIntensity(intensity) {
        const newCount = Math.floor(this.options.particleCount * intensity);
        this.updateParticleCount(newCount);
    }

    updateParticleCount(count) {
        // Odstranit přebytečné částice
        while (this.particles.length > count) {
            const particle = this.particles.pop();
            particle.remove();
        }
        
        // Přidat nové částice
        while (this.particles.length < count) {
            this.createParticle();
        }
        
        this.options.particleCount = count;
    }

    changeColors(colors) {
        this.options.colors = colors;
        this.particles.forEach(particle => {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = color;
            particle.style.boxShadow = `0 0 ${particle.dataset.size * this.options.glowIntensity}px ${color}`;
        });
    }

    destroy() {
        this.pause();
        this.particles.forEach(particle => particle.remove());
        this.particles = [];
        if (this.container) {
            this.container.remove();
        }
        this.isActive = false;
    }
}

    // Automatické spuštění při načtení stránky
    document.addEventListener('DOMContentLoaded', () => {
        // Vytvořit základní particle systém s oranžovými částicemi
        window.particleSystem = new ParticleSystem({
            particleCount: 60,
            minSize: 1,
            maxSize: 6,
            colors: ['var(--primary-gold)', '#ff8c00', '#ffa500', '#ff7f50'],
            glowIntensity: 2
        });
    
    // Přidat globální ovládání
    window.ParticleControls = {
        pause: () => window.particleSystem.pause(),
        resume: () => window.particleSystem.resume(),
        setIntensity: (intensity) => window.particleSystem.setIntensity(intensity),
        changeColors: (colors) => window.particleSystem.changeColors(colors),
        destroy: () => window.particleSystem.destroy()
    };
});

// Export pro použití v jiných modulech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
} 