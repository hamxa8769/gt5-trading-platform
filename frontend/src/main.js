import api from './services/api.js';
import LoginPage from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';

class App {
    constructor() {
        this.app = document.getElementById('app');
        this.currentPage = null;
        this.init();
    }

    init() {
        if (api.isAuthenticated()) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        this.app.innerHTML = '';
        const loginPage = new LoginPage(() => this.showDashboard());
        this.app.appendChild(loginPage.render());
    }

    async showDashboard() {
        this.app.innerHTML = '<div class="loading">Loading dashboard...</div>';
        const dashboard = new Dashboard(() => this.showLogin());
        await dashboard.loadData();
        this.app.innerHTML = '';
        this.app.appendChild(dashboard.render());
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
