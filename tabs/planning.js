// tabs/planning.js — Premium Planning tab.
(function () {
  function Planning(props) {
    const { accent, budgetForm, budgets, cardCls, convertFromAED, convertToBaseCurrency, convertTxToAED, currentMonthLabel, darkMode, dateFmt, deleteBudget, deleteGoal, goalForm, goals, inputCls, monthlyTransactions, numFmt, openBudgetEditor, openGoalEditor, planningEditor, saveBudget, saveGoal, setBudgetForm, setGoalForm, setPlanningEditor, settings, subCardCls, selectionKey } = props;
    const h = React.createElement;
    const expenseCategories = settings.customCategories.expense || ["Groceries"];
    const budgetSpent = budget => convertFromAED(monthlyTransactions.filter(tx => tx.type === "expense" && (tx.category || "").toLowerCase() === budget.category.toLowerCase()).reduce((sum, tx) => sum + convertTxToAED(tx), 0), budget.currency);
    const goalMonthlyNeed = goal => {
      if (!goal.targetDate || goal.currentAmount >= goal.targetAmount) return null;
      const months = Math.max(1, Math.ceil((new Date(`${goal.targetDate}T12:00:00`).getTime() - new Date().getTime()) / (30.44 * 864e5)));
      return { months, amount: Math.max(0, goal.targetAmount - goal.currentAmount) / months };
    };
    const baseCurrency = settings.defaultCurrency || "AED";
    const totalBudget = budgets.reduce((s,b)=>s+convertToBaseCurrency(Number(b.amount||0), b.currency || baseCurrency),0);
    const totalSpent = budgets.reduce((s,b)=>s+convertToBaseCurrency(budgetSpent(b), b.currency || baseCurrency),0);
    const goalTarget = goals.reduce((s,g)=>s+convertToBaseCurrency(Number(g.targetAmount||0), g.currency || baseCurrency),0);
    const goalSaved = goals.reduce((s,g)=>s+convertToBaseCurrency(Number(g.currentAmount||0), g.currency || baseCurrency),0);
    const budgetHealth = totalBudget ? Math.min(100, Math.round(totalSpent/totalBudget*100)) : 0;
    const goalProgress = goalTarget ? Math.min(100, Math.round(goalSaved/goalTarget*100)) : 0;
    const status = budgetHealth >= 100 ? "Needs attention" : budgetHealth >= 80 ? "Watch your pace" : "On track";
    const currencies = ["AED","USD","EUR","GBP","SAR","INR","PKR","CAD","AUD"];
    return h("div", { className: "planning-premium max-w-2xl mx-auto w-full" },
      h("header", { className: "planning-hero" },
        h("div", { className: "planning-hero-copy" }, h("p", { className: "planning-eyebrow" }, "YOUR PLAN"), h("h2", { className: "planning-title" }, "Planning"), h("p", { className: "planning-subtitle" }, `A clear view of what you're funding and protecting this month.`)),
        h("div", { className: "planning-hero-mark" }, h(Icons.IconTarget, { className: "w-6 h-6" }))
      ),
      h("section", { className: "planning-summary-grid" },
        h("div", { className: "planning-summary-card planning-summary-budget" }, h("div", { className: "planning-summary-top" }, h(Icons.IconTune, { className: "w-4 h-4" }), h("span", null, "Budget pace")), h("strong", null, `${budgetHealth}%`), h("small", null, status)),
        h("div", { className: "planning-summary-card planning-summary-goal" }, h("div", { className: "planning-summary-top" }, h(Icons.IconTarget, { className: "w-4 h-4" }), h("span", null, "Goals funded")), h("strong", null, `${goalProgress}%`), h("small", null, `${goals.length} active goal${goals.length===1?"":"s"}`))
      ),
      h("section", { className: "planning-section" },
        h("div", { className: "planning-section-head" }, h("div", null, h("p", { className: "planning-kicker" }, "THIS MONTH"), h("h3", null, "Budgets")), h("button", { onClick: () => openBudgetEditor(), className: "planning-add-button" }, h(Icons.IconPlus, { className: "w-4 h-4" }), "Add budget")),
        budgets.length === 0 && !planningEditor && h("div", { className: "planning-empty" }, h(Icons.IconTune, { className: "w-5 h-5" }), h("strong", null, "Give your spending a lane"), h("p", null, "Set a monthly limit for any expense category.")),
        planningEditor === "budget" && h("form", { onSubmit: saveBudget, className: `planning-editor ${cardCls}` },
          h("div", { className: "planning-editor-head" }, h("h4", null, budgetForm.id ? "Edit budget" : "New budget"), h("button", { type:"button", onClick:()=>setPlanningEditor(null), className:"planning-close", "aria-label":"Close" }, h(Icons.IconClose,{className:"w-4 h-4"}))),
          h("div", { className:"grid grid-cols-2 gap-3" }, h("label", null, h("span",null,"Category"), h("select",{value:budgetForm.category,onChange:e=>setBudgetForm({...budgetForm,category:e.target.value}),className:inputCls},expenseCategories.map(name=>h("option",{key:name,value:name},name)))), h("label", null, h("span",null,"Monthly limit"), h("input",{type:"number",inputMode:"decimal",min:"0.01",step:"0.01",required:true,value:budgetForm.amount,onChange:e=>setBudgetForm({...budgetForm,amount:e.target.value}),className:inputCls})), h("label", null, h("span",null,"Currency"), h("select",{value:budgetForm.currency,onChange:e=>setBudgetForm({...budgetForm,currency:e.target.value}),className:inputCls},currencies.map(c=>h("option",{key:c,value:c},c))))),
          h("div",{className:"planning-editor-actions"},h("button",{type:"button",onClick:()=>setPlanningEditor(null),className:"planning-secondary"},"Cancel"),h("button",{type:"submit",className:"planning-primary"},"Save budget"))
        ),
        h("div", { className:"planning-list" }, budgets.map(budget=>{
          const spent=budgetSpent(budget), remaining=budget.amount-spent, progress=Math.min(100,Math.round(spent/budget.amount*100));
          const tone=progress>=100?"danger":progress>=80?"warning":"good";
          return h(window.SwipeRow,{key:budget.id,selectionKey:selectionKey("budget",budget.id),onEdit:()=>openBudgetEditor(budget),onDelete:()=>deleteBudget(budget)},h("article",{className:`planning-item ${tone}`},
            h("div",{className:"planning-item-top"},h("div",{className:"planning-item-title"},h("span",{className:"planning-item-icon"},h(window.Icons.getCategoryIcon(budget.category,"expense"),{className:"w-4 h-4"})),h("div",null,h("h4",null,budget.category),h("p",null,progress>=100?"Over budget":progress>=80?"Close to limit":"On track"))),h("strong",null,`${budget.currency} ${numFmt(budget.amount)}`)),
            h("div",{className:"planning-progress"},h("div",{style:{width:`${progress}%`}})),
            h("div",{className:"planning-item-meta"},h("span",null,`${progress}% used`),h("span",{className:remaining<0?"danger-text":""},remaining<0?`${budget.currency} ${numFmt(Math.abs(remaining))} over`:`${budget.currency} ${numFmt(remaining)} left`))
          ));
        }))
      ),
      h("section", { className:"planning-section" },
        h("div",{className:"planning-section-head"},h("div",null,h("p",{className:"planning-kicker"},"LONG TERM"),h("h3",null,"Savings goals")),h("button",{onClick:()=>openGoalEditor(),className:"planning-add-button"},h(Icons.IconPlus,{className:"w-4 h-4"}),"Add goal")),
        goals.length===0 && planningEditor!=="goal" && h("div",{className:"planning-empty"},h(Icons.IconTarget,{className:"w-5 h-5"}),h("strong",null,"Turn a goal into a plan"),h("p",null,"Track the amount, target date and pace in one place.")),
        planningEditor === "goal" && h("form",{onSubmit:saveGoal,className:`planning-editor ${cardCls}`},
          h("div",{className:"planning-editor-head"},h("h4",null,goalForm.id?"Edit goal":"New goal"),h("button",{type:"button",onClick:()=>setPlanningEditor(null),className:"planning-close","aria-label":"Close"},h(Icons.IconClose,{className:"w-4 h-4"}))),
          h("label",null,h("span",null,"Goal name"),h("input",{required:true,value:goalForm.name,onChange:e=>setGoalForm({...goalForm,name:e.target.value}),placeholder:"Emergency fund, travel…",className:inputCls})),
          h("div",{className:"grid grid-cols-2 gap-3"},h("label",null,h("span",null,"Target"),h("input",{type:"number",inputMode:"decimal",min:"0.01",step:"0.01",required:true,value:goalForm.targetAmount,onChange:e=>setGoalForm({...goalForm,targetAmount:e.target.value}),className:inputCls})),h("label",null,h("span",null,"Saved"),h("input",{type:"number",inputMode:"decimal",min:"0",step:"0.01",required:true,value:goalForm.currentAmount,onChange:e=>setGoalForm({...goalForm,currentAmount:e.target.value}),className:inputCls}))),
          h("div",{className:"grid grid-cols-2 gap-3"},h("label",null,h("span",null,"Currency"),h("select",{value:goalForm.currency,onChange:e=>setGoalForm({...goalForm,currency:e.target.value}),className:inputCls},currencies.map(c=>h("option",{key:c,value:c},c)))),h("label",null,h("span",null,"Target date · optional"),h("input",{type:"date",value:goalForm.targetDate,onChange:e=>setGoalForm({...goalForm,targetDate:e.target.value}),className:inputCls}))),
          h("label",null,h("span",null,"Target date · optional"),h("input",{type:"date",value:goalForm.targetDate,onChange:e=>setGoalForm({...goalForm,targetDate:e.target.value}),className:inputCls})),
          h("div",{className:"planning-editor-actions"},h("button",{type:"button",onClick:()=>setPlanningEditor(null),className:"planning-secondary"},"Cancel"),h("button",{type:"submit",className:"planning-primary"},"Save goal"))
        ),
        h("div",{className:"planning-list"},goals.map(goal=>{const progress=Math.min(100,Math.round(goal.currentAmount/goal.targetAmount*100));const monthly=goalMonthlyNeed(goal);return h(window.SwipeRow,{key:goal.id,selectionKey:selectionKey("goal",goal.id),onEdit:()=>openGoalEditor(goal),onDelete:()=>deleteGoal(goal)},h("article",{className:"planning-goal-card"},h("div",{className:"planning-goal-head"},h("div",{className:"planning-goal-icon"},h(Icons.IconTarget,{className:"w-5 h-5"})),h("div",{className:"min-w-0 flex-1"},h("h4",null,goal.name),h("p",null,goal.targetDate?`Target ${dateFmt(goal.targetDate)}`:"No target date")),h("strong",null,`${progress}%`)),h("div",{className:"planning-progress goal-progress"},h("div",{style:{width:`${progress}%`}})),h("div",{className:"planning-item-meta"},h("span",null,`${goal.currency} ${numFmt(goal.currentAmount)} saved`),h("span",null,`${goal.currency} ${numFmt(goal.targetAmount)} target`)),h("div",{className:"planning-goal-footer"},monthly?h("span",null,`Need ~${goal.currency} ${numFmt(monthly.amount)}/mo`):h("span",null,goal.currentAmount>=goal.targetAmount?"Goal reached":"Add a target date"),h("span",{className:progress>=100?"goal-reached":""},progress>=100?"Complete":"In progress"))));}))
      ),
      h(Tabs.Recurring, props)
    );
  }
  window.Tabs = window.Tabs || {};
  window.Tabs.Planning = Planning;
})();
