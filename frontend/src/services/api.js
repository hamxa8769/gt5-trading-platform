const API_URL = 'http://localhost:3000/api/v1';
const WS_URL = 'ws://localhost:3000/ws';

class APIService {
    constructor() {
        this.token = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.ws = null;
    }

    setTokens(accessToken, refreshToken) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 && this.refreshToken) {
            // Try to refresh token
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.token}`;
                return fetch(`${API_URL}${endpoint}`, { ...options, headers });
            }
        }

        return response;
    }

    async register(email, password, firstName, lastName) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Registration failed');
        }

        const data = await response.json();
        this.setTokens(data.access_token, data.refresh_token);
        return data;
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Login failed');
        }

        const data = await response.json();
        this.setTokens(data.access_token, data.refresh_token);
        return data;
    }

    async refreshAccessToken() {
        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (!response.ok) return false;

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);
            return true;
        } catch (error) {
            return false;
        }
    }

    async getAccount() {
        const response = await this.request('/trading/account');
        if (!response.ok) throw new Error('Failed to fetch account');
        return response.json();
    }

    async getInstruments() {
        const response = await this.request('/trading/instruments');
        if (!response.ok) throw new Error('Failed to fetch instruments');
        return response.json();
    }

    async getMarketData() {
        const response = await this.request('/trading/market-data');
        if (!response.ok) throw new Error('Failed to fetch market data');
        return response.json();
    }

    async getOrders() {
        const response = await this.request('/trading/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        return response.json();
    }

    async createOrder(orderData) {
        const response = await this.request('/trading/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create order');
        }

        return response.json();
    }

    async cancelOrder(orderId) {
        const response = await this.request(`/trading/orders/${orderId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to cancel order');
        return response.json();
    }

    async getPositions() {
        const response = await this.request('/trading/positions');
        if (!response.ok) throw new Error('Failed to fetch positions');
        return response.json();
    }

    async getAnalytics() {
        const response = await this.request('/trading/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        return response.json();
    }

    async getPerformance() {
        const response = await this.request('/trading/performance');
        if (!response.ok) throw new Error('Failed to fetch performance');
        return response.json();
    }

    async getTradingHistory(limit = 100) {
        const response = await this.request(`/trading/history?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    }

    connectWebSocket(onMarketData) {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.ws.send(JSON.stringify({ type: 'auth', token: this.token }));
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'market_data') {
                onMarketData(message.data);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(() => this.connectWebSocket(onMarketData), 3000);
        };
    }

    disconnectWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    logout() {
        this.clearTokens();
        this.disconnectWebSocket();
    }

    isAuthenticated() {
        return !!this.token;
    }
}

export default new APIService();
