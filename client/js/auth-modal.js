// Auth Modal Functionality

class AuthModal {
    constructor() {
        this.modal = null;
        this.currentTab = 'login';
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('auth-modal');
        if (existing) existing.remove();

        this.modal = document.createElement('div');
        this.modal.id = 'auth-modal';
        this.modal.className = 'auth-modal';
        this.modal.innerHTML = `
            <div class="auth-modal-overlay">
                <div class="auth-modal-container">
                    <div class="auth-modal-header">
                        <h2><i class="fas fa-dragon"></i> HeroVault</h2>
                        <button class="auth-modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">
                            Login
                        </button>
                        <button class="auth-tab" data-tab="register">
                            Registration
                        </button>
                    </div>
                    
                    <!-- Login Tab Content -->
                    <div class="auth-tab-content active" id="login-content">
                        <form class="auth-form" id="login-form">
                            <div class="auth-form-group">
                                <label for="login-email">Email</label>
                                <input 
                                    type="email" 
                                    id="login-email" 
                                    name="email" 
                                    placeholder="your@email.com" 
                                    required
                                    autocomplete="email"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="login-password">Password</label>
                                <input 
                                    type="password" 
                                    id="login-password" 
                                    name="password" 
                                    placeholder="••••••••" 
                                    required
                                    autocomplete="current-password"
                                >
                                <div class="auth-forgot-password">
                                    <a href="#" class="forgot-password-link">
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                            
                            <div class="auth-error" id="login-error"></div>
                            
                            <button type="submit" class="auth-submit-btn">
                                Login
                            </button>
                        </form>
                    </div>
                    
                    <!-- Register Tab Content -->
                    <div class="auth-tab-content" id="register-content">
                        <form class="auth-form" id="register-form">
                            <div class="auth-form-group">
                                <label for="register-name">Name</label>
                                <input 
                                    type="text" 
                                    id="register-name" 
                                    name="name" 
                                    placeholder="Your Name" 
                                    required
                                    autocomplete="name"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-email">Email</label>
                                <input 
                                    type="email" 
                                    id="register-email" 
                                    name="email" 
                                    placeholder="your@email.com" 
                                    required
                                    autocomplete="email"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-password">Password</label>
                                <input 
                                    type="password" 
                                    id="register-password" 
                                    name="password" 
                                    placeholder="••••••••" 
                                    required
                                    autocomplete="new-password"
                                >
                            </div>
                            
                            <div class="auth-form-group">
                                <label for="register-password-confirm">Confirm password</label>
                                <input 
                                    type="password" 
                                    id="register-password-confirm" 
                                    name="passwordConfirm" 
                                    placeholder="••••••••" 
                                    required
                                    autocomplete="new-password"
                                >
                                <div class="password-match" id="password-match-indicator"></div>
                            </div>
                            
                            <div class="auth-error" id="register-error"></div>
                            
                            <button type="submit" class="auth-submit-btn">
                                Register
                            </button>
                        </form>
                    </div>

                    <!-- Reset Password Tab Content -->
                    <div class="auth-tab-content" id="reset-content">
                        <form class="auth-form" id="reset-form">
                            <div class="auth-form-group">
                                <label for="reset-email">Email</label>
                                <input
                                    type="email"
                                    id="reset-email"
                                    name="email"
                                    placeholder="your@email.com"
                                    required
                                    autocomplete="email"
                                >
                            </div>

                            <div class="auth-info" id="reset-info"></div>
                            <div class="auth-error" id="reset-error"></div>

                            <button type="submit" class="auth-submit-btn">
                                Send reset link
                            </button>

                            <div class="auth-secondary-actions">
                                <a href="#" class="back-to-login">Back to login</a>
                            </div>
                        </form>
                    </div>

                    <!-- Update Password Tab Content -->
                    <div class="auth-tab-content" id="update-content">
                        <form class="auth-form" id="update-form">
                            <div class="auth-form-group">
                                <label for="update-password">New password</label>
                                <input
                                    type="password"
                                    id="update-password"
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    autocomplete="new-password"
                                >
                            </div>

                            <div class="auth-form-group">
                                <label for="update-password-confirm">Confirm password</label>
                                <input
                                    type="password"
                                    id="update-password-confirm"
                                    name="passwordConfirm"
                                    placeholder="••••••••"
                                    required
                                    autocomplete="new-password"
                                >
                                <div class="password-match" id="update-password-match"></div>
                            </div>

                            <div class="auth-info" id="update-info"></div>
                            <div class="auth-error" id="update-error"></div>

                            <button type="submit" class="auth-submit-btn">
                                Set new password
                            </button>

                            <div class="auth-secondary-actions">
                                <a href="#" class="back-to-login">Back to login</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        this.setupFormListeners();
        this.setupPasswordValidation();
        
        // Setup event listeners for close and forgot password
        const closeBtn = this.modal.querySelector('.auth-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        const forgotPasswordLink = this.modal.querySelector('.forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword(e);
            });
        }

        const backToLoginLinks = this.modal.querySelectorAll('.back-to-login');
        backToLoginLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setAuthMode('login');
            });
        });

        const overlay = this.modal.querySelector('.auth-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }
    }

    setupEventListeners() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-tab')) {
                this.switchTab(e.target.dataset.tab);
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    setupFormListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
        }

        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleResetRequest(e);
            });
        }

        const updateForm = document.getElementById('update-form');
        if (updateForm) {
            updateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdatePassword(e);
            });
        }
    }

    setupPasswordValidation() {
        const pairs = [
            {
                passwordId: 'register-password',
                confirmId: 'register-password-confirm',
                indicatorId: 'password-match-indicator'
            },
            {
                passwordId: 'update-password',
                confirmId: 'update-password-confirm',
                indicatorId: 'update-password-match'
            }
        ];

        pairs.forEach(({ passwordId, confirmId, indicatorId }) => {
            const passwordInput = document.getElementById(passwordId);
            const confirmInput = document.getElementById(confirmId);
            const indicator = document.getElementById(indicatorId);

            if (passwordInput && confirmInput && indicator) {
                const validatePasswords = () => {
                    const password = passwordInput.value;
                    const confirm = confirmInput.value;

                    if (confirm.length === 0) {
                        indicator.classList.remove('show');
                        return;
                    }

                    indicator.classList.add('show');
                    if (password === confirm && password.length > 0) {
                        indicator.textContent = '✓ Passwords match';
                        indicator.classList.remove('password-mismatch');
                    } else {
                        indicator.textContent = '✗ Passwords do not match';
                        indicator.classList.add('password-mismatch');
                    }
                };

                passwordInput.addEventListener('input', validatePasswords);
                confirmInput.addEventListener('input', validatePasswords);
            }
        });
    }

    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        this.setAuthMode(tabName);
    }

    setAuthMode(mode) {
        const tabs = this.modal.querySelector('.auth-tabs');
        if (tabs) {
            tabs.style.display = (mode === 'login' || mode === 'register') ? '' : 'none';
        }

        const contentMap = {
            login: 'login-content',
            register: 'register-content',
            reset: 'reset-content',
            update: 'update-content'
        };

        const activeId = contentMap[mode] || 'login-content';
        const allContents = this.modal.querySelectorAll('.auth-tab-content');
        allContents.forEach(content => {
            content.classList.toggle('active', content.id === activeId);
        });

        if (mode === 'login' || mode === 'register') {
            this.currentTab = mode;
            const tabsEls = this.modal.querySelectorAll('.auth-tab');
            tabsEls.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === mode);
            });
        } else {
            this.currentTab = mode;
        }

        this.clearErrors();
    }

    show() {
        if (!this.modal) {
            this.createModal();
        }
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
            // Clear forms
            this.clearForms();
            this.clearErrors();
            // Reset to login tab
            this.setAuthMode('login');
            // Reset loading state on card
            if (window.HeroVaultApp && typeof window.HeroVaultApp.resetLoadingState === 'function') {
                window.HeroVaultApp.resetLoadingState();
            } else {
                // Fallback: find and reset any cards with loading state
                const cardsWithLoading = document.querySelectorAll('.card[data-original-content]');
                cardsWithLoading.forEach(card => {
                    const content = card.querySelector('.card-content');
                    const originalContent = card.dataset.originalContent;
                    if (content && originalContent) {
                        content.innerHTML = originalContent;
                        delete card.dataset.originalContent;
                    }
                });
            }
        }
    }

    clearForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const resetForm = document.getElementById('reset-form');
        const updateForm = document.getElementById('update-form');
        
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        if (resetForm) resetForm.reset();
        if (updateForm) updateForm.reset();
    }

    clearErrors() {
        const messages = this.modal.querySelectorAll('.auth-error, .auth-info');
        messages.forEach(message => {
            message.classList.remove('show');
            message.textContent = '';
        });
    }

    showError(formId, message) {
        const errorEl = document.getElementById(`${formId}-error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    showInfo(formId, message) {
        const infoEl = document.getElementById(`${formId}-info`);
        if (infoEl) {
            infoEl.textContent = message;
            infoEl.classList.add('show');
        }
    }

    async handleLogin(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Clear previous errors
        this.clearErrors();

        // Basic validation
        if (!email || !password) {
            this.showError('login', 'Please fill in all fields.');
            return;
        }

        // Show loading state
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        try {
            if (!window.supabase) {
                this.showError('login', 'Supabase is not initialized. Check that `supabase-client.js` is loaded.');
                return;
            }

            const { error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                this.showError('login', error.message);
                return;
            }

            this.close();
            if (window.HeroVault && window.HeroVault.showNotification) {
                window.HeroVault.showNotification('Signed in successfully!', 'success');
            }
        } catch (err) {
            this.showError('login', err?.message || 'Sign-in failed.');
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!name || !email || !password || !passwordConfirm) {
            this.showError('register', 'Please fill in all fields.');
            return;
        }

        if (password !== passwordConfirm) {
            this.showError('register', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            this.showError('register', 'Password must be at least 6 characters.');
            return;
        }

        // Show loading state
        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        try {
            if (!window.supabase) {
                this.showError('register', 'Supabase is not initialized. Check that `supabase-client.js` is loaded.');
                return;
            }

            const { data, error } = await window.supabase.auth.signUp({
                email,
                password,
                options: {
                    // user_metadata (užitečné, pokud máš trigger na vytvoření profilu z metadata)
                    data: { name }
                }
            });

            if (error) {
                this.showError('register', error.message);
                return;
            }

            // Insert profile row (id = auth.user.id) so UI can read `profiles.name`
            // Requires RLS policy allowing insert where auth.uid() = id (typical setup).
            try {
                const user = data?.user;
                if (user?.id) {
                    await window.supabase
                        .from('profiles')
                        .upsert({ id: user.id, name }, { onConflict: 'id' });
                }
            } catch (_e) {
                // Best-effort; ignore if RLS/email-confirmation prevents insert at this step
            }

            this.close();

            // Pokud je v Supabase zapnuté potvrzení emailu, session může být null.
            const msg = data?.session
                ? 'Registration successful!'
                : 'Registration successful. Check your email to confirm your account.';

            if (window.HeroVault && window.HeroVault.showNotification) {
                window.HeroVault.showNotification(msg, 'success');
            }
        } catch (err) {
            this.showError('register', err?.message || 'Registration failed.');
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    }

    async handleResetRequest(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const email = document.getElementById('reset-email')?.value?.trim();

        this.clearErrors();

        if (!email) {
            this.showError('reset', 'Please enter an email.');
            return;
        }

        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        try {
            if (!window.supabase) {
                this.showError('reset', 'Supabase is not initialized. Check that `supabase-client.js` is loaded.');
                return;
            }

            const redirectTo = this.getPasswordResetRedirectUrl();
            const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                redirectTo
            });

            if (error) {
                this.showError('reset', error.message);
                return;
            }

            this.showInfo('reset', 'Password reset link sent. Check your email.');
        } catch (err) {
            this.showError('reset', err?.message || 'Password reset failed.');
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    }

    async handleUpdatePassword(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const password = document.getElementById('update-password')?.value || '';
        const confirm = document.getElementById('update-password-confirm')?.value || '';

        this.clearErrors();

        if (!password || !confirm) {
            this.showError('update', 'Please fill in all fields.');
            return;
        }

        if (password !== confirm) {
            this.showError('update', 'Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            this.showError('update', 'Password must be at least 6 characters.');
            return;
        }

        submitBtn.classList.add('is-loading');
        submitBtn.disabled = true;

        try {
            if (!window.supabase) {
                this.showError('update', 'Supabase is not initialized. Check that `supabase-client.js` is loaded.');
                return;
            }

            const { data } = await window.supabase.auth.getSession();
            const session = data?.session;
            if (!session) {
                this.showError('update', 'The password reset link is invalid or has expired.');
                return;
            }

            const { error } = await window.supabase.auth.updateUser({ password });
            if (error) {
                this.showError('update', error.message);
                return;
            }

            this.clearRecoveryParams();
            this.showInfo('update', 'Password updated successfully.');
        } catch (err) {
            this.showError('update', err?.message || 'Password update failed.');
        } finally {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
        }
    }

    handleForgotPassword(e) {
        if (e) e.preventDefault();
        const loginEmail = document.getElementById('login-email')?.value || '';
        const resetEmail = document.getElementById('reset-email');
        if (resetEmail && loginEmail) resetEmail.value = loginEmail;
        this.setAuthMode('reset');
    }

    getPasswordResetRedirectUrl() {
        const { origin, pathname } = window.location;
        if (pathname.includes('/pages/')) {
            const prefix = pathname.split('/pages/')[0];
            return `${origin}${prefix}/index.html`;
        }
        return `${origin}${pathname}`;
    }

    clearRecoveryParams() {
        try {
            const url = new URL(window.location.href);
            if (url.hash) {
                const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
                if (hashParams.get('type') === 'recovery' || hashParams.get('access_token')) {
                    url.hash = '';
                }
            }
            if (url.searchParams.get('type') === 'recovery') {
                url.searchParams.delete('type');
            }
            window.history.replaceState({}, document.title, url.toString());
        } catch (_e) {
            // ignore
        }
    }

    checkRecoveryMode() {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);
        const type = hashParams.get('type') || searchParams.get('type');
        const hasRecovery = type === 'recovery' || hashParams.get('access_token');

        if (hasRecovery) {
            this.show();
            this.setAuthMode('update');
        }
    }
}

// Initialize auth modal
let AuthModalInstance;
document.addEventListener('DOMContentLoaded', () => {
    AuthModalInstance = new AuthModal();
    
    // Make it globally accessible
    window.AuthModalInstance = AuthModalInstance;
    AuthModalInstance.checkRecoveryMode();
});

