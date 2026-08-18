// tabs/ledger.js — Transactions/Ledger tab.
(function () {
  function Ledger(props) {
    const {
      accent, darkMode, dateFmt, exportCSV, filteredTransactions, ledgerFilter,
      ledgerSearch, ledgerSort, numFmt, openAddModal, openEditModal,
      setDeleteTarget, setLedgerFilter, setLedgerSearch, setLedgerSort,
      subCardCls, transactions, selectionKey, getTransactionStatementMeta,
      statementOpen, setStatementOpen, statementAccountId, setStatementAccountId, statementFromDate,
      setStatementFromDate, statementToDate, setStatementToDate, exportStatement, accounts
    } = props;
    const h = React.createElement;
    const statementTouchRef = { current: {} };
    const lockStatementPage = () => {
      document.body.dataset.ledgerStatementLock = "1";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.overscrollBehavior = "none";
    };
    const unlockStatementPage = () => {
      delete document.body.dataset.ledgerStatementLock;
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.overscrollBehavior = "";
    };
    const closeStatementAfterSwipe = () => {
      const sheet = document.querySelector(".ledger-statement-sheet");
      if (sheet) {
        sheet.style.transition = "transform .34s cubic-bezier(.22,1,.36,1), opacity .26s ease";
        sheet.style.transform = "translate3d(0,100%,0)";
        sheet.style.opacity = "0";
      }
      window.setTimeout(() => { unlockStatementPage(); setStatementOpen(false); }, 280);
    };
    const onStatementTouchStart = e => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      statementTouchRef.current = { x: t.clientX, y: t.clientY, lastY: t.clientY, active: true, vertical: null };
      const sheet = document.querySelector(".ledger-statement-sheet");
      if (sheet) sheet.style.transition = "none";
    };
    const onStatementTouchMove = e => {
      const state = statementTouchRef.current;
      const t = e.touches && e.touches[0];
      const sheet = document.querySelector(".ledger-statement-sheet");
      if (!state.active || !t || !sheet) return;
      const dx = t.clientX - state.x;
      const dy = t.clientY - state.y;
      if (state.vertical === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) state.vertical = Math.abs(dy) >= Math.abs(dx);
      if (state.vertical !== true) return;
      if (dy > 0) {
        e.preventDefault();
        sheet.style.transform = `translate3d(0,${dy}px,0)`;
        sheet.style.opacity = String(Math.max(.72, 1 - dy / 520));
      } else if (sheet.scrollTop <= 0) {
        e.preventDefault();
      }
      state.lastY = t.clientY;
    };
    const onStatementTouchEnd = e => {
      const state = statementTouchRef.current;
      const sheet = document.querySelector(".ledger-statement-sheet");
      if (!state.active || !sheet) return;
      const t = e.changedTouches && e.changedTouches[0];
      const dy = t ? t.clientY - state.y : 0;
      const isSwipeDown = state.vertical === true && dy > 90;
      state.active = false;
      if (isSwipeDown) { closeStatementAfterSwipe(); return; }
      sheet.style.transition = "transform .38s cubic-bezier(.22,1,.36,1), opacity .28s ease";
      sheet.style.transform = "translate3d(0,0,0)";
      sheet.style.opacity = "1";
    };
    return h("div", { className: "space-y-4 max-w-2xl mx-auto w-full" },
      h("div", { className: "flex justify-between items-center px-1 gap-2" },
        h("h2", { className: "text-sm font-bold uppercase tracking-wider text-emerald-500" }, "Connected Transactions Ledger"),
        h("div", { className: "flex items-center gap-2" },
          h("button", { onClick: exportCSV, title: "Export CSV", className: `p-2 rounded-xl border ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-700"}` },
            h(Icons.IconCSV, { className: "w-4 h-4" })),
          h("button", { onClick: () => { lockStatementPage(); setStatementOpen(true); }, title: "Export statement", className: `px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-200 text-zinc-700"}` }, "Statement"),
          h("button", { onClick: () => openAddModal("income", { category: "Salary" }), className: `px-3 py-1.5 ${accent.solidBtn} text-white rounded-xl text-xs font-semibold whitespace-nowrap` }, "+ Add Entry")
        )
      ),
      h("div", { className: "flex gap-2" },
        h("div", { className: `flex-1 flex items-center gap-2 px-3 rounded-xl border ${darkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"}` },
          h(Icons.IconSearch, { className: "w-3.5 h-3.5 text-zinc-400 shrink-0" }),
          h("input", { type: "text", placeholder: "Search name, account, title or category…", value: ledgerSearch, onChange: e => setLedgerSearch(e.target.value), className: "w-full py-2 text-[16px] bg-transparent outline-none" })
        ),
        h("label", { className: `icon-select ${darkMode ? "icon-select-dark" : ""}`, title: "Filter transactions", "aria-label": "Filter transactions" },
          h(Icons.IconFilter, { className: "w-4 h-4" }),
          h("select", { value: ledgerFilter, onChange: e => setLedgerFilter(e.target.value), "aria-label": "Filter transactions" },
            h("option", { value: "all" }, "All Types"), h("option", { value: "income" }, "Income"), h("option", { value: "expense" }, "Expense"), h("option", { value: "transfer" }, "Transfer")
          )
        ),
        h("label", { className: `icon-select ${darkMode ? "icon-select-dark" : ""}`, title: "Sort transactions", "aria-label": "Sort transactions" },
          h(Icons.IconSort, { className: "w-4 h-4" }),
          h("select", { value: ledgerSort, onChange: e => setLedgerSort(e.target.value), "aria-label": "Sort transactions" },
            h("option", { value: "date_desc" }, "Newest First"), h("option", { value: "date_asc" }, "Oldest First"), h("option", { value: "amount_desc" }, "Amount: High-Low"), h("option", { value: "amount_asc" }, "Amount: Low-High")
          )
        )
      ),
      h("div", { className: "space-y-2.5" },
        filteredTransactions.length === 0
          ? h("div", { className: `p-12 text-center rounded-3xl border ${darkMode ? "bg-zinc-900/40 border-zinc-800 text-zinc-400" : "bg-white border-zinc-200 text-zinc-500"}` },
              h("p", { className: "text-xs font-medium" }, transactions.length === 0 ? "No transactions recorded yet." : "No transactions match your search."))
          : filteredTransactions.map(tx => {
            const meta = getTransactionStatementMeta(tx);
            const isIn = tx.type === "income" || (tx.type === "transfer" && meta?.toAccount && String(tx.toAccountId) === String(meta.toAccount.id));
            const balance = meta?.account ? (isIn && meta.toAccount ? meta.toBalance : meta.balance) : 0;
            return h(window.SwipeRow, {
              key: tx.id,
              onEdit: tx.type === "transfer" ? null : () => openEditModal(tx.type, tx),
              onDelete: () => setDeleteTarget({ type: "transaction", id: tx.id, name: tx.title }),
              selectionKey: selectionKey("transaction", tx.id)
            },
              h("div", { className: `swipe-content-card p-4 rounded-2xl border ${subCardCls} ledger-card-compact` },
                h("div", { className: "ledger-card-topline" },
                  h("div", { className: "flex items-center gap-1 min-w-0" },
                    h("span", { className: `tx-category-icon ${tx.type === "income" ? "tx-category-income" : tx.type === "expense" ? "tx-category-expense" : "tx-category-transfer"}`, title: tx.category, "aria-label": tx.category }, h((tx.type === "income" && String(tx.category).toLowerCase() === "other") ? window.Icons.IconArrowDown45 : (tx.type === "expense" && String(tx.category).toLowerCase() === "other") ? window.Icons.IconArrowUp45 : window.Icons.getCategoryIcon(tx.category, tx.type), { className: "w-3.5 h-3.5" })),
                    h("span", { className: `tx-category-label ${tx.type === "income" ? "tx-category-income-text" : tx.type === "expense" ? "tx-category-expense-text" : "tx-category-transfer-text"}` }, tx.category),
                    h("span", { className: "text-[10px] text-zinc-400 shrink-0" }, dateFmt(tx.date))
                  )
                ),
                h("div", { className: "ledger-title-amount-row" },
                  h("h3", { className: "font-bold text-sm truncate" }, tx.title),
                  h("div", { className: "ledger-amount-stack" },
                    h("span", { className: `font-bold text-sm ${tx.type === "income" ? "text-emerald-500" : tx.type === "expense" ? "text-rose-500" : "text-blue-500"}` }, tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "", tx.currency, " ", numFmt(tx.amount))
                  )
                ),
                h("div", { className: "ledger-card-bottomline" },
                  meta?.account ? h("span", { className: "ledger-account-chip" }, `${isIn ? "to" : "from"} a/c ${meta.account.name}`) : h("span", null),
                  meta?.account ? h("span", { className: "ledger-available-balance ledger-available-right" }, `Available ${meta.account.currency} ${numFmt(balance, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : h("span", null)
                )
              )
            );
          })
      ),
      statementOpen && ReactDOM.createPortal(
        h("div", { className: "ledger-statement-overlay", onClick: e => { if (e.target === e.currentTarget) { unlockStatementPage(); setStatementOpen(false); } } },
          h("div", { className: `ledger-statement-sheet ${darkMode ? "ledger-statement-dark" : ""}`, onTouchStart: onStatementTouchStart, onTouchMove: onStatementTouchMove, onTouchEnd: onStatementTouchEnd, onTouchCancel: onStatementTouchEnd },
          h("div", { className: "ledger-statement-handle" }),
          h("div", { className: "flex items-center justify-between gap-3 mb-4" },
            h("div", null, h("h3", { className: "text-sm font-bold" }, "Export statement"), h("p", { className: "text-[10px] text-zinc-400 mt-1" }, "Bank-style records with available balance after each transaction.")),
            h("button", { type: "button", onClick: () => { unlockStatementPage(); setStatementOpen(false); }, className: "p-2 rounded-xl bg-zinc-500/10", "aria-label": "Close statement export" }, h(Icons.IconClose, { className: "w-4 h-4" }))
          ),
          h("div", { className: "space-y-3" },
            h("label", { className: "block text-xs font-semibold" }, "Account", h("select", { value: statementAccountId, onChange: e => setStatementAccountId(e.target.value), className: "ledger-statement-input mt-1" },
              h("option", { value: "all" }, "All bank accounts"),
              accounts.map(acc => h("option", { key: acc.id, value: acc.id }, `${acc.name} · ${acc.currency}`))
            )),
            h("div", { className: "grid grid-cols-2 gap-2" },
              h("label", { className: "block text-xs font-semibold" }, "From", h("input", { type: "date", value: statementFromDate, onChange: e => setStatementFromDate(e.target.value), className: "ledger-statement-input mt-1" })),
              h("label", { className: "block text-xs font-semibold" }, "To", h("input", { type: "date", value: statementToDate, onChange: e => setStatementToDate(e.target.value), className: "ledger-statement-input mt-1" }))
            ),
            h("button", { type: "button", onClick: exportStatement, className: `w-full py-3 rounded-2xl text-xs font-bold ${accent.solidBtn} text-white` }, "Export Statement CSV")
          )
          )
        ),
        document.body
      )
    );
  }
  window.Tabs = window.Tabs || {};
  window.Tabs.Ledger = Ledger;
})();
