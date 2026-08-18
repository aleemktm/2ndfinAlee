// tabs/recurring.js — Premium recurring planner.
(function () {
  function Recurring(props) {
    const { accounts, accent, advanceRecurringDate, convertToBaseCurrency, dateFmt, deleteRecurringItem, inputCls, numFmt, openRecurringEditor, recordRecurringOccurrence, recurringEditor, recurringForm, recurringItems, saveRecurringItem, setRecurringEditor, setRecurringForm, settings, updateRecurringItem, selectionKey, darkMode } = props;
    const h = React.createElement;
    const incomeItems = recurringItems.filter(item => item.type === "income");
    const expenseItems = recurringItems.filter(item => item.type === "expense");
    const activeItems = recurringItems.filter(item => item.active);
    const upcoming = activeItems.slice().sort((a,b) => (a.nextDate || "").localeCompare(b.nextDate || "")).slice(0, 4);
    const baseCurrency = settings.defaultCurrency || "AED";
    const monthlyIncome = incomeItems.filter(x => x.active && x.frequency === "monthly").reduce((s,x)=>s+convertToBaseCurrency(Number(x.amount||0), x.currency || baseCurrency),0);
    const monthlyExpense = expenseItems.filter(x => x.active && x.frequency === "monthly").reduce((s,x)=>s+convertToBaseCurrency(Number(x.amount||0), x.currency || baseCurrency),0);
    const categoryList = recurringForm.type === "income" ? (settings.customCategories.income || ["Salary"]) : (settings.customCategories.expense || ["Groceries"]);
    return h("div", { className: "recurring-native space-y-4 max-w-2xl mx-auto w-full" },
      h("section", { className: "recurring-hero" },
        h("div", { className: "recurring-hero-copy" },
          h("span", { className: "accounts-eyebrow" }, "AUTOPILOT PLANNING"),
          h("h2", { className: "accounts-title" }, "Recurring"),
          h("p", { className: "accounts-subtitle" }, "Plan predictable money without recording it until you choose." )
        ),
        h("button", { type: "button", onClick: () => openRecurringEditor(), className: "recurring-add", "aria-label": "Add recurring item" }, h(Icons.IconPlus,{className:"w-4 h-4"}), h("span",null,"Add"))
      ),
      h("section", { className: "recurring-stats" },
        h("div", { className: "recurring-stat recurring-stat-income" }, h(Icons.IconArrowDown45,{className:"w-4 h-4"}), h("div",null,h("span",null,"Monthly income"),h("strong",null,"+",monthlyIncome.toLocaleString()))),
        h("div", { className: "recurring-stat recurring-stat-expense" }, h(Icons.IconArrowUp45,{className:"w-4 h-4"}), h("div",null,h("span",null,"Monthly expenses"),h("strong",null,"-",monthlyExpense.toLocaleString()))),
        h("div", { className: "recurring-stat recurring-stat-neutral" }, h(Icons.IconCalendar,{className:"w-4 h-4"}), h("div",null,h("span",null,"Active schedules"),h("strong",null,String(activeItems.length))))
      ),
      upcoming.length > 0 && h("section", { className: `recurring-next ${darkMode ? "is-dark" : ""}` },
        h("div", { className: "recurring-section-head" }, h("div",null,h("span",null,"UP NEXT"),h("strong",null,"Upcoming")), h(Icons.IconChevron,{className:"w-4 h-4"})),
        h("div", { className: "recurring-next-list" }, upcoming.map(item => h("div", { key:item.id, className:"recurring-next-item" },
          h("div", { className:`recurring-next-icon ${item.type === "income" ? "is-income" : "is-expense"}` }, item.type === "income" ? h(Icons.IconArrowDown45,{className:"w-4 h-4"}) : h(Icons.IconArrowUp45,{className:"w-4 h-4"})),
          h("div", { className:"min-w-0 flex-1" }, h("strong",null,item.title), h("span",null,`${dateFmt(item.nextDate)} · ${item.frequency}`)),
          h("b", { className:item.type === "income" ? "recurring-amount-income" : "recurring-amount-expense" }, `${item.type === "income" ? "+" : "-"}${item.currency} ${numFmt(item.amount)}`)
        )))
      ),
      recurringEditor && h("form", { onSubmit: saveRecurringItem, className: "recurring-editor" },
        h("div", { className:"recurring-editor-head" }, h("div",null,h("span",null,"SCHEDULE"),h("strong",null,recurringForm.id ? "Edit recurring item" : "New recurring item")), h("button",{type:"button",onClick:()=>setRecurringEditor(null),className:"recurring-icon-button","aria-label":"Close"},h(Icons.IconClose,{className:"w-4 h-4"}))),
        h("div", { className:"recurring-type-toggle", role:"tablist" }, [ ["expense","Expense",Icons.IconArrowUp45],["income","Income",Icons.IconArrowDown45] ].map(([value,label,Icon])=>h("button",{key:value,type:"button",role:"tab","aria-selected":recurringForm.type===value,onClick:()=>setRecurringForm({...recurringForm,type:value,category:(value==="income"?settings.customCategories.income:settings.customCategories.expense||[""])[0]||""}),className:`recurring-type-button ${recurringForm.type===value?"is-active":""}`},h(Icon,{className:"w-4 h-4"}),label))),
        h("div",{className:"recurring-form-grid"},
          h("label",null,h("span",null,"Title"),h("input",{required:true,value:recurringForm.title,onChange:e=>setRecurringForm({...recurringForm,title:e.target.value}),placeholder:"Salary, Rent, Internet…",className:inputCls})),
          h("label",null,h("span",null,"Amount"),h("input",{type:"number",inputMode:"decimal",min:"0.01",step:"0.01",required:true,value:recurringForm.amount,onChange:e=>setRecurringForm({...recurringForm,amount:e.target.value}),className:inputCls})),
          h("label",null,h("span",null,"Frequency"),h("select",{value:recurringForm.frequency,onChange:e=>setRecurringForm({...recurringForm,frequency:e.target.value}),className:inputCls},h("option",{value:"monthly"},"Monthly"),h("option",{value:"weekly"},"Weekly"),h("option",{value:"yearly"},"Yearly"))),
          h("label",null,h("span",null,"Next date"),h("input",{type:"date",required:true,value:recurringForm.nextDate,onChange:e=>setRecurringForm({...recurringForm,nextDate:e.target.value}),className:inputCls})),
          h("label",null,h("span",null,"Account"),h("select",{required:true,value:recurringForm.accountId,onChange:e=>{const nextAccount=accounts.find(a=>a.id===e.target.value);setRecurringForm({...recurringForm,accountId:e.target.value,currency:(nextAccount&&nextAccount.currency)||recurringForm.currency});},className:inputCls},accounts.map(a=>h("option",{key:a.id,value:a.id},`${a.name} (${a.currency})`)))),
          h("label",null,h("span",null,"Category"),h("select",{value:recurringForm.category,onChange:e=>setRecurringForm({...recurringForm,category:e.target.value}),className:inputCls},categoryList.map(name=>h("option",{key:name,value:name},name))))
        ),
        h("div",{className:"recurring-editor-actions"},h("button",{type:"button",onClick:()=>setRecurringEditor(null),className:"recurring-secondary"},"Cancel"),h("button",{type:"submit",className:"recurring-primary"},recurringForm.id?"Save changes":"Create schedule"))
      ),
      h("section", { className:"recurring-list-section" },
        h("div",{className:"recurring-section-head"},h("div",null,h("span",null,"YOUR SCHEDULES"),h("strong",null,`${recurringItems.length} item${recurringItems.length===1?"":"s"}`))),
        recurringItems.length===0 ? h("div",{className:"recurring-empty"},h(Icons.IconCalendar,{className:"w-6 h-6"}),h("strong",null,"No recurring items yet"),h("span",null,"Add salary, rent, subscriptions or other predictable money."),h("button",{type:"button",onClick:()=>openRecurringEditor(),className:"recurring-primary"},"Create first schedule")) :
        h("div",{className:"recurring-list"}, recurringItems.slice().sort((a,b)=>(a.nextDate||"").localeCompare(b.nextDate||"")).map(item=>h(window.SwipeRow,{key:item.id,onEdit:()=>openRecurringEditor(item),onDelete:()=>deleteRecurringItem(item),selectionKey:selectionKey("recurring",item.id)},
          h("article",{className:`recurring-card ${darkMode?"is-dark":""} ${!item.active?"is-paused":""}`},
            h("div",{className:"recurring-card-main"},h("div",{className:`recurring-card-icon ${item.type==="income"?"is-income":"is-expense"}`},item.type==="income"?h(Icons.IconArrowDown45,{className:"w-4 h-4"}):h(Icons.IconArrowUp45,{className:"w-4 h-4"})),h("div",{className:"min-w-0 flex-1"},h("div",{className:"recurring-card-title-row"},h("h3",null,item.title),h("span",{className:item.active?"status-active":"status-paused"},item.active?"Active":"Paused")),h("p",null,`${item.frequency} · Next ${dateFmt(item.nextDate)} · ${item.category}`)),h("div",{className:`recurring-card-amount ${item.type==="income"?"is-income":"is-expense"}`},`${item.type==="income"?"+":"-"}${item.currency} ${numFmt(item.amount)}`)),
            h("div",{className:"recurring-card-actions"},
              item.active&&h("button",{type:"button",onClick:()=>recordRecurringOccurrence(item),className:"recurring-action-primary"},h(Icons.IconPlus,{className:"w-3.5 h-3.5"}),"Record now"),
              h("button",{type:"button",onClick:()=>updateRecurringItem(item,{active:!item.active}),className:"recurring-action-secondary"},item.active?"Pause":"Resume"),
              item.active&&h("button",{type:"button",onClick:()=>updateRecurringItem(item,{nextDate:advanceRecurringDate(item.nextDate,item.frequency)}),className:"recurring-action-secondary"},"Skip next")
            )
          )
        )))
      )
    );
  }
  window.Tabs = window.Tabs || {};
  window.Tabs.Recurring = Recurring;
})();
