// tabs/loans.js — Loans & Liabilities tab.
(function () {
  function Loans(props) {
    const {
      accounts, transactions = [], darkMode, dateFmt, expandedLoanHistory, fmt, loanFilter, loanSort,
      numFmt, openAddModal, openEditModal, setAddMoreAccountId, setAddMoreAmount, setAddMoreDate,
      setDeleteTarget, setExpandedLoanHistory, setLoanAddMoreTarget, setLoanFilter, setLoanSort,
      setRepayAccountId, setRepayAmount, setRepayDate, setRepaymentModalLoan, sortedLoans, todayISO,
      todayStr, totalLoansBorrowedAED, totalLoansLentAED, selectionKey, undoLoanMovement
    } = props;
    const h = React.createElement;
    const lentCount = sortedLoans.filter(l => l.type === "lent").length;
    const borrowedCount = sortedLoans.filter(l => l.type === "borrowed").length;
    const visibleLoans = loanFilter === "all" ? sortedLoans : sortedLoans.filter(l => l.type === loanFilter);

    const openRepayment = loan => {
      const outstanding = Math.max(0, Number(loan.amount || 0) - Number(loan.repaid || 0));
      if (outstanding <= 0) return;
      setRepaymentModalLoan(loan);
      setRepayAmount(outstanding.toString());
      setRepayAccountId((accounts[0] ? accounts[0].id : "") || "");
      setRepayDate(todayISO());
    };
    const openAddMore = loan => {
      setLoanAddMoreTarget(loan);
      setAddMoreAmount("");
      setAddMoreAccountId((accounts[0] ? accounts[0].id : "") || "");
      setAddMoreDate(todayISO());
    };

    return h("div", { className: "loans-native space-y-4 max-w-2xl mx-auto w-full" },
      h("div", { className: "loans-header" },
        h("div", null,
          h("span", { className: "accounts-eyebrow" }, "MONEY OWED"),
          h("h2", { className: "accounts-title" }, "Loans"),
          h("p", { className: "accounts-subtitle" }, `${lentCount} lent · ${borrowedCount} borrowed`)
        ),
        h("div", { className: "loans-header-actions" },
          h("label", { className: `icon-select ${darkMode ? "icon-select-dark" : ""}`, title: "Sort loans", "aria-label": "Sort loans" },
            h(Icons.IconSort, { className: "w-4 h-4" }),
            h("select", { value: loanSort, onChange: e => setLoanSort(e.target.value), "aria-label": "Sort loans" },
              h("option", { value: "date_desc" }, "Newest First"),
              h("option", { value: "date_asc" }, "Oldest First"),
              h("option", { value: "amount_desc" }, "Amount: High-Low"),
              h("option", { value: "amount_asc" }, "Amount: Low-High"),
              h("option", { value: "name" }, "Name A-Z")
            )
          ),
          h("button", { onClick: () => openAddModal("loan"), className: "accounts-add-button", "aria-label": "Add loan" },
            h(Icons.IconPlus, { className: "w-4 h-4" }), h("span", null, "Add"))
        )
      ),
      h("div", { className: "loan-filter-segment", role: "tablist", "aria-label": "Loan type" },
        [["all", "All", sortedLoans.length], ["lent", "Lent out", lentCount], ["borrowed", "Borrowed", borrowedCount]].map(([value, label, count]) =>
          h("button", {
            key: value, type: "button", role: "tab", "aria-selected": loanFilter === value,
            onClick: () => setLoanFilter(value),
            className: `loan-filter-tab ${loanFilter === value ? "is-active" : ""}`
          }, label, h("span", null, count))
        )
      ),
      h("div", { className: "loan-native-summary" },
        h("button", {
          type: "button",
          className: `loan-native-summary-card loan-native-lent ${loanFilter === "lent" ? "is-filtered" : ""}`,
          onClick: () => setLoanFilter("lent"), "aria-label": "Show lent out loans"
        }, h(Icons.IconArrowUp45, { className: "loan-native-summary-icon" }),
          h("div", null, h("span", null, "Lent out"), h("strong", null, fmt(totalLoansLentAED)), h("small", null, "Money others owe you"))),
        h("button", {
          type: "button",
          className: `loan-native-summary-card loan-native-borrowed ${loanFilter === "borrowed" ? "is-filtered" : ""}`,
          onClick: () => setLoanFilter("borrowed"), "aria-label": "Show borrowed loans"
        }, h(Icons.IconArrowDown45, { className: "loan-native-summary-icon" }),
          h("div", null, h("span", null, "Borrowed"), h("strong", null, fmt(totalLoansBorrowedAED)), h("small", null, "Money you owe")))
      ),
      h("div", { className: "loans-list" },
        visibleLoans.length === 0
          ? h("div", { className: "loan-empty-state" },
              h(Icons.IconLoan, { className: "w-5 h-5" }),
              h("strong", null, loanFilter === "lent" ? "No lent-out loans" : loanFilter === "borrowed" ? "No borrowed loans" : "No loans yet"),
              h("span", null, "Add a loan to start tracking it."))
          : visibleLoans.map(loan => {
              const repaid = Number(loan.repaid || 0);
              const principal = Number(loan.amount || 0);
              const outstanding = Math.max(0, principal - repaid);
              const percentPaid = Math.min(100, Math.round(repaid / (principal || 1) * 100) || 0);
              const isFullyPaid = outstanding <= 0;
              const typeClass = loan.type === "lent" ? "loan-card-lent" : "loan-card-borrowed";
              const expanded = !!expandedLoanHistory[loan.id];

              const movements = Array.isArray(loan.movements) ? [...loan.movements] : [];
              const movementTxIds = new Set(movements.map(m => m.id));
              const legacyRepayments = transactions.filter(t =>
                t && t.loanId === loan.id && t.type && t.category === "Loan Repayment" && !movementTxIds.has(t.movementId)
              );
              const history = movements.concat(legacyRepayments.map(t => ({
                id: "legacy:" + t.id,
                legacyTransactionId: t.id,
                kind: "repayment",
                amount: Number(t.accountAmount != null ? t.accountAmount : t.amount) || 0,
                date: t.date,
                accountId: t.accountId
              }))).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

              // The front card always shows the latest transaction/entry date.
              const latestEntryDate = history[0]?.date || loan.date;
              const firstPrincipalId = movements.find(m => m.kind === "principal")?.id;

              const historyRows = history.map(mv => {
                const isRepayment = mv.kind === "repayment";
                const isInitial = mv.kind === "principal" && mv.id === firstPrincipalId;
                const label = isRepayment ? "Repaid" : isInitial ? (loan.type === "lent" ? "Lent out" : "Borrowed") : "Added more";
                const sign = isRepayment ? "−" : "+";
                const amountClass = isRepayment
                  ? (loan.type === "lent" ? "loan-history-in" : "loan-history-out")
                  : (loan.type === "lent" ? "loan-history-out" : "loan-history-in");

                return h("div", { key: mv.id, className: "loan-history-row" },
                  h("div", { className: "loan-history-main" },
                    h("strong", null, label),
                    h("span", null, dateFmt(mv.date))
                  ),
                  h("div", { className: "loan-history-value" },
                    h("strong", { className: amountClass }, sign, loan.currency, " ", numFmt(mv.amount)),
                    h("button", {
                      type: "button",
                      className: "loan-history-undo",
                      onClick: e => { e.stopPropagation(); undoLoanMovement(loan.id, mv.id, mv.legacyTransactionId); },
                      title: "Undo this record", "aria-label": "Undo this record"
                    }, h(Icons.IconUndo, { className: "w-3 h-3" }))
                  )
                );
              });

              const frontCard = h("div", {
                className: `loan-native-card loan-native-front ${darkMode ? "loan-native-dark" : ""} ${typeClass}`,
                onClick: () => setExpandedLoanHistory(prev => ({ ...prev, [loan.id]: !prev[loan.id] })),
                role: "button",
                tabIndex: 0,
                "aria-expanded": expanded,
                onKeyDown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedLoanHistory(prev => ({ ...prev, [loan.id]: !prev[loan.id] })); } }
              },
                h("div", { className: "loan-card-topline" },
                  h("div", { className: "loan-person" },
                    h("span", { className: "loan-direction-icon" },
                      loan.type === "lent" ? h(Icons.IconArrowUp45, { className: "w-4 h-4" }) : h(Icons.IconArrowDown45, { className: "w-4 h-4" })),
                    h("div", { className: "min-w-0" },
                      h("span", { className: "loan-kind" }, loan.type === "lent" ? "Lent out" : "Borrowed"),
                      h("h3", null, loan.name)
                    )
                  ),
                  h("div", { className: "loan-outstanding" },
                    h("span", null, "Outstanding"),
                    h("strong", null, loan.currency, " ", numFmt(outstanding))
                  )
                ),
                h("div", { className: "loan-date-line" },
                  h("span", null, dateFmt(latestEntryDate)),
                  loan.dueDate && h("span", { className: "loan-due-date" }, "Due ", dateFmt(loan.dueDate))
                ),
                h("div", { className: "loan-progress-wrap" },
                  h("div", { className: "loan-progress-label" },
                    h("span", null, `${percentPaid}% repaid`),
                    h("span", null, isFullyPaid ? "Settled" : `${loan.currency} ${numFmt(outstanding)} left`)
                  ),
                  h("div", { className: "loan-progress-track" },
                    h("div", { className: "loan-progress-fill", style: { width: `${percentPaid}%` } }))
                ),
                loan.whatsapp && !isFullyPaid && h("a", {
                  href: `https://wa.me/${loan.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${loan.name}, reminder regarding the outstanding balance of ${loan.currency} ${numFmt(outstanding)}`)}`,
                  target: "_blank", rel: "noreferrer", className: "loan-reminder",
                  onClick: e => e.stopPropagation()
                }, "WhatsApp Reminder →"),
              );

              const historyCard = h("div", {
                className: `loan-history-card ${darkMode ? "loan-history-card-dark" : ""} ${typeClass}`
              },
                h("div", { className: "loan-history-card-head" },
                  h("div", null,
                    h("span", null, "LOAN HISTORY"),
                    h("strong", null, `${history.length} ${history.length === 1 ? "record" : "records"}`)
                  )
                ),
                history.length
                  ? h("div", { className: "loan-history-list" }, historyRows)
                  : h("p", { className: "loan-history-empty" }, "No payment or added-amount records yet.")
              );

              return h(window.SwipeRow, {
                key: loan.id,
                onEdit: () => openEditModal("loan", loan),
                onDelete: () => setDeleteTarget({ type: "loan", id: loan.id, name: loan.name }),
                onLeftAction: () => openRepayment(loan),
                onLeftAction2: () => openAddMore(loan),
                leftActionLabel: "Record payment",
                leftAction2Label: "Add more",
                selectionKey: selectionKey("loan", loan.id)
              }, h("div", { className: `loan-card-stack ${expanded ? "is-expanded" : ""}` },
                frontCard,
                expanded && historyCard
              ));
            })
      )
    );
  }
  window.Tabs = window.Tabs || {};
  window.Tabs.Loans = Loans;
})();
