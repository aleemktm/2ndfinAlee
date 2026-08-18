(function () {
  function App() {
const SETTINGS_KEY = "aleemfin_settings_v1";
const DEFAULT_SETTINGS = {
  theme: "dark",
  accentColor: "emerald",
  heroMetric: "liquid",
  dashboardCards: ["accounts", "vault", "loans", "analytics"],
  hiddenDashboardCards: [],
  liveRateSync: true,
  soundEnabled: false,
  hapticsEnabled: true,
  biometricEnabled: false,
  notificationsEnabled: false,
  loanRemindersEnabled: true,
  recurringRemindersEnabled: true,
  pinLockEnabled: false,
  pinHash: "",
  showGreeting: true,
  primaryNavIds: ["overview", "transactions", "accounts", "loans"],
  defaultCurrency: "AED",
  dateFormat: "YYYY-MM-DD",
  numberFormat: "comma",
  customCategories: {
    income: ["Salary", "Freelance", "Gift", "Other"],
    expense: ["Groceries", "Family", "Rent", "Utilities", "Transport", "Dining", "Shopping", "Other"]
  }
};
const [settings, setSettings] = useState(() => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const legacyAccent = parsed.accentColor === "rose" || parsed.accentColor === "red";
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        accentColor: legacyAccent ? "emerald" : parsed.accentColor,
        customCategories: {
          ...DEFAULT_SETTINGS.customCategories,
          ...(parsed.customCategories || {})
        }
      };
    }
  } catch (e) {}
  return DEFAULT_SETTINGS;
});
const updateSettings = partial => {
  setSettings(prev => {
    const next = {
      ...prev,
      ...partial
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  });
};
const getNativePlugin = name => {
  try {
    const cap = window.Capacitor;
    if (!cap) return null;
    if (cap.Plugins && cap.Plugins[name]) return cap.Plugins[name];
    if (typeof cap.registerPlugin === "function") return cap.registerPlugin(name);
  } catch (e) {}
  return null;
};
const isNativeAleemFin = () => {
  try {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
  } catch (e) { return false; }
};
const isStandalonePWA = () => {
  try {
    return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  } catch (e) { return false; }
};
const authenticateBiometric = async () => {
  try {
    const plugin = getNativePlugin("BiometricAuth");
    if (plugin) {
      if (typeof plugin.checkBiometry === "function") {
        const availability = await plugin.checkBiometry();
        if (availability && availability.isAvailable === false) return false;
      }
      if (typeof plugin.authenticate === "function") {
        await plugin.authenticate({ reason: "Unlock AleemFin securely." });
        return true;
      }
    }
    // Optional native WebKit bridge for the iOS host app.
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.biometricAuth) {
      window.webkit.messageHandlers.biometricAuth.postMessage({ reason: "Unlock AleemFin securely." });
      return true;
    }
  } catch (e) {
    console.warn("AleemFin biometric authentication failed", e);
  }
  return false;
};
const requestNotificationPermission = async () => {
  try {
    const plugin = getNativePlugin("LocalNotifications");
    if (isNativeAleemFin() && plugin && typeof plugin.requestPermissions === "function") {
      const result = await plugin.requestPermissions();
      const granted = result && (result.display === "granted" || result.display === "provisional");
      if (granted) return { ok: true, mode: "native" };
    }
    // iOS web notifications are supported for Home Screen web apps, not normal Safari tabs.
    if (typeof Notification !== "undefined" && isStandalonePWA()) {
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      return { ok: permission === "granted", mode: "web", permission };
    }
    return { ok: false, mode: "web", reason: "standalone-required" };
  } catch (e) {
    console.warn("AleemFin notification permission request failed", e);
    return { ok: false, mode: isNativeAleemFin() ? "native" : "web", reason: "error" };
  }
};
window.__aleemFinAuthenticateBiometric = authenticateBiometric;
window.__aleemFinRequestNotificationPermission = requestNotificationPermission;

