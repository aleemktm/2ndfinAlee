// tabs/accounts.js — Accounts tab. Wallet-style gradient cards; tap to expand
// and reveal the latest transactions affecting that account.
(function () {
  const h = React.createElement;

  function Accounts(props) {
    const { accounts, askDeleteAccount, darkMode, dateFmt, describeAccountMovement, getLastInflow, getLastOutflow, numFmt, openAddModal, openEditModal, selectionKey, settings, convertToBaseCurrency, transactions = [] } = props;
    const baseCurrency = settings?.defaultCurrency || "AED";
    const [expandedId, setExpandedId] = React.useState(null);
    const [stackOpen, setStackOpen] = React.useState(false);
    const accountColor = acc => {
      const name = String(acc.name || "").toLowerCase();
      if (name.includes("fiverr")) return "#3B82F6";
      if (name.includes("paypal")) return "#6366F1";
      if (name.includes("ubl")) return "#F59E0B";
      if (name.includes("dib")) return "#1DBF73";
      if (name.includes("cash") || String(acc.type || "").toLowerCase() === "cash") return "#8E8E93";
      return acc.color || "#1DBF73";
    };
    const total = accounts.reduce((sum, a) => sum + convertToBaseCurrency(Number(a.balance || 0), a.currency), 0);

    const accountTransactions = accId => {
      const key = String(accId);
      return transactions
        .filter(t => t && (String(t.accountId) === key || String(t.toAccountId) === key))
        .slice()
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 8);
    };

    return h("div", { className: "accounts-native space-y-4 max-w-2xl mx-auto w-full" },
      h("section", { className: `accounts-header-card ${darkMode ? "accounts-header-dark" : ""}` },
        h("div", { className: "accounts-header-top" },
          h("div", null,
            h("span", { className: "accounts-eyebrow" }, "YOUR MONEY"),
            h("h2", { className: "accounts-title" }, "Accounts"),
            h("p", { className: "accounts-subtitle" }, `${accounts.length} account${accounts.length === 1 ? "" : "s"} · ${accounts.length ? "All balances in your account currencies" : "Add an account to get started"}`)
          ),
          h("button", { onClick: () => openAddModal("account"), className: "accounts-add-button", "aria-label": "Add account" }, h(Icons.IconPlus, { className: "w-4 h-4" }), h("span", null, "Add"))
        ),
        accounts.length > 0 && h("div", { className: "accounts-total-row" },
          h("span", null, "Combined balance"),
          h("strong", null, baseCurrency, " ", numFmt(total))
        )
      ),
      h("div", { className: "accounts-list" }, accounts.map(acc => {
        const inflow = getLastInflow(acc.id);
        const outflow = getLastOutflow(acc.id);
        const inflowInfo = inflow ? describeAccountMovement(inflow, acc) : null;
        const outflowInfo = outflow ? describeAccountMovement(outflow, acc) : null;
        const color = accountColor(acc);
        const isExpanded = expandedId === acc.id;
        const history = isExpanded ? accountTransactions(acc.id).slice(0, 3) : [];
        return h(window.SwipeRow, {
          key: acc.id,
          className: `account-swipe-row ${stackOpen ? "accounts-stack-open" : ""} ${isExpanded ? "account-row-expanded" : ""}`,
          onEdit: () => openEditModal("account", acc),
          onDelete: () => askDeleteAccount(acc),
          selectionKey: selectionKey("account", acc.id)
        },
          h("div", {
            className: `account-wallet-card ${isExpanded ? "is-expanded" : ""}`,
            style: {
              "--account-color": color,
              "--stack-index": accounts.indexOf(acc)
            },
            onClick: () => {
              if (!stackOpen) {
                setStackOpen(true);
                setExpandedId(null);
                return;
              }
              setExpandedId(isExpanded ? null : acc.id);
            },
            role: "button",
            tabIndex: 0,
            "aria-expanded": isExpanded,
            "aria-label": `${acc.name} account card, tap to ${isExpanded ? "collapse" : "view recent transactions"}`
          },
            h("div", { className: "account-wallet-sheen" }),
            h("div", { className: "account-wallet-main" },
              h("div", { className: "account-wallet-details" },
                h("div", { className: "account-wallet-top" },
                  h("div", { className: "account-wallet-identity" },
                    h("span", { className: "account-wallet-icon" }, acc.type === "Bank" ? h(Icons.IconAccounts, { className: "w-4 h-4" }) : h(Icons.IconWallet, { className: "w-4 h-4" })),
                    h("div", { className: "account-wallet-name-block" },
                      h("h3", { className: "account-wallet-name" }, acc.name),
                      h("span", { className: "account-wallet-type" }, acc.type || "Bank Account")
                    )
                  )
                ),
                h("div", { className: "account-wallet-meta" },
                  h("span", null, acc.currency),
                  h("span", null, isExpanded ? "Tap to collapse" : "Tap for activity")
                )
              ),
              h("div", { className: "account-wallet-balance-side" },
                h("span", { className: "account-wallet-currency" }, acc.currency),
                h("strong", { className: "account-wallet-balance" }, numFmt(acc.balance))
              )
            ),
            h("div", { className: "account-wallet-expand", "aria-hidden": !isExpanded },
              h("div", { className: "account-wallet-expand-inner" },
                h("div", { className: "account-wallet-expand-head" }, h("span", null, "Recent activity")),
                history.length === 0
                  ? h("p", { className: "account-wallet-empty" }, "No transactions recorded for this account yet.")
                  : h("div", { className: "account-wallet-tx-list" }, history.slice(0, 4).map(tx => {
                      const isIn = (tx.type === "income" && String(tx.accountId) === String(acc.id)) || (tx.type === "transfer" && String(tx.toAccountId) === String(acc.id));
                      const info = describeAccountMovement(tx, acc);
                      return h("div", { key: tx.id, className: "account-wallet-tx-row" },
                        isIn ? h(Icons.IconArrowUp45, { className: "w-4 h-4 account-wallet-tx-in" }) : h(Icons.IconArrowDown45, { className: "w-4 h-4 account-wallet-tx-out" }),
                        h("div", { className: "min-w-0 flex-1" },
                          h("span", null, tx.category || (tx.type === "transfer" ? "Transfer" : tx.type)),
                          h("small", null, dateFmt(tx.date), info.note || "")
                        ),
                        h("strong", { className: isIn ? "account-wallet-tx-in" : "account-wallet-tx-out" }, isIn ? "+" : "-", info.cur, " ", numFmt(info.amt))
                      );
                    }))
              )
            )
          )
        )
      }))
    );
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Accounts = Accounts;
})();
