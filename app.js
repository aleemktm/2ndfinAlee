// AleemFin Phase 9 bootstrap — app logic is modularized under app/ and core/.
(function () {
  if (!window.AleemFinApp || !window.AleemFinApp.App) {
    throw new Error("AleemFin app modules failed to load.");
  }
  var root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(React.createElement(window.AleemFinApp.App, null));
})();
