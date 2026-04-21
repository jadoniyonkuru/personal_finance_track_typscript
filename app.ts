

//  1. TYPES & INTERFACES 

type TransactionType = "income" | "expense";

type Category =
  | "income"
  | "food"
  | "transport"
  | "entertainment"
  | "health"
  | "shopping"
  | "utilities"
  | "other";

type BillStatus = "paid" | "upcoming" | "due-soon";

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
  note?: string;
}

interface Budget {
  id: string;
  category: Category;
  limit: number;
  color: string;
}

interface SavingsPot {
  id: string;
  name: string;
  target: number;
  saved: number;
  color: string;
}

interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  dueDay: number;        // day of month (1–31)
  status: BillStatus;
}

interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  pots: SavingsPot[];
  bills: RecurringBill[];
}

interface Summary {
  balance: number;
  income: number;
  expenses: number;
}

interface BillSummary {
  paid: number;
  upcoming: number;
  dueSoon: number;
  total: number;
}

// 2. CONSTANTS 

const STORAGE_KEY = "fintrack_v2";

const CATEGORY_LABEL: Record<Category, string> = {
  income:        "Income",
  food:          "Food & Drink",
  transport:     "Transport",
  entertainment: "Entertainment",
  health:        "Health",
  shopping:      "Shopping",
  utilities:     "Utilities",
  other:         "Other",
};

const BUDGET_COLORS: Partial<Record<Category, string>> = {
  food:          "#f59e0b",
  transport:     "#3b82f6",
  entertainment: "#8b5cf6",
  health:        "#ec4899",
  shopping:      "#f97316",
  utilities:     "#64748b",
  other:         "#6b7280",
};

const AVATAR_COLORS = 8; // cycles through av-0..av-7

const PAGE_SIZE = 8;

//  3. UTILITIES

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function avatarClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS;
  return `av-${hash}`;
}

//  4. localStorage 

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const p = JSON.parse(raw) as Partial<AppState>;
    return {
      transactions: Array.isArray(p.transactions) ? p.transactions : [],
      budgets:      Array.isArray(p.budgets)      ? p.budgets      : [],
      pots:         Array.isArray(p.pots)          ? p.pots         : [],
      bills:        Array.isArray(p.bills)         ? p.bills        : [],
    };
  } catch {
    return getDefaultState();
  }
}

function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDefaultState(): AppState {
  return {
    transactions: [
      { id: generateId(), name: "Monthly Salary",     amount: 2500, type: "income",  category: "income",        date: "2026-04-01" },
      { id: generateId(), name: "Grocery Run",         amount: 68,   type: "expense", category: "food",          date: "2026-04-03" },
      { id: generateId(), name: "Netflix",             amount: 15,   type: "expense", category: "entertainment",  date: "2026-04-05" },
      { id: generateId(), name: "Bus Pass",            amount: 30,   type: "expense", category: "transport",     date: "2026-04-07" },
      { id: generateId(), name: "Freelance Payment",   amount: 400,  type: "income",  category: "income",        date: "2026-04-10" },
      { id: generateId(), name: "Electricity Bill",    amount: 55,   type: "expense", category: "utilities",     date: "2026-04-12" },
      { id: generateId(), name: "Coffee Shop",         amount: 12,   type: "expense", category: "food",          date: "2026-04-14" },
      { id: generateId(), name: "Gym Membership",      amount: 40,   type: "expense", category: "health",        date: "2026-04-15" },
      { id: generateId(), name: "Online Shopping",     amount: 89,   type: "expense", category: "shopping",      date: "2026-04-16" },
      { id: generateId(), name: "Spotify",             amount: 10,   type: "expense", category: "entertainment",  date: "2026-04-17" },
    ],
    budgets: [
      { id: generateId(), category: "food",          limit: 200, color: BUDGET_COLORS.food!          },
      { id: generateId(), category: "entertainment", limit: 80,  color: BUDGET_COLORS.entertainment! },
      { id: generateId(), category: "transport",     limit: 100, color: BUDGET_COLORS.transport!     },
    ],
    pots: [
      { id: generateId(), name: "Emergency Fund", target: 3000, saved: 850,  color: "#37b5a0" },
      { id: generateId(), name: "Vacation",        target: 1500, saved: 320,  color: "#c94f2e" },
    ],
    bills: [
      { id: generateId(), title: "Rent",        amount: 950,  dueDay: 1,  status: "paid"     },
      { id: generateId(), title: "Netflix",     amount: 15,   dueDay: 5,  status: "paid"     },
      { id: generateId(), title: "Electricity", amount: 55,   dueDay: 12, status: "upcoming" },
      { id: generateId(), title: "Internet",    amount: 40,   dueDay: 20, status: "due-soon" },
      { id: generateId(), title: "Spotify",     amount: 10,   dueDay: 25, status: "upcoming" },
    ],
  };
}

