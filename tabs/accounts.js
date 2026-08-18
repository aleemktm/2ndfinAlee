// tabs/accounts.js — Accounts tab. Stacked bank cards with iOS-style depth.
// Financial data, calculations and existing edit/delete actions remain unchanged.
(function () {
  const h = React.createElement;

  function Accounts(props) {
    const {
      accounts,
      askDeleteAccount,
      darkMode,
      dateFmt,
      describeAccountMovement,
      numFmt,
      openAddModal,
      openEditModal,
      selectionKey,
      settings,
      convertToBaseCurrency,
      transactions = []
    } = props;

    const baseCurrency = settings?.defaultCurrency || "AED";
    const [stackExpanded, setStackExpanded] = React.useState(false);
    const [activityId, setActivityId] = React.useState(null);
    const [sortMode, setSortMode] = React.useState("default");
    const stackPointer = React.useRef({ x: 0, y: 0, active: false, moved: false });

    const accountColor = acc => {
      if (acc.color) return acc.color;
      const name = String(acc.name || "").toLowerCase();
      if (name.includes("fiverr")) return "#3B82F6";
      if (name.includes("paypal")) return "#6366F1";
      if (name.includes("ubl")) return "#F59E0B";
      if (name.includes("dib")) return "#1DBF73";
      if (name.includes("cash") || String(acc.type || "").toLowerCase() === "cash") return "#8E8E93";
      return "#1DBF73";
    };

    const total = accounts.reduce(
      (sum, a) => sum + convertToBaseCurrency(Number(a.balance || 0), a.currency),
      0
    );

    const accountTransactions = accId => {
      const key = String(accId);
      return transactions
        .filter(t => t && (String(t.accountId) === key || String(t.toAccountId) === key))
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 3);
    };

    const expandStack = () => {
      setStackExpanded(true);
      setActivityId(null);
    };

    const handleStackPointerDown = e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      stackPointer.current = {
        x: e.clientX,
        y: e.clientY,
        active: true,
        moved: false
      };
    };

    const handleStackPointerMove = e => {
      if (!stackPointer.current.active) return;
      const dx = e.clientX - stackPointer.current.x;
      const dy = e.clientY - stackPointer.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) stackPointer.current.moved = true;
    };

    const handleStackPointerUp = () => {
      if (!stackPointer.current.active) return;
      const moved = stackPointer.current.moved;
      stackPointer.current.active = false;
      if (!stackExpanded && moved) expandStack();
    };

    React.useEffect(() => {
      if (!accounts.some(acc => String(acc.id) === String(activityId))) setActivityId(null);
      if (!accounts.length) {
        setStackExpanded(false);
        setActivityId(null);
      }
    }, [accounts.length, activityId]);

    const displayAccounts = React.useMemo(() => {
      const list = accounts.slice();
      if (sortMode === "name") return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      if (sortMode === "balance-desc") return list.sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
      if (sortMode === "balance-asc") return list.sort((a, b) => Number(a.balance || 0) - Number(b.balance || 0));
      if (sortMode === "type") return list.sort((a, b) => String(a.type || "").localeCompare(String(b.type || "")) || String(a.name || "").localeCompare(String(b.name || "")));
      return list;
    }, [accounts, sortMode]);

    return h(
      "div",
      { className: "accounts-native space-y-4 max-w-2xl mx-auto w-full" },
      h(
        "section",
        { className: `accounts-header-card ${darkMode ? "accounts-header-dark" : ""}` },
        h(
          "div",
          { className: "accounts-header-top" },
          h(
            "div",
            null,
            h("span", { className: "accounts-eyebrow" }, "YOUR MONEY"),
            h("h2", { className: "accounts-title" }, "Accounts"),
            h(
              "p",
              { className: "accounts-subtitle" },
              `${accounts.length} account${accounts.length === 1 ? "" : "s"} · ${accounts.length ? "All balances in your account currencies" : "Add an account to get started"}`
            )
          ),
          h(
            "button",
            {
              onClick: () => openAddModal("account"),
              className: "accounts-add-button",
              "aria-label": "Add account",
              type: "button"
            },
            h(Icons.IconPlus, { className: "w-4 h-4" }),
            h("span", null, "Add")
          ),
          h(
            "label",
            { className: "accounts-sort-control", title: "Sort account cards" },
            h(Icons.IconFilter, { className: "w-3.5 h-3.5" }),
            h(
              "select",
              { value: sortMode, onChange: e => { setSortMode(e.target.value); setActivityId(null); setStackExpanded(false); }, "aria-label": "Sort account cards" },
              h("option", { value: "default" }, "Default"),
              h("option", { value: "name" }, "Name"),
              h("option", { value: "balance-desc" }, "Balance: High"),
              h("option", { value: "balance-asc" }, "Balance: Low"),
              h("option", { value: "type" }, "Type")
            )
          )
        ),
        accounts.length > 0 &&
          h(
            "div",
            { className: "accounts-total-row" },
            h("span", null, "Combined balance"),
            h("strong", null, baseCurrency, " ", numFmt(total))
          )
      ),
      accounts.length > 0 &&
        h(
          "div",
          {
            className: `accounts-stack ${stackExpanded ? "is-expanded" : "is-stacked"}`,
            style: { "--account-count": accounts.length },
            "data-account-stack": "true",
            onPointerDown: handleStackPointerDown,
            onPointerMove: handleStackPointerMove,
            onPointerUp: handleStackPointerUp,
            onPointerCancel: () => {
              stackPointer.current.active = false;
            }
          },
          displayAccounts.map((acc, index) => {
            const color = accountColor(acc);
            const isActivityOpen = String(activityId) === String(acc.id);
            const history = isActivityOpen ? accountTransactions(acc.id) : [];

            const openActivity = e => {
              e.stopPropagation();
              if (!stackExpanded) {
                expandStack();
                return;
              }
              setActivityId(isActivityOpen ? null : acc.id);
            };

            const card = h(
              "div",
              {
                className: `account-wallet-card ${isActivityOpen ? "has-activity" : ""}`,
                style: {
                  "--account-color": color,
                  "--stack-index": index
                },
                onClick: openActivity,
                role: "button",
                tabIndex: 0,
                "aria-expanded": isActivityOpen,
                "aria-label": `${acc.name} account card, tap to ${isActivityOpen ? "hide recent transactions" : "view recent transactions"}`
              },
              h("div", { className: "account-wallet-sheen" }),
              h(
                "div",
                { className: "account-wallet-main" },
                h(
                  "div",
                  { className: "account-wallet-details" },
                  h(
                    "div",
                    { className: "account-wallet-name-row" },
                    h("span", { className: "account-wallet-dot", style: { background: color } }),
                    h("h3", { className: "account-wallet-name" }, acc.name)
                  ),
                  h(
                    "div",
                    { className: "account-wallet-meta" },
                    h("span", null, acc.type || "Bank Account"),
                    h("span", null, acc.currency),
                    h("span", null, isActivityOpen ? "Tap to close activity" : "Tap for activity")
                  )
                ),
                h(
                  "div",
                  { className: "account-wallet-balance-block" },
                  h("span", { className: "account-wallet-currency" }, acc.currency),
                  h("strong", { className: "account-wallet-balance" }, numFmt(acc.balance))
                )
              )
            );

            const activity = h(
              "div",
              {
                className: `account-activity-card ${isActivityOpen ? "is-visible" : ""}`,
                "aria-hidden": !isActivityOpen
              },
              h(
                "div",
                { className: "account-activity-head" },
                h("span", null, "Recent activity"),
                h("small", null, history.length ? `Latest ${history.length}` : "No activity")
              ),
              history.length === 0
                ? h("p", { className: "account-activity-empty" }, "No transactions recorded for this account yet.")
                : h(
                    "div",
                    { className: "account-activity-list" },
                    history.map(tx => {
                      const isIn =
                        (tx.type === "income" && String(tx.accountId) === String(acc.id)) ||
                        (tx.type === "transfer" && String(tx.toAccountId) === String(acc.id));
                      const info = describeAccountMovement(tx, acc);
                      const FlowIcon = isIn ? Icons.IconArrowDown45 : Icons.IconArrowUp45;
                      return h(
                        "div",
                        { key: tx.id, className: "account-activity-row" },
                        h(
                          "span",
                          { className: `account-activity-flow ${isIn ? "is-in" : "is-out"}` },
                          h(FlowIcon, { className: "w-4 h-4" })
                        ),
                        h(
                          "div",
                          { className: "account-activity-copy" },
                          h("span", null, tx.category || (tx.type === "transfer" ? "Transfer" : tx.type)),
                          h("small", null, dateFmt(tx.date), info.note || "")
                        ),
                        h(
                          "strong",
                          { className: isIn ? "account-activity-amount is-in" : "account-activity-amount is-out" },
                          isIn ? "+" : "-",
                          info.cur,
                          " ",
                          numFmt(info.amt)
                        )
                      );
                    })
                  )
            );

            return h(
              window.SwipeRow,
              {
                key: acc.id,
                onEdit: () => openEditModal("account", acc),
                onDelete: () => askDeleteAccount(acc),
                selectionKey: selectionKey("account", acc.id)
              },
              h(
                "div",
                {
                  className: "account-stack-item",
                  style: { "--stack-index": index },
                  "data-account-card-index": index
                },
                activity,
                card
              )
            );
          })
        )
    );
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Accounts = Accounts;
})();
