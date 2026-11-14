
// FINGROW - FRONT-END APPLICATION

const DEMO_ACCOUNTS_KEY = "ppDemoAccounts";

const $ = (selector) => document.querySelector(selector);

const authScreen = $("#auth-screen");
const appShell = $("#app-shell");
const pageContent = $("#page-content");
const pageHeading = $("#page-heading");
const toast = $("#toast");

let currentUser = null;

let transactions = JSON.parse(localStorage.getItem("fgTransactions") || "null") || [
  { id: 1, description: "Sample allowance", amount: 25000, type: "income", date: "01/11/2026" },
  { id: 2, description: "Sample groceries", amount: 3200, type: "expense", date: "03/11/2026" },
  { id: 3, description: "Sample transport", amount: 1200, type: "expense", date: "05/11/2026" }
];
let habits = JSON.parse(localStorage.getItem("fgHabits") || "null") || [
  { text: "Track today's expenses", done: false },
  { text: "Review my savings goal", done: false },
  { text: "Learn one new money concept", done: false },
  { text: "Plan my spending", done: false }
];

let goals = JSON.parse(localStorage.getItem("fgGoals") || "null") || [
  { name: "Emergency Savings", target: 50000, saved: 20000 },
  { name: "Education Fund", target: 30000, saved: 12000 },
  { name: "Personal Goal", target: 10000, saved: 3500 }
];

const headings = {
  dashboard: "Your Dashboard",
  transactions: "Income & Expenses",
  habits: "Financial Habit Tracker",
  goals: "Your Savings Goals",
  wealth: "Wealth Analytics",
  profile: "Profile & Settings",
  admin: "Admin Panel"
};

function saveData() {
  localStorage.setItem("fgTransactions", JSON.stringify(transactions));
  localStorage.setItem("fgHabits", JSON.stringify(habits));
  localStorage.setItem("fgGoals", JSON.stringify(goals));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function formatMoney(value) {
  return "₹" + Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getDemoAccounts() {
  return JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) || "[]");
}

// AUTH TAB SWITCHING
document.querySelectorAll("[data-auth-tab]").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.dataset.authTab;

    document.querySelectorAll("[data-auth-tab]").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.authTab === selected);
    });

    $("#login-form").classList.toggle("hidden", selected !== "login");
    $("#register-form").classList.toggle("hidden", selected !== "register");
  });
});

// ACCOUNT REGISTRATION
$("#register-form").addEventListener("submit", async event => {
  event.preventDefault();

  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const name = form.get("name").trim();
  const email = form.get("email").trim().toLowerCase();

  const password = form.get("password");
  if (!name || !email || !password) {
    showToast("Please complete all fields.");
    return;
  }

  const button = formElement.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const accounts = getDemoAccounts();
    if (accounts.some(account => account.email === email)) {
      throw new Error("An account with this email already exists in this browser.");
    }
    accounts.push({ name, email, password });
    localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
    formElement.reset();
    document.querySelector('[data-auth-tab="login"]').click();
    $("#login-form").elements.email.value = email;
    showToast("Demo account created in this browser. Please sign in.");
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

// ACCOUNT LOGIN
$("#login-form").addEventListener("submit", async event => {
  event.preventDefault();

  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const email = form.get("email").trim().toLowerCase();
  const password = form.get("password");

  if (!email || !password) {
    showToast("Please enter your email and password.");
    return;
  }

  const button = formElement.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const account = getDemoAccounts().find(item => item.email === email && item.password === password);
    if (!account) throw new Error("Email or password not found. Create a demo account in this browser first.");
    currentUser = { name: account.name, email: account.email };
    formElement.reset();
    openApp();
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
  }
});

// LOGOUT
$("#logout-btn").addEventListener("click", logout);

function logout() {
  currentUser = null;
  appShell.classList.add("hidden");
  authScreen.classList.remove("hidden");
  $("#login-form").reset();
  showToast("You have signed out.");
}

// OPEN APPLICATION
function openApp() {
  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  $("#avatar-button").textContent =
    currentUser.name.charAt(0).toUpperCase();

  const isDemoAdmin = currentUser.email === "admin@fingrow.demo";
  $("#admin-nav").classList.toggle("hidden", !isDemoAdmin);

  $("#date-label").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).toUpperCase();

  showPage("dashboard");
  showToast("Welcome to PennyPilot, " + currentUser.name + "!");
}

