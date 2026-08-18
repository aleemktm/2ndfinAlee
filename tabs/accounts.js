// tabs/accounts.js — Accounts tab.
(function () {
  const h = React.createElement;

  function Accounts(props) {
    const { accounts, askDeleteAccount, darkMode, dateFmt, describeAccountMovement, getLastInflow, getLastOutflow, numFmt, openAddModal, openEditModal, selectionKey, settings, convertToBaseCurrency } = props;
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
    const shade = (hex, amt) => {
      const c = String(hex || "#1DBF73").replace("#", "");
      const num = parseInt(c.length === 3 ? c.split("").map(x => x + x).join("") : c, 16);
      const r = Math.max(0, Math.min(255, (num >> 16) + amt));
      const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
      const b = Math.max(0, Math.min(255, (num & 0xff) + amt));
      return `rgb(${r}, ${g}, ${b})`;
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
        return h(window.SwipeRow, {
          key: acc.id,
          onEdit: () => openEditModal("account", acc),
          onDelete: () => askDeleteAccount(acc),
          selectionKey: selectionKey("account", acc.id)
        }, h("div", {
          className: `account-native-card ${darkMode ? "account-native-dark" : ""}`
        },
          h("div", {
            className: "wallet-card",
            style: { "--card-a": accountColor(acc), "--card-b": shade(accountColor(acc), -36) }
          },
            h("div", { className: "wallet-card-top" },
              h("div", { className: "wallet-card-chip", "aria-hidden": "true" }),
              h("span", { className: "wallet-card-type" }, acc.type || "Bank Account")
            ),
            h("h3", { className: "wallet-card-name" }, acc.name),
            h("div", { className: "wallet-card-bottom" },
              h("span", { className: "wallet-card-currency" }, acc.currency),
              h("strong", { className: "wallet-card-balance" }, numFmt(acc.balance))
            )
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
