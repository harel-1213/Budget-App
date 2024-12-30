class BudgetApp {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.form = document.getElementById('transaction-form');
        this.transactionsList = document.getElementById('transactions-list');
        this.chart = null;
        this.editingTransactionId = null;
        this.submitButton = this.form.querySelector('button[type="submit"]');

        this.initializeEventListeners();
        this.updateUI();
        this.initializeChart();
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingTransactionId) {
                this.updateTransaction();
            } else {
                this.addTransaction();
            }
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'ביטול עריכה';
        cancelButton.className = 'btn';
        cancelButton.style.display = 'none';
        cancelButton.style.marginRight = '10px';
        cancelButton.style.backgroundColor = '#e74c3c';
        
        this.submitButton.parentNode.insertBefore(cancelButton, this.submitButton.nextSibling);
        
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.cancelEdit();
        });
        
        this.cancelButton = cancelButton;
    }

    initializeChart() {
        const ctx = document.getElementById('expensesChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#2ecc71',
                        '#e74c3c',
                        '#3498db',
                        '#f1c40f',
                        '#9b59b6',
                        '#e67e22'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    cancelEdit() {
        this.editingTransactionId = null;
        this.form.reset();
        this.submitButton.textContent = 'הוסף תנועה';
        this.cancelButton.style.display = 'none';
    }

    addTransaction() {
        try {
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;

            if (!description || isNaN(amount) || !type || !category) {
                throw new Error('כל השדות חייבים להיות מלאים');
            }

            const transaction = {
                id: Date.now(),
                description,
                amount,
                type,
                category,
                date: new Date().toISOString()
            };

            this.transactions.push(transaction);
            this.saveTransactions();
            this.updateUI();
            this.showNotification('התנועה נוספה בהצלחה', 'success');
            this.form.reset();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    updateTransaction() {
        try {
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const category = document.getElementById('category').value;

            if (!description || isNaN(amount) || !type || !category) {
                throw new Error('כל השדות חייבים להיות מלאים');
            }

            const index = this.transactions.findIndex(t => t.id === this.editingTransactionId);
            if (index === -1) {
                throw new Error('התנועה לא נמצאה');
            }

            this.transactions[index] = {
                ...this.transactions[index],
                description,
                amount,
                type,
                category
            };
            
            this.saveTransactions();
            this.updateUI();
            this.showNotification('התנועה עודכנה בהצלחה', 'success');
            this.form.reset();
            this.editingTransactionId = null;
            this.submitButton.textContent = 'הוסף תנועה';
            this.cancelButton.style.display = 'none';
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    editTransaction(id) {
        try {
            const transaction = this.transactions.find(t => t.id === id);
            
            if (!transaction) {
                throw new Error('התנועה לא נמצאה');
            }

            document.getElementById('description').value = transaction.description;
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('type').value = transaction.type;
            document.getElementById('category').value = transaction.category;
            
            this.editingTransactionId = id;
            this.submitButton.textContent = 'עדכן תנועה';
            this.cancelButton.style.display = 'inline-block';
            
            this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    deleteTransaction(id) {
        try {
            this.transactions = this.transactions.filter(transaction => transaction.id !== id);
            this.saveTransactions();
            this.updateUI();
            this.showNotification('התנועה נמחקה בהצלחה', 'success');

            if (this.editingTransactionId === id) {
                this.cancelEdit();
            }
        } catch (error) {
            this.showNotification('שגיאה במחיקת התנועה', 'error');
        }
    }

    calculateTotals() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);

        return { 
            income, 
            expenses, 
            balance: income - expenses 
        };
    }

    updateUI() {
        const { income, expenses, balance } = this.calculateTotals();
        
        document.getElementById('total-balance').textContent = `₪${Math.round(balance)}`;
        document.getElementById('total-income').textContent = `₪${Math.round(income)}`;
        document.getElementById('total-expenses').textContent = `₪${Math.round(expenses)}`;

        this.renderTransactionsList();
        this.updateChart();
        this.updateCategorySummary();
    }

    renderTransactionsList() {
        this.transactionsList.innerHTML = this.transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(transaction => `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <span class="transaction-category ${transaction.type}-category">
                            ${transaction.category}
                        </span>
                        <div>
                            <div>${transaction.description}</div>
                            <small>${new Date(transaction.date).toLocaleDateString()}</small>
                        </div>
                    </div>
                    <div class="transaction-amount">
                        <span style="color: ${transaction.type === 'income' ? 'var(--primary)' : 'var(--secondary)'}">
                            ${transaction.type === 'income' ? '+' : '-'}₪${Math.round(transaction.amount)}
                        </span>
                        <i class="fas fa-edit edit-btn" onclick="budgetApp.editTransaction(${transaction.id})"></i>
                        <i class="fas fa-trash delete-btn" onclick="budgetApp.deleteTransaction(${transaction.id})"></i>
                    </div>
                </div>
            `).join('');
    }

    updateChart() {
        if (!this.chart) return;
        
        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        this.chart.data.labels = Object.keys(expensesByCategory);
        this.chart.data.datasets[0].data = Object.values(expensesByCategory);
        this.chart.update();
    }

    getCategoryIcon(category) {
        const icons = {
            salary: 'fa-money-bill-wave',
            business: 'fa-briefcase',
            food: 'fa-utensils',
            transportation: 'fa-car',
            entertainment: 'fa-film',
            shopping: 'fa-shopping-cart',
            bills: 'fa-file-invoice-dollar',
            other: 'fa-question'
        };
        return icons[category] || 'fa-question';
    }

    getCategoryColor(category) {
        const colors = {
            salary: '#2ecc71',
            business: '#3498db',
            food: '#e74c3c',
            transportation: '#f1c40f',
            entertainment: '#9b59b6',
            shopping: '#e67e22',
            bills: '#1abc9c',
            other: '#95a5a6'
        };
        return colors[category] || '#95a5a6';
    }

    updateCategorySummary() {
        const categorySummary = document.getElementById('category-summary');
        const expensesByCategory = {};
        let totalExpenses = 0;

        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                totalExpenses += t.amount;
            });

        if (totalExpenses === 0) {
            categorySummary.innerHTML = '<p>אין הוצאות להצגה.</p>';
            return;
        }

        const categoryHTML = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
                const percentage = Math.round((amount / totalExpenses) * 100);
                return `
                    <div class="category-card">
                        <div class="category-icon" style="background-color: ${this.getCategoryColor(category)}">
                            <i class="fas ${this.getCategoryIcon(category)}"></i>
                        </div>
                        <div class="category-details">
                            <div class="category-name">${category}</div>
                            <div class="category-amount">₪${Math.round(amount)}</div>
                            <div class="category-percentage">${percentage}% מסך ההוצאות</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%; background-color: ${this.getCategoryColor(category)}"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        categorySummary.innerHTML = categoryHTML;
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = type;
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

// יצירת אובייקט חדש של האפליקציה
const budgetApp = new BudgetApp();