// 5. BUSINESS LOGIC 

function computeSummary(txns: Transaction[]): Summary {
  return txns.reduce<Summary>(
    (acc, t) => {
      if (t.type === "income") { acc.income += t.amount; acc.balance += t.amount; }
      else { acc.expenses += t.amount; acc.balance -= t.amount; }
      return acc;
    },
    { balance: 0, income: 0, expenses: 0 }
  );
}

function spentInCategory(txns: Transaction[], cat: Category): number {
  return txns.filter(t => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0);
}

function computeBillSummary(bills: RecurringBill[]): BillSummary {
  return bills.reduce<BillSummary>(
    (acc, b) => {
      acc.total += b.amount;
      if (b.status === "paid")     acc.paid     += b.amount;
      if (b.status === "upcoming") acc.upcoming += b.amount;
      if (b.status === "due-soon") acc.dueSoon  += b.amount;
      return acc;
    },
    { paid: 0, upcoming: 0, dueSoon: 0, total: 0 }
  );
}

function sortTransactions(txns: Transaction[], mode: string): Transaction[] {
  const c = [...txns];
  switch (mode) {
    case "date-desc":   return c.sort((a, b) => b.date.localeCompare(a.date));
    case "date-asc":    return c.sort((a, b) => a.date.localeCompare(b.date));
    case "amount-desc": return c.sort((a, b) => b.amount - a.amount);
    case "amount-asc":  return c.sort((a, b) => a.amount - b.amount);
    default:            return c;
  }
}

function filterTransactions(txns: Transaction[], search: string, cat: string): Transaction[] {
  return txns.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) &&
    (cat === "" || t.category === cat)
  );
}

// 6. DOM HELPERS 

function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null;
  if (!el) throw new Error(`#${id} not found`);
  return el;
}

//7. PAGINATION STATE 

let txnPage = 0;

// 8. RENDER 

function txnRowHTML(t: Transaction, showDelete: boolean): string {
  const sign = t.type === "income" ? "+" : "−";
  const cls  = t.type === "income" ? "amount-pos" : "amount-neg";
  const del  = showDelete
    ? `<td><button class="btn-danger-sm" onclick="deleteTransaction('${t.id}')">Delete</button></td>`
    : `<td></td>`;
  return `
    <tr>
      <td>
        <div class="txn-sender">
          <div class="txn-avatar ${avatarClass(t.name)}">${initials(t.name)}</div>
          <span class="txn-name-text">${t.name}</span>
        </div>
      </td>
      <td><span class="cat-badge">${CATEGORY_LABEL[t.category]}</span></td>
      <td>${formatDate(t.date)}</td>
      <td class="text-right ${cls}">${sign}${formatCurrency(t.amount)}</td>
      ${del}
    </tr>`;
}

function renderSummaryCards(s: Summary): void {
  getEl("totalBalance").textContent  = formatCurrency(s.balance);
  getEl("totalIncome").textContent   = formatCurrency(s.income);
  getEl("totalExpenses").textContent = formatCurrency(s.expenses);
}

function renderOverviewTxns(txns: Transaction[]): void {
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const body = getEl("overviewTxnBody");
  body.innerHTML = recent.length
    ? recent.map(t => txnRowHTML(t, false)).join("")
    : `<tr><td colspan="4" class="empty-state">No Data Provided</td></tr>`;
}