// NAVIGATION
document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    showPage(button.dataset.page);
  });
});

function showPage(page) {
  if (page === "admin" &&
      (!currentUser || currentUser.email !== "admin@fingrow.demo")) {
    showToast("Demo admin access only.");
    return;
  }

  pageHeading.textContent = headings[page] || "PennyPilot";

  document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const pages = {
    dashboard: renderDashboard,
    transactions: renderTransactions,
    habits: renderHabits,
    goals: renderGoals,
    wealth: renderWealth,
    profile: renderProfile,
    admin: renderAdmin
  };

  if (pages[page]) pages[page]();
}

// FINANCIAL TOTALS
function calculateTotals() {
  const income = transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenses = transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const goalSavings = goals.reduce((sum, goal) => sum + goal.saved, 0);

  return {
    income,
    expenses,
    savings: goalSavings,
    balance: income - expenses
  };
}

// DASHBOARD
function renderDashboard() {
  const totals = calculateTotals();
  const completedHabits = habits.filter(item => item.done).length;

  pageContent.innerHTML = `
    <p class="welcome-line">
      Welcome, ${escapeHTML(currentUser.name)}. Here's your financial overview.
    </p>

    <div class="summary-grid">
      <div class="card summary-card">
        <small>Total Income</small>
        <h3>${formatMoney(totals.income)}</h3>
        <p>Recorded demo income</p>
      </div>

      <div class="card summary-card">
        <small>Total Expenses</small>
        <h3>${formatMoney(totals.expenses)}</h3>
        <p>Recorded demo expenses</p>
      </div>

      <div class="card summary-card">
        <small>Total Goal Savings</small>
        <h3>${formatMoney(totals.savings)}</h3>
        <p>Across your sample goals</p>
      </div>

      <div class="card summary-card">
        <small>Net Balance</small>
        <h3>${formatMoney(totals.balance)}</h3>
        <p>Income minus expenses</p>
      </div>
    </div>

    <h2 class="section-title">Your Financial Overview</h2>

    <div class="two-columns">
      <section class="panel">
        <h3>Monthly Activity</h3>
        <p>A simple illustration of your financial progress.</p>
        <div class="bar-chart">
          ${[40, 65, 48, 78, 58, 90].map((height, index) => `
            <div class="bar-column">
              <div class="bar" style="height:${height}%"></div>
              <span>${["Jan","Feb","Mar","Apr","May","Jun"][index]}</span>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="panel">
        <h3>Habit Progress</h3>
        <p>You completed ${completedHabits} out of ${habits.length} habits today.</p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${habits.length ? completedHabits / habits.length * 100 : 0}%"></div>
        </div>
        <p>${habits.length ? Math.round(completedHabits / habits.length * 100) : 0}% of today's habits completed</p>
        <button class="btn primary" onclick="showPage('habits')">View Habits</button>
      </section>
    </div>

    <h2 class="section-title">Your Savings Goals</h2>
    <section class="panel">
      ${goals.map(goal => `
        <div class="goal-row">
          <strong>${escapeHTML(goal.name)}</strong>
          <p>${formatMoney(goal.saved)} saved of ${formatMoney(goal.target)}</p>
          <div class="progress-track">
            <div class="progress-fill" style="width:${Math.min(100, goal.saved / goal.target * 100)}%"></div>
          </div>
        </div>
      `).join("")}
      <button class="btn primary" onclick="showPage('goals')">Manage Goals</button>
    </section>
  `;
}

// TRANSACTIONS
function renderTransactions() {
  const totals = calculateTotals();

  pageContent.innerHTML = `
    <div class="summary-grid">
      <div class="card summary-card">
        <small>Total Income</small><h3>${formatMoney(totals.income)}</h3>
      </div>
      <div class="card summary-card">
        <small>Total Expenses</small><h3>${formatMoney(totals.expenses)}</h3>
      </div>
    </div>

    <h2 class="section-title">Add a Transaction</h2>

    <section class="content-box">
      <form id="transaction-form" class="form-grid">
        <label>Description
          <input class="form-control" name="description" maxlength="60"
            placeholder="e.g. Pocket money" required>
        </label>

        <label>Amount (₹)
          <input class="form-control" name="amount" type="number"
            min="0.01" step="0.01" placeholder="Enter amount" required>
        </label>

        <label>Type
          <select class="form-control" name="type">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <button class="btn primary" type="submit">Add Transaction</button>
      </form>
    </section>

    <section class="content-box">
      <h2>Recent Transactions</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Description</th><th>Date</th><th>Type</th><th>Amount</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${transactions.length ? transactions.map(item => `
              <tr>
                <td>${escapeHTML(item.description)}</td>
                <td>${escapeHTML(item.date)}</td>
                <td class="${item.type}">${item.type}</td>
                <td class="${item.type}">${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}</td>
                <td><button class="delete-btn" data-delete="${item.id}">Delete</button></td>
              </tr>
            `).join("") : `<tr><td colspan="5">No transactions yet. Add your first demo transaction above.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;

  $("#transaction-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a valid amount.");
      return;
    }

    transactions.unshift({
      id: Date.now(),
      description: form.get("description").trim(),
      amount,
      type: form.get("type"),
      date: new Date().toLocaleDateString("en-IN")
    });

    saveData();
    renderTransactions();
    showToast("Transaction added.");
  });

  pageContent.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      transactions = transactions.filter(item =>
        item.id !== Number(button.dataset.delete)
      );
      saveData();
      renderTransactions();
      showToast("Transaction deleted.");
    });
  });
}

// HABITS
function renderHabits() {
  const completed = habits.filter(item => item.done).length;

  pageContent.innerHTML = `
    <section class="content-box">
      <h2>Your Daily Habits</h2>
      <p class="muted">Tick each habit when you complete it.</p>
      <h3>${completed} / ${habits.length} completed</h3>

      <div class="progress-track">
        <div class="progress-fill" style="width:${habits.length ? completed / habits.length * 100 : 0}%"></div>
      </div>

      <div class="habit-list">
        ${habits.map((habit, index) => `
          <label class="habit-item ${habit.done ? "done" : ""}">
            <input type="checkbox" data-habit="${index}" ${habit.done ? "checked" : ""}>
            <span>${escapeHTML(habit.text)}</span>
          </label>
        `).join("")}
      </div>
    </section>
  `;

  pageContent.querySelectorAll("[data-habit]").forEach(input => {
    input.addEventListener("change", () => {
      habits[Number(input.dataset.habit)].done = input.checked;
      saveData();
      renderHabits();
    });
  });
}

// GOALS
function renderGoals() {
  pageContent.innerHTML = `
    <section class="content-box">
      <h2>Create a Savings Goal</h2>
      <form id="goal-form" class="form-grid">
        <label>Goal Name
          <input class="form-control" name="name" maxlength="50" placeholder="e.g. New laptop" required>
        </label>
        <label>Target Amount (₹)
          <input class="form-control" name="target" type="number" min="1" step="0.01" required>
        </label>
        <button class="btn primary" type="submit">Create Goal</button>
      </form>
    </section>

    <h2 class="section-title">Your Goals</h2>
    ${goals.map((goal, index) => `
      <section class="goal-card">
        <h3>${escapeHTML(goal.name)}</h3>
        <p>${formatMoney(goal.saved)} saved of ${formatMoney(goal.target)}</p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(100, goal.saved / goal.target * 100)}%"></div>
        </div>
        <p>${Math.round(Math.min(100, goal.saved / goal.target * 100))}% completed</p>
        <div class="goal-actions">
          <button class="small-btn" data-add-saving="${index}">Add Demo Saving</button>
          <button class="small-btn" data-remove-goal="${index}">Remove Goal</button>
        </div>
      </section>
    `).join("")}
  `;

  $("#goal-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const target = Number(form.get("target"));

    if (!Number.isFinite(target) || target <= 0) {
      showToast("Enter a valid target.");
      return;
    }

    goals.push({
      name: form.get("name").trim(),
      target,
      saved: 0
    });

    saveData();
    renderGoals();
    showToast("Savings goal created.");
  });

  pageContent.querySelectorAll("[data-add-saving]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.addSaving);
      const remaining = goals[index].target - goals[index].saved;
      const addition = Math.min(500, remaining);

      if (addition <= 0) {
        showToast("This demo goal is complete!");
        return;
      }

      goals[index].saved += addition;
      saveData();
      renderGoals();
      showToast("Demo saving added.");
    });
  });

  pageContent.querySelectorAll("[data-remove-goal]").forEach(button => {
    button.addEventListener("click", () => {
      goals.splice(Number(button.dataset.removeGoal), 1);
      saveData();
      renderGoals();
      showToast("Goal removed.");
    });
  });
}

// WEALTH ANALYTICS
function renderWealth() {
  const totals = calculateTotals();
  const completed = habits.filter(item => item.done).length;

  pageContent.innerHTML = `
    <section class="content-box">
      <h2>Your Progress Overview</h2>
      <div class="summary-grid">
        <div class="card summary-card">
          <small>Income</small><h3>${formatMoney(totals.income)}</h3>
        </div>
        <div class="card summary-card">
          <small>Expenses</small><h3>${formatMoney(totals.expenses)}</h3>
        </div>
        <div class="card summary-card">
          <small>Goal Savings</small><h3>${formatMoney(totals.savings)}</h3>
        </div>
        <div class="card summary-card">
          <small>Net Balance</small><h3>${formatMoney(totals.balance)}</h3>
        </div>
      </div>
    </section>

    <section class="content-box">
      <h2>Savings Goal Progress</h2>
      ${goals.map(goal => `
        <div class="goal-row">
          <strong>${escapeHTML(goal.name)}</strong>
          <p>${formatMoney(goal.saved)} / ${formatMoney(goal.target)}</p>
          <div class="progress-track">
            <div class="progress-fill" style="width:${Math.min(100, goal.saved / goal.target * 100)}%"></div>
          </div>
        </div>
      `).join("")}
    </section>

    <section class="content-box">
      <h2>Habit Consistency</h2>
      <p>You have completed ${completed} of ${habits.length} tracked habits.</p>
      <p class="muted">These figures are illustrative and are not investment or wealth advice.</p>
    </section>
  `;
}

// PROFILE
function renderProfile() {
  pageContent.innerHTML = `
    <section class="content-box">
      <h2>Your Profile</h2>
      <div class="profile-info">
        <p><strong>Name:</strong> ${escapeHTML(currentUser.name)}</p>
        <p><strong>Email:</strong> ${escapeHTML(currentUser.email)}</p>
        <p><strong>Account:</strong> Local browser demo account</p>
      </div>
      <p class="muted">Your demo account and finance tracking data are stored in this browser's localStorage and are not secure.</p>
      <button class="btn primary" id="profile-logout">Sign Out</button>
    </section>
  `;

  $("#profile-logout").addEventListener("click", logout);
}

// DEMO ADMIN
function renderAdmin() {
  const totals = calculateTotals();

  pageContent.innerHTML = `
    <section class="content-box">
      <h2>Demo Administration</h2>
      <p class="muted">Sample activity from this browser's PennyPilot demo.</p>
      <div class="summary-grid">
        <div class="card summary-card">
          <small>Transactions</small>
          <h3>${transactions.length}</h3>
        </div>
        <div class="card summary-card">
          <small>Savings Goals</small>
          <h3>${goals.length}</h3>
        </div>
        <div class="card summary-card">
          <small>Tracked Habits</small>
          <h3>${habits.length}</h3>
        </div>
        <div class="card summary-card">
          <small>Recorded Income</small>
          <h3>${formatMoney(totals.income)}</h3>
        </div>
      </div>
      <p class="muted">This is a demonstration panel, not a secure multi-user admin system.</p>
    </section>
  `;
}

// INITIAL DISPLAY
authScreen.classList.remove("hidden");
appShell.classList.add("hidden");
