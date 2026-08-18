// Dedicated FX & Convert workspace — defensive rendering so the tab never blanks on malformed/missing data.
(function () {
  function Rates(props) {
    props = props || {};
    var h = React.createElement;
    var safeSettings = props.settings && typeof props.settings === "object" ? props.settings : {};
    var safeExchange = props.exchangeRates && typeof props.exchangeRates === "object" ? props.exchangeRates : {};
    var currencies = ["AED", "USD", "EUR", "GBP", "SAR", "INR", "PKR", "CAD", "AUD"];
    var base = currencies.indexOf(safeSettings.defaultCurrency) >= 0 ? safeSettings.defaultCurrency : "AED";
    var [amount, setAmount] = React.useState("1");
    var [from, setFrom] = React.useState("USD");
    var [to, setTo] = React.useState("PKR");
    var [referenceTarget, setReferenceTarget] = React.useState("AED");

    var safeRates = { AED: 1 };
    Object.keys(safeExchange).forEach(function (key) {
      var value = Number(safeExchange[key]);
      if (Number.isFinite(value) && value > 0) safeRates[key] = value;
    });

    var fromRate = safeRates[from] || 1;
    var toRate = safeRates[to] || 1;
    var numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) numericAmount = 0;
    var converted = numericAmount * fromRate / toRate;
    var unitRate = fromRate / toRate;
    var locale = safeSettings.numberFormat === "period" ? "de-DE" : "en-US";
    var format = function (value, digits) {
      var n = Number(value);
      if (!Number.isFinite(n)) n = 0;
      return n.toLocaleString(locale, { maximumFractionDigits: digits });
    };
    var inputCls = props.inputCls || "";
    var accentClass = props.accent && props.accent.solidBtn ? props.accent.solidBtn : "";
    var sync = typeof props.syncLiveExchangeRates === "function" ? props.syncLiveExchangeRates : function () {};
    var saveRates = typeof props.saveRates === "function" ? props.saveRates : function (e) { if (e && e.preventDefault) e.preventDefault(); };
    var setRateForm = typeof props.setRateForm === "function" ? props.setRateForm : function () {};
    var updateSettings = typeof props.updateSettings === "function" ? props.updateSettings : function () {};
    var rateForm = props.rateForm && typeof props.rateForm === "object" ? props.rateForm : {};
    var dark = !!props.darkMode;
    var referenceTargetRate = safeRates[referenceTarget] || 1;
    var syncing = !!props.syncingRates;
    var IconsSafe = window.Icons || {};
    var SyncIcon = IconsSafe.IconSync;

    return h("div", { className: "rates-native max-w-2xl mx-auto w-full" },
      h("section", { className: "rates-hero " + (dark ? "is-dark" : "") },
        h("div", null,
          h("span", { className: "accounts-eyebrow" }, "CURRENCY TOOLS"),
          h("h2", { className: "accounts-title" }, "FX & Convert"),
          h("p", { className: "accounts-subtitle" }, "Live rates, manual rate controls and a simple currency calculator.")
        ),
        h("div", { className: "rates-hero-actions" },
          h("button", { type: "button", onClick: sync, disabled: syncing, className: "rates-sync " + (syncing ? "is-syncing" : "") },
            SyncIcon ? h(SyncIcon, { className: "w-4 h-4" }) : null,
            syncing ? "Syncing…" : "Sync Live Rates"
          ),
          h("button", { type: "button", onClick: function () { updateSettings({ liveRateSync: safeSettings.liveRateSync === false }); }, className: "rates-auto " + (safeSettings.liveRateSync === false ? "is-off" : "") },
            "Auto-sync " + (safeSettings.liveRateSync === false ? "Off" : "On")
          )
        )
      ),
      props.rateSyncMsg ? h("p", { className: "rates-message", role: "status" }, String(props.rateSyncMsg)) : null,
      h("section", { className: "rates-card " + (dark ? "is-dark" : "") },
        h("div", { className: "rates-card-head" },
          h("div", null, h("span", null, "CONVERTER"), h("strong", null, "Live conversion")),
          h("span", { className: "rates-base-pill" }, "Base · " + base)
        ),
        h("div", { className: "rates-convert-grid" },
          h("label", null, h("span", null, "Amount"), h("input", { type: "number", inputMode: "decimal", step: "any", value: amount, onChange: function (e) { setAmount(e.target.value); }, className: inputCls })),
          h("label", null, h("span", null, "From"), h("select", { value: from, onChange: function (e) { setFrom(e.target.value); }, className: inputCls }, currencies.map(function (c) { return h("option", { key: c, value: c }, c); }))),
          h("label", null, h("span", null, "To"), h("select", { value: to, onChange: function (e) { setTo(e.target.value); }, className: inputCls }, currencies.map(function (c) { return h("option", { key: c, value: c }, c); })))
        ),
        h("div", { className: "rates-result" },
          h("span", null, (amount || 0) + " " + from),
          h("strong", null, "= " + format(converted, 2) + " " + to),
          h("small", null, "1 " + from + " = " + format(unitRate, 4) + " " + to)
        )
      ),
      h("section", { className: "rates-card rates-reference-card " + (dark ? "is-dark" : "") },
        h("div", { className: "rates-card-head" },
          h("div", null, h("span", null, "LIVE RATES"), h("strong", null, "Reference rates")),
          h("label", { className: "rates-base-select-wrap" },
            h("select", {
              value: referenceTarget,
              onChange: function (e) { setReferenceTarget(e.target.value); },
              className: "rates-base-select"
            }, currencies.map(function (code) {
              return h("option", { key: code, value: code }, "1 unit → " + code);
            }))
          )
        ),
        h("form", { onSubmit: saveRates, className: "rates-list" },
          ["USD", "EUR", "GBP", "SAR", "INR", "PKR", "CAD", "AUD"].map(function (code) {
            var displayValue = rateForm[code] == null || rateForm[code] === ""
              ? ""
              : Number(rateForm[code]) / referenceTargetRate;
            return h("label", { key: code },
              h("span", null, "1 " + code),
              h("input", {
                type: "number",
                inputMode: "decimal",
                step: "0.0001",
                required: true,
                value: displayValue === "" ? "" : displayValue,
                onChange: function (e) {
                  var entered = e.target.value;
                  var next = Object.assign({}, rateForm);
                  next[code] = entered === "" ? "" : String(Number(entered) * referenceTargetRate);
                  setRateForm(next);
                },
                className: inputCls
              }),
              h("small", null, code + " = " + referenceTarget)
            );
          }),
          h("button", { type: "submit", className: "rates-save loan-text-action loan-text-action-repay " + accentClass }, "Save rates")
        )
      )
    );
  }
  window.Tabs = window.Tabs || {};
  window.Tabs.Rates = Rates;
})();
