// Initialize state
let currentTab = 'dashboard';
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';

const categoryIcons = {
    food: '🍽️',
    transport: '🚗',
    bills: '📄',
    entertainment: '🎬',
    shopping: '🛍️',
    salary: '💰',
    other: '📎'
};

const categoryTranslations = {
    food: 'מזון',
    transport: 'תחבורה',
    bills: 'חשבונות',
    entertainment: 'בידור',
    shopping: 'קניות',
    salary: 'משכורת',
    other: 'אחר'
};

// Tab switching functionality
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabName).style.display = 'block';
    
    // Update active state in navbar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.textContent.includes(tabName === 'dashboard' ? 'דשבורד' : tabName === 'transactions' ? 'תנועות' : 'סיכום')) {
            item.classList.add('active');
        }
    });

    currentTab = tabName;
    updateUI();
}

// Modal functionality
function openModal() {
    document.getElementById('transactionModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('transactionModal').style.display = 'none';
    document.getElementById('transactionForm').reset();
}

// Transaction handling
function handleTransactionSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const transaction = {
        type: form.type.value,
        category: form.category.value,
        amount: parseFloat(form.amount.value),
        description: form.description.value,
        date: new Date().toISOString(),
        id: Date.now()
    };

    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    updateUI();
    closeModal();
}

function deleteTransaction(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק תנועה זו?')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
    }
}

// Filter functionality
function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === getFilterText(filter)) {
            btn.classList.add('active');
        }
    });
    updateTransactionsList();
}

function getFilterText(filter) {
    switch(filter) {
        case 'income': return 'הכנסות';
        case 'expense': return 'הוצאות';
        default: return 'הכל';
    }
}

// UI Updates
function updateUI() {
    updateDashboard();
    updateTransactionsList();
    updateChart();
    updateExpensesSummary();
}

function updateDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= monthStart);
    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = transactions
        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpense').textContent = formatCurrency(monthlyExpense);
}

function updateTransactionsList() {
    const listId = currentTab === 'dashboard' ? 'transactionsList' : 'allTransactionsList';
    const list = document.getElementById(listId);
    const filteredTransactions = transactions.filter(t => {
        if (currentFilter === 'all') return true;
        return t.type === currentFilter;
    });

    const transactionsToShow = currentTab === 'dashboard' ? 
        filteredTransactions.slice(0, 5) : filteredTransactions;

    list.innerHTML = transactionsToShow.map(t => `
        <div class="transaction">
            <div class="transaction-info">
                <div class="category-icon">
                    ${categoryIcons[t.category]}
                </div>
                <div>
                    <div>${t.description}</div>
                    <small style="color: var(--secondary)">${new Date(t.date).toLocaleDateString('he-IL')} • ${categoryTranslations[t.category]}</small>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="amount ${t.type === 'income' ? 'income' : 'expense'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </span>
                <button class="btn secondary" onclick="deleteTransaction(${t.id})" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateExpensesSummary() {
    const summaryList = document.getElementById('expensesSummaryList');
    const expensesByCategory = {};
    let totalExpenses = 0;

    // Calculate expenses by category
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            totalExpenses += t.amount;
        });

    // Create HTML for summary list
    const summaryHTML = Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1]) // Sort by amount (highest first)
        .map(([category, amount]) => {
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);
            return `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="category-icon">
                            ${categoryIcons[category]}
                        </div>
                        <div>
                            <div>${categoryTranslations[category]}</div>
                            <small style="color: var(--secondary)">${percentage}% מסך ההוצאות</small>
                        </div>
                    </div>
                    <span class="amount expense">${formatCurrency(amount)}</span>
                </li>
            `;
        })
        .join('');

    summaryList.innerHTML = totalExpenses > 0 ? summaryHTML : '<li style="text-align: center; padding: 20px;">אין הוצאות להצגה</li>';
}

function updateChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            if (expensesByCategory[t.category]) {
                expensesByCategory[t.category] += t.amount;
            } else {
                expensesByCategory[t.category] = t.amount;
            }
        });

    if (window.expenseChart instanceof Chart) {
        window.expenseChart.destroy();
    }

    window.expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByCategory).map(category => categoryTranslations[category]),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#f59e0b', '#22c55e', 
                    '#8b5cf6', '#ec4899', '#64748b'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'system-ui, -apple-system, sans-serif'
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('transactionModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});
