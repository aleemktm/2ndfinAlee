// tabs/accounts.js — Accounts tab.
(function () {
  const h = React.createElement;

  function Accounts(props) {
    const { accounts, askDeleteAccount, darkMode, dateFmt, describeAccountMovement, getLastInflow, getLastOutflow, numFmt, openAddModal, openEditModal, selectionKey, settings, convertToBaseCurrency, transactions = [] } = props;
    const [expandedAccountId, setExpandedAccountId] = React.useState(null);
    const baseCurrency = settings?.defaultCurrency || "AED";
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
        const isExpanded = expandedAccountId === acc.id;
        const recentTransactions = (Array.isArray(transactions) ? transactions : [])
          .filter(tx => String(tx.accountId ?? tx.account ?? tx.fromAccountId ?? "") === String(acc.id))
          .sort((a,b) => String(b.date || "").localeCompare(String(a.date || "")))
          .slice(0, 4);
        const iconType = String(acc.type || "").toLowerCase();
        const AccountIcon = iconType.includes("cash") ? Icons.IconWallet : iconType.includes("wallet") ? Icons.IconWallet : Icons.IconAccounts;
        return h(window.SwipeRow, {
          key: acc.id,
          onEdit: () => openEditModal("account", acc),
          onDelete: () => askDeleteAccount(acc),
          selectionKey: selectionKey("account", acc.id)
        }, h("div", {
          className: `account-native-card account-gradient-card ${darkMode ? "account-native-dark" : ""} ${isExpanded ? "is-expanded" : ""}`,
          style: { "--account-color": accountColor(acc) }
        },
          h("button", {
            type: "button",
            className: "account-card-main",
            onClick: () => setExpandedAccountId(isExpanded ? null : acc.id),
            "aria-expanded": isExpanded
          }, h("div", { className: "account-card-head" },
            h("div", { className: "account-identity" },
              h("div", { className: "account-heading" },
                h("span", { className: "account-type" }, acc.type || "Bank Account"),
                h("div", { className: "account-title-row" },
                  h("span", { className: "account-icon account-icon-colored", "aria-hidden": "true" }, h(AccountIcon, { className: "w-5 h-5" })),
                  h("h3", { className: "account-name" }, acc.name)
                )
              )
            ),
            h("div", { className: "account-balance-block" },
              h("span", { className: "account-currency" }, acc.currency),
              h("strong", { className: "account-balance" }, numFmt(acc.balance))
            )
          ),
          h("div", { className: "account-card-meta" },
            h("span", null, acc.currency),
            h("span", null, acc.type || "Account"),
            h("span", { className: "account-expand-chevron", "aria-hidden": "true" }, "⌄")
          )),
          isExpanded && h("div", { className: "account-expanded-transactions" },
            recentTransactions.length ? recentTransactions.map((tx, i) => {
              const amount = Number(tx.amount ?? tx.value ?? 0);
              const positive = String(tx.type || "").toLowerCase().includes("income") || String(tx.type || "").toLowerCase().includes("salary") || String(tx.kind || "").toLowerCase() === "income";
              return h("div", { className: "account-recent-row", key: tx.id || i },
                h("div", { className: "account-recent-copy" },
                  h("span", null, tx.description || tx.note || tx.category || tx.title || "Transaction"),
                  h("small", null, tx.date ? dateFmt(tx.date) : "")
                ),
                h("strong", { className: positive ? "is-positive" : "" }, positive ? "+" : "-", acc.currency, " ", numFmt(Math.abs(amount)))
              );
            }) : h("div", { className: "account-no-transactions" }, "No recent transactions for this account.")
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
          )
        ));
      }))
    );
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Accounts = Accounts;
})();
