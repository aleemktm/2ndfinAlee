// tabs/analytics.js — Premium Insights experience.
// Uses the existing finance data model but presents it as a calm, native-iOS-inspired intelligence dashboard.
(function () {
  const h = React.createElement;
  const GREEN = "#1DBF73";
  const RED = "#FF3B30";
  const BLUE = "#007AFF";
  const PURPLE = "#AF52DE";
  const GRAY = "#8E8E93";

  function moneyDelta(value, fmt) {
    return `${value >= 0 ? "+" : "−"}${fmt(Math.abs(value))}`;
  }

  function pct(value) {
    if (!Number.isFinite(value)) return "—";
    return `${Math.round(value)}%`;
  }

  function scoreFor({ savingsRate, emergencyRunwayMonths, monthlySavingsAED, monthlyIncomeAED }) {
    const runway = emergencyRunwayMonths === "12+" ? 12 : Number(emergencyRunwayMonths || 0);
    const savings = savingsRate == null ? 0 : Math.max(0, Math.min(100, savingsRate));
    const cashFlow = monthlyIncomeAED > 0 ? Math.max(0, Math.min(100, monthlySavingsAED / monthlyIncomeAED * 100)) : 0;
    const score = Math.round(Math.max(0, Math.min(100, savings * 0.45 + Math.min(100, runway / 6 * 100) * 0.35 + cashFlow * 0.20)));
    return score;
  }

  function sparkline(data, field, color, darkMode) {
    const width = 320, height = 96, pad = 8;
    const values = data.map(d => Number(d[field]) || 0);
    const min = Math.min(0, ...values), max = Math.max(1, ...values);
    const range = Math.max(1, max - min);
    const points = data.map((d, i) => {
      const x = pad + i * (width - pad * 2) / Math.max(1, data.length - 1);
      const y = height - pad - ((Number(d[field]) || 0) - min) / range * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return h("svg", { viewBox: `0 0 ${width} ${height}`, className: "insight-sparkline", role: "img" },
      h("line", { x1: pad, y1: height - pad, x2: width - pad, y2: height - pad, stroke: darkMode ? "#3F3F46" : "#E4E4E7", strokeWidth: "1" }),
      h("polyline", { points, fill: "none", stroke: color, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }),
      data.map((d, i) => {
        const x = pad + i * (width - pad * 2) / Math.max(1, data.length - 1);
        const y = height - pad - ((Number(d[field]) || 0) - min) / range * (height - pad * 2);
        return h("circle", { key: d.key, cx: x, cy: y, r: i === data.length - 1 ? 4 : 2.2, fill: darkMode ? "#18181B" : "#FFFFFF", stroke: color, strokeWidth: "2" });
      })
    );
  }

  function comparisonChart(data, mode, darkMode) {
    const width = 640, height = 190, padX = 28, padY = 20, labelY = 184;
    const maxValue = Math.max(1, ...data.flatMap(d => [Number(d.inc) || 0, Number(d.exp) || 0]));
    const xFor = i => padX + i * (width - padX * 2) / Math.max(1, data.length - 1);
    const yFor = value => height - padY - (Number(value) || 0) / maxValue * (height - padY * 2);
    const grid = [0.25, 0.5, 0.75, 1].map((ratio, i) => h("line", { key: `grid-${i}`, x1: padX, x2: width - padX, y1: yFor(maxValue * ratio), y2: yFor(maxValue * ratio), stroke: darkMode ? "#3F3F46" : "#E4E4E7", strokeWidth: "1" }));
    const labels = data.map((d, i) => h("text", { key: `label-${d.key}`, x: mode === "bars" ? padX + i * ((width - padX * 2) / Math.max(1, data.length)) + ((width - padX * 2) / Math.max(1, data.length)) / 2 : xFor(i), y: labelY, textAnchor: "middle", fill: darkMode ? "#A1A1AA" : "#8E8E93", fontSize: "9" }, d.label));
    if (!data.length) return h("div", { className: "insight-empty" }, "Not enough data for a comparison yet.");
    if (mode === "bars") {
      const groupW = (width - padX * 2) / Math.max(1, data.length);
      return h("svg", { viewBox: `0 0 ${width} ${height}`, className: "insight-comparison-chart", role: "img", "aria-label": "Income and spending comparison bar chart" },
        grid,
        data.map((d, i) => {
          const center = padX + i * groupW + groupW / 2;
          const barW = Math.min(20, groupW * 0.25);
          const incH = Math.max(2, (Number(d.inc) || 0) / maxValue * (height - padY * 2));
          const expH = Math.max(2, (Number(d.exp) || 0) / maxValue * (height - padY * 2));
          return h("g", { key: d.key },
            h("rect", { x: center - barW - 2, y: height - padY - incH, width: barW, height: incH, rx: 5, fill: GREEN }),
            h("rect", { x: center + 2, y: height - padY - expH, width: barW, height: expH, rx: 5, fill: RED }));
        }), labels);
    }
    const incomePoints = data.map((d, i) => `${xFor(i).toFixed(1)},${yFor(d.inc).toFixed(1)}`).join(" ");
    const spendingPoints = data.map((d, i) => `${xFor(i).toFixed(1)},${yFor(d.exp).toFixed(1)}`).join(" ");
    return h("svg", { viewBox: `0 0 ${width} ${height}`, className: "insight-comparison-chart", role: "img", "aria-label": "Income and spending comparison line chart" },
      grid,
      h("polyline", { points: incomePoints, fill: "none", stroke: GREEN, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }),
      h("polyline", { points: spendingPoints, fill: "none", stroke: RED, strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }),
      data.flatMap((d, i) => [
        h("circle", { key: `${d.key}-inc`, cx: xFor(i), cy: yFor(d.inc), r: i === data.length - 1 ? 4 : 2.7, fill: darkMode ? "#18181B" : "#FFFFFF", stroke: GREEN, strokeWidth: "2" }),
        h("circle", { key: `${d.key}-exp`, cx: xFor(i), cy: yFor(d.exp), r: i === data.length - 1 ? 4 : 2.7, fill: darkMode ? "#18181B" : "#FFFFFF", stroke: RED, strokeWidth: "2" })
      ]), labels);
  }

  function InsightHero(props) {
    const { darkMode, fmt, monthlyIncomeAED, monthlyExpenseAED, monthlySavingsAED, savingsRate, emergencyRunwayMonths, runwayStatus, biggestExpenseThisMonth, monthlyHistory } = props;
    const score = scoreFor(props);
    const last = monthlyHistory[monthlyHistory.length - 1];
    const prior = monthlyHistory[monthlyHistory.length - 2];
    const netChange = prior && prior.net !== 0 ? (last.net - prior.net) / Math.abs(prior.net) * 100 : null;
    const lead = monthlySavingsAED > 0
      ? `You kept ${fmt(monthlySavingsAED)} this month. Your cash flow is moving in the right direction.`
      : monthlySavingsAED < 0
        ? `Spending is ahead of income by ${fmt(Math.abs(monthlySavingsAED))}. A small reset could bring the month back on track.`
        : "Your month is balanced so far. Keep recording transactions to reveal stronger patterns.";
    return h("section", { className: `insight-hero ${darkMode ? "insight-dark" : ""}` },
      h("div", { className: "insight-hero-top" },
        h("div", null,
          h("span", { className: "insight-eyebrow" }, "INSIGHTS"),
          h("h1", { className: "insight-title" }, "Your money, in focus."),
          h("p", { className: "insight-subtitle" }, "A quiet read of your recent financial patterns.")),
        h("div", { className: "insight-score", title: "A simple wellness signal based on savings, cash flow and runway" },
          h("div", { className: "insight-score-ring", style: { background: `conic-gradient(${GREEN} ${score * 3.6}deg, rgba(29,191,115,.10) 0deg)` } },
            h("div", { className: "insight-score-inner" }, h("strong", null, score), h("span", null, "HEALTH"))))),
      h("div", { className: "insight-ai-card" },
        h("div", { className: "insight-ai-icon" }, "✦"),
        h("div", { className: "insight-ai-copy" },
          h("span", { className: "insight-ai-label" }, "ALEEMFIN INSIGHT"),
          h("p", null, lead),
          h("div", { className: "insight-ai-meta" },
            h("span", null, "Runway ", h("b", null, `~${emergencyRunwayMonths} mo`)),
            h("span", null, "Savings ", h("b", null, savingsRate == null ? "—" : `${savingsRate}%`)),
            netChange != null && h("span", null, "Net vs prior ", h("b", { className: netChange >= 0 ? "insight-positive" : "insight-negative" }, pct(netChange))))))),
      h("div", { className: "insight-kpi-grid" },
        h("div", { className: "insight-kpi" }, h("span", null, "INCOME"), h("strong", { style: { color: GREEN } }, fmt(monthlyIncomeAED)), h("small", null, "this month")),
        h("div", { className: "insight-kpi" }, h("span", null, "SPENDING"), h("strong", { style: { color: RED } }, fmt(monthlyExpenseAED)), h("small", null, "this month")),
        h("div", { className: "insight-kpi" }, h("span", null, "NET"), h("strong", { className: monthlySavingsAED >= 0 ? "insight-positive" : "insight-negative" }, moneyDelta(monthlySavingsAED, fmt)), h("small", null, "after expenses")),
        h("div", { className: "insight-kpi" }, h("span", null, "BUFFER"), h("strong", { className: "insight-buffer-value" }, `${emergencyRunwayMonths} mo`), h("small", null, runwayStatus.label)));
  }

  function CashFlowCard({ darkMode, fmt, monthlyHistory, insightTrendPeriod, setInsightTrendPeriod }) {
    const data = insightTrendPeriod === "yearly" ? arguments[0].yearlyHistory : monthlyHistory;
    const chartData = data || monthlyHistory;
    const income = chartData.reduce((a, x) => a + x.inc, 0);
    const expense = chartData.reduce((a, x) => a + x.exp, 0);
    const net = income - expense;
    const max = Math.max(1, ...chartData.map(x => Math.max(x.inc, x.exp)));
    return h("section", { className: `insight-panel ${darkMode ? "insight-panel-dark" : ""}` },
      h("div", { className: "insight-panel-head" },
        h("div", null, h("span", { className: "insight-section-kicker" }, "CASH FLOW"), h("h2", null, insightTrendPeriod === "yearly" ? "Year at a glance" : "Six-month rhythm")),
        h("div", { className: "insight-segment" },
          ["monthly", "yearly"].map(id => h("button", { key: id, type: "button", onClick: () => setInsightTrendPeriod(id), className: insightTrendPeriod === id ? "active" : "" }, id === "monthly" ? "Monthly" : "Yearly")))),
      h("div", { className: "insight-chart-wrap" },
        h("div", { className: "insight-bar-chart", role: "img", "aria-label": `${insightTrendPeriod} income and expense chart` },
          chartData.map(item => h("div", { key: item.key, className: "insight-bar-group" },
            h("div", { className: "insight-bars" },
              h("span", { className: "insight-bar income", style: { height: `${Math.max(3, item.inc / max * 100)}%` }, title: `Income ${fmt(item.inc)}` }),
              h("span", { className: "insight-bar expense", style: { height: `${Math.max(3, item.exp / max * 100)}%` }, title: `Expenses ${fmt(item.exp)}` })),
            h("small", null, insightTrendPeriod === "yearly" ? item.label : item.label))))),
      h("div", { className: "insight-chart-legend" }, h("span", null, h("i", { style: { background: GREEN } }), "Income"), h("span", null, h("i", { style: { background: RED } }), "Expenses")),
      h("div", { className: "insight-summary-strip" },
        h("div", null, h("span", null, "In"), h("strong", { style: { color: GREEN } }, fmt(income))),
        h("div", null, h("span", null, "Out"), h("strong", { style: { color: RED } }, fmt(expense))),
        h("div", null, h("span", null, "Net"), h("strong", { className: net >= 0 ? "insight-positive" : "insight-negative" }, moneyDelta(net, fmt)))));
  }

  function GoldPerformanceCard(props) {
    const { darkMode, fmt, goldAssets, goldHistory, settings, exchangeRates } = props;
    const h = React.createElement;
    const baseCurrency = settings && settings.defaultCurrency || "AED";
    const totalWeight = goldAssets.reduce((sum, a) => sum + Number(a.weightGrams || 0), 0);
    const avgPurchasePerGram = totalWeight > 0 ? goldAssets.reduce((sum, a) => sum + Number(a.purchaseValueBase || 0), 0) / totalWeight : 0;
    const series = (goldHistory || []).map(item => {
      const rate = Number(item.rateAEDPerGram || 0) / (exchangeRates && exchangeRates[baseCurrency] || 1);
      const pnl = goldAssets.reduce((sum, a) => {
        const grams = Number(a.weightGrams || 0);
        const purchase = Number(a.purchaseValueBase || 0);
        return sum + (grams > 0 ? grams * (rate - purchase / grams) : 0);
      }, 0);
      return { ...item, pnl, rate };
    });
    const latest = series[series.length - 1];
    const previous = series[series.length - 2];
    const currentPnl = latest ? latest.pnl : goldAssets.reduce((sum,a)=>sum + Number(a.currentValueBase||0) - Number(a.purchaseValueBase||0),0);
    const labels = series.map(x => ({ date:x.date, label:new Date(`${x.date}T12:00:00`).toLocaleDateString("en-US", {month:"short",day:"numeric"}), pnl:x.pnl }));
    const values = [0].concat(labels.map(x=>x.pnl));
    const min = Math.min(0,...values), max = Math.max(0,...values), range = Math.max(1,max-min), width=640, height=210, padX=24, padY=22;
    const pointFor=(v,i)=>[padX+i*(width-padX*2)/Math.max(1,values.length-1),height-padY-(v-min)/range*(height-padY*2)];
    const points=values.map((v,i)=>pointFor(v,i).map(n=>n.toFixed(1)).join(",")).join(" ");
    const zeroY=pointFor(0,0)[1];
    return h("section",{className:`insight-panel gold-performance-panel ${darkMode?"insight-panel-dark":""}`},
      h("div",{className:"insight-panel-head"},h("div",null,h("span",{className:"insight-section-kicker gold-kicker"},"GOLD PERFORMANCE"),h("h2",null,"Daily profit & loss")),h("strong",{className:currentPnl>=0?"gold-positive":"gold-negative"},`${currentPnl>=0?"+":"-"}${fmt(Math.abs(currentPnl))}`)),
      goldAssets.length===0?h("div",{className:"insight-empty"},"Add gold assets to track their daily profit and loss."):series.length===0?h("div",{className:"insight-empty"},"Daily gold performance will appear after the next successful gold-rate sync."):h("div",{className:"gold-performance-chart"},
        h("svg",{viewBox:`0 0 ${width} ${height}`,role:"img","aria-label":"Daily gold profit and loss trend"},h("line",{x1:padX,y1:zeroY,x2:width-padX,y2:zeroY,stroke:"#D4AF37",strokeWidth:"1",strokeDasharray:"4 5",opacity:".45"}),h("polyline",{points,fill:"none",stroke:"#D4AF37",strokeWidth:"3",strokeLinecap:"round",strokeLinejoin:"round"}),values.map((v,i)=>{const [x,y]=pointFor(v,i);return h("circle",{key:i,cx:x,cy:y,r:i===values.length-1?4.5:3,fill:darkMode?"#18181B":"#FFFFFF",stroke:"#D4AF37",strokeWidth:"2"})})),
        h("div",{className:"gold-performance-labels"},h("span",null,"Purchase baseline"),labels.slice(-7).map(x=>h("span",{key:x.date,title:x.date},x.label))),
        h("div",{className:"gold-performance-meta"},h("span",null,`Avg purchase ${fmt(avgPurchasePerGram)} / g`),h("span",null,latest?`Latest ${fmt(latest.rate)} / g`:"Latest pending"),h("span",null,previous?`Previous ${fmt(previous.rate)} / g`:"Previous pending")),
        h("div",{className:"gold-performance-note"},`Daily fetched benchmark compared with your recorded gold purchase cost. P/L is based only on your gold weight and is shown in ${baseCurrency}.`))
    );
  }

  function Analytics(props) {
    const { cardCls, categoryBreakdown = [], currentMonthLabel, darkMode, fmt, goldAssets = [], goldHistory = [], settings = {}, exchangeRates = { AED: 1 }, monthlyExpenseAED = 0, monthlyHistory = [], monthlyIncomeAED = 0, monthlySavingsAED = 0, savingsRate, emergencyRunwayMonths = 0, runwayStatus = { label: "—" }, biggestExpenseThisMonth, totalLiquidAED = 0, totalPhysicalAED = 0, totalLoansLentAED = 0, totalLoansBorrowedAED = 0 } = props;
    const top = categoryBreakdown[0];
    const categoryTotal = Math.max(1, monthlyExpenseAED);
    const categories = categoryBreakdown.slice(0, 5);
    const netWorthBase = Math.max(1, totalLiquidAED + totalPhysicalAED + totalLoansLentAED + totalLoansBorrowedAED);
    const segments = [
      ["Accounts", totalLiquidAED, GREEN], ["Assets", totalPhysicalAED, "#FF9500"], ["Lent", totalLoansLentAED, BLUE], ["Borrowed", totalLoansBorrowedAED, RED]
    ];
    return h("div", { className: "insight-page" },
      h(InsightHero, props),
      h("div", { className: "insight-two-col" },
        h("section", { className: `insight-panel ${darkMode ? "insight-panel-dark" : ""}` },
          h("div", { className: "insight-panel-head" }, h("div", null, h("span", { className: "insight-section-kicker" }, "SPENDING"), h("h2", null, `${currentMonthLabel} mix`)), h("span", { className: "insight-panel-total" }, fmt(monthlyExpenseAED))),
          categories.length === 0 ? h("div", { className: "insight-empty" }, "No spending recorded yet.") : h("div", { className: "insight-category-list" }, categories.map(([cat, value], i) => {
            const share = value / categoryTotal * 100;
            return h("div", { key: cat, className: "insight-category-row" },
              h("div", { className: "insight-category-main" }, h("span", { className: "insight-rank" }, String(i + 1).padStart(2, "0")), h("span", null, cat)),
              h("div", { className: "insight-category-value" }, h("b", null, fmt(value)), h("small", null, `${Math.round(share)}%`)),
              h("div", { className: "insight-category-track" }, h("i", { style: { width: `${share}%` } })));
          })),
          top && biggestExpenseThisMonth && h("div", { className: "insight-callout" }, h("span", null, "Largest signal"), h("strong", null, `${top[0]} is your biggest spend category`), h("small", null, `${biggestExpenseThisMonth.title} was ${fmt(biggestExpenseThisMonth.aed)}.`)))),
        h("section", { className: `insight-panel ${darkMode ? "insight-panel-dark" : ""}` },
          h("div", { className: "insight-panel-head" }, h("div", null, h("span", { className: "insight-section-kicker" }, "NET WORTH"), h("h2", null, "Where it sits"))),
          h("div", { className: "insight-donut-wrap" },
            h("div", { className: "insight-donut", style: { background: `conic-gradient(${segments.map((s, i) => { const start = segments.slice(0, i).reduce((a, x) => a + Math.abs(x[1]), 0) / netWorthBase * 360; const end = start + Math.abs(s[1]) / netWorthBase * 360; return `${s[2]} ${start}deg ${end}deg`; }).join(", ")})` } },
              h("div", { className: "insight-donut-hole" }, h("strong", null, fmt(totalLiquidAED + totalPhysicalAED + totalLoansLentAED - totalLoansBorrowedAED)), h("span", null, "net position"))),
            h("div", { className: "insight-net-list" },
              segments.map(([label, value, color]) => h("div", { key: label }, h("i", { style: { background: color } }), h("span", null, label), h("b", null, fmt(value))))))));
  }

  function AnalyticsSummary(props) {
    const { darkMode, fmt, monthlyHistory = [], yearlyHistory = [], insightTrendPeriod, setInsightTrendPeriod, insightTrendStyle, setInsightTrendStyle, avgMonthlyNet, bestMonth, biggestExpenseThisMonth, categoryBreakdown = [], goldAssets = [], goldHistory = [], settings = {}, exchangeRates = { AED: 1 } } = props;
    const data = (insightTrendPeriod === "yearly" ? yearlyHistory : monthlyHistory) || [];
    const trendIncome = data.reduce((a, x) => a + (Number(x.inc) || 0), 0);
    const trendSpending = data.reduce((a, x) => a + (Number(x.exp) || 0), 0);
    const averageIncome = data.length ? trendIncome / data.length : 0;
    const averageSpending = data.length ? trendSpending / data.length : 0;
    const averageNet = averageIncome - averageSpending;
    const last = data[data.length - 1];
    return h("div", { className: "insight-page insight-summary-page" },
      h("section", { className: `insight-panel ${darkMode ? "insight-panel-dark" : ""}` },
        h("div", { className: "insight-panel-head" }, h("div", null, h("span", { className: "insight-section-kicker" }, "TREND"), h("h2", null, "Income vs spending")), h("div", { className: "insight-segment" }, ["monthly", "yearly"].map(id => h("button", { key: id, type: "button", onClick: () => setInsightTrendPeriod(id), className: insightTrendPeriod === id ? "active" : "" }, id === "monthly" ? "Monthly" : "Yearly")))),
        h("div", { className: "insight-trend-hero insight-income-spending-hero" },
          h("div", null, h("span", null, "Average income"), h("strong", { className: "insight-positive" }, fmt(averageIncome)), h("small", null, `${data.length} ${insightTrendPeriod === "yearly" ? "years" : "months"}`)),
          h("div", { className: "insight-trend-last" }, h("span", null, "Average spending"), h("b", { className: "insight-negative" }, fmt(averageSpending)), h("small", { className: averageNet >= 0 ? "insight-positive" : "insight-negative" }, `Avg net ${moneyDelta(averageNet, fmt)}`))),
        h("div", { className: "insight-comparison-legend" }, h("span", null, h("i", { style: { background: GREEN } }), "Income"), h("span", null, h("i", { style: { background: RED } }), "Spending")),
        h("div", { className: "insight-comparison-chart-wrap" }, comparisonChart(data, insightTrendStyle, darkMode)),
        h("div", { className: "insight-style-row" }, ["line", "bars"].map(id => h("button", { key: id, type: "button", onClick: () => setInsightTrendStyle(id), className: insightTrendStyle === id ? "active" : "" }, id === "line" ? "Line" : "Bars")))),
      h("div", { className: "insight-two-col insight-summary-stack" },
        h("section", { className: `insight-panel ${darkMode ? "insight-panel-dark" : ""}` }, h("div", { className: "insight-panel-head" }, h("div", null, h("span", { className: "insight-section-kicker" }, "SIGNALS"), h("h2", null, "Worth noticing"))),
          h("div", { className: "insight-signal-list" },
            h("div", null, h("span", null, "Best month"), h("strong", null, bestMonth && bestMonth.net !== 0 ? `${bestMonth.label} · ${moneyDelta(bestMonth.net, fmt)}` : "Not enough data")),
            h("div", null, h("span", null, "Top category"), h("strong", null, categoryBreakdown[0] ? `${categoryBreakdown[0][0]} · ${fmt(categoryBreakdown[0][1])}` : "Not enough data")),
            h("div", null, h("span", null, "Largest transaction"), h("strong", null, biggestExpenseThisMonth ? `${biggestExpenseThisMonth.title} · ${fmt(biggestExpenseThisMonth.aed)}` : "Not enough data")))),
        h(GoldPerformanceCard, { darkMode, fmt, goldAssets, goldHistory, settings, exchangeRates }),
        h("section", { className: `insight-panel insight-ai-panel ${darkMode ? "insight-panel-dark" : ""}` }, h("div", { className: "insight-ai-label" }, "✦ SMART NOTE"), h("h2", null, averageNet >= 0 ? "Income is staying ahead of spending." : "Spending is running ahead of income."), h("p", null, averageNet >= 0 ? "The strongest move now is consistency: protect the positive months and keep fixed costs predictable." : "Look for one recurring cost to trim and one category to cap. Small changes compound quickly over a full year."), h("div", { className: "insight-note-pill" }, insightTrendPeriod === "yearly" ? "Annual view" : "Recent view"))),
      h("div", { className: "insight-footnote" }, "Insights are generated from transactions recorded in AleemFin. They are guidance, not financial advice."));
  }

  window.Tabs = window.Tabs || {};
  window.Tabs.Analytics = Analytics;
  window.Tabs.AnalyticsSummary = AnalyticsSummary;
})();
