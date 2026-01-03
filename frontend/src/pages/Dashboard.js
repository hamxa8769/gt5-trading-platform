import api from '../services/api.js';

export default class Dashboard {
    constructor(onLogout) {
        this.onLogout = onLogout;
        this.account = null;
        this.instruments = [];
        this.marketData = [];
        this.positions = [];
        this.orders = [];
        this.analytics = null;
        this.tradingHistory = [];
        this.activeTab = 'positions';
    }

    async loadData() {
        try {
            const [accountData, instrumentsData, positionsData, ordersData, analyticsData, historyData] = await Promise.all([
                api.getAccount(),
                api.getInstruments(),
                api.getPositions(),
                api.getOrders(),
                api.getAnalytics(),
                api.getTradingHistory(50)
            ]);

            this.account = accountData.account;
            this.instruments = instrumentsData.instruments;
            this.positions = positionsData.positions;
            this.orders = ordersData.orders;
            this.analytics = analyticsData.analytics;
            this.tradingHistory = historyData.history;

            // Connect to WebSocket for real-time market data
            api.connectWebSocket((data) => {
                this.marketData = data;
                this.updateMarketData();
            });
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    render() {
        const container = document.createElement('div');

        // Header
        const header = document.createElement('div');
        header.className = 'header';
        header.innerHTML = `
            <div class="header-title">GT5 Trading Platform</div>
            <div class="header-right">
                <div class="user-info">
                    <div class="user-email">${this.account?.email || 'Loading...'}</div>
                    <div class="user-balance">$${this.account?.balance || '0.00'}</div>
                </div>
                <button class="logout-btn" id="logoutBtn">Logout</button>
            </div>
        `;

        // Dashboard content
        const content = document.createElement('div');
        content.className = 'container';
        content.innerHTML = `
            <div class="dashboard">
                <div class="card">
                    <div class="card-title">Account Balance</div>
                    <div class="stat-value">$${parseFloat(this.account?.balance || 0).toFixed(2)}</div>
                    <div class="stat-label">${this.account?.account_type || 'Demo'} Account</div>
                </div>
                <div class="card">
                    <div class="card-title">Equity</div>
                    <div class="stat-value">$${parseFloat(this.account?.equity || 0).toFixed(2)}</div>
                    <div class="stat-label">Unrealized P&L: $${parseFloat(this.account?.unrealized_pnl || 0).toFixed(2)}</div>
                </div>
                <div class="card">
                    <div class="card-title">Open Positions</div>
                    <div class="stat-value">${this.positions.length}</div>
                    <div class="stat-label">Active trades</div>
                </div>
                <div class="card market-data">
                    <div class="card-title">Live Market Data</div>
                    <div class="market-grid" id="marketGrid">
                        <div class="loading">Connecting to market data...</div>
                    </div>
                </div>
            </div>

            <div class="trading-section">
                <div class="card">
                    <div class="tabs">
                        <div class="tab ${this.activeTab === 'positions' ? 'active' : ''}" data-tab="positions">
                            Positions
                        </div>
                        <div class="tab ${this.activeTab === 'orders' ? 'active' : ''}" data-tab="orders">
                            Orders
                        </div>
                        <div class="tab ${this.activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics">
                            Analytics
                        </div>
                        <div class="tab ${this.activeTab === 'history' ? 'active' : ''}" data-tab="history">
                            History
                        </div>
                    </div>
                    <div id="tradingContent"></div>
                </div>
                <div class="card">
                    <div class="card-title">New Order</div>
                    <form class="order-form" id="orderForm">
                        <div class="form-group">
                            <label>Instrument</label>
                            <select id="instrument" required>
                                <option value="">Select instrument...</option>
                                ${this.instruments.map(inst => 
                                    `<option value="${inst.id}">${inst.symbol} - ${inst.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Side</label>
                            <div class="order-type-selector">
                                <button type="button" class="order-type-btn active" data-side="buy">Buy</button>
                                <button type="button" class="order-type-btn" data-side="sell">Sell</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Quantity</label>
                            <input type="number" id="quantity" step="0.01" required placeholder="1.00" />
                        </div>
                        <div class="form-group">
                            <label>Order Type</label>
                            <select id="orderType" required>
                                <option value="market">Market</option>
                                <option value="limit">Limit</option>
                            </select>
                        </div>
                        <div class="form-group" id="priceGroup" style="display: none;">
                            <label>Limit Price</label>
                            <input type="number" id="price" step="0.00001" placeholder="0.00" />
                        </div>
                        <div id="orderError" class="error"></div>
                        <button type="submit" class="success">Place Order</button>
                    </form>
                </div>
            </div>
        `;

        container.appendChild(header);
        container.appendChild(content);

        this.attachListeners(container);
        this.updateTradingContent(container);
        
        return container;
    }

    attachListeners(container) {
        // Logout button
        container.querySelector('#logoutBtn').addEventListener('click', () => {
            api.logout();
            this.onLogout();
        });

        // Tab switching
        container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateTradingContent(container);
            });
        });

        // Order side buttons
        container.querySelectorAll('[data-side]').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('[data-side]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Order type change
        const orderType = container.querySelector('#orderType');
        const priceGroup = container.querySelector('#priceGroup');
        orderType.addEventListener('change', () => {
            priceGroup.style.display = orderType.value === 'limit' ? 'block' : 'none';
        });

        // Order form submission
        const orderForm = container.querySelector('#orderForm');
        orderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitOrder(container);
        });
    }

    async submitOrder(container) {
        const errorEl = container.querySelector('#orderError');
        errorEl.textContent = '';

        const instrument_id = parseInt(container.querySelector('#instrument').value);
        const side = container.querySelector('[data-side].active').dataset.side;
        const quantity = parseFloat(container.querySelector('#quantity').value);
        const order_type = container.querySelector('#orderType').value;
        const price = order_type === 'limit' ? parseFloat(container.querySelector('#price').value) : null;

        try {
            await api.createOrder({
                instrument_id,
                side,
                quantity,
                order_type,
                price
            });

            // Reload data
            const [ordersData, positionsData, accountData] = await Promise.all([
                api.getOrders(),
                api.getPositions(),
                api.getAccount()
            ]);

            this.orders = ordersData.orders;
            this.positions = positionsData.positions;
            this.account = accountData.account;

            // Reset form
            container.querySelector('#orderForm').reset();
            container.querySelectorAll('[data-side]')[0].click();

            // Update UI
            container.querySelector('.user-balance').textContent = `$${this.account.balance}`;
            this.updateTradingContent(container);
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    updateTradingContent(container) {
        const content = container.querySelector('#tradingContent');
        
        if (this.activeTab === 'positions') {
            if (this.positions.length === 0) {
                content.innerHTML = '<div class="empty-state">No open positions</div>';
            } else {
                content.innerHTML = `
                    <div class="positions-list">
                        ${this.positions.map(pos => `
                            <div class="position-item">
                                <div class="item-info">
                                    <h4>${pos.symbol} - ${pos.side.toUpperCase()}</h4>
                                    <p>Quantity: ${pos.quantity} | Entry: $${parseFloat(pos.entry_price).toFixed(5)} | Current: $${parseFloat(pos.current_price).toFixed(5)}</p>
                                    <p style="color: ${parseFloat(pos.unrealized_pnl) >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                                        P&L: $${parseFloat(pos.unrealized_pnl).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } else if (this.activeTab === 'orders') {
            if (this.orders.length === 0) {
                content.innerHTML = '<div class="empty-state">No orders</div>';
            } else {
                content.innerHTML = `
                    <div class="orders-list">
                        ${this.orders.slice(0, 10).map(order => `
                            <div class="order-item">
                                <div class="item-info">
                                    <h4>${order.symbol} - ${order.side.toUpperCase()} ${order.order_type.toUpperCase()}</h4>
                                    <p>Quantity: ${order.quantity} | Price: ${order.price || 'Market'}</p>
                                    <p>Status: <span style="color: ${this.getStatusColor(order.status)}">${order.status.toUpperCase()}</span></p>
                                </div>
                                ${order.status === 'pending' || order.status === 'open' ? `
                                    <div class="item-actions">
                                        <button class="btn-small danger" onclick="cancelOrder(${order.id})">Cancel</button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;

                // Attach cancel handlers
                window.cancelOrder = async (orderId) => {
                    try {
                        await api.cancelOrder(orderId);
                        this.orders = (await api.getOrders()).orders;
                        this.updateTradingContent(container);
                    } catch (error) {
                        alert('Failed to cancel order: ' + error.message);
                    }
                };
            }
        } else if (this.activeTab === 'analytics') {
            if (!this.analytics || this.analytics.total_trades === 0) {
                content.innerHTML = '<div class="empty-state">No trading data available yet. Start trading to see analytics!</div>';
            } else {
                content.innerHTML = `
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <div class="analytics-label">Total Trades</div>
                            <div class="analytics-value">${this.analytics.total_trades}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Win Rate</div>
                            <div class="analytics-value" style="color: ${this.analytics.win_rate >= 50 ? 'var(--success-color)' : 'var(--danger-color)'}">
                                ${this.analytics.win_rate.toFixed(1)}%
                            </div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Net Profit</div>
                            <div class="analytics-value" style="color: ${this.analytics.net_profit >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}">
                                ${this.analytics.net_profit.toFixed(2)}
                            </div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Profit Factor</div>
                            <div class="analytics-value">${this.analytics.profit_factor.toFixed(2)}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Winning Trades</div>
                            <div class="analytics-value" style="color: var(--success-color)">${this.analytics.winning_trades}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Losing Trades</div>
                            <div class="analytics-value" style="color: var(--danger-color)">${this.analytics.losing_trades}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Average Win</div>
                            <div class="analytics-value">${this.analytics.average_win.toFixed(2)}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Average Loss</div>
                            <div class="analytics-value">${Math.abs(this.analytics.average_loss).toFixed(2)}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Largest Win</div>
                            <div class="analytics-value" style="color: var(--success-color)">${this.analytics.largest_win.toFixed(2)}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Largest Loss</div>
                            <div class="analytics-value" style="color: var(--danger-color)">${Math.abs(this.analytics.largest_loss).toFixed(2)}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Sharpe Ratio</div>
                            <div class="analytics-value">${this.analytics.sharpe_ratio.toFixed(2)}</div>
                        </div>
                        <div class="analytics-card">
                            <div class="analytics-label">Total Profit</div>
                            <div class="analytics-value" style="color: var(--success-color)">${this.analytics.total_profit.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }
        } else if (this.activeTab === 'history') {
            if (this.tradingHistory.length === 0) {
                content.innerHTML = '<div class="empty-state">No trading history</div>';
            } else {
                content.innerHTML = `
                    <div class="history-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Symbol</th>
                                    <th>Side</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Value</th>
                                    <th>Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.tradingHistory.map(trade => `
                                    <tr>
                                        <td>${new Date(trade.created_at).toLocaleString()}</td>
                                        <td>${trade.symbol}</td>
                                        <td style="color: ${trade.side === 'buy' ? 'var(--success-color)' : 'var(--danger-color)'}">
                                            ${trade.side.toUpperCase()}
                                        </td>
                                        <td>${parseFloat(trade.quantity).toFixed(2)}</td>
                                        <td>${parseFloat(trade.price).toFixed(5)}</td>
                                        <td>${trade.total_value}</td>
                                        <td>${parseFloat(trade.fee).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }
    }

    getStatusColor(status) {
        const colors = {
            'filled': 'var(--success-color)',
            'open': 'var(--primary-color)',
            'pending': 'var(--text-secondary)',
            'cancelled': 'var(--danger-color)',
            'rejected': 'var(--danger-color)'
        };
        return colors[status] || 'var(--text-secondary)';
    }

    updateMarketData() {
        const grid = document.querySelector('#marketGrid');
        if (!grid || this.marketData.length === 0) return;

        grid.innerHTML = this.marketData.slice(0, 12).map(data => `
            <div class="market-item">
                <div class="market-symbol">${data.symbol}</div>
                <div class="market-price">$${data.last.toFixed(data.symbol.includes('JPY') ? 2 : 4)}</div>
                <div class="market-change">
                    Bid: ${data.bid.toFixed(data.symbol.includes('JPY') ? 2 : 4)} | 
                    Ask: ${data.ask.toFixed(data.symbol.includes('JPY') ? 2 : 4)}
                </div>
            </div>
        `).join('');
    }
}
