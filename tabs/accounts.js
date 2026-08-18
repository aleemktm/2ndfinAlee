// tabs/accounts.js — Accounts tab.
(function () {
  const h = React.createElement;

  function Accounts(props) {
    const { accounts, askDeleteAccount, darkMode, dateFmt, describeAccountMovement, getLastInflow, getLastOutflow, numFmt, openAddModal, openEditModal, selectionKey, settings, convertToBaseCurrency, transactions = [] } = props;
    const baseCurrency = settings?.defaultCurrency || "AED";
    const [expandedAccounts, setExpandedAccounts] = React.useState({});
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
        const accountTransactions = transactions.filter(t => {
          if (!t) return false;
          return String(t.accountId || "") === String(acc.id) ||
            String(t.fromAccountId || "") === String(acc.id) ||
            String(t.toAccountId || "") === String(acc.id);
        }).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 5);
        const isExpanded = !!expandedAccounts[acc.id];
        return h(window.SwipeRow, {
          key: acc.id,
          onEdit: () => openEditModal("account", acc),
          onDelete: () => askDeleteAccount(acc),
          selectionKey: selectionKey("account", acc.id)
        }, h("div", {
          className: `account-native-card ${darkMode ? "account-native-dark" : ""} ${isExpanded ? "is-expanded" : ""}`, style: { "--af-account-color": accountColor(acc) },
          role: "button",
          tabIndex: 0,
          onClick: () => setExpandedAccounts(prev => ({ ...prev, [acc.id]: !prev[acc.id] })),
          onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedAccounts(prev => ({ ...prev, [acc.id]: !prev[acc.id] })); } }
        },
          h("div", { className: "account-card-head" },
            h("div", { className: "account-identity" },
              h("div", { className: "account-heading" },
                h("span", { className: "account-type" }, acc.type || "Bank Account"),
                h("div", { className: "account-title-row" },
                  h("span", { className: "account-icon", "aria-hidden": "true" }, String(acc.type || "").toLowerCase().indexOf("cash") >= 0 || String(acc.type || "").toLowerCase().indexOf("wallet") >= 0 ? h(Icons.IconWallet, { className: "w-4 h-4" }) : h(Icons.IconAccounts, { className: "w-4 h-4" })),
                  h("h3", { className: "account-name" }, acc.name)
                )
              )
            ),
            h("div", { className: "account-balance-block" },
              h("span", { className: "account-currency" }, acc.currency),
              h("strong", { className: "account-balance" }, numFmt(acc.balance))
            ),
            h("span", { className: `account-expand-chevron ${isExpanded ? "is-open" : ""}`, "aria-hidden": "true" }, "⌄")
          ),
          h("div", { className: "account-card-meta" },
            h("span", null, acc.currency),
            h("span", null, acc.type || "Account")
          ),
          (inflowInfo || outflowInfo) && h("div", { className: "account-flow-list" },
            inflowInfo && h("div", { className: "account-flow-row account-flow-income" },
              h(Icons.IconInflow, { className: "w-4 h-4 account-flow-in" }),
              h("div", { className: "min-w-0" }, h("span", null, "Last inflow"), h("small", null, `${dateFmt(inflow.date)}${inflowInfo.note || ""}`)),
              h("strong", null, "+", inflowInfo.cur, " ", numFmt(inflowInfo.amt))
            ),
            outflowInfo && h("div", { className: "account-flow-row account-flow-expense" },
              h(Icons.IconInflow, { className: "w-4 h-4 account-flow-out" }),
              h("div", { className: "min-w-0" }, h("span", null, "Last outflow"), h("small", null, `${dateFmt(outflow.date)}${outflowInfo.note || ""}`)),
              h("strong", null, "-", outflowInfo.cur, " ", numFmt(outflowInfo.amt))
            )
          ),
          isExpanded && h("div", { className: "account-transactions-panel" },
            h("div", { className: "account-transactions-heading" }, h("span", null, "LATEST TRANSACTIONS"), h("span", null, accountTransactions.length ? `${accountTransactions.length}` : "None")),
            accountTransactions.length ? accountTransactions.map(t => {
              const isOut = String(t.type || "").toLowerCase() === "expense" || String(t.type || "").toLowerCase() === "transfer" && String(t.fromAccountId || "") === String(acc.id);
              const amount = Number(t.amount || 0);
              return h("div", { key: t.id, className: "account-transaction-row" },
                h("div", { className: "account-transaction-icon" }, isOut ? "−" : "+"),
                h("div", { className: "account-transaction-main" },
                  h("strong", null, t.category || t.description || t.type || "Transaction"),
                  h("small", null, `${dateFmt(t.date)}${t.note ? " · " + t.note : ""}`)
                ),
                h("span", { className: isOut ? "account-transaction-out" : "account-transaction-in" }, `${isOut ? "−" : "+"}${t.currency || acc.currency} ${numFmt(amount)}`)
              );
            }) : h("div", { className: "account-transactions-empty" }, "No transactions recorded for this account yet.")
          )
        ));
      }))
    );
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Accounts = Accounts;
})();