const hashPin = async pin => {
  const value = String(pin || "");
  if (window.crypto && window.crypto.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
};
React.useEffect(() => {
  const onVisibility = () => {
    if (document.visibilityState === "visible" && (settings.pinLockEnabled && settings.pinHash || settings.biometricEnabled)) {
      setSecurityLocked(true);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
}, [settings.pinLockEnabled, settings.pinHash, settings.biometricEnabled]);

window.__aleemFinSoundEnabled = settings.soundEnabled === true;
window.__aleemFinHapticsEnabled = settings.hapticsEnabled !== false;
const safeAccentColor = ["emerald", "teal", "blue", "violet", "amber"].includes(settings.accentColor) ? settings.accentColor : "emerald";
if (settings.accentColor !== safeAccentColor) {
  try { updateSettings({ accentColor: safeAccentColor }); } catch (e) {}
}
const accent = ACCENT_PALETTE[safeAccentColor];
const cleanedPrimaryNavIds = Array.isArray(settings.primaryNavIds) ? settings.primaryNavIds.filter(id => id !== "recurring") : DEFAULT_SETTINGS.primaryNavIds;
const primaryNavIds = cleanedPrimaryNavIds.length === 4 ? cleanedPrimaryNavIds : DEFAULT_SETTINGS.primaryNavIds;
const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter(t => primaryNavIds.includes(t.id));
const MORE_NAV_ITEMS = NAV_ITEMS.filter(t => !primaryNavIds.includes(t.id));
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(t => t.id !== "settings");
const numFmt = (n, opts) => Number(n || 0).toLocaleString(settings.numberFormat === "period" ? "de-DE" : "en-US", opts);
const dateFmt = iso => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  if (settings.dateFormat === "DD/MM/YYYY") return `${d}/${m}/${y}`;
  if (settings.dateFormat === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  if (settings.dateFormat === "DD-MMM-YYYY") {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${Number(d)}-${months[Number(m) - 1]}-${y}`;
  }
  if (settings.dateFormat === "DD-MM-YYYY") return `${d}-${m}-${y}`;
  return iso;
};
const [darkMode, setDarkMode] = useState(true);
useEffect(() => {
  const resolveTheme = () => {
    if (settings.theme === "auto") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    } else {
      setDarkMode(settings.theme === "dark");
    }
  };
  resolveTheme();
  if (settings.theme === "auto" && window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => resolveTheme();
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }
}, [settings.theme]);
const [activeTab, setActiveTab] = useState(() => { try { return localStorage.getItem("aleemfin_active_tab") === "recurring" ? "planning" : "overview"; } catch (_) { return "overview"; } });
const lastNonSettingsTabRef = useRef("overview");
useEffect(() => { try { localStorage.setItem("aleemfin_active_tab", activeTab); } catch (_) {} }, [activeTab]);
useEffect(() => { if (selectedKeys.size) { selectedKeys.clear(); setSelectionVersion(v => v + 1); } }, [activeTab]);
const [insightTrendPeriod, setInsightTrendPeriod] = useState("monthly");
const [insightTrendStyle, setInsightTrendStyle] = useState("line");
const [greetingTypingStarted, setGreetingTypingStarted] = useState(false);
const [heroFlash, setHeroFlash] = useState(null);
const [heroWealthHidden, setHeroWealthHidden] = useState(() => { try { return localStorage.getItem("aleemfin_hero_wealth_hidden") === "1"; } catch (_) { return false; } });
const toggleHeroWealthVisibility = () => setHeroWealthHidden(prev => { const next = !prev; try { localStorage.setItem("aleemfin_hero_wealth_hidden", next ? "1" : "0"); } catch (_) {} return next; });
const [currency, setCurrency] = useState(() => settings.defaultCurrency || "AED");
const STORAGE_KEY = "aleemfin_data_v8";
const loadStoredData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed[key]) return parsed[key];
    }
  } catch (e) {}
  return fallback;
};
const [exchangeRates, setExchangeRates] = useState(() => loadStoredData("rates", {
  AED: 1, USD: 3.67, EUR: 4.28, GBP: 4.96, SAR: 0.98, INR: 0.044, PKR: 0.013, CAD: 2.68, AUD: 2.39
}));
const convertToAED = (amt, curr) => amt * (exchangeRates[curr] || 1);
const convertFromAED = (amtAED, targetCurr) => amtAED / (exchangeRates[targetCurr] || 1);
const convertToBaseCurrency = (amt, curr) => convertFromAED(convertToAED(amt, curr), settings.defaultCurrency || "AED");
const convertTxToAED = t => t.amount * (t.rateToAED || exchangeRates[t.currency] || 1);
const [accounts, setAccounts] = useState(() => loadStoredData("accounts", [{
  id: "1",
  name: "DIB (UAE)",
  type: "Bank",
  balance: 14500,
  currency: "AED",
  color: "#1DBF73", scope: "local"
}, {
  id: "2",
  name: "Fiverr",
  type: "Wallet",
  balance: 1250,
  currency: "USD",
  color: "#0A84FF", scope: "freelance"
}, {
  id: "3",
  name: "PayPal",
  type: "Wallet",
  balance: 850,
  currency: "USD",
  color: "#5E5CE6", scope: "freelance"
}, {
  id: "4",
  name: "UBL Pakistan",
  type: "Bank",
  balance: 25e4,
  currency: "PKR",
  color: "#FF9F0A", scope: "local"
}]));
const [assets, setAssets] = useState(() => loadStoredData("assets", [{
  id: "1",
  name: "Physical Gold (24k)",
  category: "Gold",
  weightGrams: 50,
  currency: "AED",
  purchasePriceAED: 11e3,
  currentPriceAED: 13750
}, {
  id: "2",
  name: "Downtown Apartment",
  category: "Property",
  currency: "AED",
  purchasePriceAED: 1e6,
  currentPriceAED: 12e5
}]));
const [loans, setLoans] = useState(() => loadStoredData("loans", [{
  id: "1",
  type: "lent",
  name: "Ahmad Khan",
  amount: 5e3,
  repaid: 2e3,
  currency: "AED",
  whatsapp: "+971501234567",
  dueDate: "2026-09-30"
}, {
  id: "2",
  type: "borrowed",
  name: "Family Support",
  amount: 2e4,
  repaid: 0,
  currency: "AED",
  whatsapp: "+971509876543",
  dueDate: "2026-12-31"
}]));
const [transactions, setTransactions] = useState(() => loadStoredData("transactions", [{
  id: "t1",
  title: "Monthly Salary",
  type: "income",
  category: "Salary",
  amount: 18e3,
  currency: "AED",
  accountId: "1",
  date: "2026-08-01"
}, {
  id: "t2",
  title: "Groceries",
  type: "expense",
  category: "Groceries",
  amount: 1200,
  currency: "AED",
  accountId: "1",
  date: "2026-08-03"
}, {
  id: "t3",
  title: "Wife Allowance",
  type: "expense",
  category: "Family",
  amount: 3e3,
  currency: "AED",
  accountId: "1",
  date: "2026-08-02"
}]));
const [budgets, setBudgets] = useState(() => loadStoredData("budgets", []));
const [goals, setGoals] = useState(() => loadStoredData("goals", []));
const [recurringItems, setRecurringItems] = useState(() => loadStoredData("recurringItems", []));
const [storageError, setStorageError] = useState(false);
const persistAllData = (newAccs, newAsts, newLoans, newTxns, newRates, newBudgets, newGoals, newRecurringItems) => {
  try {
    let existing = {};
    try {
      existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (e) {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accounts: newAccs,
      assets: newAsts,
      loans: newLoans,
      transactions: newTxns,
      rates: newRates || exchangeRates,
      budgets: newBudgets === void 0 ? Array.isArray(existing.budgets) ? existing.budgets : budgets : newBudgets,
      goals: newGoals === void 0 ? Array.isArray(existing.goals) ? existing.goals : goals : newGoals,
      recurringItems: newRecurringItems === void 0 ? Array.isArray(existing.recurringItems) ? existing.recurringItems : recurringItems : newRecurringItems
    }));
    if (storageError) setStorageError(false);
  } catch (e) {
    setStorageError(true);
  }
};
const [ratesModalOpen, setRatesModalOpen] = useState(false);
const [rateForm, setRateForm] = useState(() => Object.fromEntries(["USD","EUR","GBP","SAR","INR","PKR","CAD","AUD"].map(k => [k, String(exchangeRates[k] || "")] )));
const openRatesModal = () => {
  setRateForm(Object.fromEntries(["USD","EUR","GBP","SAR","INR","PKR","CAD","AUD"].map(k => [k, String(exchangeRates[k] || "")] )));
  setRatesModalOpen(true);
};
const saveRates = e => {
  e.preventDefault();
  const supported = ["USD","EUR","GBP","SAR","INR","PKR","CAD","AUD"];
  const newRates = { AED: 1 };
  for (const code of supported) { const value = Number(rateForm[code]); if (!value || value <= 0) { alert(`Please enter a valid ${code} rate.`); return; } newRates[code] = value; }
  flashHeroForRateUpdate(newRates);
  setExchangeRates(newRates);
  persistAllData(accounts, assets, loans, transactions, newRates);
  setRatesModalOpen(false);
};
useEffect(() => {
  document.documentElement.classList.toggle("dark", darkMode);
}, [darkMode]);
useEffect(() => {
  document.documentElement.dataset.afAccent = settings.accentColor || "emerald";
}, [settings.accentColor]);
const [history, setHistory] = useState([]);
const [redoStack, setRedoStack] = useState([]);
const saveStateToHistory = () => {
  setHistory(prev => [...prev.slice(-15), {
    accounts,
    assets,
    loans,
    transactions
  }]);
  setRedoStack([]);
};
const handleUndo = () => {
  if (history.length === 0) return;
  const previousState = history[history.length - 1];
  setRedoStack(prev => [{
    accounts,
    assets,
    loans,
    transactions
  }, ...prev]);
  setHistory(prev => prev.slice(0, prev.length - 1));
  setAccounts(previousState.accounts);
  setAssets(previousState.assets);
  setLoans(previousState.loans);
  setTransactions(previousState.transactions);
  persistAllData(previousState.accounts, previousState.assets, previousState.loans, previousState.transactions);
};
const handleRedo = () => {
  if (redoStack.length === 0) return;
  const nextState = redoStack[0];
  setHistory(prev => [...prev, {
    accounts,
    assets,
    loans,
    transactions
  }]);
  setRedoStack(redoStack.slice(1));
  setAccounts(nextState.accounts);
  setAssets(nextState.assets);
  setLoans(nextState.loans);
  setTransactions(nextState.transactions);
  persistAllData(nextState.accounts, nextState.assets, nextState.loans, nextState.transactions);
};
const undoLoanMovement = (loanId, movementId, legacyTransactionId) => {
  const loan = loans.find(l => l.id === loanId);
  if (!loan) return;
  let movement = (loan.movements || []).find(m => m.id === movementId);
  let linkedTx = legacyTransactionId
    ? transactions.find(t => t.id === legacyTransactionId && t.loanId === loanId)
    : transactions.find(t => t.loanId === loanId && t.movementId === movementId);

  if (!movement && linkedTx) {
    movement = {
      id: linkedTx.movementId || linkedTx.id,
      kind: linkedTx.category === "Loan Repayment" ? "repayment" : "principal",
      amount: Number(linkedTx.accountAmount != null ? linkedTx.accountAmount : linkedTx.amount) || 0,
      accountId: linkedTx.accountId,
      date: linkedTx.date
    };
  }
  if (!movement) return;

  saveStateToHistory();

  const movementAmount = Number(movement.amount || 0);
  const updatedLoans = loans.map(l => {
    if (l.id !== loanId) return l;
    if (movement.kind === "repayment") {
      return {
        ...l,
        repaid: Math.max(0, (l.repaid || 0) - movementAmount),
        movements: (l.movements || []).filter(m => m.id !== movementId && m.id !== movement.id)
      };
    }
    return {
      ...l,
      amount: Math.max(0, (l.amount || 0) - movementAmount),
      repaid: Math.min(l.repaid || 0, Math.max(0, (l.amount || 0) - movementAmount)),
      movements: (l.movements || []).filter(m => m.id !== movementId && m.id !== movement.id)
    };
  });

  let updatedAccs = accounts;
  let updatedTxns = transactions;
  if (linkedTx) {
    const delta = linkedTx.type === "income"
      ? -Number(linkedTx.accountAmount ?? linkedTx.amount ?? 0)
      : Number(linkedTx.accountAmount ?? linkedTx.amount ?? 0);
    updatedAccs = accounts.map(a => a.id === linkedTx.accountId
      ? { ...a, balance: a.balance + delta }
      : a);
    updatedTxns = transactions.filter(t => t.id !== linkedTx.id);
  }

  setLoans(updatedLoans);
  setAccounts(updatedAccs);
  setTransactions(updatedTxns);
  persistAllData(updatedAccs, assets, updatedLoans, updatedTxns, exchangeRates, budgets, goals, recurringItems);
};
const [modalOpen, setModalOpen] = useState(false);
const [modalClosing, setModalClosing] = useState(false);
const modalCloseTimerRef = useRef(null);
const [modalType, setModalType] = useState("income");
const [editingId, setEditingId] = useState(null);
const [repaymentModalLoan, setRepaymentModalLoan] = useState(null);
const [repayAmount, setRepayAmount] = useState("");
const [repayAccountId, setRepayAccountId] = useState("");
const [repayDate, setRepayDate] = useState(() => todayISO());
const [loanAddMoreTarget, setLoanAddMoreTarget] = useState(null);
const [addMoreAmount, setAddMoreAmount] = useState("");
const [addMoreAccountId, setAddMoreAccountId] = useState("");
const [addMoreDate, setAddMoreDate] = useState(() => todayISO());
const [expandedLoanHistory, setExpandedLoanHistory] = useState({});
const [ledgerSort, setLedgerSort] = useState("date_desc");
const [statementOpen, setStatementOpen] = useState(false);
const [statementAccountId, setStatementAccountId] = useState("all");
const [statementFromDate, setStatementFromDate] = useState("");
const [statementToDate, setStatementToDate] = useState("");
const [loanSort, setLoanSort] = useState("date_desc");
const [loanFilter, setLoanFilter] = useState("all");
const [deleteTarget, setDeleteTarget] = useState(null);
const [selectionVersion, setSelectionVersion] = useState(0);
const selectedKeys = window.__aleemSelection;
const clearSelection = () => { selectedKeys.clear(); setSelectionVersion(v => v + 1); };
const toggleSelection = key => { if (!key) return; if (selectedKeys.has(key)) selectedKeys.delete(key); else selectedKeys.add(key); setSelectionVersion(v => v + 1); hapticFeedback(12); };
const selectionKey = (type, id) => `${type}:${id}`;
useEffect(() => {
  const onSelect = e => toggleSelection(e.detail && e.detail.key);
  const onSelectAll = e => { selectedKeys.clear(); (e.detail && e.detail.keys || []).forEach(k => selectedKeys.add(k)); setSelectionVersion(v => v + 1); hapticFeedback(14); };
  window.addEventListener("aleem-select", onSelect);
  window.addEventListener("aleem-select-all", onSelectAll);
  return () => { window.removeEventListener("aleem-select", onSelect); window.removeEventListener("aleem-select-all", onSelectAll); };
}, []);
const currentSelectableKeys = () => {
  if (activeTab === "overview") return transactions.slice(0, 5).map(x => selectionKey("transaction", x.id));
  if (activeTab === "transactions") return filteredTransactions.map(x => selectionKey("transaction", x.id));
  if (activeTab === "accounts") return accounts.map(x => selectionKey("account", x.id));
  if (activeTab === "vault") return assets.map(x => selectionKey("asset", x.id));
  if (activeTab === "loans") return sortedLoans.map(x => selectionKey("loan", x.id));
  if (activeTab === "planning") return [...budgets.map(x => selectionKey("budget", x.id)), ...goals.map(x => selectionKey("goal", x.id))];
    return [];
};
const selectedCount = selectedKeys.size;
const selectAllCurrent = () => window.dispatchEvent(new CustomEvent("aleem-select-all", { detail: { keys: currentSelectableKeys() } }));
const editSelected = () => {
  if (selectedKeys.size !== 1) return;
  const [key] = [...selectedKeys]; const [type,id] = key.split(":");
  const list = type === "transaction" ? transactions : type === "account" ? accounts : type === "asset" ? assets : type === "loan" ? loans : type === "budget" ? budgets : type === "goal" ? goals : type === "recurring" ? recurringItems : [];
  const item = list.find(x => String(x.id) === id); if (!item) return;
  if (type === "transaction") openEditModal(item.type, item);
  else if (type === "account") openEditModal("account", item);
  else if (type === "asset") openEditModal("asset", item);
  else if (type === "loan") openEditModal("loan", item);
  else if (type === "budget") openBudgetEditor(item);
  else if (type === "goal") openGoalEditor(item);
  else if (type === "recurring") openRecurringEditor(item);
  clearSelection();
};
const bulkDeleteSelected = () => {
  const keys = [...selectedKeys]; if (!keys.length) return;
  if (!window.confirm(`Delete ${keys.length} selected item${keys.length === 1 ? "" : "s"}?`)) return;
  saveStateToHistory();
  let updatedAccs = [...accounts], updatedAsts = [...assets], updatedLoans = [...loans], updatedTxns = [...transactions];
  let updatedBudgets = [...budgets], updatedGoals = [...goals], updatedRecurring = [...recurringItems];
  const ids = (type) => new Set(keys.filter(k => k.startsWith(type+":")).map(k => k.split(":")[1]));
  const txIds = ids("transaction"); if (txIds.size) {
    updatedTxns = transactions.filter(t => !txIds.has(String(t.id)));
    transactions.filter(t => txIds.has(String(t.id))).forEach(tx => { if (tx.accountId) updatedAccs = updatedAccs.map(a => a.id === tx.accountId ? { ...a, balance: a.balance + (tx.type === "income" ? -(tx.accountAmount ?? tx.amount) : (tx.type === "expense" ? (tx.accountAmount ?? tx.amount) : 0)) } : a); });
  }
  const accountIds = ids("account"); if (accountIds.size) { updatedAccs = updatedAccs.filter(a => !accountIds.has(String(a.id))); updatedTxns = updatedTxns.filter(t => !accountIds.has(String(t.accountId)) && !accountIds.has(String(t.toAccountId))); }
  const assetIds=ids("asset"); if(assetIds.size) updatedAsts=updatedAsts.filter(a=>!assetIds.has(String(a.id)));
  const loanIds=ids("loan"); if(loanIds.size) updatedLoans=updatedLoans.filter(l=>!loanIds.has(String(l.id)));
  const budgetIds=ids("budget"); if(budgetIds.size) updatedBudgets=updatedBudgets.filter(b=>!budgetIds.has(String(b.id)));
  const goalIds=ids("goal"); if(goalIds.size) updatedGoals=updatedGoals.filter(g=>!goalIds.has(String(g.id)));
  const recurringIds=ids("recurring"); if(recurringIds.size) updatedRecurring=updatedRecurring.filter(r=>!recurringIds.has(String(r.id)));
  setAccounts(updatedAccs); setAssets(updatedAsts); setLoans(updatedLoans); setTransactions(updatedTxns); setBudgets(updatedBudgets); setGoals(updatedGoals); setRecurringItems(updatedRecurring);
  persistAllData(updatedAccs, updatedAsts, updatedLoans, updatedTxns, exchangeRates, updatedBudgets, updatedGoals, updatedRecurring);
  clearSelection();
};

const [loanView, setLoanView] = useState("lent");
const [ledgerSearch, setLedgerSearch] = useState("");
const [ledgerFilter, setLedgerFilter] = useState("all");
const [moreSheetOpen, setMoreSheetOpen] = useState(false);
const [dashboardCardsSheetOpen, setDashboardCardsSheetOpen] = useState(false);
const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
const [categoryType, setCategoryType] = useState("expense");
const [categoryName, setCategoryName] = useState("");
const [securitySheetOpen, setSecuritySheetOpen] = useState(false);
const [securityLocked, setSecurityLocked] = useState(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    return !!(saved && saved.pinLockEnabled && saved.pinHash);
  } catch (_) { return false; }
});
React.useEffect(() => {
  if (!securityLocked || !settings.biometricEnabled) return;
  let cancelled = false;
  (async () => {
    const ok = await authenticateBiometric();
    if (ok && !cancelled) {
      setSecurityLocked(false);
      hapticFeedback(18);
      actionSound("success");
    }
  })();
  return () => { cancelled = true; };
}, [securityLocked, settings.biometricEnabled]);
const [dangerAction, setDangerAction] = useState(null);
const [planningEditor, setPlanningEditor] = useState(null);
const [budgetForm, setBudgetForm] = useState({
  id: null,
  category: "Groceries",
  amount: "",
  currency: "AED"
});
const [goalForm, setGoalForm] = useState({
  id: null,
  name: "",
  targetAmount: "",
  currentAmount: "",
  currency: "AED",
  targetDate: ""
});
const [recurringEditor, setRecurringEditor] = useState(null);
const [recurringForm, setRecurringForm] = useState({
  id: null,
  type: "expense",
  title: "",
  amount: "",
  currency: "AED",
  accountId: "",
  category: "Groceries",
  frequency: "monthly",
  nextDate: todayISO()
});
const [syncingRates, setSyncingRates] = useState(false);
const [rateSyncMsg, setRateSyncMsg] = useState("");
const [syncingGold, setSyncingGold] = useState(false);
const [goldSyncMsg, setGoldSyncMsg] = useState("");
const [liveGoldAEDPerGram, setLiveGoldAEDPerGram] = useState(null);
const GOLD_HISTORY_KEY = "aleemfin_gold_history_v1";
const [goldHistory, setGoldHistory] = useState(() => { try { const saved = localStorage.getItem(GOLD_HISTORY_KEY); return Array.isArray(JSON.parse(saved)) ? JSON.parse(saved) : []; } catch (_) { return []; } });
const persistGoldHistory = next => { setGoldHistory(next); try { localStorage.setItem(GOLD_HISTORY_KEY, JSON.stringify(next)); } catch (_) {} };
const netWorthWithRates = rates => {
  const liquid = accounts.reduce((sum, account) => sum + account.balance * (rates[account.currency] || 1), 0);
  const fixedAssets = assets.reduce((sum, asset) => sum + (asset.currentPriceAED || 0) * (rates[asset.currency || "AED"] || 1), 0);
  const lent = loans.filter(loan => loan.type === "lent").reduce((sum, loan) => sum + (loan.amount - (loan.repaid || 0)) * (rates[loan.currency] || 1), 0);
  const borrowed = loans.filter(loan => loan.type === "borrowed").reduce((sum, loan) => sum + (loan.amount - (loan.repaid || 0)) * (rates[loan.currency] || 1), 0);
  return liquid + fixedAssets + lent - borrowed;
};
const flashHeroForRateUpdate = nextRates => setHeroFlash(netWorthWithRates(nextRates) >= netWorthWithRates(exchangeRates) ? "gain" : "loss");
const flashHeroForGoldRate = nextRate => {
  const goldWeight = assets.filter(asset => asset.category === "Gold" && asset.weightGrams).reduce((sum, asset) => sum + Number(asset.weightGrams), 0);
  const savedGoldRate = goldWeight > 0 ? assets.filter(asset => asset.category === "Gold" && asset.weightGrams).reduce((sum, asset) => sum + convertToAED(asset.currentPriceAED || 0, asset.currency || "AED"), 0) / goldWeight : 0;
  setHeroFlash(nextRate >= (liveGoldAEDPerGram || savedGoldRate || nextRate) ? "gain" : "loss");
};
const syncLiveExchangeRates = async () => {
  setSyncingRates(true);
  setRateSyncMsg("");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/AED");
    const json = await res.json();
    if (!json || !json.rates) throw new Error("bad response");
    const codes = ["USD","EUR","GBP","SAR","INR","PKR","CAD","AUD"];
    const newRates = { AED: 1 };
    codes.forEach(code => { if (json.rates[code]) newRates[code] = 1 / json.rates[code]; });
    if (!newRates.USD || !newRates.EUR) throw new Error("missing rates");
    flashHeroForRateUpdate(newRates);
    setExchangeRates(newRates);
    setRateForm(Object.fromEntries(Object.keys(newRates).filter(k => k !== "AED").map(k => [k, Number(newRates[k]).toFixed(4)])));
    persistAllData(accounts, assets, loans, transactions, newRates);
    setRateSyncMsg("Synced live rates just now.");
    return newRates;
  } catch (err) {
    setRateSyncMsg("Couldn't fetch live rates \u2014 check your internet connection and try again.");
    return exchangeRates;
  } finally {
    setSyncingRates(false);
  }
};
const syncLiveGoldRate = async (rates = exchangeRates) => {
  setSyncingGold(true);
  setGoldSyncMsg("");
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU");
    const json = await res.json();
    const pricePerOzUSD = json && json.price;
    if (!pricePerOzUSD) throw new Error("bad response");
    const aedPerUsd = rates.USD || 3.67;
    const aedPerGram = pricePerOzUSD * aedPerUsd / 31.1034768;
    flashHeroForGoldRate(aedPerGram);
    setLiveGoldAEDPerGram(aedPerGram);
    const goldDate = todayISO();
    const priorGold = (goldHistory || []).find(item => item.date === goldDate);
    const samples = priorGold ? Number(priorGold.samples || 1) : 0;
    const averageRate = ((priorGold ? Number(priorGold.rateAEDPerGram || 0) * samples : 0) + aedPerGram) / (samples + 1);
    const nextGoldHistory = [...(goldHistory || []).filter(item => item.date !== goldDate), { date: goldDate, rateAEDPerGram: Number(averageRate.toFixed(4)), samples: samples + 1 }].sort((a,b) => a.date.localeCompare(b.date)).slice(-180);
    persistGoldHistory(nextGoldHistory);
    setGoldSyncMsg(`Live 24k spot rate: AED ${aedPerGram.toFixed(2)} / gram`);
  } catch (err) {
    setLiveGoldAEDPerGram(null);
    setGoldSyncMsg("Couldn't fetch a live gold rate \u2014 check your internet connection and try again.");
  } finally {
    setSyncingGold(false);
  }
};
const applyLiveGoldRate = () => {
  if (!liveGoldAEDPerGram) return;
  saveStateToHistory();
  const previousGoldValue = assets.filter(a => a.category === "Gold").reduce((sum, a) => sum + convertToAED(a.currentPriceAED || 0, a.currency || "AED"), 0);
  const updated = assets.map(a => a.category === "Gold" && a.weightGrams ? {
    ...a,
    currentPriceAED: Math.round(convertFromAED(a.weightGrams * liveGoldAEDPerGram, a.currency || "AED") * 100) / 100
  } : a);
  const updatedGoldValue = updated.filter(a => a.category === "Gold").reduce((sum, a) => sum + convertToAED(a.currentPriceAED || 0, a.currency || "AED"), 0);
  setHeroFlash(updatedGoldValue >= previousGoldValue ? "gain" : "loss");
  setAssets(updated);
  persistAllData(accounts, updated, loans, transactions);
  setGoldSyncMsg(`Applied AED ${liveGoldAEDPerGram.toFixed(2)}/gram to your gold holdings.`);
};
const refreshLiveRates = async () => {
  const freshRates = await syncLiveExchangeRates();
  await syncLiveGoldRate(freshRates);
};
useEffect(() => {
  if (settings.liveRateSync !== false) refreshLiveRates();
}, [settings.liveRateSync]);
const getDefaultFormInput = (overrides = {}) => ({
  title: "",
  category: "Salary",
  amount: "",
  currency: "AED",
  accountId: (accounts[0] ? accounts[0].id : "") || "",
  toAccountId: (accounts[1] ? accounts[1].id : "") || (accounts[0] ? accounts[0].id : "") || "",
  weightGrams: "",
  purchasePriceAED: "",
  currentPriceAED: "",
  assetCategory: "Gold",
  loanType: "lent",
  whatsapp: "",
  dueDate: "",
  accType: "Bank",
  date: todayISO(),
  ...overrides
});
const [formInput, setFormInput] = useState(() => getDefaultFormInput());
const openAddModal = (type, overrides = {}) => {
  if (modalCloseTimerRef.current) clearTimeout(modalCloseTimerRef.current);
  setModalClosing(false);
  if (["income", "expense", "transfer"].includes(type) && accounts.length === 0) {
    alert("Add an account first before recording transactions.");
    setActiveTab("accounts");
    return;
  }
  if (type === "transfer" && accounts.length < 2) {
    alert("You need at least two accounts to make a transfer.");
    setActiveTab("accounts");
    return;
  }
  setEditingId(null);
  setModalType(type);
  setFormInput(getDefaultFormInput(overrides));
  setModalOpen(true);
};
const openEditModal = (type, item) => {
  if (modalCloseTimerRef.current) clearTimeout(modalCloseTimerRef.current);
  setModalClosing(false);
  setEditingId(item.id);
  setModalType(type);
  const base = getDefaultFormInput();
  if (type === "account") {
    setFormInput({
      ...base,
      title: item.name,
      amount: String(item.balance),
      currency: item.currency,
      accType: item.type || "Bank"
    });
  } else if (type === "asset") {
    setFormInput({
      ...base,
      title: item.name,
      assetCategory: item.category,
      weightGrams: item.weightGrams ? String(item.weightGrams) : "",
      currency: item.currency || "AED",
      purchasePriceAED: String(item.purchasePriceAED),
      currentPriceAED: String(item.currentPriceAED)
    });
  } else if (type === "loan") {
    setFormInput({
      ...base,
      title: item.name,
      amount: String(item.amount),
      currency: item.currency,
      loanType: item.type,
      whatsapp: item.whatsapp || "",
      dueDate: item.dueDate || ""
    });
  } else if (type === "income" || type === "expense") {
    setFormInput({
      ...base,
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      currency: item.currency,
      accountId: item.accountId,
      date: item.date
    });
  } else if (type === "transfer") {
    setFormInput({
      ...base,
      amount: String(item.amount),
      accountId: item.accountId,
      toAccountId: item.toAccountId,
      date: item.date
    });
  }
  setModalOpen(true);
};
const closeModal = () => {
  setModalOpen(false);
  setEditingId(null);
  setFormInput(getDefaultFormInput());
};
const closeMainFormModal = () => {
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 768px)").matches) {
    closeModal();
    return;
  }
  if (modalClosing) return;
  setModalClosing(true);
  if (modalCloseTimerRef.current) clearTimeout(modalCloseTimerRef.current);
  modalCloseTimerRef.current = setTimeout(() => {
    setModalOpen(false);
    setModalClosing(false);
    setEditingId(null);
    setFormInput(getDefaultFormInput());
    modalCloseTimerRef.current = null;
  }, 280);
};
const totalLiquidAED = accounts.reduce((acc, item) => acc + convertToAED(item.balance, item.currency), 0);
const totalPhysicalAED = assets.reduce((acc, item) => acc + convertToAED(item.currentPriceAED || 0, item.currency || "AED"), 0);
const goldAssets = assets.filter(item => item.category === "Gold");
const goldPurchaseAED = goldAssets.reduce((acc, item) => acc + convertToAED(item.purchasePriceAED || 0, item.currency || "AED"), 0);
const goldCurrentAED = goldAssets.reduce((acc, item) => acc + convertToAED(item.currentPriceAED || 0, item.currency || "AED"), 0);
const goldChangeAED = goldCurrentAED - goldPurchaseAED;
const goldChangePct = goldPurchaseAED > 0 ? goldChangeAED / goldPurchaseAED * 100 : null;
const goldAssetsForInsights = goldAssets.map(asset => ({ ...asset, purchaseValueBase: convertToBaseCurrency(asset.purchasePriceAED || 0, asset.currency || "AED"), currentValueBase: convertToBaseCurrency(asset.currentPriceAED || 0, asset.currency || "AED") }));
const totalLoansLentAED = loans.filter(l => l.type === "lent").reduce((acc, l) => acc + convertToAED(l.amount - (l.repaid || 0), l.currency), 0);
const totalLoansBorrowedAED = loans.filter(l => l.type === "borrowed").reduce((acc, l) => acc + convertToAED(l.amount - (l.repaid || 0), l.currency), 0);
const sortedLoans = useMemo(() => {
  const list = [...loans];
  if (loanSort === "date_asc") list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));else if (loanSort === "date_desc") list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));else if (loanSort === "amount_desc") list.sort((a, b) => b.amount - (b.repaid || 0) - (a.amount - (a.repaid || 0)));else if (loanSort === "amount_asc") list.sort((a, b) => a.amount - (a.repaid || 0) - (b.amount - (b.repaid || 0)));else if (loanSort === "name") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return list;
}, [loans, loanSort]);
const netWorthWithoutFixedAssets = totalLiquidAED + totalLoansLentAED - totalLoansBorrowedAED;
const netWorthTotal = totalLiquidAED + totalPhysicalAED + totalLoansLentAED - totalLoansBorrowedAED;
const now = /* @__PURE__ */new Date();
const currentMonthPrefix = toLocalISO(now).slice(0, 7);
const currentMonthLabel = now.toLocaleString("en-US", {
  month: "long",
  year: "numeric"
});
const todayStr = todayISO();
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = toLocalISO(tomorrow);
const recurringReminders = recurringItems.filter(item => item.active && item.nextDate === tomorrowStr && !(item.reminderDoneDates || []).includes(tomorrowStr));
const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
const monthlyIncomeAED = monthlyTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + convertTxToAED(t), 0);
const monthlyExpenseAED = monthlyTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + convertTxToAED(t), 0);
const monthlySavingsAED = monthlyIncomeAED - monthlyExpenseAED;
const savingsRate = monthlyIncomeAED > 0 ? Math.round(monthlySavingsAED / monthlyIncomeAED * 100) : null;
const emergencyRunwayMonths = monthlyExpenseAED > 0 ? (totalLiquidAED / monthlyExpenseAED).toFixed(1) : totalLiquidAED > 0 ? "12+" : "0";
const runwayMonthsNum = emergencyRunwayMonths === "12+" ? 12 : Number(emergencyRunwayMonths);
const runwayStatus = monthlyExpenseAED <= 0 ? {
  label: "No spending logged yet",
  cls: "bg-zinc-500/10 text-zinc-400"
} : runwayMonthsNum >= 6 ? {
  label: "Healthy buffer",
  cls: "bg-emerald-500/10 text-emerald-500"
} : runwayMonthsNum >= 3 ? {
  label: "Moderate buffer",
  cls: "bg-amber-500/10 text-amber-500"
} : {
  label: "Low buffer",
  cls: "bg-rose-500/10 text-rose-500"
};
const categoryBreakdown = useMemo(() => {
  const map = {};
  monthlyTransactions.filter(t => t.type === "expense").forEach(t => {
    map[t.category] = (map[t.category] || 0) + convertTxToAED(t);
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}, [monthlyTransactions, currency]);
const fmt = amtAED => {
  const converted = convertFromAED(amtAED, currency);
  return `${currency} ${numFmt(converted, {
    maximumFractionDigits: 0
  })}`;
};
const getLastInflow = accId => {
  const accountKey = String(accId);
  const inflows = transactions.filter(t => (t.type === "income" && String(t.accountId) === accountKey) || (t.type === "transfer" && String(t.toAccountId) === accountKey));
  if (inflows.length === 0) return null;
  const latest = inflows.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return latest.date >= toLocalISO(cutoff) ? latest : null;
};
const getLastOutflow = accId => {
  const accountKey = String(accId);
  const outflows = transactions.filter(t => (t.type === "expense" && String(t.accountId) === accountKey) || (t.type === "transfer" && String(t.accountId) === accountKey));
  if (outflows.length === 0) return null;
  const latest = outflows.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  return latest.date >= toLocalISO(cutoff) ? latest : null;
};
const describeAccountMovement = (tx, acc) => {
  if (tx.type === "transfer") {
    if (tx.toAccountId === acc.id) return {
      amt: tx.toAmount ?? tx.amount,
      cur: tx.toCurrency || acc.currency,
      note: " (transfer in)"
    };
    return {
      amt: tx.amount,
      cur: tx.currency,
      note: " (transfer out)"
    };
  }
  return {
    amt: tx.accountAmount ?? tx.amount,
    cur: acc.currency,
    note: ""
  };
};
const monthlyHistory = useMemo(() => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", {
      month: "short"
    });
    const txns = transactions.filter(t => t.date && t.date.startsWith(prefix));
    const inc = txns.filter(t => t.type === "income").reduce((a, t) => a + convertTxToAED(t), 0);
    const exp = txns.filter(t => t.type === "expense").reduce((a, t) => a + convertTxToAED(t), 0);
    months.push({
      key: prefix,
      label,
      inc,
      exp,
      net: inc - exp
    });
  }
  return months;
}, [transactions, exchangeRates]);
const maxMonthlyVal = Math.max(1, ...monthlyHistory.map(m => Math.max(m.inc, m.exp)));
const yearlyHistory = useMemo(() => {
  const years = [];
  for (let i = 4; i >= 0; i--) {
    const year = now.getFullYear() - i;
    const prefix = `${year}-`;
    const txns = transactions.filter(t => t.date && t.date.startsWith(prefix));
    const inc = txns.filter(t => t.type === "income").reduce((a, t) => a + convertTxToAED(t), 0);
    const exp = txns.filter(t => t.type === "expense").reduce((a, t) => a + convertTxToAED(t), 0);
    years.push({
      key: String(year),
      label: String(year),
      inc,
      exp,
      net: inc - exp
    });
  }
  return years;
}, [transactions, exchangeRates]);
const avgMonthlyNet = monthlyHistory.reduce((a, m) => a + m.net, 0) / monthlyHistory.length;
const bestMonth = monthlyHistory.reduce((best, m) => best === null || m.net > best.net ? m : best, null);
const lastFullMonth = monthlyHistory[monthlyHistory.length - 2];
const momDeltaPct = lastFullMonth && lastFullMonth.net !== 0 ? Math.round((monthlySavingsAED - lastFullMonth.net) / Math.abs(lastFullMonth.net) * 100) : null;
const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
const biggestExpenseThisMonth = monthlyTransactions.filter(t => t.type === "expense").reduce((biggest, t) => {
  const aed = convertTxToAED(t);
  return !biggest || aed > biggest.aed ? {
    ...t,
    aed
  } : biggest;
}, null);

const statementDateTime = tx => {
  const raw = tx?.recordedAt || tx?.date || "";
  const d = raw ? new Date(raw) : null;
  if (d && !Number.isNaN(d.getTime()) && tx?.recordedAt) {
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${mon}-${year} ${hh}:${mm}`;
  }
  if (tx?.date) {
    const [y,m,d2] = String(tx.date).slice(0,10).split("-");
    if (y && m && d2) {
      const month = new Date(Number(y), Number(m)-1, Number(d2)).toLocaleString("en-US", { month: "short" }).toUpperCase();
      return `${d2}-${month}-${y}`;
    }
  }
  return raw;
};
const statementSortKey = tx => tx?.recordedAt || tx?.date || "";
const accountTransactionDelta = (tx, accountId) => {
  if (!tx || !accountId) return 0;
  const aid = String(accountId);
  if (tx.type === "transfer") {
    if (String(tx.accountId) === aid) return -Number(tx.accountAmount ?? tx.amount ?? 0);
    if (String(tx.toAccountId) === aid) return Number(tx.toAmount ?? tx.amount ?? 0);
    return 0;
  }
  if (String(tx.accountId) !== aid) return 0;
  const amt = Number(tx.accountAmount ?? tx.amount ?? 0);
  return tx.type === "income" ? amt : tx.type === "expense" ? -amt : 0;
};
const statementBalanceMap = useMemo(() => {
  const map = {};
  accounts.forEach(acc => {
    const relevant = transactions.filter(tx => String(tx.accountId) === String(acc.id) || String(tx.toAccountId) === String(acc.id))
      .slice().sort((a,b) => {
        const byTime = statementSortKey(a).localeCompare(statementSortKey(b));
        return byTime || String(a.id).localeCompare(String(b.id));
      });
    let afterLater = 0;
    const balances = {};
    for (let i = relevant.length - 1; i >= 0; i--) {
      const tx = relevant[i];
      const delta = accountTransactionDelta(tx, acc.id);
      const balanceAfter = Number(acc.balance || 0) - afterLater;
      balances[String(tx.id)] = balanceAfter;
      afterLater += delta;
    }
    map[String(acc.id)] = balances;
  });
  return map;
}, [accounts, transactions]);
const getTransactionStatementMeta = tx => {
  if (!tx) return null;
  const account = accounts.find(a => String(a.id) === String(tx.accountId));
  const toAccount = tx.type === "transfer" ? accounts.find(a => String(a.id) === String(tx.toAccountId)) : null;
  const balance = account ? (statementBalanceMap[String(account.id)]?.[String(tx.id)] ?? account.balance) : null;
  const toBalance = toAccount ? (statementBalanceMap[String(toAccount.id)]?.[String(tx.id)] ?? toAccount.balance) : null;
  return { account, toAccount, balance, toBalance, dateTime: statementDateTime(tx) };
};
const statementMessageFor = (tx, accountOverride) => {
  const meta = getTransactionStatementMeta(tx);
  const account = accountOverride || meta?.account;
  if (!account) return "";
  const amount = tx.type === "transfer" && String(tx.toAccountId) === String(account.id) ? Number(tx.toAmount ?? tx.amount ?? 0) : Number(tx.accountAmount ?? tx.amount ?? 0);
  const direction = tx.type === "income" || (tx.type === "transfer" && String(tx.toAccountId) === String(account.id)) ? "to a/c" : "from a/c";
  const fromText = tx.type === "transfer" && String(tx.toAccountId) === String(account.id) && meta.account ? ` from ${meta.account.name}` : ` from ${tx.title || "Transaction"}`;
  const balance = tx.type === "transfer" && String(tx.toAccountId) === String(account.id) ? meta.toBalance : meta.balance;
  const category = tx.category || "Transaction";
  return `${category} ${account.currency} ${numFmt(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${direction} ${account.name} on ${meta.dateTime}${fromText}. Available balance is ${account.currency} ${numFmt(balance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
const exportStatement = () => {
  const from = statementFromDate || "";
  const to = statementToDate || "";
  if (from && to && from > to) {
    alert("From date must be before or equal to the To date.");
    return;
  }
  const selectedAccounts = statementAccountId === "all" ? accounts : accounts.filter(a => String(a.id) === String(statementAccountId));
  if (!selectedAccounts.length) {
    alert("Please select a valid bank account.");
    return;
  }
  const selectedIds = new Set(selectedAccounts.map(a => String(a.id)));
  const rows = [];
  transactions
    .slice()
    .sort((a,b) => {
      const byTime = statementSortKey(a).localeCompare(statementSortKey(b));
      return byTime || String(a.id).localeCompare(String(b.id));
    })
    .forEach(tx => {
      const txDate = String(tx.date || "").slice(0,10);
      if (from && txDate < from || to && txDate > to) return;
      const touched = selectedAccounts.filter(a => String(a.id) === String(tx.accountId) || String(a.id) === String(tx.toAccountId));
      touched.forEach(account => {
        const meta = getTransactionStatementMeta(tx);
        const balance = String(account.id) === String(tx.toAccountId) ? meta.toBalance : meta.balance;
        const amount = String(account.id) === String(tx.toAccountId) ? Number(tx.toAmount ?? tx.amount ?? 0) : Number(tx.accountAmount ?? tx.amount ?? 0);
        const direction = tx.type === "income" || String(account.id) === String(tx.toAccountId) ? "Credit" : "Debit";
        rows.push([
          statementDateTime(tx), tx.category || "", tx.title || "", direction,
          amount.toFixed(2), account.currency, account.name,
          Number(balance ?? 0).toFixed(2), statementMessageFor(tx, account)
        ]);
      });
    });
  const header = ["Date", "Category", "Description", "Type", "Amount", "Currency", "Account", "Available Balance", "Statement Message"];
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aleemfin_statement_${statementAccountId === "all" ? "all-accounts" : (selectedAccounts[0]?.name || "account").replace(/[^a-z0-9]+/gi,"-").toLowerCase()}_${from || "all"}_to_${to || "all"}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatementOpen(false);
};
const filteredTransactions = useMemo(() => {
  const q = ledgerSearch.trim().toLowerCase();
  const list = transactions.filter(t => {
    const matchesType = ledgerFilter === "all" || t.type === ledgerFilter;
    const accountName = accounts.find(a => String(a.id) === String(t.accountId))?.name || "";
    const toAccountName = t.type === "transfer" ? (accounts.find(a => String(a.id) === String(t.toAccountId))?.name || "") : "";
    const matchesSearch = !q || t.title.toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q) || accountName.toLowerCase().includes(q) || toAccountName.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });
  const sorted = [...list];
  if (ledgerSort === "date_asc") sorted.sort((a, b) => (a.date || "").localeCompare(b.date || ""));else if (ledgerSort === "date_desc") sorted.sort((a, b) => (b.date || "").localeCompare(a.date || ""));else if (ledgerSort === "amount_desc") sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));else if (ledgerSort === "amount_asc") sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));
  return sorted;
}, [transactions, ledgerSearch, ledgerFilter, ledgerSort]);
const handleFormSubmit = e => {
  e.preventDefault();
  const amt = Number(formInput.amount);
  if (["income", "expense", "transfer", "loan"].includes(modalType) && !(amt > 0)) {
    alert("Please enter an amount greater than zero.");
    return;
  }
  if (modalType === "asset") {
    if (Number(formInput.purchasePriceAED) < 0 || Number(formInput.currentPriceAED) < 0) {
      alert("Asset prices cannot be negative.");
      return;
    }
  }
  if (modalType === "transfer") {
    const fromAcc = accounts.find(a => a.id === formInput.accountId);
    const toAcc = accounts.find(a => a.id === formInput.toAccountId);
    if (!fromAcc || !toAcc) {
      alert("Please select valid accounts.");
      return;
    }
    if (fromAcc.id === toAcc.id) {
      alert("From and To accounts must be different.");
      return;
    }
  }
  if (["income", "expense"].includes(modalType) && !accounts.find(a => a.id === formInput.accountId)) {
    alert("Please select a valid account.");
    return;
  }
  saveStateToHistory();
  let updatedAccs = [...accounts];
  let updatedAsts = [...assets];
  let updatedLoans = [...loans];
  let updatedTxns = [...transactions];
  if (modalType === "account") {
    if (editingId) {
      const prevAcc = accounts.find(acc => acc.id === editingId);
      updatedAccs = accounts.map(acc => acc.id === editingId ? {
        ...acc,
        name: formInput.title,
        type: formInput.accType,
        color: prevAcc.color || ACCOUNT_COLORS[accounts.findIndex(a => a.id === editingId) % ACCOUNT_COLORS.length],
        balance: amt,
        currency: formInput.currency
      } : acc);
      if (prevAcc && prevAcc.currency === formInput.currency && Math.abs(amt - prevAcc.balance) > 1e-9) {
        const delta = amt - prevAcc.balance;
        const adjTx = {
          id: makeId(),
          title: `Balance adjustment: ${formInput.title}`,
          type: delta > 0 ? "income" : "expense",
          category: "Balance Adjustment",
          amount: Math.abs(delta),
          currency: formInput.currency,
          rateToAED: exchangeRates[formInput.currency] || 1,
          accountAmount: Math.abs(delta),
          accountId: editingId,
          date: todayISO(),
          recordedAt: new Date().toISOString()
        };
        updatedTxns = [adjTx, ...transactions];
        setTransactions(updatedTxns);
      }
    } else {
      updatedAccs.push({
        id: makeId(),
        name: formInput.title,
        type: formInput.accType,
        balance: amt,
        currency: formInput.currency,
        color: ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length]
      });
    }
    setAccounts(updatedAccs);
  } else if (modalType === "asset") {
    const curVal = Number(formInput.currentPriceAED) || 0;
    const purVal = Number(formInput.purchasePriceAED) || 0;
    if (editingId) {
      updatedAsts = assets.map(a => a.id === editingId ? {
        ...a,
        name: formInput.title,
        category: formInput.assetCategory,
        weightGrams: Number(formInput.weightGrams) || 0,
        currency: formInput.currency,
        purchasePriceAED: purVal,
        currentPriceAED: curVal
      } : a);
    } else {
      updatedAsts.push({
        id: makeId(),
        name: formInput.title,
        category: formInput.assetCategory,
        weightGrams: Number(formInput.weightGrams) || 0,
        currency: formInput.currency,
        purchasePriceAED: purVal,
        currentPriceAED: curVal
      });
    }
    setAssets(updatedAsts);
  } else if (modalType === "loan") {
    if (editingId) {
      updatedLoans = loans.map(l => l.id === editingId ? {
        ...l,
        type: formInput.loanType,
        name: formInput.title,
        amount: amt,
        repaid: Math.min(l.repaid || 0, amt),
        currency: formInput.currency,
        whatsapp: formInput.whatsapp,
        dueDate: formInput.dueDate
      } : l);
      setLoans(updatedLoans);
    } else {
      const newLoanId = makeId();
      const loanAcc = formInput.accountId ? accounts.find(a => a.id === formInput.accountId) : null;
      const movements = [{
        id: makeId(),
        kind: "principal",
        amount: amt,
        date: formInput.date,
        accountId: loanAcc ? loanAcc.id : null
      }];
      if (loanAcc) {
        const accAmt = convertFromAED(convertToAED(amt, formInput.currency), loanAcc.currency);
        const delta = formInput.loanType === "lent" ? -accAmt : accAmt;
        updatedAccs = accounts.map(a => a.id === loanAcc.id ? {
          ...a,
          balance: a.balance + delta
        } : a);
        setAccounts(updatedAccs);
        const loanTx = {
          id: makeId(),
          title: `${formInput.loanType === "lent" ? "Loan to" : "Loan from"} ${formInput.title}`,
          type: formInput.loanType === "lent" ? "expense" : "income",
          category: "Loan",
          amount: accAmt,
          currency: loanAcc.currency,
          rateToAED: exchangeRates[loanAcc.currency] || 1,
          accountAmount: accAmt,
          accountId: loanAcc.id,
          date: formInput.date,
          recordedAt: new Date().toISOString(),
          loanId: newLoanId
        };
        updatedTxns = [loanTx, ...transactions];
        setTransactions(updatedTxns);
      }
      updatedLoans.push({
        id: newLoanId,
        type: formInput.loanType,
        name: formInput.title,
        amount: amt,
        repaid: 0,
        currency: formInput.currency,
        whatsapp: formInput.whatsapp,
        dueDate: formInput.dueDate,
        date: formInput.date,
        movements
      });
      setLoans(updatedLoans);
    }
  } else if (modalType === "transfer") {
    const fromAcc = accounts.find(a => a.id === formInput.accountId);
    const toAcc = accounts.find(a => a.id === formInput.toAccountId);
    let accsWorking = [...accounts];
    if (editingId) {
      const oldTx = transactions.find(t => t.id === editingId);
      if (oldTx) {
        accsWorking = accsWorking.map(acc => {
          if (acc.id === oldTx.accountId) return {
            ...acc,
            balance: acc.balance + oldTx.amount
          };
          if (acc.id === oldTx.toAccountId) return {
            ...acc,
            balance: acc.balance - (oldTx.toAmount != null ? oldTx.toAmount : oldTx.amount)
          };
          return acc;
        });
      }
    }
    const convertedAmt = convertFromAED(convertToAED(amt, fromAcc.currency), toAcc.currency);
    updatedAccs = accsWorking.map(acc => {
      if (acc.id === fromAcc.id) return {
        ...acc,
        balance: acc.balance - amt
      };
      if (acc.id === toAcc.id) return {
        ...acc,
        balance: acc.balance + convertedAmt
      };
      return acc;
    });
    setAccounts(updatedAccs);
    const txPayload = {
      id: editingId || makeId(),
      title: `Transfer: ${fromAcc.name} \u2192 ${toAcc.name}`,
      type: "transfer",
      category: "Transfer",
      amount: amt,
      currency: fromAcc.currency,
      rateToAED: exchangeRates[fromAcc.currency] || 1,
      accountId: fromAcc.id,
      toAmount: convertedAmt,
      toCurrency: toAcc.currency,
      toAccountId: toAcc.id,
      date: formInput.date,
      recordedAt: editingId ? (transactions.find(t => t.id === editingId)?.recordedAt || new Date().toISOString()) : new Date().toISOString()
    };
    updatedTxns = editingId ? transactions.map(t => t.id === editingId ? txPayload : t) : [txPayload, ...transactions];
    setTransactions(updatedTxns);
  } else if (["income", "expense"].includes(modalType)) {
    const targetAcc = accounts.find(a => a.id === formInput.accountId);
    let accsWorking = [...accounts];
    if (editingId) {
      const oldTx = transactions.find(t => t.id === editingId);
      if (oldTx && oldTx.accountId) {
        const oldAccAmt = oldTx.accountAmount != null ? oldTx.accountAmount : oldTx.amount;
        accsWorking = accsWorking.map(acc => {
          if (acc.id === oldTx.accountId) {
            const revDelta = oldTx.type === "income" ? -oldAccAmt : oldAccAmt;
            return {
              ...acc,
              balance: acc.balance + revDelta
            };
          }
          return acc;
        });
      }
    }
    const accountAmt = convertFromAED(convertToAED(amt, formInput.currency), targetAcc.currency);
    const txPayload = {
      id: editingId || makeId(),
      title: formInput.title,
      type: modalType,
      category: formInput.category,
      amount: amt,
      currency: formInput.currency,
      rateToAED: exchangeRates[formInput.currency] || 1,
      accountAmount: accountAmt,
      accountId: formInput.accountId,
      date: formInput.date,
      recordedAt: editingId ? (transactions.find(t => t.id === editingId)?.recordedAt || new Date().toISOString()) : new Date().toISOString()
    };
    updatedAccs = accsWorking.map(acc => {
      if (acc.id === targetAcc.id) {
        const delta = modalType === "income" ? accountAmt : -accountAmt;
        return {
          ...acc,
          balance: acc.balance + delta
        };
      }
      return acc;
    });
    setAccounts(updatedAccs);
    updatedTxns = editingId ? transactions.map(t => t.id === editingId ? txPayload : t) : [txPayload, ...transactions];
    setTransactions(updatedTxns);
  }
  persistAllData(updatedAccs, updatedAsts, updatedLoans, updatedTxns);
  closeMainFormModal();
};
const handleRepaymentSubmit = e => {
  e.preventDefault();
  if (!repaymentModalLoan) return;
  const amt = Number(repayAmount);
  if (!(amt > 0)) {
    alert("Please enter a repayment amount greater than zero.");
    return;
  }
  const outstanding = repaymentModalLoan.amount - (repaymentModalLoan.repaid || 0);
  if (amt > outstanding + 1e-4) {
    alert(`This repayment (${repaymentModalLoan.currency} ${amt.toLocaleString()}) is more than the outstanding balance (${repaymentModalLoan.currency} ${outstanding.toLocaleString()}). Please enter an amount up to the outstanding balance.`);
    return;
  }
  saveStateToHistory();
  const loan = repaymentModalLoan;
  const repayDateVal = repayDate || todayISO();
  const repaymentMovementId = makeId();
  const updatedLoans = loans.map(l => l.id === loan.id ? {
    ...l,
    repaid: (l.repaid || 0) + amt,
    movements: [...(l.movements || []), {
      id: repaymentMovementId,
      kind: "repayment",
      amount: amt,
      date: repayDateVal,
      accountId: repayAccountId || null
    }]
  } : l);
  let updatedAccs = accounts;
  let updatedTxns = transactions;
  if (repayAccountId) {
    const acc = accounts.find(a => a.id === repayAccountId);
    if (acc) {
      const accAmt = convertFromAED(convertToAED(amt, loan.currency), acc.currency);
      const delta = loan.type === "lent" ? accAmt : -accAmt;
      updatedAccs = accounts.map(a => a.id === acc.id ? {
        ...a,
        balance: a.balance + delta
      } : a);
      const newTx = {
        id: makeId(),
        title: `${loan.type === "lent" ? "Repayment from" : "Repayment to"} ${loan.name}`,
        type: loan.type === "lent" ? "income" : "expense",
        category: "Loan Repayment",
        amount: accAmt,
        currency: acc.currency,
        rateToAED: exchangeRates[acc.currency] || 1,
        accountId: acc.id,
        date: repayDateVal,
        recordedAt: new Date().toISOString(),
        loanId: loan.id,
        movementId: repaymentMovementId
      };
      updatedTxns = [newTx, ...transactions];
    }
  }
  setLoans(updatedLoans);
  setAccounts(updatedAccs);
  setTransactions(updatedTxns);
  persistAllData(updatedAccs, assets, updatedLoans, updatedTxns);
  setRepaymentModalLoan(null);
  setRepayAmount("");
  setRepayAccountId("");
};
const handleAddMoreSubmit = e => {
  e.preventDefault();
  if (!loanAddMoreTarget) return;
  const amt = Number(addMoreAmount);
  if (!(amt > 0)) {
    alert("Please enter an amount greater than zero.");
    return;
  }
  saveStateToHistory();
  const loan = loanAddMoreTarget;
  const addDateVal = addMoreDate || todayISO();
  const addMoreMovementId = makeId();
  const updatedLoans = loans.map(l => l.id === loan.id ? {
    ...l,
    amount: l.amount + amt,
    movements: [...(l.movements || []), {
      id: addMoreMovementId,
      kind: "principal",
      amount: amt,
      date: addDateVal,
      accountId: addMoreAccountId || null
    }]
  } : l);
  let updatedAccs = accounts;
  let updatedTxns = transactions;
  if (addMoreAccountId) {
    const acc = accounts.find(a => a.id === addMoreAccountId);
    if (acc) {
      const accAmt = convertFromAED(convertToAED(amt, loan.currency), acc.currency);
      const delta = loan.type === "lent" ? -accAmt : accAmt;
      updatedAccs = accounts.map(a => a.id === acc.id ? {
        ...a,
        balance: a.balance + delta
      } : a);
      const newTx = {
        id: makeId(),
        title: `${loan.type === "lent" ? "Loan to" : "Loan from"} ${loan.name}`,
        type: loan.type === "lent" ? "expense" : "income",
        category: "Loan",
        amount: accAmt,
        currency: acc.currency,
        rateToAED: exchangeRates[acc.currency] || 1,
        accountId: acc.id,
        date: addDateVal,
        recordedAt: new Date().toISOString(),
        loanId: loan.id,
        movementId: addMoreMovementId
      };
      updatedTxns = [newTx, ...transactions];
    }
  }
  setLoans(updatedLoans);
  setAccounts(updatedAccs);
  setTransactions(updatedTxns);
  persistAllData(updatedAccs, assets, updatedLoans, updatedTxns);
  setLoanAddMoreTarget(null);
  setAddMoreAmount("");
  setAddMoreAccountId("");
};
const confirmDelete = () => {
  if (!deleteTarget) return;
  saveStateToHistory();
  let updatedAccs = [...accounts];
  let updatedAsts = [...assets];
  let updatedLoans = [...loans];
  let updatedTxns = [...transactions];
  if (deleteTarget.type === "transaction") {
    const tx = transactions.find(t => t.id === deleteTarget.id);
    if (tx) {
      if (tx.type === "transfer") {
        updatedAccs = accounts.map(acc => {
          if (acc.id === tx.accountId) return {
            ...acc,
            balance: acc.balance + tx.amount
          };
          if (acc.id === tx.toAccountId) return {
            ...acc,
            balance: acc.balance - (tx.toAmount != null ? tx.toAmount : tx.amount)
          };
          return acc;
        });
      } else if (tx.accountId) {
        const accAmt = tx.accountAmount != null ? tx.accountAmount : tx.amount;
        updatedAccs = accounts.map(acc => {
          if (acc.id === tx.accountId) {
            const revDelta = tx.type === "income" ? -accAmt : accAmt;
            return {
              ...acc,
              balance: acc.balance + revDelta
            };
          }
          return acc;
        });
      }
      setAccounts(updatedAccs);
    }
    updatedTxns = transactions.filter(t => t.id !== deleteTarget.id);
    setTransactions(updatedTxns);
  } else if (deleteTarget.type === "account") {
    const accId = deleteTarget.id;
    let accs = accounts.filter(a => a.id !== accId);
    const relatedTxns = transactions.filter(t => t.accountId === accId || t.toAccountId === accId);
    relatedTxns.forEach(t => {
      if (t.type === "transfer") {
        if (t.accountId === accId && t.toAccountId !== accId) {
          accs = accs.map(a => a.id === t.toAccountId ? {
            ...a,
            balance: a.balance - (t.toAmount ?? t.amount)
          } : a);
        } else if (t.toAccountId === accId && t.accountId !== accId) {
          accs = accs.map(a => a.id === t.accountId ? {
            ...a,
            balance: a.balance + t.amount
          } : a);
        }
      }
    });
    updatedAccs = accs;
    updatedTxns = transactions.filter(t => t.accountId !== accId && t.toAccountId !== accId);
    setAccounts(updatedAccs);
    setTransactions(updatedTxns);
  } else if (deleteTarget.type === "asset") {
    updatedAsts = assets.filter(ast => ast.id !== deleteTarget.id);
    setAssets(updatedAsts);
  } else if (deleteTarget.type === "loan") {
    updatedLoans = loans.filter(l => l.id !== deleteTarget.id);
    setLoans(updatedLoans);
  }
  persistAllData(updatedAccs, updatedAsts, updatedLoans, updatedTxns);
  setDeleteTarget(null);
};
const askDeleteAccount = acc => {
  const linkedCount = transactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id).length;
  setDeleteTarget({
    type: "account",
    id: acc.id,
    name: acc.name,
    extra: linkedCount > 0 ? `This will also remove ${linkedCount} linked transaction${linkedCount > 1 ? "s" : ""}.` : null
  });
};
const exportBackup = () => {
  const data = {
    version: 2,
    createdAt: /* @__PURE__ */new Date().toISOString(),
    accounts,
    assets,
    loans,
    transactions,
    rates: exchangeRates,
    budgets,
    goals,
    recurringItems,
    goldHistory,
    settings
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aleemfin_backup_${todayISO()}.json`;
  a.click();
};
const exportCSV = () => {
  const header = ["Date", "Title", "Type", "Category", "Amount", "Currency", "Account", "To Account", "To Amount", "To Currency"];
  const rows = transactions.map(t => {
    const acc = accounts.find(a2 => a2.id === t.accountId);
    const toAcc = t.type === "transfer" ? accounts.find(a2 => a2.id === t.toAccountId) : null;
    return [t.date, t.title, t.type, t.category, t.amount, t.currency, acc ? acc.name : "", toAcc ? toAcc.name : "", t.type === "transfer" ? t.toAmount ?? t.amount : "", t.type === "transfer" ? t.toCurrency || t.currency : ""];
  });
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v != null ? v : "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {
    type: "text/csv"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aleemfin_transactions_${todayISO()}.csv`;
  a.click();
};
const importBackup = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!parsed.accounts || !parsed.transactions) throw new Error("Invalid structure");
      if (!window.confirm("Restore this backup? It will replace the accounts, transactions, loans, assets and exchange rates currently stored on this device.")) {
        e.target.value = "";
        return;
      }
      saveStateToHistory();
      setAccounts(parsed.accounts);
      if (parsed.assets) setAssets(parsed.assets);
      if (parsed.loans) setLoans(parsed.loans);
      setTransactions(parsed.transactions);
      if (parsed.rates) setExchangeRates(parsed.rates);
      setBudgets(Array.isArray(parsed.budgets) ? parsed.budgets : []);
      setGoals(Array.isArray(parsed.goals) ? parsed.goals : []);
      setRecurringItems(Array.isArray(parsed.recurringItems) ? parsed.recurringItems : []);
      if (Array.isArray(parsed.goldHistory)) persistGoldHistory(parsed.goldHistory);
      if (parsed.settings) updateSettings({
        ...parsed.settings,
        customCategories: {
          ...DEFAULT_SETTINGS.customCategories,
          ...(parsed.settings.customCategories || {})
        }
      });
      if (parsed.settings && parsed.settings.defaultCurrency) setCurrency(parsed.settings.defaultCurrency);
      persistAllData(parsed.accounts, parsed.assets || assets, parsed.loans || loans, parsed.transactions, parsed.rates || exchangeRates, Array.isArray(parsed.budgets) ? parsed.budgets : [], Array.isArray(parsed.goals) ? parsed.goals : [], Array.isArray(parsed.recurringItems) ? parsed.recurringItems : []);
      alert("Backup restored successfully.");
    } catch (err) {
      alert("Invalid or corrupted backup file.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
};
const persistPlanning = (nextBudgets = budgets, nextGoals = goals, nextRecurringItems = recurringItems) => {
  persistAllData(accounts, assets, loans, transactions, exchangeRates, nextBudgets, nextGoals, nextRecurringItems);
};
const advanceRecurringDate = (date, frequency) => {
  const next = new Date(`${date}T12:00:00`);
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "yearly") {
    const day = next.getDate();
    next.setFullYear(next.getFullYear() + 1);
    if (next.getDate() !== day) next.setDate(0);
  } else {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 2, 0);
    next.setDate(Math.min(day, next.getDate()));
  }
  return toLocalISO(next);
};
const makeId = (prefix = "") => {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}${rand}` : rand;
};
const openBudgetEditor = (budget = null) => {
  setBudgetForm(budget ? {
    id: budget.id,
    category: budget.category,
    amount: String(budget.amount),
    currency: budget.currency
  } : {
    id: null,
    category: (settings.customCategories.expense || ["Groceries"])[0] || "Groceries",
    amount: "",
    currency
  });
  setPlanningEditor("budget");
};
const saveBudget = e => {
  e.preventDefault();
  const amount = Number(budgetForm.amount);
  if (!budgetForm.category.trim() || !(amount > 0)) {
    alert("Choose a category and enter a positive monthly budget.");
    return;
  }
  const budget = {
    id: budgetForm.id || `budget_${Date.now()}`,
    category: budgetForm.category.trim(),
    amount,
    currency: budgetForm.currency
  };
  const updated = budgetForm.id ? budgets.map(item => item.id === budgetForm.id ? budget : item) : [...budgets, budget];
  setBudgets(updated);
  persistPlanning(updated, goals, recurringItems);
  setPlanningEditor(null);
};
const deleteBudget = budget => {
  if (!window.confirm(`Remove the ${budget.category} budget? This does not affect transactions or balances.`)) return;
  const updated = budgets.filter(item => item.id !== budget.id);
  setBudgets(updated);
  persistPlanning(updated, goals, recurringItems);
};
const openGoalEditor = (goal = null) => {
  setGoalForm(goal ? {
    id: goal.id,
    name: goal.name,
    targetAmount: String(goal.targetAmount),
    currentAmount: String(goal.currentAmount),
    currency: goal.currency,
    targetDate: goal.targetDate || ""
  } : {
    id: null,
    name: "",
    targetAmount: "",
    currentAmount: "",
    currency,
    targetDate: ""
  });
  setPlanningEditor("goal");
};
const saveGoal = e => {
  e.preventDefault();
  const targetAmount = Number(goalForm.targetAmount);
  const currentAmount = Number(goalForm.currentAmount) || 0;
  if (!goalForm.name.trim() || !(targetAmount > 0) || currentAmount < 0) {
    alert("Enter a goal name, a positive target, and a valid current amount.");
    return;
  }
  const goal = {
    id: goalForm.id || `goal_${Date.now()}`,
    name: goalForm.name.trim(),
    targetAmount,
    currentAmount,
    currency: goalForm.currency,
    targetDate: goalForm.targetDate || ""
  };
  const updated = goalForm.id ? goals.map(item => item.id === goalForm.id ? goal : item) : [...goals, goal];
  setGoals(updated);
  persistPlanning(budgets, updated, recurringItems);
  setPlanningEditor(null);
};
const deleteGoal = goal => {
  if (!window.confirm(`Remove “${goal.name}”? This does not affect transactions or balances.`)) return;
  const updated = goals.filter(item => item.id !== goal.id);
  setGoals(updated);
  persistPlanning(budgets, updated, recurringItems);
};
const openRecurringEditor = (item = null) => {
  setRecurringForm(item ? {
    id: item.id,
    type: item.type,
    title: item.title,
    amount: String(item.amount),
    currency: (accounts.find(a => a.id === item.accountId) || {}).currency || item.currency || currency,
    accountId: item.accountId,
    category: item.category,
    frequency: item.frequency,
    nextDate: item.nextDate
  } : {
    id: null,
    type: "expense",
    title: "",
    amount: "",
    currency: ((accounts[0] || {}).currency || currency),
    accountId: (accounts[0] || {}).id || "",
    category: (settings.customCategories.expense || ["Groceries"])[0] || "Groceries",
    frequency: "monthly",
    nextDate: todayISO()
  });
  setRecurringEditor(true);
};
const saveRecurringItem = e => {
  e.preventDefault();
  const amount = Number(recurringForm.amount);
  if (!recurringForm.title.trim() || !(amount > 0) || !recurringForm.accountId || !recurringForm.category.trim() || !recurringForm.nextDate) {
    alert("Complete the title, amount, account, category, and next date.");
    return;
  }
  const existing = recurringItems.find(item => item.id === recurringForm.id);
  const linkedAccount = accounts.find(a => a.id === recurringForm.accountId);
  const linkedCurrency = linkedAccount && linkedAccount.currency ? linkedAccount.currency : (recurringForm.currency || currency);
  const item = {
    id: recurringForm.id || makeId("recurring_"),
    type: recurringForm.type,
    title: recurringForm.title.trim(),
    amount,
    currency: linkedCurrency,
    accountId: recurringForm.accountId,
    category: recurringForm.category.trim(),
    frequency: recurringForm.frequency,
    nextDate: recurringForm.nextDate,
    active: existing ? existing.active : true,
    recordedDates: existing ? existing.recordedDates || [] : [],
    reminderDoneDates: existing ? existing.reminderDoneDates || [] : []
  };
  const updated = existing ? recurringItems.map(entry => entry.id === item.id ? item : entry) : [...recurringItems, item];
  setRecurringItems(updated);
  persistPlanning(budgets, goals, updated);
  setRecurringEditor(null);
};
const updateRecurringItem = (item, partial) => {
  const updated = recurringItems.map(entry => entry.id === item.id ? {
    ...entry,
    ...partial
  } : entry);
  setRecurringItems(updated);
  persistPlanning(budgets, goals, updated);
};
const markRecurringReminderDone = item => {
  const updated = recurringItems.map(entry => entry.id === item.id ? {
    ...entry,
    reminderDoneDates: [...new Set([...(entry.reminderDoneDates || []), tomorrowStr])]
  } : entry);
  setRecurringItems(updated);
  persistPlanning(budgets, goals, updated);
};
const deleteRecurringItem = item => {
  if (!window.confirm(`Delete the “${item.title}” schedule? Previously recorded transactions will remain unchanged.`)) return;
  const updated = recurringItems.filter(entry => entry.id !== item.id);
  setRecurringItems(updated);
  persistPlanning(budgets, goals, updated);
};
const recordRecurringOccurrence = item => {
  const date = item.nextDate;
  if ((item.recordedDates || []).includes(date)) {
    alert("This occurrence has already been recorded.");
    return;
  }
  const account = accounts.find(entry => entry.id === item.accountId);
  if (!account) {
    alert("Choose a valid account before recording this occurrence.");
    return;
  }
  saveStateToHistory();
  const accountAmount = convertFromAED(convertToAED(item.amount, item.currency), account.currency);
  const updatedAccounts = accounts.map(entry => entry.id === account.id ? {
    ...entry,
    balance: entry.balance + (item.type === "income" ? accountAmount : -accountAmount)
  } : entry);
  const transaction = {
    id: makeId("rec_tx_"),
    title: item.title,
    type: item.type,
    category: item.category,
    amount: item.amount,
    currency: item.currency,
    rateToAED: exchangeRates[item.currency] || 1,
    accountAmount,
    accountId: account.id,
    date,
    recordedAt: new Date().toISOString(),
    recurringId: item.id,
    recurringDate: date
  };
  const updatedTransactions = [transaction, ...transactions];
  const updatedRecurring = recurringItems.map(entry => entry.id === item.id ? {
    ...entry,
    nextDate: advanceRecurringDate(date, item.frequency),
    recordedDates: [...(entry.recordedDates || []), date]
  } : entry);
  setAccounts(updatedAccounts);
  setTransactions(updatedTransactions);
  setRecurringItems(updatedRecurring);
  persistAllData(updatedAccounts, assets, loans, updatedTransactions, exchangeRates, budgets, goals, updatedRecurring);
};
const addCategory = e => {
  e.preventDefault();
  const name = categoryName.trim();
  if (!name) return;
  const existing = settings.customCategories[categoryType] || [];
  if (existing.some(item => item.toLowerCase() === name.toLowerCase())) {
    alert("That category already exists.");
    return;
  }
  updateSettings({
    customCategories: {
      ...settings.customCategories,
      [categoryType]: [...existing, name]
    }
  });
  setCategoryName("");
};
const removeCategory = (type, name) => {
  if (!window.confirm(`Remove “${name}” from ${type} categories? Existing transactions will keep their category.`)) return;
  updateSettings({
    customCategories: {
      ...settings.customCategories,
      [type]: (settings.customCategories[type] || []).filter(item => item !== name)
    }
  });
};
const openDangerAction = () => {
  setDangerAction(true);
};
const confirmDangerAction = () => {
  if (!dangerAction) return;
  const emptyData = {
    accounts: [],
    assets: [],
    loans: [],
    transactions: [],
    rates: {
      AED: 1,
      USD: 3.67,
      PKR: 0.013
    },
    budgets: [],
    goals: [],
    recurringItems: []
  };
  setAccounts(emptyData.accounts);
  setAssets(emptyData.assets);
  setLoans(emptyData.loans);
  setTransactions(emptyData.transactions);
  setExchangeRates(emptyData.rates);
  setBudgets(emptyData.budgets);
  setGoals(emptyData.goals);
  setRecurringItems(emptyData.recurringItems);
  setHistory([]);
  setRedoStack([]);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(GOLD_HISTORY_KEY);
  setSettings(DEFAULT_SETTINGS);
  setSecurityLocked(false);
  setCurrency(DEFAULT_SETTINGS.defaultCurrency);
  persistGoldHistory([]);
  setDangerAction(null);
  setActiveTab("overview");
};
const inputCls = `w-full px-3 py-2 rounded-xl text-[16px] border outline-none ${darkMode ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-zinc-50 border-zinc-200 text-zinc-900"}`;
const cardCls = `rounded-3xl border ${darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"}`;
const subCardCls = `rounded-2xl border ${darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-200"}`;
const renderTxRow = tx => {
  const isTransfer = tx.type === "transfer";
  const statementMeta = getTransactionStatementMeta(tx);
  const isInflow = tx.type === "income" || (tx.type === "transfer" && statementMeta?.toAccount && String(tx.toAccountId) === String(statementMeta.toAccount.id));
  const availableBalance = statementMeta?.account ? (isInflow && statementMeta.toBalance != null ? statementMeta.toBalance : statementMeta.balance) : null;
  const content = React.createElement("div", {
    className: `p-3.5 rounded-2xl border ${subCardCls} ledger-card-compact`
  },
    React.createElement("div", { className: "ledger-card-topline" },
      React.createElement("div", { className: "flex items-center gap-2 min-w-0" },
        React.createElement("span", { className: `tx-category-icon ${tx.type === "income" ? "tx-category-income" : tx.type === "expense" ? "tx-category-expense" : "tx-category-transfer"}`, title: tx.category, "aria-label": tx.category }, React.createElement((tx.type === "income" && String(tx.category).toLowerCase() === "other") ? window.Icons.IconArrowDown45 : (tx.type === "expense" && String(tx.category).toLowerCase() === "other") ? window.Icons.IconArrowUp45 : window.Icons.getCategoryIcon(tx.category, tx.type), { className: "w-3.5 h-3.5" })),
        React.createElement("span", { className: `tx-category-label ${tx.type === "income" ? "tx-category-income-text" : tx.type === "expense" ? "tx-category-expense-text" : "tx-category-transfer-text"}` }, tx.category),
        React.createElement("span", { className: "text-[10px] text-zinc-400 shrink-0" }, dateFmt(tx.date))
      )
    ),
    React.createElement("div", { className: "ledger-title-amount-row" },
      React.createElement("p", { className: "font-bold text-sm truncate" }, tx.title),
      React.createElement("div", { className: "ledger-amount-stack" },
        React.createElement("span", { className: `font-bold text-sm ${tx.type === "income" ? "text-emerald-500" : tx.type === "expense" ? "text-rose-500" : "text-blue-500"}` }, tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "", tx.currency, " ", numFmt(tx.amount))
      )
    ),
    React.createElement("div", { className: "ledger-card-bottomline" },
      statementMeta?.account ? React.createElement("span", { className: "ledger-account-chip" }, `${isInflow ? "to" : "from"} a/c ${statementMeta.account.name}`) : React.createElement("span", null),
      availableBalance != null ? React.createElement("span", { className: "ledger-available-balance ledger-available-right" }, `Available ${statementMeta.account.currency} ${numFmt(availableBalance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : React.createElement("span", null)
    )
  );
  if (isTransfer) return React.createElement("div", { key: tx.id, className: "swipe-row" }, React.createElement("div", { className: "swipe-content" }, content));
  return React.createElement(SwipeRow, {
    key: tx.id,
    onEdit: () => openEditModal(tx.type, tx),
    onDelete: () => setDeleteTarget({ type: "transaction", id: tx.id, name: tx.title }),
    selectionKey: selectionKey("transaction", tx.id)
  }, content);
};

const DashCard = ({
  tabId,
  cardId = tabId,
  icon: Icon,
  iconWrapCls,
  tintCls,
  label,
  big,
  bigCls,
  sub,
  chip,
  chipCls
}) => {
  const selected = Array.isArray(settings.dashboardCards) ? settings.dashboardCards : DEFAULT_SETTINGS.dashboardCards;
  if (!selected.includes(cardId) && cardId !== "analytics") return null;
  const card = selected.includes(cardId) && /* @__PURE__ */React.createElement("button", {
    onClick: () => setActiveTab(tabId),
    className: `text-left p-4 rounded-3xl border shadow-sm active:scale-[0.97] transition-transform flex flex-col gap-2 ${tintCls}`
  }, /* @__PURE__ */React.createElement("div", {
    className: "flex items-center justify-between"
  }, /* @__PURE__ */React.createElement("div", {
    className: `w-8 h-8 rounded-xl flex items-center justify-center ${iconWrapCls}`
  }, /* @__PURE__ */React.createElement(Icon, {
    className: "w-4 h-4"
  })), /* @__PURE__ */React.createElement(Icons.IconChevron, {
    className: "w-3.5 h-3.5 opacity-50"
  })), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("span", {
    className: "text-[10px] font-bold uppercase tracking-wider opacity-60 block"
  }, label), /* @__PURE__ */React.createElement("span", {
    className: `font-extrabold text-base leading-tight block mt-0.5 ${bigCls}`
  }, big), sub && /* @__PURE__ */React.createElement("span", {
    className: "text-[10px] opacity-70 mt-0.5 block"
  }, sub), chip && /* @__PURE__ */React.createElement("span", {
    className: `inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${chipCls}`
  }, chip)));
  if (cardId !== "analytics") return card;
  return /* @__PURE__ */React.createElement(React.Fragment, null, card, selected.includes("planning") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "planning",
    tabId: "planning",
    icon: Icons.IconTarget,
    iconWrapCls: "bg-emerald-500/20 text-emerald-600",
    tintCls: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 text-current",
    label: "Plans & Goals",
    big: `${budgets.length + goals.length}`,
    bigCls: "text-emerald-600",
    sub: `${budgets.length} budget${budgets.length === 1 ? "" : "s"} · ${goals.length} goal${goals.length === 1 ? "" : "s"}`
  }), selected.includes("recurring") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "recurring",
    tabId: "planning",
    icon: Icons.IconCalendar,
    iconWrapCls: "bg-blue-500/20 text-blue-600",
    tintCls: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 text-current",
    label: "Upcoming",
    big: `${recurringItems.filter(item => item.active).length}`,
    bigCls: "text-blue-600",
    sub: "Scheduled items"
  }), selected.includes("gold") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "gold",
    tabId: "vault",
    icon: Icons.IconVault,
    iconWrapCls: "bg-amber-500/20 text-amber-600",
    tintCls: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15 text-current",
    label: "24k Gold Rate",
    big: liveGoldAEDPerGram ? `AED ${liveGoldAEDPerGram.toFixed(2)}/g` : "Check live rate",
    bigCls: "text-amber-600",
    sub: liveGoldAEDPerGram ? "Today's live market benchmark" : "Tap to refresh from Assets"
  }), selected.includes("rates") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "rates",
    tabId: "rates",
    icon: Icons.IconRates,
    iconWrapCls: "bg-sky-500/20 text-sky-600",
    tintCls: "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15 text-current",
    label: "FX · AED / PKR",
    big: `1 AED = ${(1 / (exchangeRates.PKR || 0.013)).toFixed(2)} PKR`,
    bigCls: "text-sky-600",
    sub: `1 USD = AED ${(exchangeRates.USD || 3.67).toFixed(2)}`
  }), selected.includes("gold-performance") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "gold-performance",
    tabId: "vault",
    icon: Icons.IconVault,
    iconWrapCls: "bg-amber-500/20 text-amber-600",
    tintCls: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15 text-current",
    label: "Gold Performance",
    big: goldChangePct === null ? "No gold assets" : `${goldChangePct >= 0 ? "▲ +" : "▼ "}${Math.abs(goldChangePct).toFixed(1)}%`,
    bigCls: goldChangePct === null ? "text-zinc-500" : goldChangePct >= 0 ? "text-emerald-600" : "text-rose-500",
    sub: goldChangePct === null ? "Add gold assets to track it" : `${goldChangeAED >= 0 ? "Up" : "Down"} AED ${numFmt(Math.abs(goldChangeAED))} since purchase`
  }), selected.includes("runway") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "runway",
    tabId: "analytics",
    icon: Icons.IconAnalytics,
    iconWrapCls: "bg-teal-500/20 text-teal-600",
    tintCls: "bg-teal-500/10 border-teal-500/20 hover:bg-teal-500/15 text-current",
    label: "Cash Buffer",
    big: `${emergencyRunwayMonths} mo`,
    bigCls: "text-teal-600",
    sub: "At this month’s spending pace"
  }), selected.includes("spending") && /* @__PURE__ */React.createElement(DashCard, {
    cardId: "spending",
    tabId: "analytics",
    icon: Icons.IconLedger,
    iconWrapCls: "bg-rose-500/20 text-rose-500",
    tintCls: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15 text-current",
    label: "Spending Pace",
    big: fmt(monthlyExpenseAED),
    bigCls: "text-rose-500",
    sub: `${currentMonthLabel} expenses`
  }));
};
useEffect(() => {
  const timer = window.setTimeout(() => setGreetingTypingStarted(true), 2000);
  return () => window.clearTimeout(timer);
}, []);
useEffect(() => {
  document.documentElement.dataset.greetingTyping = greetingTypingStarted ? "ready" : "waiting";
  return () => delete document.documentElement.dataset.greetingTyping;
}, [greetingTypingStarted]);
useEffect(() => {
  if (!heroFlash || activeTab !== "overview") return;
  const timer = window.setTimeout(() => setHeroFlash(null), 950);
  return () => window.clearTimeout(timer);
}, [activeTab, heroFlash]);
useEffect(() => {
  document.querySelectorAll("[data-hero-flash]").forEach(node => delete node.dataset.heroFlash);
  if (activeTab !== "overview" || !heroFlash) return;
  const heroMetric = [...document.querySelectorAll("main h2")].find(node => (node.className || "").includes("text-3xl"));
  const heroCard = heroMetric && heroMetric.closest("div.p-6.rounded-3xl");
  if (heroCard) heroCard.dataset.heroFlash = heroFlash;
}, [activeTab, heroFlash]);
useEffect(() => {
  document.querySelectorAll("[data-home-recurring-reminder]").forEach(node => node.remove());
  if (activeTab !== "overview" || recurringReminders.length === 0) return;
  const greetingLine = [...document.querySelectorAll("main p")].find(node => /^(Good morning|Good afternoon|Good evening),? Aleem$/.test(node.textContent || ""));
  if (!greetingLine) return;
  if (greetingLine.firstChild) greetingLine.firstChild.textContent = (greetingLine.firstChild.textContent || "").replace(", Aleem", " Aleem");
  const reminder = document.createElement("span");
  reminder.dataset.homeRecurringReminder = "true";
  reminder.className = "inline-flex items-center gap-1.5 ml-1";
  const summary = document.createElement("span");
  summary.textContent = `— ${recurringReminders[0].title} is due tomorrow${recurringReminders.length > 1 ? ` +${recurringReminders.length - 1}` : ""}`;
  const done = document.createElement("button");
  done.type = "button";
  done.setAttribute("aria-label", "Mark recurring reminder done");
  done.title = "Mark reminder done";
  done.className = "w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 text-[11px] font-extrabold leading-none hover:bg-emerald-500 hover:text-white active:scale-95";
  done.textContent = "✓";
  done.onclick = () => recurringReminders.forEach(markRecurringReminderDone);
  reminder.append(summary, done);
  greetingLine.append(reminder);
}, [activeTab, recurringReminders, darkMode]);

useEffect(() => {
  document.querySelectorAll("[data-loan-subtabs]").forEach(node => node.remove());
  if (activeTab !== "loans") return;
  const heading = [...document.querySelectorAll("h2")].find(node => node.textContent === "Loans & Liabilities");
  const loanRoot = heading && heading.parentElement && heading.parentElement.parentElement;
  if (!loanRoot || loanRoot.children.length < 3) return;
  const list = loanRoot.children[2];
  const tabs = document.createElement("div");
  tabs.dataset.loanSubtabs = "true";
  tabs.className = `grid grid-cols-2 gap-2 p-1 rounded-2xl ${darkMode ? "bg-zinc-900" : "bg-zinc-200/70"}`;
  [["lent", "Lent-out"], ["borrowed", "Borrowed"]].forEach(([type, label]) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.textContent = label;
    tab.className = `py-2.5 rounded-xl text-xs font-bold ${loanView === type ? `${accent.activeBg} ${accent.textStrong}` : "text-zinc-400"}`;
    tab.onclick = () => setLoanView(type);
    tabs.append(tab);
  });
  loanRoot.insertBefore(tabs, list);
  let visible = 0;
  loans.forEach(loan => {
    const name = [...list.querySelectorAll("h3")].find(node => node.textContent === loan.name);
    const card = name && name.closest("div.space-y-3");
    if (!card) return;
    const show = loan.type === loanView;
    card.style.display = show ? "" : "none";
    if (show) visible += 1;
  });
  if (visible === 0) {
    const empty = document.createElement("p");
    empty.dataset.loanSubtabsEmpty = "true";
    empty.className = "text-center text-xs text-zinc-400 py-8";
    empty.textContent = loanView === "lent" ? "No lent-out entries." : "No borrowed entries.";
    list.append(empty);
  }
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    if (link.dataset.whatsappIcon) return;
    link.dataset.whatsappIcon = "true";
    link.setAttribute("aria-label", "Open WhatsApp reminder");
    link.title = "Open WhatsApp";
    link.className = "inline-flex w-7 h-7 rounded-lg bg-emerald-500 text-white items-center justify-center hover:bg-emerald-600 shrink-0";
    const loanCard = link.closest("div.space-y-3");
    const loanName = loanCard && loanCard.querySelector("h3");
    if (loanName && loanName.parentElement) {
      const titleRow = document.createElement("div");
      titleRow.className = "flex items-center gap-2";
      loanName.parentElement.insertBefore(titleRow, loanName);
      titleRow.append(loanName, link);
    }
    link.textContent = "";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("class", "w-4 h-4");
    const bubble = document.createElementNS("http://www.w3.org/2000/svg", "path");
    bubble.setAttribute("d", "M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z");
    const phone = document.createElementNS("http://www.w3.org/2000/svg", "path");
    phone.setAttribute("d", "M9.4 8.2c.3 2.4 1.7 3.8 4.1 4.1l1.2-1.2 1.5.7c.2.1.3.4.2.6l-.7 1.2c-.1.2-.4.3-.6.2-4.3-1.2-6.7-3.6-7.9-7.9-.1-.2 0-.5.2-.6l1.2-.7c.2-.1.5 0 .6.2l.7 1.5-1.2 1.2Z");
    icon.append(bubble, phone);
    link.append(icon);
  });
}, [activeTab, loanView, loans, darkMode, accent.activeBg, accent.textStrong]);
useEffect(() => {
  if (activeTab === "settings" || window.innerWidth > 767) return;
  const frame = requestAnimationFrame(() => {
    const activeButton = document.querySelector(`[data-mobile-nav-tab="${activeTab}"]`);
    const scroller = document.querySelector("[data-mobile-nav-scroll]");
    if (activeButton && scroller) activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  });
  return () => cancelAnimationFrame(frame);
}, [activeTab]);

useEffect(() => {
  if (activeTab !== "settings") {
    if (activeTab) lastNonSettingsTabRef.current = activeTab;
    return;
  }
  const main = document.querySelector("main");
  if (!main) return;
  let startX = 0;
  let startY = 0;
  let tracking = false;
  const onPointerDown = e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  };
  const onPointerUp = e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      hapticFeedback(9);
      setActiveTab(lastNonSettingsTabRef.current || "overview");
    }
  };
  main.addEventListener("pointerdown", onPointerDown, { passive: true });
  main.addEventListener("pointerup", onPointerUp, { passive: true });
  main.addEventListener("pointercancel", () => { tracking = false; }, { passive: true });
  return () => {
    main.removeEventListener("pointerdown", onPointerDown);
    main.removeEventListener("pointerup", onPointerUp);
  };
}, [activeTab]);

    const selectionToolbar = selectedCount > 0 ? React.createElement("div", { className: "selection-toolbar safe-x", role: "toolbar", "aria-label": "Selection actions" },
  React.createElement("div", { className: "selection-toolbar-inner max-w-5xl mx-auto" },
    React.createElement("button", { onClick: clearSelection, className: "selection-toolbar-button selection-toolbar-cancel", "aria-label": "Cancel selection" }, React.createElement(Icons.IconClose, { className: "w-4 h-4" })),
    React.createElement("div", { className: "selection-toolbar-title" }, `${selectedCount} selected`),
    React.createElement("button", { onClick: selectAllCurrent, className: "selection-toolbar-button", "aria-label": "Select all" }, "Select All"),
    selectedCount === 1 && React.createElement("button", { onClick: editSelected, className: "selection-toolbar-button", "aria-label": "Edit selected" }, React.createElement(Icons.IconEdit, { className: "w-4 h-4" })),
    React.createElement("button", { onClick: bulkDeleteSelected, className: "selection-toolbar-button selection-toolbar-delete", "aria-label": "Delete selected" }, React.createElement(Icons.IconTrash, { className: "w-4 h-4" }))
  )
) : null;
const dashboardCardOptions = [
  { id: "accounts", label: "Accounts" }, { id: "vault", label: "Assets" },
  { id: "loans", label: "Lent" }, { id: "analytics", label: "Month Snapshot" },
  { id: "planning", label: "Plans" }, { id: "recurring", label: "Upcoming" },
  { id: "gold", label: "24k Gold Rate" }, { id: "rates", label: "FX Rates" },
  { id: "gold-performance", label: "Gold Performance" }, { id: "runway", label: "Cash Buffer" },
  { id: "spending", label: "Spending Pace" }
];
const selectedDashboardCardsForSheet = Array.isArray(settings.dashboardCards) && settings.dashboardCards.length <= 4 ? settings.dashboardCards : DEFAULT_SETTINGS.dashboardCards;
const toggleDashboardCardForSheet = id => {
  if (selectedDashboardCardsForSheet.includes(id)) updateSettings({ dashboardCards: selectedDashboardCardsForSheet.filter(cardId => cardId !== id) });
  else if (selectedDashboardCardsForSheet.length < 4) updateSettings({ dashboardCards: [...selectedDashboardCardsForSheet, id] });
};
const tabProps = { selectionToolbar, selectionVersion, selectionKey, selectedKeys, toggleSelection, selectedCount, clearSelection, selectAllCurrent,  DEFAULT_SETTINGS, DashCard, MORE_NAV_ITEMS, accent, accounts, activeTab, addCategory, addMoreAccountId, addMoreAmount, addMoreDate, advanceRecurringDate, applyLiveGoldRate, askDeleteAccount, assets, avgMonthlyNet, bestMonth, biggestExpenseThisMonth, budgetForm, budgets, cardCls, categoryBreakdown, categoryManagerOpen, categoryName, categoryType, closeModal, confirmDangerAction, confirmDelete, convertFromAED, convertToBaseCurrency, convertTxToAED, currency, currentMonthLabel, dangerAction, darkMode, dateFmt, deleteBudget, deleteGoal, deleteRecurringItem, deleteTarget, describeAccountMovement, editingId, emergencyRunwayMonths, exchangeRates, expandedLoanHistory, exportBackup, exportCSV, filteredTransactions, fmt, exportStatement, getTransactionStatementMeta, statementMessageFor, statementOpen, setStatementOpen, statementAccountId, setStatementAccountId, statementFromDate, setStatementFromDate, statementToDate, setStatementToDate, formInput, getLastInflow, getLastOutflow, goalForm, goals, goldAssets: goldAssetsForInsights, goldHistory, goldChangeAED, goldChangePct, goldSyncMsg, greeting, handleAddMoreSubmit, handleFormSubmit, heroWealthHidden, toggleHeroWealthVisibility, handleRepaymentSubmit, undoLoanMovement, importBackup, inputCls, insightTrendPeriod, insightTrendStyle, ledgerFilter, ledgerSearch, ledgerSort, liveGoldAEDPerGram, loanAddMoreTarget, loanFilter, loanSort, loans, maxMonthlyVal, modalType, modalClosing, closeMainFormModal, momDeltaPct, monthlyExpenseAED, monthlyHistory, monthlyIncomeAED, monthlySavingsAED, monthlyTransactions, netWorthTotal, numFmt, openAddModal, openBudgetEditor, openDangerAction, openEditModal, openGoalEditor, openRatesModal, openRecurringEditor, planningEditor, rateForm, rateSyncMsg, recordRecurringOccurrence, recurringEditor, recurringForm, recurringItems, refreshLiveRates, removeCategory, renderTxRow, repayAccountId, repayAmount, repayDate, repaymentModalLoan, runwayStatus, saveBudget, saveGoal, saveRates, saveRecurringItem, savingsRate, setActiveTab, setAddMoreAccountId, setAddMoreAmount, setAddMoreDate, setBudgetForm, setCategoryManagerOpen, setCategoryName, setCategoryType, setCurrency, setDangerAction, securitySheetOpen, setSecuritySheetOpen, securityLocked, setSecurityLocked, hashPin, authenticateBiometric, setDeleteTarget, setExpandedLoanHistory, setFormInput, setGoalForm, setInsightTrendPeriod, setInsightTrendStyle, setLedgerFilter, setLedgerSearch, setLedgerSort, setLoanAddMoreTarget, setLoanFilter, setLoanSort, setMoreSheetOpen, setPlanningEditor, setRateForm, setRatesModalOpen, setRecurringEditor, setRecurringForm, setRepayAccountId, setRepayAmount, setRepayDate, setRepaymentModalLoan, settings, sortedLoans, subCardCls, dashboardCardOptions, selectedDashboardCardsForSheet, toggleDashboardCardForSheet, dashboardCardsSheetOpen, setDashboardCardsSheetOpen, syncLiveExchangeRates, syncLiveGoldRate, syncingGold, syncingRates, todayISO, todayStr, totalLiquidAED, totalLoansBorrowedAED, totalLoansLentAED, totalPhysicalAED, transactions, updateRecurringItem, updateSettings, yearlyHistory };

    return (
      /* @__PURE__ */React.createElement("div", {
      className: `min-h-screen transition-colors duration-300 pb-24 md:pb-8 flex flex-col ${darkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-100/80 text-zinc-900"}`
    }, /* @__PURE__ */React.createElement("header", {
      className: `sticky top-0 z-40 backdrop-blur-xl border-b safe-top ${darkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200"}`
    }, /* @__PURE__ */React.createElement("div", {
      className: "max-w-5xl mx-auto px-4 h-16 flex items-center justify-between safe-x"
    }, /* @__PURE__ */React.createElement("div", {
      className: "flex items-center space-x-2 min-w-0"
    }, /* @__PURE__ */React.createElement("div", {
      className: `p-2 bg-gradient-to-tr ${accent.grad} rounded-2xl text-white shadow-md shadow-emerald-500/20`
    }, /* @__PURE__ */React.createElement("svg", {
      className: "w-5 h-5",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /* @__PURE__ */React.createElement("path", {
      d: "M21 12V7H5a2 2 0 0 1 0-4h14v4"
    }), /* @__PURE__ */React.createElement("path", {
      d: "M3 5v14a2 2 0 0 0 2 2h16v-5"
    }), /* @__PURE__ */React.createElement("path", {
      d: "M18 12a2 2 0 0 0 0 4h4v-4Z"
    }))), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("h1", {
      className: "font-bold text-base leading-tight tracking-tight truncate"
    }, "AleemFin"), /* @__PURE__ */React.createElement("p", {
      className: `text-[10px] truncate ${darkMode ? "text-zinc-400" : "text-zinc-500"}`
    }, "Wealth ", /* @__PURE__ */React.createElement("span", {
      className: "opacity-60"
    }, "\u2014 Created by Aleem")))), /* @__PURE__ */React.createElement("nav", {
      className: "hidden md:flex items-center space-x-1 p-1 rounded-2xl border bg-zinc-900/90 border-zinc-700/50"
    }, NAV_ITEMS.map(tab => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return /* @__PURE__ */React.createElement("button", {
        key: tab.id,
        onClick: () => setActiveTab(tab.id),
        className: `flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${isActive ? `bg-zinc-800 ${accent.text400} shadow-sm` : "text-zinc-400 hover:text-white"}`
      }, /* @__PURE__ */React.createElement(Icon, {
        className: "w-3.5 h-3.5"
      }), /* @__PURE__ */React.createElement("span", null, tab.label));
    })), /* @__PURE__ */React.createElement("div", {
      className: "flex items-center space-x-2"
    }, /* @__PURE__ */React.createElement("button", {
      onClick: handleUndo,
      disabled: history.length === 0,
      title: "Undo",
      className: `min-w-[44px] min-h-[44px] p-2.5 rounded-2xl border text-xs disabled:opacity-30 ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}`
    }, /* @__PURE__ */React.createElement(Icons.IconUndo, {
      className: "w-4 h-4"
    })), /* @__PURE__ */React.createElement("button", {
      onClick: handleRedo,
      disabled: redoStack.length === 0,
      title: "Redo",
      className: `min-w-[44px] min-h-[44px] p-2.5 rounded-2xl border text-xs disabled:opacity-30 ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}`
    }, /* @__PURE__ */React.createElement(Icons.IconRedo, {
      className: "w-4 h-4"
    })), /* @__PURE__ */React.createElement("button", {
      onClick: exportBackup,
      title: "Backup (JSON)",
      className: `p-2 rounded-xl border text-xs ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}`
    }, /* @__PURE__ */React.createElement(Icons.IconDownload, {
      className: "w-4 h-4"
    })), /* @__PURE__ */React.createElement("label", {
      className: `p-2 rounded-xl border text-xs cursor-pointer ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}`,
      title: "Restore backup"
    }, /* @__PURE__ */React.createElement(Icons.IconUpload, {
      className: "w-4 h-4"
    }), /* @__PURE__ */React.createElement("input", {
      type: "file",
      accept: ".json",
      onChange: importBackup,
      className: "hidden"
    })), /* @__PURE__ */React.createElement("button", {
      onClick: () => setDarkMode(!darkMode),
      className: `p-2 rounded-xl border ${darkMode ? "bg-zinc-900 border-zinc-800 text-amber-400" : "bg-white border-zinc-200 text-zinc-600"}`
    }, darkMode ? /* @__PURE__ */React.createElement(Icons.IconSun, {
      className: "w-4 h-4"
    }) : /* @__PURE__ */React.createElement(Icons.IconMoon, {
      className: "w-4 h-4"
    }))))), storageError && /* @__PURE__ */React.createElement("div", {
      className: "bg-rose-600 text-white text-xs font-semibold text-center py-2 px-4 safe-x"
    }, "Couldn't save your last change to this device's storage (it may be full or in private-browsing mode). Please export a backup soon so nothing is lost."), activeTab !== "overview" && selectionToolbar,
    React.createElement("main", {
      className: "max-w-5xl mx-auto px-4 py-5 sm:py-6 space-y-5 sm:space-y-6 flex-1 w-full safe-x"
    }, activeTab === "overview" && Tabs.Overview(tabProps), activeTab === "transactions" && Tabs.Ledger(tabProps), activeTab === "accounts" && Tabs.Accounts(tabProps), activeTab === "vault" && Tabs.Vault(tabProps), activeTab === "loans" && Tabs.Loans(tabProps), activeTab === "analytics" && Tabs.Analytics(tabProps), activeTab === "analytics" && Tabs.AnalyticsSummary(tabProps), activeTab === "planning" && Tabs.Planning(tabProps), activeTab === "rates" && React.createElement(Tabs.Rates, tabProps), activeTab === "settings" && Tabs.Settings(tabProps)), /* @__PURE__ */React.createElement("nav", {
      className: "md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t safe-bottom bg-zinc-900/95 border-zinc-800",
      style: {
        position: "fixed"
      }
    }, /* @__PURE__ */React.createElement("div", {
      className: "mobile-bottom-bar max-w-5xl mx-auto px-2 py-1.5 h-[74px] safe-x"
    }, /* @__PURE__ */React.createElement("div", {
      className: "mobile-nav-swipe",
      "data-mobile-nav-scroll": "true"
    }, MOBILE_NAV_ITEMS.filter(tab => tab.id !== "settings").map(tab => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return /* @__PURE__ */React.createElement("button", {
        key: tab.id,
        onClick: () => {
          setActiveTab(tab.id);
          setMoreSheetOpen(false);
        },
        "data-mobile-nav-tab": tab.id,
        className: `mobile-nav-tab flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 ${isActive ? "mobile-nav-tab-active" : "text-zinc-400 hover:text-zinc-200"}`
      }, /* @__PURE__ */React.createElement("div", {
        className: `flex items-center justify-center w-9 h-9 rounded-xl mb-1 ${isActive ? "mobile-nav-icon-active" : ""}`
      }, /* @__PURE__ */React.createElement(Icon, {
        className: "w-5 h-5"
      })), /* @__PURE__ */React.createElement("span", {
        className: "text-[10px] leading-none"
      }, tab.label));
    })), /* @__PURE__ */React.createElement("div", {
      className: "mobile-settings-fixed"
    }, (() => {
      const tab = NAV_ITEMS.find(item => item.id === "settings");
      const Icon = tab.icon;
      const isActive = activeTab === "settings";
      return /* @__PURE__ */React.createElement("button", {
        onClick: () => {
          setActiveTab("settings");
          setMoreSheetOpen(false);
        },
        "data-mobile-nav-tab": "settings",
        "aria-label": "Settings",
        title: "Settings",
        className: `mobile-nav-tab mobile-settings-tab flex flex-col items-center justify-center rounded-2xl transition-all active:scale-95 ${isActive ? "mobile-nav-tab-active settings-nav-active font-bold" : "text-zinc-400 hover:text-zinc-200"}`
      }, /* @__PURE__ */React.createElement("div", {
        className: `flex items-center justify-center w-9 h-9 rounded-xl mb-1 ${isActive ? "mobile-nav-icon-active settings-nav-active-icon" : ""}`
      }, /* @__PURE__ */React.createElement(Icon, {
        className: "w-5 h-5"
      })), /* @__PURE__ */React.createElement("span", {
        className: "text-[10px] leading-none"
      }, "Settings"));
    })()))),
moreSheetOpen && React.createElement(Modals.MoreSheet, tabProps), dashboardCardsSheetOpen && React.createElement(Modals.DashboardCardsSheet, tabProps), categoryManagerOpen && React.createElement(Modals.CategoryManagerSheet, tabProps), securitySheetOpen && React.createElement(Modals.SecuritySheet, tabProps), deleteTarget && Modals.DeleteConfirm(tabProps), ratesModalOpen && Modals.RatesModal(tabProps), repaymentModalLoan && Modals.RepaymentModal(tabProps), loanAddMoreTarget && Modals.LoanAddMoreModal(tabProps), modalOpen && React.createElement(Modals.MainFormModal, tabProps), securityLocked && React.createElement(Modals.SecurityLockOverlay, tabProps))
    );
  }

  window.AleemFinApp = window.AleemFinApp || {};
  window.AleemFinApp.App = App;
})();