function renderAllTxns(state: AppState): void {
  const search = getEl<HTMLInputElement>("searchTxn").value;
  const cat    = getEl<HTMLSelectElement>("filterCategory").value;
  const sort   = getEl<HTMLSelectElement>("sortTxn").value;

  const filtered = filterTransactions(state.transactions, search, cat);
  const sorted   = sortTransactions(filtered, sort);
  const total    = sorted.length;
  const pages    = Math.max(1, Math.ceil(total / PAGE_SIZE));
  txnPage = clamp(txnPage, 0, pages - 1);

  const page = sorted.slice(txnPage * PAGE_SIZE, (txnPage + 1) * PAGE_SIZE);
  const body = getEl("allTxnBody");
  body.innerHTML = page.length
    ? page.map(t => txnRowHTML(t, true)).join("")
    : `<tr><td colspan="5" class="empty-state">No results.</td></tr>`;

  const prevBtn = getEl<HTMLButtonElement>("prevPage");
  const nextBtn = getEl<HTMLButtonElement>("nextPage");
  prevBtn.disabled = txnPage === 0;
  nextBtn.disabled = txnPage >= pages - 1;
}

function renderOverviewPots(pots: SavingsPot[]): void {
  const el = getEl("overviewPots");
  if (pots.length === 0) { el.innerHTML = `<p class="empty-state">No pots yet.</p>`; return; }
  const totalSaved = pots.reduce((s, p) => s + p.saved, 0);
  el.innerHTML = `
    <div class="mini-pot" style="margin-bottom:12px">
      <div class="mini-pot-icon" style="background:#f5f0eb;font-size:22px">💰</div>
      <div class="mini-pot-info">
        <div class="mini-label">Pots</div>
        <div class="mini-val">${formatCurrency(totalSaved)}</div>
      </div>
    </div>
    <div class="overview-pots-grid">
      ${pots.map(p => `
        <div class="mini-pot">
          <div class="mini-pot-icon" style="background:${p.color}20;width:12px;height:12px;border-radius:50%;background:${p.color}"></div>
          <div class="mini-pot-info">
            <div class="mini-label" style="font-size:11px">${p.name}</div>
            <div class="mini-val" style="font-size:14px">${formatCurrency(p.saved)}</div>
          </div>
        </div>`).join("")}
    </div>`;
}

