import api from '../services/api.js';

export default class LoginPage {
    constructor(onLogin) {
        this.onLogin = onLogin;
        this.isRegisterMode = false;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'auth-container';

        container.innerHTML = `
            <div class="logo">GT5 Trading</div>
            <form id="authForm">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" required placeholder="your@email.com" />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required placeholder="••••••••" />
                </div>
                <div class="form-group" id="nameFields" style="display: none;">
                    <label>First Name</label>
                    <input type="text" id="firstName" placeholder="John" />
                    <label style="margin-top: 10px;">Last Name</label>
                    <input type="text" id="lastName" placeholder="Doe" />
                </div>
                <div id="error" class="error"></div>
                <button type="submit" id="submitBtn">Login</button>
                <button type="button" class="secondary" id="toggleBtn">
                    Create Account
                </button>
            </form>
        `;

        this.attachListeners(container);
        return container;
    }

    attachListeners(container) {
        const form = container.querySelector('#authForm');
        const toggleBtn = container.querySelector('#toggleBtn');
        const submitBtn = container.querySelector('#submitBtn');
        const nameFields = container.querySelector('#nameFields');
        const errorEl = container.querySelector('#error');

        toggleBtn.addEventListener('click', () => {
            this.isRegisterMode = !this.isRegisterMode;
            nameFields.style.display = this.isRegisterMode ? 'block' : 'none';
            submitBtn.textContent = this.isRegisterMode ? 'Register' : 'Login';
            toggleBtn.textContent = this.isRegisterMode ? 'Back to Login' : 'Create Account';
            errorEl.textContent = '';
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';

            const email = container.querySelector('#email').value;
            const password = container.querySelector('#password').value;
            const firstName = container.querySelector('#firstName').value;
            const lastName = container.querySelector('#lastName').value;

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Loading...';

                if (this.isRegisterMode) {
                    await api.register(email, password, firstName, lastName);
                } else {
                    await api.login(email, password);
                }

                this.onLogin();
            } catch (error) {
                errorEl.textContent = error.message;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = this.isRegisterMode ? 'Register' : 'Login';
            }
        });
    }
}
