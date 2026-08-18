// tabs/accounts.js — Accounts tab. Wallet-style gradient cards; tap to expand
// and reveal the latest transactions affecting that account.
(function () {
  const h = React.createElement;

  function Accounts(props) {
    const { accounts, askDeleteAccount, darkMode, dateFmt, describeAccountMovement, getLastInflow, getLastOutflow, numFmt, openAddModal, openEditModal, selectionKey, settings, convertToBaseCurrency, transactions = [] } = props;
    const baseCurrency = settings?.defaultCurrency || "AED";
    const [expandedAll, setExpandedAll] = React.useState(false);
    const [activityId, setActivityId] = React.useState(null);

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
        .slice(0, 3);
    };

    const handleCardTap = accId => {
      if (!expandedAll) {
        setExpandedAll(true);
        setActivityId(null);
        return;
      }
      setActivityId(prev => prev === accId ? null : accId);
    };

    React.useEffect(() => {
      if (!accounts.some(acc => String(acc.id) === String(activityId))) setActivityId(null);
    }, [accounts, activityId]);

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
      h("div", {
        className: `accounts-list ${expandedAll ? "is-expanded" : "is-stacked"}`,
        "data-accounts-stack": expandedAll ? "expanded" : "stacked"
      }, accounts.map((acc, index) => {
        const inflow = getLastInflow(acc.id);
        const outflow = getLastOutflow(acc.id);
        const inflowInfo = inflow ? describeAccountMovement(inflow, acc) : null;
        const outflowInfo = outflow ? describeAccountMovement(outflow, acc) : null;
        const color = accountColor(acc);
        const isActivityOpen = activityId === acc.id;
        const history = isActivityOpen ? accountTransactions(acc.id) : [];
        const bankDetails = `${acc.type || "Bank Account"} · ${acc.currency}`;

        return h(window.SwipeRow, {
          key: acc.id,
          onEdit: () => openEditModal("account", acc),
          onDelete: () => askDeleteAccount(acc),
          selectionKey: selectionKey("account", acc.id)
        },
          h("div", { className: "account-stack-inner" },
            isActivityOpen && h("div", {
              className: `account-activity-card ${darkMode ? "account-activity-card-dark" : ""}`,
              "aria-label": `Recent activity for ${acc.name}`
            },
              h("div", { className: "account-activity-head" },
                h("div", null,
                  h("span", { className: "account-activity-eyebrow" }, "RECENT ACTIVITY"),
                  h("strong", null, acc.name)
                ),
                h("span", { className: "account-activity-count" }, `${history.length} of 3`)
              ),
              history.length === 0
                ? h("p", { className: "account-activity-empty" }, "No transactions recorded for this account yet.")
                : h("div", { className: "account-activity-list" }, history.map(tx => {
                    const isIn = (tx.type === "income" && String(tx.accountId) === String(acc.id)) ||
                      (tx.type === "transfer" && String(tx.toAccountId) === String(acc.id));
                    const info = describeAccountMovement(tx, acc);
                    const MovementIcon = isIn ? Icons.IconArrowUp45 : Icons.IconArrowDown45;
                    return h("div", { key: tx.id, className: "account-activity-row" },
                      h("span", { className: `account-activity-direction ${isIn ? "is-inflow" : "is-outflow"}` },
                        h(MovementIcon, { className: "w-4 h-4" })
                      ),
                      h("div", { className: "min-w-0 flex-1" },
                        h("span", null, tx.category || (tx.type === "transfer" ? "Transfer" : tx.type)),
                        h("small", null, dateFmt(tx.date), info.note || "")
                      ),
                      h("strong", { className: isIn ? "account-activity-in" : "account-activity-out" },
                        isIn ? "+" : "-", info.cur, " ", numFmt(info.amt)
                      )
                    );
                  }))
            ),
            h("div", {
              className: `account-wallet-card ${expandedAll ? "is-expanded" : "is-stacked-card"}`,
              style: {
                background: `linear-gradient(135deg, color-mix(in srgb, ${color} 92%, white) 0%, ${color} 46%, color-mix(in srgb, ${color} 78%, black) 100%)`,
                "--account-stack-index": index
              },
              onClick: () => handleCardTap(acc.id),
              role: "button",
              tabIndex: 0,
              "aria-expanded": expandedAll,
              "aria-label": `${acc.name} account card, tap to ${!expandedAll ? "expand all accounts" : isActivityOpen ? "hide recent activity" : "view recent activity"}`
            },
              h("div", { className: "account-wallet-sheen" }),
              h("div", { className: "account-wallet-layout" },
                h("div", { className: "account-wallet-left" },
                  h("div", { className: "account-wallet-top" },
                    h("div", { className: "account-wallet-identity" },
                      h("span", { className: "account-wallet-icon" }, acc.type === "Bank" ? h(Icons.IconAccounts, { className: "w-4 h-4" }) : h(Icons.IconWallet, { className: "w-4 h-4" })),
                      h("div", { className: "account-wallet-bank-meta" },
                        h("span", { className: "account-wallet-name" }, acc.name),
                        h("span", { className: "account-wallet-details" }, bankDetails)
                      )
                    )
                  )
                ),
                h("div", { className: "account-wallet-right" },
                  h("span", { className: "account-wallet-currency" }, acc.currency),
                  h("strong", { className: "account-wallet-balance" }, numFmt(acc.balance))
                )
              ),
              (inflowInfo || outflowInfo) && h("div", { className: "account-wallet-footer" },
                h("span", { className: "account-wallet-hint" },
                  !expandedAll ? "Tap to expand" : isActivityOpen ? "Tap to close activity" : "Tap for activity"
                )
              )
            )
          )
        );
      }))
    );
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Accounts = Accounts;
})();
