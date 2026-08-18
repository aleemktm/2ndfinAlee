// modals.js — All modal/sheet overlays used across tabs.
(function () {
  function MoreSheet(props) {
    const { MORE_NAV_ITEMS, accent, activeTab, darkMode, setActiveTab, setMoreSheetOpen } = props;
    const [closing, setClosing] = React.useState(false);
    const [offsetY, setOffsetY] = React.useState(0);
    const startY = React.useRef(0);
    const dragging = React.useRef(false);
    const closeTimer = React.useRef(null);
    const dismiss = () => {
      if (closing) return;
      setClosing(true);
      setOffsetY(0);
      closeTimer.current = setTimeout(() => setMoreSheetOpen(false), 240);
    };
    React.useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
    const onPointerDown = e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startY.current = e.clientY;
      dragging.current = true;
      if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = e => {
      if (!dragging.current || closing) return;
      const dy = e.clientY - startY.current;
      if (dy <= 0) return;
      setOffsetY(Math.min(180, dy));
    };
    const onPointerUp = e => {
      if (!dragging.current) return;
      dragging.current = false;
      const dy = e.clientY - startY.current;
      if (dy > 70) { dismiss(); } else { setOffsetY(0); }
    };
    return /* @__PURE__ */React.createElement("div", {
    className: `ios-sheet-backdrop md:hidden fixed inset-0 z-50 flex items-end justify-center ${closing ? "is-closing" : ""}`,
    onClick: e => { if (e.target === e.currentTarget) dismiss(); }
  }, /* @__PURE__ */React.createElement("div", {
    className: `ios-bottom-sheet w-full max-w-md p-3 pb-6 safe-bottom space-y-2 ${darkMode ? "is-dark" : ""} ${closing ? "is-closing" : ""} ${dragging.current ? "is-dragging" : ""}`,
    style: { "--sheet-offset": `${offsetY}px` },
    onClick: e => e.stopPropagation(),
    onPointerDown, onPointerMove, onPointerUp,
    onPointerCancel: () => { dragging.current = false; setOffsetY(0); }
  }, /* @__PURE__ */React.createElement("div", {
    className: "ios-sheet-handle"
  }), MORE_NAV_ITEMS.map(tab => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return /* @__PURE__ */React.createElement("button", {
      key: tab.id,
      onClick: () => {
        setActiveTab(tab.id);
        dismiss();
      },
      className: `w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-colors ${isActive ? accent.activeBg10 : darkMode ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`
    }, /* @__PURE__ */React.createElement("div", {
      className: `w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? `${accent.activeBg20} ${accent.text}` : darkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`
    }, /* @__PURE__ */React.createElement(Icon, {
      className: "w-5 h-5"
    })), /* @__PURE__ */React.createElement("span", {
      className: `text-sm font-semibold ${isActive ? accent.text : ""}`
    }, tab.label), /* @__PURE__ */React.createElement(Icons.IconChevron, {
      className: "w-4 h-4 ml-auto opacity-40"
    }));
  })));
  }


  function DashboardCardsSheet(props) {
    const { accent, darkMode, dashboardCardOptions, selectedDashboardCardsForSheet, toggleDashboardCardForSheet, setDashboardCardsSheetOpen } = props;
    const dashboardOptions = dashboardCardOptions || [];
    const selectedDashboardCards = Array.isArray(selectedDashboardCardsForSheet) ? selectedDashboardCardsForSheet : [];
    const [closing, setClosing] = React.useState(false);
    const [offsetY, setOffsetY] = React.useState(0);
    const startY = React.useRef(0);
    const startX = React.useRef(0);
    const dragging = React.useRef(false);
    const dragActive = React.useRef(false);
    const closeTimer = React.useRef(null);

    const dismiss = React.useCallback(() => {
      if (closing) return;
      setClosing(true);
      setOffsetY(0);
      closeTimer.current = setTimeout(() => setDashboardCardsSheetOpen(false), 320);
    }, [closing, setDashboardCardsSheetOpen]);

    React.useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

    const onPointerDown = e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startY.current = e.clientY;
      startX.current = e.clientX;
      dragging.current = true;
      dragActive.current = false;
    };
    const onPointerMove = e => {
      if (!dragging.current || closing) return;
      const dy = e.clientY - startY.current;
      const dx = e.clientX - startX.current;
      if (!dragActive.current) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
          dragging.current = false;
          return;
        }
        if (dy < 10) return;
        dragActive.current = true;
      }
      if (dy <= 0) {
        setOffsetY(0);
        return;
      }
      setOffsetY(Math.min(260, dy));
      if (e.cancelable) e.preventDefault();
      if (e.currentTarget.setPointerCapture && e.pointerId != null) {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      }
    };
    const onPointerUp = e => {
      if (!dragging.current) return;
      const dy = e.clientY - startY.current;
      const wasDragging = dragActive.current;
      dragging.current = false;
      dragActive.current = false;
      if (wasDragging && dy > 82) dismiss();
      else if (wasDragging) setOffsetY(0);
    };
    const onPointerCancel = () => {
      dragging.current = false;
      dragActive.current = false;
      setOffsetY(0);
    };

    return React.createElement("div", {
      className: `ios-sheet-backdrop ios-dashboard-cards-backdrop fixed inset-0 flex items-end justify-center ${closing ? "is-closing" : ""}`,
      onClick: e => { if (e.target === e.currentTarget) dismiss(); },
      style: { zIndex: 1000, touchAction: "none" }
    },
      React.createElement("div", {
        className: `ios-dashboard-cards-sheet ${closing ? "is-closing" : ""}`,
        style: { "--sheet-offset": `${offsetY}px`, touchAction: "pan-y", overscrollBehavior: "contain", zIndex: 1001 },
        onClick: e => e.stopPropagation(),
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel
      },
        React.createElement("div", {
          className: `ios-dashboard-cards-panel ${darkMode ? "is-dark bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"} w-full border shadow-2xl`
        },
          React.createElement("div", { className: "ios-dashboard-cards-header", onPointerDown },
            React.createElement("div", { className: "mx-auto mb-3 h-1.5 w-11 rounded-full bg-zinc-400/45" }),
            React.createElement("div", { className: "flex items-start justify-between gap-3" },
              React.createElement("div", { className: "min-w-0" },
                React.createElement("h3", { className: "text-sm font-bold" }, "Choose four cards"),
                React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1 leading-relaxed" }, `${selectedDashboardCards.length}/4 selected · Choose the cards shown on your Home dashboard.`)
              ),
              React.createElement("button", {
                type: "button", onClick: dismiss, "aria-label": "Close",
                className: `shrink-0 w-9 h-9 flex items-center justify-center rounded-full ${darkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`
              }, React.createElement(Icons.IconClose, { className: "w-4 h-4" }))
            )
          ),
          React.createElement("div", { className: "ios-dashboard-cards-list" },
            React.createElement("div", { className: "grid grid-cols-2 gap-3" },
              dashboardOptions.map(option => {
                const selected = selectedDashboardCards.includes(option.id);
                const unavailable = !selected && selectedDashboardCards.length >= 4;
                return React.createElement("button", {
                  key: option.id, type: "button",
                  onClick: e => { e.stopPropagation(); toggleDashboardCardForSheet(option.id); },
                  disabled: unavailable,
                  "aria-pressed": selected,
                  className: `dashboard-card-choice min-h-[68px] w-full px-3.5 py-3 rounded-2xl border text-left transition-all active:scale-[0.98] disabled:opacity-35 ${selected ? "settings-selection-active" : darkMode ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-600"}`
                },
                  React.createElement("span", { className: "flex items-center gap-3" },
                    React.createElement("span", { className: `w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold ${selected ? `${accent.activeBg20} ${accent.text}` : darkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-200 text-zinc-500"}` }, selected ? "✓" : "＋"),
                    React.createElement("span", { className: "min-w-0 text-xs font-bold leading-snug" }, option.label)
                  )
                );
              })
            )
          )
        )
      )
    );
  }

  function CategoryManagerSheet(props) {
    const { DEFAULT_SETTINGS, accent, addCategory, categoryName, categoryType, darkMode, inputCls, removeCategory, setCategoryManagerOpen, setCategoryName, setCategoryType, settings, subCardCls } = props;
    const [closing, setClosing] = React.useState(false);
    const [offsetY, setOffsetY] = React.useState(0);
    const startY = React.useRef(0);
    const startX = React.useRef(0);
    const dragging = React.useRef(false);
    const dragActive = React.useRef(false);
    const closeTimer = React.useRef(null);
    React.useEffect(() => {
      const prevOverflow = document.body.style.overflow;
      const prevTouch = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => { document.body.style.overflow = prevOverflow; document.body.style.touchAction = prevTouch; };
    }, []);
    const categories = settings.customCategories || DEFAULT_SETTINGS.customCategories;
    const dismiss = React.useCallback(() => {
      if (closing) return;
      setClosing(true);
      setOffsetY(0);
      closeTimer.current = setTimeout(() => setCategoryManagerOpen(false), 320);
    }, [closing, setCategoryManagerOpen]);
    React.useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
    const onPointerDown = e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startY.current = e.clientY; startX.current = e.clientX;
      dragging.current = true; dragActive.current = false;
    };
    const onPointerMove = e => {
      if (!dragging.current || closing) return;
      const dy = e.clientY - startY.current, dx = e.clientX - startX.current;
      if (!dragActive.current) {
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { dragging.current = false; return; }
        if (dy < 8) return;
        dragActive.current = true;
      }
      if (dy <= 0) { setOffsetY(0); return; }
      setOffsetY(Math.min(280, dy));
      if (e.cancelable) e.preventDefault();
      if (e.currentTarget.setPointerCapture && e.pointerId != null) { try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} }
    };
    const onPointerUp = e => {
      if (!dragging.current) return;
      const dy = e.clientY - startY.current;
      const wasDragging = dragActive.current;
      dragging.current = false; dragActive.current = false;
      if (wasDragging && dy > 82) dismiss(); else if (wasDragging) setOffsetY(0);
    };
    return ReactDOM.createPortal(
      React.createElement("div", {
        className: `ios-settings-sheet-backdrop ${closing ? "is-closing" : ""}`,
        onClick: e => { if (e.target === e.currentTarget) dismiss(); },
        style: { touchAction: "none" }
      },
        React.createElement("div", {
          className: `ios-settings-sheet ${closing ? "is-closing" : ""}`,
          style: { "--sheet-offset": `${offsetY}px`, touchAction: "pan-y" },
          onClick: e => e.stopPropagation(), onPointerDown, onPointerMove, onPointerUp,
          onPointerCancel: () => { dragging.current = false; dragActive.current = false; setOffsetY(0); }
        },
          React.createElement("div", { className: `ios-settings-sheet-panel ${darkMode ? "is-dark" : ""}` },
            React.createElement("div", { className: "ios-settings-sheet-handle" }),
            React.createElement("div", { className: "flex items-start justify-between gap-3 px-1 pb-3" },
              React.createElement("div", { className: "min-w-0" },
                React.createElement("h3", { className: "text-sm font-bold" }, "Manage categories"),
                React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1" }, "Add or remove your income and expense categories.")
              ),
              React.createElement("button", { type: "button", onClick: dismiss, className: `w-9 h-9 rounded-full flex items-center justify-center ${darkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`, "aria-label": "Close" }, React.createElement(Icons.IconClose, { className: "w-4 h-4" }))
            ),
            React.createElement("div", { className: "ios-settings-sheet-scroll" },
              React.createElement("div", { className: "flex gap-2 mb-3" }, ["expense", "income"].map(type => React.createElement("button", { key: type, type: "button", onClick: () => setCategoryType(type), className: `flex-1 py-2.5 rounded-xl text-xs font-bold capitalize ${categoryType === type ? `${accent.activeBg} ${accent.textStrong}` : darkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}` }, type))),
              React.createElement("div", { className: "space-y-2" }, (categories[categoryType] || []).map(name => React.createElement("div", { key: name, className: `px-3.5 py-3 rounded-2xl flex items-center justify-between ${darkMode ? "bg-zinc-950" : "bg-zinc-50"}` },
                React.createElement("span", { className: "text-xs font-semibold" }, name),
                React.createElement("button", { type: "button", onClick: () => removeCategory(categoryType, name), className: "w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-500", title: `Remove ${name}` }, React.createElement(Icons.IconTrash, { className: "w-4 h-4" }))
              ))),
              React.createElement("form", { onSubmit: addCategory, className: "flex gap-2 pt-2 pb-1" },
                React.createElement("input", { value: categoryName, onChange: e => setCategoryName(e.target.value), placeholder: "New category", className: `${inputCls} flex-1` }),
                React.createElement("button", { type: "submit", className: `px-4 rounded-xl text-xs font-bold ${accent.solidBtn} text-white` }, "Add")
              )
            )
          )
        )
      ), document.body
    );
  }

  function SecuritySheet(props) {
    const { darkMode, settings, updateSettings, setSecuritySheetOpen, setSecurityLocked, hashPin, inputCls } = props;
    const [closing, setClosing] = React.useState(false);
    const [mode, setMode] = React.useState(settings.pinLockEnabled ? "manage" : "setup");
    const [currentPin, setCurrentPin] = React.useState("");
    const [newPin, setNewPin] = React.useState("");
    const [confirmPin, setConfirmPin] = React.useState("");
    const [error, setError] = React.useState("");
    const [resetConfirm, setResetConfirm] = React.useState(false);
    const closeTimer = React.useRef(null);
    const start = React.useRef({ x: 0, y: 0, active: false, vertical: null });
    const [offsetY, setOffsetY] = React.useState(0);
    React.useEffect(() => {
      const prevOverflow = document.body.style.overflow;
      const prevTouch = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => { document.body.style.overflow = prevOverflow; document.body.style.touchAction = prevTouch; if (closeTimer.current) clearTimeout(closeTimer.current); };
    }, []);
    const dismiss = React.useCallback(() => {
      if (closing) return;
      setClosing(true); setOffsetY(0);
      closeTimer.current = setTimeout(() => setSecuritySheetOpen(false), 320);
    }, [closing, setSecuritySheetOpen]);
    const onPointerDown = e => { if (e.pointerType === "mouse" && e.button !== 0) return; start.current = { x:e.clientX, y:e.clientY, active:true, vertical:null }; };
    const onPointerMove = e => {
      const g = start.current; if (!g.active || closing) return;
      const dx=e.clientX-g.x, dy=e.clientY-g.y;
      if (g.vertical === null && (Math.abs(dx)>8 || Math.abs(dy)>8)) g.vertical=Math.abs(dy)>=Math.abs(dx);
      if (g.vertical !== true) return;
      if (dy>0) { if(e.cancelable)e.preventDefault(); setOffsetY(Math.min(320,dy)); if(e.currentTarget.setPointerCapture){try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){}} }
    };
    const onPointerUp = e => { const g=start.current; if(!g.active)return; const dy=e.clientY-g.y; g.active=false; if(g.vertical===true&&dy>90){dismiss();}else setOffsetY(0); };
    const savePin = async e => {
      e.preventDefault(); setError("");
      if (!/^\d{4,8}$/.test(newPin)) { setError("PIN must be 4–8 digits."); return; }
      if (newPin !== confirmPin) { setError("PINs do not match."); return; }
      const pinHash = await hashPin(newPin);
      updateSettings({ pinLockEnabled:true, pinHash }); setSecurityLocked(false); setNewPin(""); setConfirmPin(""); setMode("manage");
    };
    const changePin = async e => {
      e.preventDefault(); setError("");
      if (!/^\d{4,8}$/.test(newPin)) { setError("PIN must be 4–8 digits."); return; }
      if (newPin !== confirmPin) { setError("PINs do not match."); return; }
      if ((await hashPin(currentPin)) !== settings.pinHash) { setError("Current PIN is incorrect."); return; }
      updateSettings({ pinHash: await hashPin(newPin), pinLockEnabled:true }); setCurrentPin(""); setNewPin(""); setConfirmPin(""); setError(""); setMode("manage");
    };
    const disablePin = async () => {
      if (!settings.pinLockEnabled) return;
      updateSettings({ pinLockEnabled:false, pinHash:"" }); setSecurityLocked(false); setResetConfirm(false); setMode("setup");
    };
    return ReactDOM.createPortal(
      React.createElement("div", { className:`ios-settings-sheet-backdrop ${closing?"is-closing":""}`, onClick:e=>{if(e.target===e.currentTarget)dismiss();}, style:{touchAction:"none"} },
        React.createElement("div", { className:`ios-settings-sheet ${closing?"is-closing":""}`, style:{"--sheet-offset":`${offsetY}px`,touchAction:"pan-y"}, onClick:e=>e.stopPropagation(), onPointerDown, onPointerMove, onPointerUp, onPointerCancel:()=>{start.current.active=false;setOffsetY(0);} },
          React.createElement("div", { className:`ios-settings-sheet-panel ${darkMode?"is-dark":""}` },
            React.createElement("div", { className:"ios-settings-sheet-handle" }),
            React.createElement("div", { className:"flex items-start justify-between gap-3 px-1 pb-3" },
              React.createElement("div", {className:"min-w-0"}, React.createElement("h3",{className:"text-sm font-bold"},"Security"), React.createElement("p",{className:"text-[10px] text-zinc-400 mt-1"},"Protect AleemFin with iOS-style security controls.")),
              React.createElement("button",{type:"button",onClick:dismiss,className:`w-9 h-9 rounded-full flex items-center justify-center ${darkMode?"bg-zinc-800 text-zinc-300":"bg-zinc-100 text-zinc-600"}`},React.createElement(Icons.IconClose,{className:"w-4 h-4"}))
            ),
            React.createElement("div",{className:"ios-settings-sheet-scroll space-y-3"},
              React.createElement("div",{className:`ios-security-native-card ${darkMode?"is-dark":""}`},
                React.createElement("div",{className:"ios-security-row"},React.createElement("div",{className:"min-w-0"},React.createElement("strong",null,"Biometrics"),React.createElement("span",null,"Face ID / Touch ID · ready for Capacitor/Xcode native hookup.")),React.createElement("span",{className:`ios-security-status ${settings.biometricEnabled?"is-on":""}`},settings.biometricEnabled?"On":"Off")),
                React.createElement("div",{className:"ios-security-row"},React.createElement("div",{className:"min-w-0"},React.createElement("strong",null,"PIN Lock"),React.createElement("span",null,settings.pinLockEnabled?"Enabled":"Not set")),React.createElement("span",{className:`ios-security-status ${settings.pinLockEnabled?"is-on":""}`},settings.pinLockEnabled?"On":"Off"))
              ),
              !settings.pinLockEnabled && mode==="setup" && React.createElement("form",{onSubmit:savePin,className:"ios-security-form"},React.createElement("div",{className:"ios-security-title"},"Set PIN"),React.createElement("input",{type:"password",inputMode:"numeric",pattern:"[0-9]*",maxLength:8,autoComplete:"new-password",placeholder:"4–8 digit PIN",value:newPin,onChange:e=>setNewPin(e.target.value.replace(/\\D/g,"")).slice(0,8),className:inputCls}),React.createElement("input",{type:"password",inputMode:"numeric",pattern:"[0-9]*",maxLength:8,autoComplete:"new-password",placeholder:"Confirm PIN",value:confirmPin,onChange:e=>setConfirmPin(e.target.value.replace(/\\D/g,"")).slice(0,8),className:inputCls}),error&&React.createElement("p",{className:"text-xs text-rose-500 font-semibold"},error),React.createElement("button",{type:"submit",className:"ios-security-primary"},"Enable PIN Lock")) ,
              settings.pinLockEnabled && mode==="manage" && React.createElement("div",{className:"ios-security-actions"},React.createElement("button",{type:"button",onClick:()=>{setMode("change");setError("")},className:"ios-security-action"},"Change PIN"),React.createElement("button",{type:"button",onClick:()=>setResetConfirm(true),className:"ios-security-action is-danger"},"Forgot PIN / Reset Lock")),
              settings.pinLockEnabled && mode==="change" && React.createElement("form",{onSubmit:changePin,className:"ios-security-form"},React.createElement("div",{className:"ios-security-title"},"Change PIN"),React.createElement("input",{type:"password",inputMode:"numeric",maxLength:8,placeholder:"Current PIN",value:currentPin,onChange:e=>setCurrentPin(e.target.value.replace(/\\D/g,"")).slice(0,8),className:inputCls}),React.createElement("input",{type:"password",inputMode:"numeric",maxLength:8,placeholder:"New PIN",value:newPin,onChange:e=>setNewPin(e.target.value.replace(/\\D/g,"")).slice(0,8),className:inputCls}),React.createElement("input",{type:"password",inputMode:"numeric",maxLength:8,placeholder:"Confirm new PIN",value:confirmPin,onChange:e=>setConfirmPin(e.target.value.replace(/\\D/g,"")).slice(0,8),className:inputCls}),error&&React.createElement("p",{className:"text-xs text-rose-500 font-semibold"},error),React.createElement("div",{className:"flex gap-2"},React.createElement("button",{type:"button",onClick:()=>setMode("manage"),className:"ios-security-action"},"Cancel"),React.createElement("button",{type:"submit",className:"ios-security-primary flex-1"},"Save New PIN"))),
              resetConfirm && React.createElement("div",{className:"ios-security-reset"},React.createElement("strong",null,"Reset PIN Lock?"),React.createElement("p",null,"This removes the local PIN lock from this device. Your financial data is not deleted."),React.createElement("div",{className:"flex gap-2 justify-end"},React.createElement("button",{type:"button",onClick:()=>setResetConfirm(false),className:"ios-security-action"},"Cancel"),React.createElement("button",{type:"button",onClick:disablePin,className:"ios-security-primary"},"Reset Lock")))
            )
          )
        )
      ), document.body
    );
  }

  function SecurityLockOverlay(props) {
    const { darkMode, settings, hashPin, setSecurityLocked, updateSettings } = props;
    const [pin, setPin] = React.useState("");
    const [error, setError] = React.useState("");
    const [resetConfirm, setResetConfirm] = React.useState(false);
    const unlock = async e => {
      e.preventDefault();
      if ((await hashPin(pin)) === settings.pinHash) { setSecurityLocked(false); setPin(""); setError(""); }
      else { setError("Incorrect PIN."); setPin(""); }
    };
    return ReactDOM.createPortal(
      React.createElement("div", { className:`ios-security-lock ${darkMode?"is-dark":""}` },
        React.createElement("div", { className:"ios-security-lock-card" },
          React.createElement("div", { className:"ios-security-lock-icon" }, React.createElement(Icons.IconSettings, { className:"w-6 h-6" })),
          React.createElement("h2", { className:"text-base font-bold" }, "AleemFin is Locked"),
          React.createElement("p", { className:"text-xs text-zinc-400 mt-1" }, settings.biometricEnabled ? "Use Face ID / Touch ID or enter your PIN to continue." : "Enter your PIN to continue."),
          settings.biometricEnabled && React.createElement("button", { type:"button", onClick:async()=>{ const ok=await (typeof window.__aleemFinAuthenticateBiometric === "function" ? window.__aleemFinAuthenticateBiometric() : false); if(ok){setSecurityLocked(false);hapticFeedback(18);actionSound("success");} }, className:"ios-security-primary w-full mt-4" }, "Unlock with Face ID / Touch ID"),
          React.createElement("form", { onSubmit:unlock, className:"mt-3 space-y-3" },
            React.createElement("input", { autoFocus:true, type:"password", inputMode:"numeric", maxLength:8, placeholder:"PIN", value:pin, onChange:e=>setPin(e.target.value.replace(/\\D/g,"").slice(0,8)), className:"ios-security-lock-input" }),
            error && React.createElement("p", { className:"text-xs text-rose-500 font-semibold" }, error),
            React.createElement("button", { type:"submit", className:"ios-security-primary w-full" }, "Unlock")
          ),
          React.createElement("button", { type:"button", onClick:()=>setResetConfirm(true), className:"text-[9px] text-zinc-400 mt-3 text-center underline underline-offset-2" }, "Forgot PIN? Reset lock"), resetConfirm && React.createElement("div", { className:"mt-3 rounded-2xl border border-rose-500/15 bg-rose-500/5 p-3" }, React.createElement("p", { className:"text-[9px] text-zinc-400 text-left leading-relaxed" }, "Resetting removes the local PIN lock. Your financial data stays on this device."), React.createElement("div", { className:"flex gap-2 justify-end mt-2" }, React.createElement("button", { type:"button", onClick:()=>setResetConfirm(false), className:"ios-security-action" }, "Cancel"), React.createElement("button", { type:"button", onClick:()=>{updateSettings({pinLockEnabled:false,pinHash:""});setSecurityLocked(false);}, className:"ios-security-primary" }, "Reset Lock")))
        )
      ), document.body
    );
  }

  function DeleteConfirm(props) {
    const { confirmDelete, darkMode, deleteTarget, setDeleteTarget } = props;
    return /* @__PURE__ */React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn"
  }, /* @__PURE__ */React.createElement("div", {
    className: `w-full max-w-xs rounded-3xl border p-5 shadow-2xl space-y-3 ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}`
  }, /* @__PURE__ */React.createElement("h3", {
    className: "font-bold text-sm"
  }, "Confirm Deletion"), /* @__PURE__ */React.createElement("p", {
    className: "text-xs text-zinc-400"
  }, "Are you sure you want to delete ", /* @__PURE__ */React.createElement("strong", {
    className: "text-zinc-200"
  }, '"', deleteTarget.name, '"'), "? This action cannot be undone."), deleteTarget.extra && /* @__PURE__ */React.createElement("p", {
    className: "text-xs text-rose-400 font-semibold"
  }, deleteTarget.extra), /* @__PURE__ */React.createElement("div", {
    className: "pt-2 flex justify-end space-x-2"
  }, /* @__PURE__ */React.createElement("button", {
    type: "button",
    onClick: () => setDeleteTarget(null),
    className: `px-3.5 py-2 rounded-xl text-xs font-semibold border ${darkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-200 hover:bg-zinc-100"}`
  }, "Cancel"), /* @__PURE__ */React.createElement("button", {
    type: "button",
    onClick: confirmDelete,
    className: "px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20"
  }, "Delete"))));
  }

  function RatesModal(props) {
    const { accent, darkMode, inputCls, rateForm, rateSyncMsg, saveRates, setRateForm, setRatesModalOpen, syncLiveExchangeRates, syncingRates } = props;
    const currencies = [["USD","US Dollar"],["EUR","Euro"],["GBP","Pound"],["SAR","Saudi Riyal"],["INR","Indian Rupee"],["PKR","Pakistani Rupee"],["CAD","Canadian Dollar"],["AUD","Australian Dollar"]];
    return React.createElement("div", { className:"fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn" },
      React.createElement("div", { className:`w-full max-w-sm max-h-[88vh] overflow-y-auto rounded-3xl border p-5 shadow-2xl space-y-3 ${darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"}` },
        React.createElement("div", { className:"flex justify-between items-center" }, React.createElement("h3", {className:"font-bold text-sm"},"Exchange Rates"), React.createElement("button",{onClick:()=>setRatesModalOpen(false),className:"p-1 rounded-lg text-zinc-400"},React.createElement(Icons.IconClose,{className:"w-3.5 h-3.5"}))),
        React.createElement("p", {className:"text-[10px] text-zinc-400"},"1 unit of currency = this many AED. Live rates can refresh automatically."),
        React.createElement("button", {type:"button",onClick:syncLiveExchangeRates,disabled:syncingRates,className:`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50 ${darkMode?"border-zinc-800":"border-zinc-200"}`},React.createElement(Icons.IconSync,{className:`w-3.5 h-3.5 ${syncingRates?"animate-pulse":""}`}),syncingRates?"Syncing…":"Sync Live Rates"),
        rateSyncMsg && React.createElement("p",{className:"text-[10px] text-zinc-400"},rateSyncMsg),
        React.createElement("form",{onSubmit:saveRates,className:"space-y-2.5"},
          React.createElement("div",{className:"p-3 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-[10px] text-zinc-500"},"AED is the reference for stored rates. Your selected base currency is used automatically for app totals."),
          currencies.map(([code,name])=>React.createElement("label",{key:code,className:"block"},React.createElement("span",{className:"block text-[10px] font-semibold mb-1"},`1 ${code} = ? AED · ${name}`),React.createElement("input",{type:"number",inputMode:"decimal",step:"0.0001",required:true,value:rateForm[code]||"",onChange:e=>setRateForm({...rateForm,[code]:e.target.value}),className:inputCls}))),
          React.createElement("div",{className:"pt-2 flex justify-end gap-2"},React.createElement("button",{type:"button",onClick:()=>setRatesModalOpen(false),className:`px-3.5 py-2 rounded-xl text-xs font-semibold border ${darkMode?"border-zinc-800":"border-zinc-200"}`},"Cancel"),React.createElement("button",{type:"submit",className:`px-3.5 py-2 ${accent.solidBtn} text-white rounded-xl text-xs font-semibold`},"Save Rates"))
        )
      )
    );
  }

  function LoanFormSheet(props) {
    const {
      accent, accounts, darkMode, inputCls, numFmt, title,
      onSubmit, onClose, children, submitLabel
    } = props;
    const [offsetY, setOffsetY] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);
    const [closing, setClosing] = React.useState(false);
    const sheetRef = React.useRef(null);
    const dragStart = React.useRef(null);
    const closeTimer = React.useRef(null);

    const dismiss = React.useCallback(() => {
      if (closing) return;
      setDragging(false);
      setOffsetY(0);
      setClosing(true);
      closeTimer.current = setTimeout(() => onClose(), 320);
    }, [closing, onClose]);

    React.useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

    React.useEffect(() => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const isInteractive = target => target && target.closest && target.closest("input, select, textarea, button, a");
      const start = e => {
        if (closing || !e.touches || e.touches.length !== 1 || isInteractive(e.target)) return;
        const t = e.touches[0];
        dragStart.current = { x: t.clientX, y: t.clientY };
      };
      const move = e => {
        if (!dragStart.current || closing || !e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        const dx = t.clientX - dragStart.current.x;
        const dy = t.clientY - dragStart.current.y;
        if (Math.abs(dx) > Math.abs(dy) || dy <= 0) return;
        if (dy > 6) {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
          setOffsetY(Math.min(260, dy));
        }
      };
      const end = e => {
        if (!dragStart.current) return;
        const y = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : dragStart.current.y;
        const dy = y - dragStart.current.y;
        dragStart.current = null;
        if (dy > 85) dismiss();
        else { setDragging(false); setOffsetY(0); }
      };
      sheet.addEventListener("touchstart", start, { passive: false });
      sheet.addEventListener("touchmove", move, { passive: false });
      sheet.addEventListener("touchend", end, { passive: false });
      sheet.addEventListener("touchcancel", end, { passive: false });
      return () => {
        sheet.removeEventListener("touchstart", start);
        sheet.removeEventListener("touchmove", move);
        sheet.removeEventListener("touchend", end);
        sheet.removeEventListener("touchcancel", end);
      };
    }, [closing, dismiss]);

    React.useEffect(() => {
      const prevOverflow = document.body.style.overflow;
      const prevTouch = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => { document.body.style.overflow = prevOverflow; document.body.style.touchAction = prevTouch; };
    }, []);

    // Keep the loan sheet above the iOS/WKWebView software keyboard.
    // visualViewport shrinks when the keyboard appears, while a normal fixed
    // inset sheet can otherwise remain positioned against the hidden layout viewport.
    const [viewport, setViewport] = React.useState(() => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      const keyboard = Math.max(0, window.innerHeight - (height + top));
      return { height, top, keyboard };
    });

    React.useEffect(() => {
      const vv = window.visualViewport;
      const syncViewport = () => {
        const height = vv ? vv.height : window.innerHeight;
        const top = vv ? vv.offsetTop : 0;
        // iOS Safari/WKWebView can leave position:fixed elements anchored to the
        // layout viewport while the software keyboard occupies the visual viewport.
        // Explicitly track that overlap and lift the sheet by exactly that amount.
        const keyboard = Math.max(0, window.innerHeight - (height + top));
        setViewport({ height, top, keyboard });

        requestAnimationFrame(() => {
          const sheet = sheetRef.current;
          const active = document.activeElement;
          if (!sheet || !active || !sheet.contains(active)) return;
          const sr = sheet.getBoundingClientRect();
          const ar = active.getBoundingClientRect();
          const safeTop = Math.max(sr.top + 12, top + 12);
          const safeBottom = height + top - 12;
          if (ar.bottom > safeBottom) sheet.scrollTop += ar.bottom - safeBottom;
          else if (ar.top < safeTop) sheet.scrollTop -= safeTop - ar.top;
        });
      };
      syncViewport();
      window.addEventListener("resize", syncViewport);
      window.addEventListener("orientationchange", syncViewport);
      if (vv) {
        vv.addEventListener("resize", syncViewport);
        vv.addEventListener("scroll", syncViewport);
      }
      return () => {
        window.removeEventListener("resize", syncViewport);
        window.removeEventListener("orientationchange", syncViewport);
        if (vv) {
          vv.removeEventListener("resize", syncViewport);
          vv.removeEventListener("scroll", syncViewport);
        }
      };
    }, []);

    return ReactDOM.createPortal(
      React.createElement("div", {
        className: `ios-form-sheet-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-3 ${closing ? "is-closing" : ""}`,
        style: {
          "--sheet-viewport-height": `${viewport.height}px`,
          "--keyboard-offset": `${viewport.keyboard}px`,
          top: 0,
          bottom: 0,
          height: "auto",
          right: 0
        },
        onClick: e => { if (e.target === e.currentTarget) dismiss(); }
      },
        React.createElement("div", {
          ref: sheetRef,
          className: `ios-form-bottom-sheet w-full max-w-md rounded-t-[30px] border border-b-0 p-5 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto md:rounded-3xl md:border-b md:max-h-[90vh] ${darkMode ? "is-dark" : ""} ${closing ? "is-closing" : ""} ${dragging ? "is-dragging" : ""}`,
          style: {
            "--sheet-offset": `${offsetY}px`,
            "--keyboard-offset": `${viewport.keyboard}px`,
            "--sheet-viewport-height": `${viewport.height}px`
          },
          onClick: e => e.stopPropagation()
        },
          React.createElement("div", { className: "ios-form-sheet-handle md:hidden" }),
          React.createElement("div", { className: "flex justify-between items-center mb-3" },
            React.createElement("h3", { className: "font-bold text-sm" }, title),
            React.createElement("button", { type: "button", onClick: dismiss, className: "p-1 rounded-lg hover:bg-zinc-800 text-zinc-400", "aria-label": "Close" }, React.createElement(Icons.IconClose, { className: "w-3.5 h-3.5" }))
          ),
          React.createElement("form", { onSubmit: e => { e.preventDefault(); if (!closing) onSubmit(e); }, className: "space-y-3" },
            children,
            React.createElement("div", { className: "pt-2 flex justify-end space-x-2" },
              React.createElement("button", { type: "button", onClick: dismiss, className: `px-3.5 py-2 rounded-xl text-xs font-semibold border ${darkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-200 hover:bg-zinc-100"}` }, "Cancel"),
              React.createElement("button", { type: "submit", className: `px-3.5 py-2 ${accent.solidBtn} text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20` }, submitLabel)
            )
          )
        )
      ), document.body
    );
  }

  function RepaymentModal(props) {
    const { accent, accounts, darkMode, handleRepaymentSubmit, inputCls, numFmt, repayAccountId, repayAmount, repayDate, repaymentModalLoan, setRepayAccountId, setRepayAmount, setRepayDate, setRepaymentModalLoan } = props;
    if (!repaymentModalLoan) return null;
    return React.createElement(LoanFormSheet, {
      accent, accounts, darkMode, inputCls, numFmt,
      title: `Record payment · ${repaymentModalLoan.name}`,
      submitLabel: "Record payment",
      onClose: () => setRepaymentModalLoan(null),
      onSubmit: handleRepaymentSubmit
    },
      React.createElement("div", null,
        React.createElement("label", { className: "block text-[11px] font-medium mb-1" }, "Payment Amount (", repaymentModalLoan.currency, ")"),
        React.createElement("input", {
          type: "number", inputMode: "decimal", step: "0.01", min: "0.01",
          max: repaymentModalLoan.amount - (repaymentModalLoan.repaid || 0), required: true, autoFocus: true,
          placeholder: "0.00", value: repayAmount, onChange: e => setRepayAmount(e.target.value), className: inputCls
        })
      ),
      React.createElement("div", null,
        React.createElement("label", { className: "block text-[11px] font-medium mb-1" }, repaymentModalLoan.type === "lent" ? "Deposit into Account" : "Pay from Account", " (optional)"),
        React.createElement("select", { value: repayAccountId, onChange: e => setRepayAccountId(e.target.value), className: inputCls },
          React.createElement("option", { value: "" }, "Don't record a cash movement"),
          accounts.map(acc => React.createElement("option", { key: acc.id, value: acc.id }, acc.name, " (", numFmt(acc.balance), " ", acc.currency, ")"))
        ),
        React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1" }, "Choosing an account also adds a matching ledger entry.")
      ),
      React.createElement("div", null,
        React.createElement("label", { className: "block text-[11px] font-medium mb-1" }, "Date"),
        React.createElement("input", { type: "date", value: repayDate, onChange: e => setRepayDate(e.target.value), className: inputCls })
      )
    );
  }

  function LoanAddMoreModal(props) {
    const { accent, accounts, addMoreAccountId, addMoreAmount, addMoreDate, darkMode, handleAddMoreSubmit, inputCls, loanAddMoreTarget, numFmt, setAddMoreAccountId, setAddMoreAmount, setAddMoreDate, setLoanAddMoreTarget } = props;
    if (!loanAddMoreTarget) return null;
    return React.createElement(LoanFormSheet, {
      accent, accounts, darkMode, inputCls, numFmt,
      title: `${loanAddMoreTarget.type === "lent" ? "Lend more to" : "Borrow more from"} · ${loanAddMoreTarget.name}`,
      submitLabel: "Add more",
      onClose: () => setLoanAddMoreTarget(null),
      onSubmit: handleAddMoreSubmit
    },
      React.createElement("div", null,
        React.createElement("label", { className: "block text-[11px] font-medium mb-1" }, "Additional Amount (", loanAddMoreTarget.currency, ")"),
        React.createElement("input", {
          type: "number", inputMode: "decimal", step: "0.01", min: "0.01", required: true, autoFocus: true,
          placeholder: "0.00", value: addMoreAmount, onChange: e => setAddMoreAmount(e.target.value), className: inputCls
        })
      ),
      React.createElement("div", null,
        React.createElement("label", { className: "block text-[11px] font-medium mb-1" }, loanAddMoreTarget.type === "lent" ? "Pay from Account" : "Deposit into Account", " (optional)"),
        React.createElement("select", { value: addMoreAccountId, onChange: e => setAddMoreAccountId(e.target.value), className: inputCls },
          React.createElement("option", { value: "" }, "Don't record a cash movement"),
          accounts.map(acc => React.createElement("option", { key: acc.id, value: acc.id }, acc.name, " (", numFmt(acc.balance), " ", acc.currency, ")"))
        ),
        React.createElement("p", { className: "text-[10px] text-zinc-400 mt-1" }, "Choosing an account also adds a matching ledger entry.")
      ),
      React.createElement("div", null,
        React.createElement("label", { className: "block text-[11px] font-medium mb-1" }, "Date"),
        React.createElement("input", { type: "date", value: addMoreDate, onChange: e => setAddMoreDate(e.target.value), className: inputCls })
      )
    );
  }

  function MainFormModal(props) {
    const { accent, accounts, closeMainFormModal, darkMode, editingId, formInput, handleFormSubmit, inputCls, modalType, modalClosing, numFmt, setFormInput, settings } = props;
    const CURRENCY_OPTIONS = ["AED", "USD", "EUR", "GBP", "SAR", "INR", "PKR", "CAD", "AUD"];
    const selectedAccountForForm = accounts.find(acc => acc.id === formInput.accountId);
    const [offsetY, setOffsetY] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);
    const sheetRef = React.useRef(null);
    const dragStart = React.useRef(null);
    const dismissFromSwipe = () => {
      if (modalClosing) return;
      setDragging(false);
      setOffsetY(140);
      closeMainFormModal();
    };

    // Safari/WKWebView: use a real non-passive touch listener on the sheet
    // so the page behind it cannot steal the vertical swipe gesture.
    React.useEffect(() => {
      const sheet = sheetRef.current;
      if (!sheet) return;
      const isInteractive = target => target && target.closest && target.closest("input, select, textarea, button, a");
      const start = e => {
        if (modalClosing || !e.touches || e.touches.length !== 1) return;
        if (isInteractive(e.target)) return;
        const t = e.touches[0];
        dragStart.current = { x: t.clientX, y: t.clientY };
      };
      const move = e => {
        if (!dragStart.current || modalClosing || !e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        const dx = t.clientX - dragStart.current.x;
        const dy = t.clientY - dragStart.current.y;
        // Lock the sheet to vertical motion; do not allow horizontal drift.
        if (Math.abs(dx) > Math.abs(dy) || dy <= 0) return;
        if (dy > 6) {
          e.preventDefault();
          e.stopPropagation();
          setDragging(true);
          setOffsetY(Math.min(260, dy));
        }
      };
      const end = e => {
        if (!dragStart.current) return;
        const y = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : dragStart.current.y;
        const dy = y - dragStart.current.y;
        dragStart.current = null;
        if (dy > 85) dismissFromSwipe();
        else {
          setDragging(false);
          setOffsetY(0);
        }
      };
      sheet.addEventListener("touchstart", start, { passive: false });
      sheet.addEventListener("touchmove", move, { passive: false });
      sheet.addEventListener("touchend", end, { passive: false });
      sheet.addEventListener("touchcancel", end, { passive: false });
      return () => {
        sheet.removeEventListener("touchstart", start);
        sheet.removeEventListener("touchmove", move);
        sheet.removeEventListener("touchend", end);
        sheet.removeEventListener("touchcancel", end);
      };
    }, [modalClosing]);

    // Prevent the document/root scroller from moving while the sheet is open.
    React.useEffect(() => {
      const html = document.documentElement;
      const body = document.body;
      const prev = { htmlOverflow: html.style.overflow, bodyOverflow: body.style.overflow, bodyOverscroll: body.style.overscrollBehavior };
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      return () => {
        html.style.overflow = prev.htmlOverflow;
        body.style.overflow = prev.bodyOverflow;
        body.style.overscrollBehavior = prev.bodyOverscroll;
      };
    }, []);
    return /* @__PURE__ */React.createElement("div", {
    className: `ios-form-sheet-backdrop fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-3 ${modalClosing ? "is-closing" : ""}`,
    onClick: e => { if (e.target === e.currentTarget) closeMainFormModal(); }
  }, /* @__PURE__ */React.createElement("div", {
    ref: sheetRef,
    className: `ios-form-bottom-sheet w-full max-w-md rounded-t-[30px] border border-b-0 p-5 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto md:rounded-3xl md:border-b md:max-h-[90vh] ${darkMode ? "is-dark" : ""} ${modalClosing ? "is-closing" : ""} ${dragging ? "is-dragging" : ""}`,
    style: { "--sheet-offset": `${offsetY}px` },
    onClick: e => e.stopPropagation()
  }, /* @__PURE__ */React.createElement("div", {
    className: "ios-form-sheet-handle md:hidden"
  }), /* @__PURE__ */React.createElement("div", {
    className: "flex justify-between items-center mb-3"
  }, /* @__PURE__ */React.createElement("h3", {
    className: "font-bold text-sm capitalize"
  }, editingId ? "Edit" : "Add", " ", modalType), /* @__PURE__ */React.createElement("button", {
    onClick: closeMainFormModal,
    className: "p-1 rounded-lg hover:bg-zinc-800 text-zinc-400"
  }, /* @__PURE__ */React.createElement(Icons.IconClose, {
    className: "w-3.5 h-3.5"
  }))), /* @__PURE__ */React.createElement("form", {
    onSubmit: handleFormSubmit,
    className: "space-y-3"
  }, modalType !== "transfer" && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Title / Name"), /* @__PURE__ */React.createElement("input", {
    type: "text",
    required: true,
    placeholder: "e.g. Salary, Groceries, Gold Bar",
    value: formInput.title,
    onChange: e => setFormInput({
      ...formInput,
      title: e.target.value
    }),
    className: inputCls
  })), modalType === "account" && /* @__PURE__ */React.createElement(React.Fragment, null, /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Account Type"), /* @__PURE__ */React.createElement("select", {
    value: formInput.accType,
    onChange: e => setFormInput({
      ...formInput,
      accType: e.target.value
    }),
    className: inputCls
  }, /* @__PURE__ */React.createElement("option", {
    value: "Bank"
  }, "Bank"), /* @__PURE__ */React.createElement("option", {
    value: "Wallet"
  }, "Wallet"), /* @__PURE__ */React.createElement("option", {
    value: "Cash"
  }, "Cash"), /* @__PURE__ */React.createElement("option", {
    value: "Credit Card"
  }, "Credit Card"), /* @__PURE__ */React.createElement("option", {
    value: "Other"
  }, "Other"))), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, editingId ? "Balance" : "Initial Balance"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    required: true,
    placeholder: "0.00",
    value: formInput.amount,
    onChange: e => setFormInput({
      ...formInput,
      amount: e.target.value
    }),
    className: inputCls
  }))), modalType === "transfer" && /* @__PURE__ */React.createElement(React.Fragment, null, /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "From Account"), /* @__PURE__ */React.createElement("select", {
    value: formInput.accountId,
    onChange: e => setFormInput({
      ...formInput,
      accountId: e.target.value
    }),
    className: inputCls
  }, accounts.map(acc => /* @__PURE__ */React.createElement("option", {
    key: acc.id,
    value: acc.id
  }, acc.name, " (", numFmt(acc.balance), " ", acc.currency, ")")))), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "To Account"), /* @__PURE__ */React.createElement("select", {
    value: formInput.toAccountId,
    onChange: e => setFormInput({
      ...formInput,
      toAccountId: e.target.value
    }),
    className: inputCls
  }, accounts.map(acc => /* @__PURE__ */React.createElement("option", {
    key: acc.id,
    value: acc.id
  }, acc.name, " (", numFmt(acc.balance), " ", acc.currency, ")")))), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Amount"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    min: "0.01",
    required: true,
    placeholder: "0.00",
    value: formInput.amount,
    onChange: e => setFormInput({
      ...formInput,
      amount: e.target.value
    }),
    className: inputCls
  }))), modalType === "asset" && /* @__PURE__ */React.createElement(React.Fragment, null, /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Category"), /* @__PURE__ */React.createElement("select", {
    value: formInput.assetCategory,
    onChange: e => setFormInput({
      ...formInput,
      assetCategory: e.target.value
    }),
    className: inputCls
  }, /* @__PURE__ */React.createElement("option", {
    value: "Gold"
  }, "Gold"), /* @__PURE__ */React.createElement("option", {
    value: "Property"
  }, "Property"), /* @__PURE__ */React.createElement("option", {
    value: "Vehicle"
  }, "Vehicle"), /* @__PURE__ */React.createElement("option", {
    value: "Other"
  }, "Other"))), formInput.assetCategory === "Gold" && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Weight (grams)"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    placeholder: "0.00",
    value: formInput.weightGrams,
    onChange: e => setFormInput({
      ...formInput,
      weightGrams: e.target.value
    }),
    className: inputCls
  })), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Purchase Price"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    min: "0",
    required: true,
    placeholder: "0.00",
    value: formInput.purchasePriceAED,
    onChange: e => setFormInput({
      ...formInput,
      purchasePriceAED: e.target.value
    }),
    className: inputCls
  })), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Current Price"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    min: "0",
    required: true,
    placeholder: "0.00",
    value: formInput.currentPriceAED,
    onChange: e => setFormInput({
      ...formInput,
      currentPriceAED: e.target.value
    }),
    className: inputCls
  }))), modalType === "loan" && /* @__PURE__ */React.createElement(React.Fragment, null, /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Loan Type"), /* @__PURE__ */React.createElement("select", {
    value: formInput.loanType,
    onChange: e => setFormInput({
      ...formInput,
      loanType: e.target.value
    }),
    className: inputCls
  }, /* @__PURE__ */React.createElement("option", {
    value: "lent"
  }, "Lent Out (they owe you)"), /* @__PURE__ */React.createElement("option", {
    value: "borrowed"
  }, "Borrowed (you owe them)"))), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Amount"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    min: "0.01",
    required: true,
    placeholder: "0.00",
    value: formInput.amount,
    onChange: e => setFormInput({
      ...formInput,
      amount: e.target.value
    }),
    className: inputCls
  })), !editingId && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Account (optional)"), /* @__PURE__ */React.createElement("select", {
    value: formInput.accountId,
    onChange: e => setFormInput({
      ...formInput,
      accountId: e.target.value
    }),
    className: inputCls
  }, /* @__PURE__ */React.createElement("option", {
    value: ""
  }, "Don't record a cash movement"), accounts.map(acc => /* @__PURE__ */React.createElement("option", {
    key: acc.id,
    value: acc.id
  }, acc.name, " (", numFmt(acc.balance), " ", acc.currency, ")"))), /* @__PURE__ */React.createElement("p", {
    className: "text-[10px] text-zinc-400 mt-1"
  }, "Choosing an account deducts/credits it now and logs a matching ledger entry.")), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "WhatsApp Number (optional)"), /* @__PURE__ */React.createElement("input", {
    type: "text",
    placeholder: "+9715XXXXXXXX",
    value: formInput.whatsapp,
    onChange: e => setFormInput({
      ...formInput,
      whatsapp: e.target.value
    }),
    className: inputCls
  })), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Due Date (optional)"), /* @__PURE__ */React.createElement("input", {
    type: "date",
    value: formInput.dueDate,
    onChange: e => setFormInput({
      ...formInput,
      dueDate: e.target.value
    }),
    className: inputCls
  }))), ["income", "expense"].includes(modalType) && /* @__PURE__ */React.createElement(React.Fragment, null, /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Category"), /* @__PURE__ */React.createElement("select", {
    required: true,
    value: formInput.category,
    onChange: e => setFormInput({
      ...formInput,
      category: e.target.value
    }),
    className: inputCls
  }, (((settings && settings.customCategories && settings.customCategories[modalType]) || []).slice ? (settings.customCategories[modalType] || []).slice() : []).concat(formInput.category && !(settings && settings.customCategories && (settings.customCategories[modalType] || []).includes(formInput.category)) ? [formInput.category] : []).map(category => React.createElement("option", {
    key: category,
    value: category
  }, category)))), /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Account"), /* @__PURE__ */React.createElement("select", {
    value: formInput.accountId,
    onChange: e => {
      const nextAccount = accounts.find(acc => acc.id === e.target.value);
      setFormInput({
        ...formInput,
        accountId: e.target.value,
        // Keep the transaction currency locked to whichever account is
        // selected so amounts are never silently misread in the wrong
        // currency (see: currency mismatch bug).
        currency: nextAccount ? nextAccount.currency : formInput.currency
      });
    },
    className: inputCls
  }, accounts.map(acc => /* @__PURE__ */React.createElement("option", {
    key: acc.id,
    value: acc.id
  }, acc.name, " (", numFmt(acc.balance), " ", acc.currency, ")"))))), ["income", "expense"].includes(modalType) && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Amount"), /* @__PURE__ */React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    step: "0.01",
    min: "0.01",
    required: true,
    placeholder: "0.00",
    value: formInput.amount,
    onChange: e => setFormInput({
      ...formInput,
      amount: e.target.value
    }),
    className: inputCls
  })), ["income", "expense", "account", "asset"].includes(modalType) && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Currency"), /* @__PURE__ */React.createElement("select", {
    value: formInput.currency,
    onChange: e => setFormInput({
      ...formInput,
      currency: e.target.value
    }),
    className: inputCls
  }, CURRENCY_OPTIONS.map(code => /* @__PURE__ */React.createElement("option", {
    key: code,
    value: code
  }, code))), ["income", "expense"].includes(modalType) && selectedAccountForForm && /* @__PURE__ */React.createElement("p", {
    className: `mt-1 text-[10px] ${formInput.currency === selectedAccountForForm.currency ? (darkMode ? "text-zinc-500" : "text-zinc-400") : "text-amber-500 font-medium"}`
  }, formInput.currency === selectedAccountForForm.currency ? `Matches ${selectedAccountForForm.name}'s currency.` : `Heads up: this differs from ${selectedAccountForForm.name}'s currency (${selectedAccountForForm.currency}) \u2014 the amount will be converted.`)), modalType === "loan" && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Currency"), /* @__PURE__ */React.createElement("select", {
    value: formInput.currency,
    onChange: e => setFormInput({
      ...formInput,
      currency: e.target.value
    }),
    className: inputCls
  }, CURRENCY_OPTIONS.map(code => /* @__PURE__ */React.createElement("option", {
    key: code,
    value: code
  }, code)))), ["income", "expense", "transfer"].includes(modalType) && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Date"), /* @__PURE__ */React.createElement("input", {
    type: "date",
    value: formInput.date,
    onChange: e => setFormInput({
      ...formInput,
      date: e.target.value
    }),
    className: inputCls
  })), modalType === "loan" && !editingId && /* @__PURE__ */React.createElement("div", null, /* @__PURE__ */React.createElement("label", {
    className: "block text-[11px] font-medium mb-1"
  }, "Date"), /* @__PURE__ */React.createElement("input", {
    type: "date",
    value: formInput.date,
    onChange: e => setFormInput({
      ...formInput,
      date: e.target.value
    }),
    className: inputCls
  })), /* @__PURE__ */React.createElement("div", {
    className: "pt-2 flex justify-end space-x-2"
  }, /* @__PURE__ */React.createElement("button", {
    type: "button",
    onClick: closeMainFormModal,
    className: `px-3.5 py-2 rounded-xl text-xs font-semibold border ${darkMode ? "border-zinc-800 hover:bg-zinc-800" : "border-zinc-200 hover:bg-zinc-100"}`
  }, "Cancel"), /* @__PURE__ */React.createElement("button", {
    type: "submit",
    className: `px-3.5 py-2 ${accent.solidBtn} text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20`
  }, "Save")))));
  }

  window.Modals = window.Modals || {};
  window.Modals.MoreSheet = MoreSheet;
  window.Modals.DashboardCardsSheet = DashboardCardsSheet;
  window.Modals.CategoryManagerSheet = CategoryManagerSheet;
  window.Modals.SecuritySheet = SecuritySheet;
  window.Modals.SecurityLockOverlay = SecurityLockOverlay;
  window.Modals.DeleteConfirm = DeleteConfirm;
  window.Modals.RatesModal = RatesModal;
  window.Modals.RepaymentModal = RepaymentModal;
  window.Modals.LoanAddMoreModal = LoanAddMoreModal;
  window.Modals.MainFormModal = MainFormModal;
})();
