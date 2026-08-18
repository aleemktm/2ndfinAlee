// tabs/vault.js — Native iOS-style Assets tab.
(function () {
  const h = React.createElement;
  function Vault(props) {
    const { applyLiveGoldRate, assets, darkMode, goldSyncMsg, liveGoldAEDPerGram, numFmt, openAddModal, openEditModal, setDeleteTarget, syncLiveGoldRate, syncingGold, selectionKey, setActiveTab, goldChangeAED, goldChangePct, convertToBaseCurrency, settings } = props;
    const total = assets.reduce((s,a)=>s+convertToBaseCurrency(Number(a.currentPriceAED||0), a.currency||"AED"),0);
    const gain = assets.reduce((s,a)=>s+convertToBaseCurrency(Number(a.currentPriceAED||0)-Number(a.purchasePriceAED||0), a.currency||"AED"),0);
    const baseCurrency = settings?.defaultCurrency || "AED";
    const goldCount = assets.filter(a=>a.category === "Gold").length;
    return h("div", { className: `assets-native ${darkMode ? "is-dark" : ""}` },
      h("section", { className: "assets-hero" },
        h("div", { className:"assets-hero-copy" },
          h("span", { className:"assets-eyebrow" }, "WEALTH & ASSETS"),
          h("h2", { className:"assets-title" }, "Assets"),
          h("p", { className:"assets-subtitle" }, `${assets.length} asset${assets.length===1?"":"s"} · Track physical value and growth in one place.`)
        ),
        h("button", { className:"assets-add", onClick:()=>openAddModal("asset"), "aria-label":"Add asset" }, h(Icons.IconPlus,{className:"w-4 h-4"}), "Add")
      ),
      h("section", { className:"assets-summary-grid" },
        h("div", { className:"assets-summary-card assets-summary-main" }, h("span",null,"Total value"), h("strong",null,baseCurrency," ",numFmt(total)), h("small",null,`${assets.length} tracked asset${assets.length===1?"":"s"}`)),
        h("div", { className:`assets-summary-card ${gain>=0?"is-positive":"is-negative"}` }, h("span",null,"Gain / loss"), h("strong",null,(gain>=0?"+":"-")+baseCurrency+" "+numFmt(Math.abs(gain))), h("small",null,total?((gain/(total-gain||1))*100).toFixed(1)+"% change":"—")),
        h("div", { className:"assets-summary-card" }, h("span",null,"Gold holdings"), h("strong",null,String(goldCount)), h("small",null,goldCount?"Live rate available":"No gold tracked"))
      ),
      goldCount>0 && h("section", { className:"assets-gold-card" },
        h("div", { className:"assets-section-head" }, h("div",null,h("span",null,"MARKET RATE"),h("strong",null,"24k Gold spot")), h("button",{onClick:syncLiveGoldRate,disabled:syncingGold,className:"assets-icon-button","aria-label":"Refresh gold rate"},h(Icons.IconSync,{className:`w-4 h-4 ${syncingGold?"animate-pulse":""}`}))),
        h("div",{className:"assets-gold-rate"}, h("div",null,h("span",null,liveGoldAEDPerGram?`AED ${numFmt(liveGoldAEDPerGram)} / g`:"Rate not synced"),h("small",null,goldSyncMsg||"Market benchmark; local jeweler rates may differ.")), liveGoldAEDPerGram&&h("button",{onClick:applyLiveGoldRate,className:"assets-apply"},"Apply rate"))
      ),
      goldCount>0 && h("button", { type:"button", className:"assets-insight-shortcut", onClick:()=>setActiveTab("analytics") },
        h("div", { className:"assets-insight-copy" }, h("span",null,"GOLD INSIGHT"), h("strong",null,"See your gold gain & loss"), h("small",null,`${goldChangePct == null ? "Live market movement" : `${goldChangePct >= 0 ? "+" : "-"}${Math.abs(goldChangePct).toFixed(1)}% since purchase`}`)),
        h(Icons.IconChevron,{className:"w-4 h-4"})
      ),
      h("section", { className:"assets-list-section" },
        h("div",{className:"assets-section-head"},h("div",null,h("span",null,"YOUR ASSETS"),h("strong",null,assets.length?"Portfolio":"Get started"))),
        assets.length===0 ? h("div",{className:"assets-empty"},h(Icons.IconWallet,{className:"w-7 h-7"}),h("strong",null,"No assets yet"),h("span",null,"Add gold, property, vehicles or other fixed assets to track your net worth."),h("button",{onClick:()=>openAddModal("asset"),className:"assets-add"},h(Icons.IconPlus,{className:"w-4 h-4"}),"Add asset")) :
        h("div",{className:"assets-list"},assets.map(ast=>{const g=Number(ast.currentPriceAED||0)-Number(ast.purchasePriceAED||0);const pct=Number(ast.purchasePriceAED||0)>0?(g/Number(ast.purchasePriceAED))*100:0;return h(window.SwipeRow,{key:ast.id,onEdit:()=>openEditModal("asset",ast),onDelete:()=>setDeleteTarget({type:"asset",id:ast.id,name:ast.name}),selectionKey:selectionKey("asset",ast.id)},h("article",{className:"asset-row-card",style:{"--af-asset-color":ast.category==="Gold"?"#F59E0B":ast.category==="Property"?"#8B5CF6":ast.category==="Vehicle"?"#3B82F6":"var(--af-accent)"}},h("div",{className:"asset-row-icon"}, ast.category==="Gold"?h(Icons.IconSparkles,{className:"w-5 h-5"}):ast.category==="Vehicle"?h(Icons.IconCar,{className:"w-5 h-5"}):ast.category==="Property"?h(Icons.IconHome,{className:"w-5 h-5"}):h(Icons.IconWallet,{className:"w-5 h-5"})),h("div",{className:"asset-row-main"},h("div",{className:"asset-row-title"},h("h3",null,ast.name),h("span",null,ast.category)),h("p",null,ast.weightGrams?`${ast.weightGrams}g · `:"",ast.currency||"AED"," · Purchased ",numFmt(ast.purchasePriceAED||0)),h("div",{className:"asset-row-progress"},h("span",{style:{width:`${Math.max(0,Math.min(100,Math.abs(pct)))}%`}}))),h("div",{className:"asset-row-value"},h("strong",null,ast.currency||"AED"," ",numFmt(ast.currentPriceAED||0)),h("small",{className:g>=0?"is-positive":"is-negative"},(g>=0?"+":"-")+numFmt(Math.abs(g))+` · ${Math.abs(pct).toFixed(1)}%`))));}))
      )
    );
  }
  window.Tabs=window.Tabs||{}; window.Tabs.Vault=Vault;
})();