function renderOverviewBudgets(state: AppState): void {
  const el = getEl("overviewBudgets");
  if (state.budgets.length === 0) { el.innerHTML = `<p class="empty-state">No Data Provided.</p>`; return; }
  el.innerHTML = `<div class="overview-budget-list">${state.budgets.map(b => {
    const spent = spentInCategory(state.transactions, b.category);
    const pct   = clamp((spent / b.limit) * 100, 0, 100);
    return `
      <div class="ov-budget-item">
        <div class="ov-budget-label">
          <span>${CATEGORY_LABEL[b.category]}</span>
          <span>${formatCurrency(spent)} / ${formatCurrency(b.limit)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;background:${b.color}"></div>
        </div>
      </div>`;
  }).join("")}</div>`;
}

function renderBudgets(state: AppState): void {
  const grid = getEl("budgetGrid");
  if (state.budgets.length === 0) {
    grid.innerHTML = `<p class="empty-state">You haven't created a budget yet.</p>`;
    return;
  }
  grid.innerHTML = state.budgets.map(b => {
    const spent = spentInCategory(state.transactions, b.category);
    const pct   = clamp((spent / b.limit) * 100, 0, 100);
    const over  = spent > b.limit;
    return `
      <div class="budget-card">
        <div class="budget-card-header">
          <div class="budget-cat-title">
            <div class="budget-dot" style="background:${b.color}"></div>
            ${CATEGORY_LABEL[b.category]}
          </div>
          <button class="btn-danger-sm" onclick="deleteBudget('${b.id}')">Remove</button>
        </div>
        <div class="budget-amounts">
          <span>Maximum of <strong>${formatCurrency(b.limit)}</strong></span>
          ${over ? `<span style="color:var(--danger);font-weight:700">Over!</span>` : ""}
        </div>
        <div class="progress-bar" style="margin-bottom:8px">
          <div class="progress-fill" style="width:${pct}%;background:${over ? "var(--danger)" : b.color}"></div>
        </div>
        <div class="budget-amounts">
          <span>Spent: <strong>${formatCurrency(spent)}</strong></span>
          <span>Left: <strong>${formatCurrency(Math.max(0, b.limit - spent))}</strong></span>
        </div>
      </div>`;
  }).join("");
}

function renderPots(pots: SavingsPot[]): void {
  const grid = getEl("potsGrid");
  if (pots.length === 0) { grid.innerHTML = `<p class="empty-state">No savings pots yet.</p>`; return; }
  grid.innerHTML = pots.map(p => {
    const pct = clamp((p.saved / p.target) * 100, 0, 100);
    return `
      <div class="pot-card">
        <div class="pot-card-bar" style="background:${p.color}"></div>
        <div class="pot-card-body">
          <div class="pot-name">${p.name}</div>
          <div class="pot-saved">${formatCurrency(p.saved)}</div>
          <div class="pot-target">of ${formatCurrency(p.target)} target · ${pct.toFixed(0)}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%;background:${p.color}"></div>
          </div>
          <div class="pot-actions">
            <button class="btn-outline" onclick="openAddMoney('${p.id}')">+ Add Money</button>
            <button class="btn-outline" onclick="openWithdraw('${p.id}')">Withdraw</button>
            <button class="btn-danger-sm" onclick="deletePot('${p.id}')">Delete</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderBills(state: AppState): void {
  const summary = computeBillSummary(state.bills);
  const fmt     = formatCurrency;

  // Overview panel
  const setIfExists = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setIfExists("billsPaidOv",  fmt(summary.paid));
  setIfExists("billsUpOv",    fmt(summary.upcoming));
  setIfExists("billsDueOv",   fmt(summary.dueSoon));
  setIfExists("billsTotalAmount", fmt(summary.total));
  setIfExists("billsPaidFull",    fmt(summary.paid));
  setIfExists("billsUpFull",      fmt(summary.upcoming));
  setIfExists("billsDueFull",     fmt(summary.dueSoon));

  const body = getEl("billsBody");
  if (state.bills.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="empty-state">No results.</td></tr>`;
    return;
  }

  const statusLabel: Record<BillStatus, string> = { paid: "Paid", upcoming: "Upcoming", "due-soon": "Due Soon" };
  const statusColor: Record<BillStatus, string> = { paid: "var(--income)", upcoming: "var(--text-2)", "due-soon": "var(--danger)" };

  body.innerHTML = state.bills.map(b => `
    <tr>
      <td><span class="txn-name-text">${b.title}</span></td>
      <td style="color:${statusColor[b.status]};font-weight:600">${statusLabel[b.status]}</td>
      <td class="text-right" style="font-weight:700">${fmt(b.amount)}</td>
      <td><button class="btn-danger-sm" onclick="deleteBill('${b.id}')">Delete</button></td>
    </tr>`).join("");
}

function renderAll(): void {
  const state   = loadState();
  const summary = computeSummary(state.transactions);
  renderSummaryCards(summary);
  renderOverviewTxns(state.transactions);
  renderOverviewPots(state.pots);
  renderOverviewBudgets(state);
  renderAllTxns(state);
  renderBudgets(state);
  renderPots(state.pots);
  renderBills(state);
}

//  9. MODAL 

function openModal(html: string): void {
  getEl("modalBody").innerHTML = html;
  getEl("modalOverlay").classList.add("open");
}

function closeModal(): void {
  getEl("modalOverlay").classList.remove("open");
  getEl("modalBody").innerHTML = "";
}

(window as any).closeModal = closeModal;

// ── 10. TRANSACTION ACTIONS ───────────────────────────────────

function openAddTransactionModal(): void {
  (window as any)._txnType = "expense";
  openModal(`
    <h2>Add Transaction</h2>
    <div class="form-group">
      <label class="input-label">Type</label>
      <div class="radio-group">
        <div class="radio-option" id="typeIncome" onclick="selectType('income')">💰 Income</div>
        <div class="radio-option sel-expense" id="typeExpense" onclick="selectType('expense')">💳 Expense</div>
      </div>
    </div>
    <div class="form-group">
      <label class="input-label" for="txnName">Recipient / Sender</label>
      <input class="input-field" id="txnName" type="text" placeholder="e.g. Grocery Store" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="input-label" for="txnAmount">Amount ($)</label>
        <input class="input-field" id="txnAmount" type="number" min="0.01" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="input-label" for="txnDate">Date</label>
        <input class="input-field" id="txnDate" type="date" value="${new Date().toISOString().split("T")[0]}" />
      </div>
    </div>
    <div class="form-group">
      <label class="input-label" for="txnCategory">Category</label>
      <select class="input-field" id="txnCategory">
        <option value="food">Food & Drink</option>
        <option value="transport">Transport</option>
        <option value="entertainment">Entertainment</option>
        <option value="health">Health</option>
        <option value="shopping">Shopping</option>
        <option value="utilities">Utilities</option>
        <option value="income">Income</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-black" onclick="saveTransaction()">Save Transaction</button>
    </div>
  `);
}

(window as any).selectType = (type: TransactionType): void => {
  (window as any)._txnType = type;
  const inc = document.getElementById("typeIncome");
  const exp = document.getElementById("typeExpense");
  if (!inc || !exp) return;
  inc.className = "radio-option" + (type === "income" ? " sel-income" : "");
  exp.className = "radio-option" + (type === "expense" ? " sel-expense" : "");
};

(window as any).saveTransaction = (): void => {
  const name   = getEl<HTMLInputElement>("txnName").value.trim();
  const amount = parseFloat(getEl<HTMLInputElement>("txnAmount").value);
  const date   = getEl<HTMLInputElement>("txnDate").value;
  const cat    = getEl<HTMLSelectElement>("txnCategory").value as Category;
  const type   = ((window as any)._txnType ?? "expense") as TransactionType;

  if (!name || isNaN(amount) || amount <= 0 || !date) {
    alert("Please fill in all required fields.");
    return;
  }

  const state = loadState();
  state.transactions.push({ id: generateId(), name, amount, type, category: cat, date });
  saveState(state);
  closeModal();
  renderAll();
};

(window as any).deleteTransaction = (id: string): void => {
  if (!confirm("Delete this transaction?")) return;
  const state = loadState();
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveState(state);
  renderAll();
};

// ── 11. BUDGET ACTIONS ────────────────────────────────────────

function openAddBudgetModal(): void {
  const state = loadState();
  const used  = new Set(state.budgets.map(b => b.category));
  const opts  = (Object.keys(BUDGET_COLORS) as Category[])
    .filter(c => !used.has(c))
    .map(c => `<option value="${c}">${CATEGORY_LABEL[c]}</option>`)
    .join("");

  if (!opts) {
    openModal(`<h2>Add Budget</h2><p style="color:var(--text-2);margin-bottom:20px">Budgets set for all categories.</p><button class="btn-black" style="width:100%" onclick="closeModal()">Close</button>`);
    return;
  }

  openModal(`
    <h2>Add New Budget</h2>
    <div class="form-group">
      <label class="input-label" for="budgetCategory">Category</label>
      <select class="input-field" id="budgetCategory">${opts}</select>
    </div>
    <div class="form-group">
      <label class="input-label" for="budgetLimit">Maximum Spending ($)</label>
      <input class="input-field" id="budgetLimit" type="number" min="1" step="1" placeholder="e.g. 300" />
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-black" onclick="saveBudget()">Add Budget</button>
    </div>
  `);
}

(window as any).saveBudget = (): void => {
  const cat   = getEl<HTMLSelectElement>("budgetCategory").value as Category;
  const limit = parseFloat(getEl<HTMLInputElement>("budgetLimit").value);
  if (isNaN(limit) || limit <= 0) { alert("Enter a valid limit."); return; }
  const state = loadState();
  state.budgets.push({ id: generateId(), category: cat, limit, color: BUDGET_COLORS[cat] ?? "#888" });
  saveState(state);
  closeModal();
  renderAll();
};

(window as any).deleteBudget = (id: string): void => {
  if (!confirm("Remove this budget?")) return;
  const state = loadState();
  state.budgets = state.budgets.filter(b => b.id !== id);
  saveState(state);
  renderAll();
};

// ── 12. POT ACTIONS ───────────────────────────────────────────

function openAddPotModal(): void {
  openModal(`
    <h2>Add New Pot</h2>
    <div class="form-group">
      <label class="input-label" for="potName">Pot Name</label>
      <input class="input-field" id="potName" type="text" placeholder="e.g. Holiday Fund" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="input-label" for="potTarget">Savings Target ($)</label>
        <input class="input-field" id="potTarget" type="number" min="1" step="1" placeholder="1000" />
      </div>
      <div class="form-group">
        <label class="input-label" for="potInitial">Starting Amount ($)</label>
        <input class="input-field" id="potInitial" type="number" min="0" step="0.01" placeholder="0" value="0" />
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-black" onclick="savePot()">Add Pot</button>
    </div>
  `);
}

(window as any).savePot = (): void => {
  const name    = getEl<HTMLInputElement>("potName").value.trim();
  const target  = parseFloat(getEl<HTMLInputElement>("potTarget").value);
  const initial = parseFloat(getEl<HTMLInputElement>("potInitial").value) || 0;
  if (!name || isNaN(target) || target <= 0) { alert("Enter a name and valid target."); return; }
  const colors = ["#37b5a0","#c94f2e","#3b82f6","#8b5cf6","#f59e0b","#ec4899","#14b8a6","#f97316"];
  const state = loadState();
  state.pots.push({ id: generateId(), name, target, saved: clamp(initial, 0, target), color: colors[Math.floor(Math.random() * colors.length)] });
  saveState(state);
  closeModal();
  renderAll();
};

(window as any).openAddMoney = (id: string): void => {
  openModal(`
    <h2>Add to Pot</h2>
    <div class="form-group">
      <label class="input-label" for="potAdd">Amount to Add ($)</label>
      <input class="input-field" id="potAdd" type="number" min="0.01" step="0.01" placeholder="50" />
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-black" onclick="addMoneyToPot('${id}')">Confirm Addition</button>
    </div>
  `);
};

(window as any).addMoneyToPot = (id: string): void => {
  const amt = parseFloat(getEl<HTMLInputElement>("potAdd").value);
  if (isNaN(amt) || amt <= 0) { alert("Enter a valid amount."); return; }
  const state = loadState();
  const pot   = state.pots.find(p => p.id === id);
  if (pot) { pot.saved = clamp(pot.saved + amt, 0, pot.target); saveState(state); }
  closeModal(); renderAll();
};

(window as any).openWithdraw = (id: string): void => {
  openModal(`
    <h2>Withdraw from Pot</h2>
    <div class="form-group">
      <label class="input-label" for="potWith">Amount to Withdraw ($)</label>
      <input class="input-field" id="potWith" type="number" min="0.01" step="0.01" placeholder="50" />
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-black" onclick="withdrawFromPot('${id}')">Confirm Withdrawal</button>
    </div>
  `);
};

(window as any).withdrawFromPot = (id: string): void => {
  const amt = parseFloat(getEl<HTMLInputElement>("potWith").value);
  if (isNaN(amt) || amt <= 0) { alert("Enter a valid amount."); return; }
  const state = loadState();
  const pot   = state.pots.find(p => p.id === id);
  if (pot) { pot.saved = clamp(pot.saved - amt, 0, pot.target); saveState(state); }
  closeModal(); renderAll();
};

(window as any).deletePot = (id: string): void => {
  if (!confirm("Delete this pot?")) return;
  const state = loadState();
  state.pots = state.pots.filter(p => p.id !== id);
  saveState(state); renderAll();
};

// ── 13. BILL ACTIONS ──────────────────────────────────────────

function openAddBillModal(): void {
  openModal(`
    <h2>Add Recurring Bill</h2>
    <div class="form-group">
      <label class="input-label" for="billTitle">Bill Title</label>
      <input class="input-field" id="billTitle" type="text" placeholder="e.g. Netflix" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="input-label" for="billAmount">Amount ($)</label>
        <input class="input-field" id="billAmount" type="number" min="0.01" step="0.01" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="input-label" for="billDueDay">Due Day (1–31)</label>
        <input class="input-field" id="billDueDay" type="number" min="1" max="31" step="1" placeholder="1" />
      </div>
    </div>
    <div class="form-group">
      <label class="input-label" for="billStatus">Status</label>
      <select class="input-field" id="billStatus">
        <option value="upcoming">Upcoming</option>
        <option value="paid">Paid</option>
        <option value="due-soon">Due Soon</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Cancel</button>
      <button class="btn-black" onclick="saveBill()">Add Bill</button>
    </div>
  `);
}

(window as any).saveBill = (): void => {
  const title  = getEl<HTMLInputElement>("billTitle").value.trim();
  const amount = parseFloat(getEl<HTMLInputElement>("billAmount").value);
  const dueDay = parseInt(getEl<HTMLInputElement>("billDueDay").value, 10);
  const status = getEl<HTMLSelectElement>("billStatus").value as BillStatus;
  if (!title || isNaN(amount) || amount <= 0 || isNaN(dueDay)) { alert("Fill in all fields."); return; }
  const state = loadState();
  state.bills.push({ id: generateId(), title, amount, dueDay: clamp(dueDay, 1, 31), status });
  saveState(state); closeModal(); renderAll();
};

(window as any).deleteBill = (id: string): void => {
  if (!confirm("Delete this bill?")) return;
  const state = loadState();
  state.bills = state.bills.filter(b => b.id !== id);
  saveState(state); renderAll();
};

// ── 14. NAVIGATION ────────────────────────────────────────────

function switchView(viewId: string): void {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const view = document.getElementById(`view-${viewId}`);
  if (view) view.classList.add("active");
  const nav = document.querySelector<HTMLElement>(`[data-view="${viewId}"]`);
  if (nav) nav.classList.add("active");
}

// ── 15. EVENTS ────────────────────────────────────────────────

function bindEvents(): void {
  // Nav items
  document.querySelectorAll<HTMLAnchorElement>(".nav-item").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) switchView(view);
    });
  });

  // See details links
  document.querySelectorAll<HTMLAnchorElement>(".see-details[data-view]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const view = link.dataset.view;
      if (view) switchView(view);
    });
  });

  // Sidebar minimize
  getEl("minimizeBtn").addEventListener("click", () => {
    getEl("sidebar").classList.toggle("collapsed");
  });

  // Modal close
  getEl("modalClose").addEventListener("click", closeModal);
  getEl("modalOverlay").addEventListener("click", (e: MouseEvent) => {
    if (e.target === getEl("modalOverlay")) closeModal();
  });
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") closeModal();
  });

  // Add buttons
  getEl("openAddTxn").addEventListener("click", openAddTransactionModal);
  getEl("openAddBudget").addEventListener("click", openAddBudgetModal);
  getEl("openAddPot").addEventListener("click", openAddPotModal);
  getEl("openAddBill").addEventListener("click", openAddBillModal);

  // Logout (just resets to overview in this demo)
  getEl("logoutBtn").addEventListener("click", () => {
    switchView("overview");
  });

  // Transaction filters
  getEl("searchTxn").addEventListener("input", () => renderAllTxns(loadState()));
  getEl("filterCategory").addEventListener("change", () => { txnPage = 0; renderAllTxns(loadState()); });
  getEl("sortTxn").addEventListener("change", () => { txnPage = 0; renderAllTxns(loadState()); });

  // Pagination
  getEl("prevPage").addEventListener("click", () => { txnPage--; renderAllTxns(loadState()); });
  getEl("nextPage").addEventListener("click", () => { txnPage++; renderAllTxns(loadState()); });
}

// ── 16. INIT ──────────────────────────────────────────────────

function init(): void {
  if (!localStorage.getItem(STORAGE_KEY)) saveState(getDefaultState());
  bindEvents();
  renderAll();
}

document.addEventListener("DOMContentLoaded", init);
