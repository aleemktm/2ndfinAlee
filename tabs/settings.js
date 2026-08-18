// tabs/settings.js — Settings tab, originally renderSettings() (SettingsSection
// and SettingsRow are bundled in since they were only ever used here).
(function () {
  function Settings(props) {
    const { DEFAULT_SETTINGS, accent, accounts, addCategory, assets, budgets, categoryManagerOpen, categoryName, categoryType, confirmDangerAction, currency, dangerAction, darkMode, exchangeRates, exportBackup, exportCSV, goals, importBackup, inputCls, loans, openDangerAction, openRatesModal, recurringItems, removeCategory, setCategoryManagerOpen, setCategoryName, setCategoryType, setCurrency, setDangerAction, settings, subCardCls, transactions, updateSettings, dashboardCardsSheetOpen, setDashboardCardsSheetOpen, securitySheetOpen, setSecuritySheetOpen } = props;
    const SettingsSection = ({
    title,
    children,
    tone = "text-zinc-500"
  }) => /* @__PURE__ */React.createElement("section", {
    className: "settings-section space-y-2"
  }, /* @__PURE__ */React.createElement("h3", {
    className: `text-[10px] font-bold uppercase tracking-wider px-1 ${tone}`
  }, title), children);
    const SettingsRow = ({
    icon: Icon,
    title,
    detail,
    children,
    danger = false
  }) => /* @__PURE__ */React.createElement("div", {
    className: `settings-row ${danger ? "settings-row-danger" : ""} ${subCardCls} flex items-center gap-3`
  }, Icon && /* @__PURE__ */React.createElement("div", {
    className: `settings-icon w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${danger ? "bg-rose-500/10 text-rose-500" : `${accent.activeBg10} ${accent.textStrong}`}`
  }, /* @__PURE__ */React.createElement(Icon, {
    className: "w-4 h-4"
  })), /* @__PURE__ */React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /* @__PURE__ */React.createElement("p", {
    className: `text-xs font-bold ${danger ? "text-rose-500" : ""}`
  }, title), detail && /* @__PURE__ */React.createElement("p", {
    className: "text-[10px] text-zinc-400 mt-0.5 leading-relaxed"
  }, detail)), children && /* @__PURE__ */React.createElement("div", {
    className: "shrink-0"
  }, children));
    const h = React.createElement;
    const IOSSwitch = ({ checked, onChange, label }) => h("button", { type: "button", role: "switch", "aria-checked": checked, "aria-label": label, onClick: onChange, className: `ios-settings-switch ${checked ? "is-on" : "is-off"}` }, h("span", { className: "ios-settings-switch-thumb" }));
    const enableNotifications = async () => {
      if (settings.notificationsEnabled === true) {
        updateSettings({ notificationsEnabled: false });
        return;
      }
      const request = window.__aleemFinRequestNotificationPermission;
      if (typeof request !== "function") {
        alert("Notifications are not available in this version of AleemFin.");
        return;
      }
      const result = await request();
      if (result && result.ok) {
        updateSettings({ notificationsEnabled: true });
      } else if (result && result.reason === "standalone-required") {
        alert("On iPhone, web notifications work when AleemFin is installed on the Home Screen. Open AleemFin from its Home Screen icon and try again.");
      } else {
        alert("AleemFin could not get notification permission. If Notifications are already blocked, open iPhone Settings and allow them for AleemFin.");
      }
    };
    const nativeApp = (() => { try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); } catch (e) { return false; } })();
    const standalonePWA = (() => { try { return !!((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true); } catch (e) { return false; } })();
    const biometricsAvailable = nativeApp;
    const dataSize = new Blob([JSON.stringify({
    accounts,
    assets,
    loans,
    transactions,
    rates: exchangeRates,
    budgets,
    goals,
    recurringItems
  })]).size;
    const dataSizeLabel = dataSize < 1024 ? `${dataSize} bytes` : `${(dataSize / 1024).toFixed(1)} KB`;
    const categories = settings.customCategories || DEFAULT_SETTINGS.customCategories;
    const dashboardOptions = [{
    id: "accounts",
    label: "Accounts"
  }, {
    id: "vault",
    label: "Assets"
  }, {
    id: "loans",
    label: "Lent"
  }, {
    id: "analytics",
    label: "Month Snapshot"
  }, {
    id: "planning",
    label: "Plans"
  }, {
    id: "recurring",
    label: "Upcoming"
  }, {
    id: "gold",
    label: "24k Gold Rate"
  }, {
    id: "rates",
    label: "FX Rates"
  }, {
    id: "gold-performance",
    label: "Gold Performance"
  }, {
    id: "runway",
    label: "Cash Buffer"
  }, {
    id: "spending",
    label: "Spending Pace"
  }];
    const selectedDashboardCards = Array.isArray(settings.dashboardCards) && settings.dashboardCards.length <= 4 ? settings.dashboardCards : DEFAULT_SETTINGS.dashboardCards;
    const toggleDashboardCard = id => {
    if (selectedDashboardCards.includes(id)) updateSettings({
      dashboardCards: selectedDashboardCards.filter(cardId => cardId !== id)
    });else if (selectedDashboardCards.length < 4) updateSettings({
      dashboardCards: [...selectedDashboardCards, id]
    });
  };
    return h(React.Fragment, null, h("div", {
    className: "settings-native"
  }, h("div", {
    className: "settings-hero"
  }, h("h2", {
    className: `text-sm font-bold uppercase tracking-wider ${accent.textStrong}`
  }, "Settings"), h("p", {
    className: "text-xs text-zinc-400 mt-1"
  }, "Preferences and data stored on this device.")), h(SettingsSection, {
    title: "Appearance"
  }, h(SettingsRow, {
    icon: Icons.IconTune,
    title: "Theme",
    detail: "Choose how AleemFin looks on this device."
  }, h("select", {
    value: settings.theme,
    onChange: e => updateSettings({
      theme: e.target.value
    }),
    className: `${inputCls} w-auto py-2 text-xs font-bold`
  }, h("option", {
    value: "light"
  }, "Light"), h("option", {
    value: "dark"
  }, "Dark"), h("option", {
    value: "auto"
  }, "System")))), h(SettingsSection, {
    title: "Accent color"
  }, h("div", {
    className: "settings-accent-picker",
    role: "radiogroup",
    "aria-label": "Accent color"
  }, [
    ["emerald", "#0F9D68", "Emerald"],
    ["teal", "#0E8F8C", "Ocean"],
    ["blue", "#2E63E7", "Sapphire"],
    ["violet", "#6E4FDE", "Plum"],
    ["amber", "#C4791C", "Copper"]
  ].map(([id, color, label]) => h("button", {
    key: id,
    type: "button",
    role: "radio",
    "aria-checked": settings.accentColor === id,
    "aria-label": label,
    title: label,
    onClick: () => updateSettings({ accentColor: id }),
    className: `settings-accent-option ${settings.accentColor === id ? "is-selected" : ""}`
  }, h("span", {
    className: "settings-accent-swatch",
    style: { backgroundColor: color }
  }), h("span", {
    className: "settings-accent-label"
  }, label)))
  )), h(SettingsSection, {
    title: "Home dashboard"
  }, h("button", {
    type: "button",
    onClick: () => setDashboardCardsSheetOpen(true),
    className: `w-full text-left ${subCardCls} p-4 rounded-2xl border transition-all active:scale-[0.99]`
  }, h("div", {
    className: "flex items-center justify-between gap-3"
  }, h("div", {
    className: "min-w-0"
  }, h("p", {
    className: "text-xs font-bold"
  }, "Choose four cards"), h("p", {
    className: "text-[10px] text-zinc-400 mt-0.5 leading-relaxed"
  }, `${selectedDashboardCards.length}/4 selected · Customize your Home dashboard cards.`)), h("div", {
    className: `shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${accent.activeBg10} ${accent.textStrong}`
  }, `${selectedDashboardCards.length}/4`)), h("div", {
    className: "mt-3 flex flex-wrap gap-1.5"
  }, selectedDashboardCards.map(id => {
    const option = dashboardOptions.find(item => item.id === id);
    return option ? h("span", {
      key: id,
      className: `px-2.5 py-1 rounded-lg text-[10px] font-semibold ${darkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`
    }, option.label) : null;
  }))))
, h(SettingsSection, {
    title: "Home appearance"
  }, h("div", { className: "space-y-2" },
    h(SettingsRow, {
      icon: Icons.IconWallet,
      title: "Hero card metric",
      detail: "Choose the main wealth figure shown at the top of Home."
    }, h("select", {
      value: settings.heroMetric || "liquid",
      onChange: e => updateSettings({ heroMetric: e.target.value }),
      className: `${inputCls} w-auto py-2 text-xs font-bold`
    }, h("option", { value: "liquid" }, "Available wealth"), h("option", { value: "networth" }, "Net worth"))),
    h(SettingsRow, {
      icon: Icons.IconTune,
      title: "Greeting",
      detail: "Show the personalized greeting above the Home hero card."
    }, IOSSwitch({ checked: settings.showGreeting !== false, onChange: () => updateSettings({ showGreeting: settings.showGreeting === false }), label: "Home greeting" }))
  ))
, h(SettingsSection, {
    title: "Formats"
  }, h("div", { className: "space-y-2" },
    h(SettingsRow, {
      icon: Icons.IconTune,
      title: "Date format",
      detail: "Choose how dates are displayed throughout AleemFin."
    }, h("select", {
      value: settings.dateFormat || "YYYY-MM-DD",
      onChange: e => updateSettings({ dateFormat: e.target.value }),
      className: `${inputCls} w-auto py-2 text-xs font-bold`
    },
      h("option", { value: "YYYY-MM-DD" }, "2026-12-01"),
      h("option", { value: "MM/DD/YYYY" }, "12/1/2026"),
      h("option", { value: "DD/MM/YYYY" }, "1/12/2026"),
      h("option", { value: "DD-MMM-YYYY" }, "1-Dec-2026"),
      h("option", { value: "DD-MM-YYYY" }, "1-12-2026")
    )),
    h(SettingsRow, {
      icon: Icons.IconTune,
      title: "Number format",
      detail: "Use commas or periods as thousands separators."
    }, h("select", {
      value: settings.numberFormat || "comma",
      onChange: e => updateSettings({ numberFormat: e.target.value }),
      className: `${inputCls} w-auto py-2 text-xs font-bold`
    }, h("option", { value: "comma" }, "1,234,567.89"), h("option", { value: "period" }, "1.234.567,89")))
  ))
, h(SettingsSection, {
    title: "Rates & sync"
  }, h(SettingsRow, {
    icon: Icons.IconRates,
    title: "Automatic FX rate sync",
    detail: "Refresh exchange rates automatically when AleemFin is opened."
  }, IOSSwitch({ checked: settings.liveRateSync !== false, onChange: () => updateSettings({ liveRateSync: settings.liveRateSync === false }), label: "Automatic FX rate sync" })))
, h(SettingsSection, {
    title: "Currency"
  }, h("div", {
    className: "space-y-2"
  }, h(SettingsRow, {
    icon: Icons.IconWallet,
    title: "Base currency",
    detail: "Used for summaries and dashboard totals."
  }, h("select", {
    value: currency,
    onChange: e => {
      setCurrency(e.target.value);
      updateSettings({
        defaultCurrency: e.target.value
      });
    },
    className: `${inputCls} w-auto py-2 text-xs font-bold`
  }, h("option", {value:"AED"}, "AED · UAE Dirham"), h("option", {value:"USD"}, "USD · US Dollar"), h("option", {value:"EUR"}, "EUR · Euro"), h("option", {value:"GBP"}, "GBP · Pound"), h("option", {value:"SAR"}, "SAR · Saudi Riyal"), h("option", {value:"INR"}, "INR · Indian Rupee"), h("option", {value:"PKR"}, "PKR · Pakistani Rupee"), h("option", {value:"CAD"}, "CAD · Canadian Dollar"), h("option", {value:"AUD"}, "AUD · Australian Dollar"))))), h(SettingsSection, {
    title: "Data & backup"
  }, h("div", {
    className: "space-y-2"
  }, h(SettingsRow, {
    icon: Icons.IconDownload,
    title: "Backup data",
    detail: `${accounts.length} accounts · ${transactions.length} transactions · ${budgets.length} budgets · ${goals.length} goals · ${dataSizeLabel}`
  }, h("button", {
    onClick: exportBackup,
    className: `px-3 py-2 rounded-xl text-xs font-bold ${accent.solidBtn} text-white`
  }, "Backup")), h(SettingsRow, {
    icon: Icons.IconUpload,
    title: "Restore data",
    detail: "Replace this device’s data with a previous AleemFin backup."
  }, h("label", {
    className: "px-3 py-2 rounded-xl text-xs font-bold bg-zinc-500/10 text-zinc-500 cursor-pointer"
  }, "Restore", h("input", {
    type: "file",
    accept: ".json",
    onChange: importBackup,
    className: "hidden"
  }))), h(SettingsRow, {
    icon: Icons.IconCSV,
    title: "Export transactions",
    detail: "Download your ledger as a CSV file."
  }, h("button", {
    onClick: exportCSV,
    className: "px-3 py-2 rounded-xl text-xs font-bold bg-zinc-500/10 text-zinc-500"
  }, "Export")))), h(SettingsSection, {
    title: "Categories"
  }, h("div", {
    className: "space-y-2"
  }, h(SettingsRow, {
    icon: Icons.IconTag,
    title: "Manage categories",
    detail: `${(categories.income || []).length} income and ${(categories.expense || []).length} expense categories.`
  }, h("button", {
    onClick: () => setCategoryManagerOpen(true),
    className: `px-3 py-2 rounded-xl text-xs font-bold ${accent.activeBg10} ${accent.textStrong}`
  }, "Manage")))), h(SettingsSection, {
    title: "Interaction"
  }, h("div", { className: "space-y-2" },
    h(SettingsRow, { icon: Icons.IconTune, title: "Haptic feedback", detail: "Use subtle haptics for taps, selections and important actions." }, IOSSwitch({ checked: settings.hapticsEnabled !== false, onChange: () => updateSettings({ hapticsEnabled: settings.hapticsEnabled === false }), label: "Haptic feedback" })),
    h(SettingsRow, { icon: Icons.IconTune, title: "Action sounds", detail: "Play a very subtle sound for taps and destructive actions." }, IOSSwitch({ checked: settings.soundEnabled === true, onChange: () => updateSettings({ soundEnabled: settings.soundEnabled !== true }), label: "Action sounds" }))
  )), h(SettingsSection, { title: "Notifications" }, h("div", { className: "space-y-2" },
    h(SettingsRow, { icon: Icons.IconSettings, title: "Notifications", detail: settings.notificationsEnabled ? "AleemFin notifications are allowed on this device." : standalonePWA ? "Allow AleemFin to send reminders and important updates." : "Install AleemFin on the iPhone Home Screen to enable web notifications." }, IOSSwitch({ checked: settings.notificationsEnabled === true, onChange: enableNotifications, label: "Notifications" })),
    h(SettingsRow, { icon: Icons.IconSettings, title: "Loan reminders", detail: "Remind you about upcoming loan repayments." }, IOSSwitch({ checked: settings.loanRemindersEnabled !== false, onChange: () => updateSettings({ loanRemindersEnabled: settings.loanRemindersEnabled === false }), label: "Loan reminders" })),
    h(SettingsRow, { icon: Icons.IconSettings, title: "Recurring reminders", detail: "Remind you about recurring entries when they are due." }, IOSSwitch({ checked: settings.recurringRemindersEnabled !== false, onChange: () => updateSettings({ recurringRemindersEnabled: settings.recurringRemindersEnabled === false }), label: "Recurring reminders" }))
  ))
, h(SettingsSection, { title: "Security" }, h("div", { className: "space-y-2" },
    h(SettingsRow, { icon: Icons.IconSettings, title: "Biometrics", detail: settings.biometricEnabled ? "Face ID / Touch ID is enabled for app unlock." : biometricsAvailable ? "Tap the switch to authenticate with Face ID / Touch ID and enable app unlock." : "Face ID / Touch ID is available in the native iOS app. Safari/PWA cannot access the native biometric plugin." }, IOSSwitch({ checked: settings.biometricEnabled === true, onChange: async () => {
      if (!biometricsAvailable) { alert("Face ID / Touch ID is available when you run AleemFin as the native iOS app. Safari and the PWA cannot use AleemFin's native biometric plugin."); return; }
      if (settings.biometricEnabled === true) { updateSettings({ biometricEnabled: false }); return; }
      const ok = await (typeof window.__aleemFinAuthenticateBiometric === "function" ? window.__aleemFinAuthenticateBiometric() : false);
      if (ok) updateSettings({ biometricEnabled: true });
      else alert("Face ID / Touch ID could not be enabled. Check that Face ID is set up and AleemFin has permission to use it.");
    }, label: "Biometrics" })),
    h(SettingsRow, { icon: Icons.IconSettings, title: "PIN Lock", detail: settings.pinLockEnabled ? "Enabled · App locks when it becomes inactive." : "Protect AleemFin with a local PIN." }, h("button", { type: "button", onClick: () => setSecuritySheetOpen(true), className: `px-3 py-2 rounded-xl text-xs font-bold ${settings.pinLockEnabled ? "bg-emerald-500/15 text-emerald-600" : "bg-zinc-500/10 text-zinc-500"}` }, settings.pinLockEnabled ? "Manage" : "Set Up")))), h(SettingsSection, {
    title: "App"
  }, h("div", {
    className: "settings-plain-info"
  }, h("div", null, h("span", null, "App name"), h("strong", null, "AleemFin")), h("div", null, h("span", null, "Version"), h("strong", null, "1.0.0 · Personal prototype")), h("div", null, h("span", null, "Device storage"), h("strong", null, `${dataSizeLabel} used by your finance data. Data stays on this device.`)))), h(SettingsSection, {
    title: "Danger zone",
    tone: "text-rose-500"
  }, h("div", {
    className: "space-y-2"
  }, h(SettingsRow, {
    icon: Icons.IconTrash,
    title: "Erase all data",
    detail: "Permanently remove all accounts, transactions, loans, assets and preferences from this device.",
    danger: true
  }, h("button", {
    onClick: () => openDangerAction(),
    className: "px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white"
  }, "Erase"))))), dangerAction && h("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
  }, h("div", {
    className: `w-full max-w-xs rounded-3xl border p-5 shadow-2xl space-y-4 ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`
  }, h("div", {
    className: "w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center"
  }, h(Icons.IconTrash, {
    className: "w-5 h-5"
  })), h("div", {
    className: "space-y-1"
  }, h("h3", {
    className: "font-bold text-sm"
  }, "Erase all data?"), h("p", {
    className: "text-xs text-zinc-400 leading-relaxed"
  }, "This will permanently remove your accounts, transactions, loans, assets and all AleemFin preferences from this device. This can't be undone unless you have a backup.")), h("div", {
    className: "pt-1 flex justify-end gap-2"
  }, h("button", {
    type: "button",
    onClick: () => setDangerAction(null),
    className: `px-3.5 py-2 rounded-xl text-xs font-semibold border ${darkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-200 hover:bg-zinc-100"}`
  }, "Cancel"), h("button", {
    type: "button",
    onClick: confirmDangerAction,
    className: "px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold"
  }, "Erase")))));
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Settings = Settings;
})();
