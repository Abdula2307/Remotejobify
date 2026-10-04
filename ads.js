/* Ads (Adsterra). Only the banner that fits the screen is loaded. */
(function () {
    var topSlot = document.getElementById("adTop");
    var bottomSlot = document.getElementById("adBottom");

    function label(slot) {
        var text = document.createElement("div");
        text.textContent = "Advertisement";
        text.style.cssText =
            "font-size:11px;letter-spacing:.08em;text-transform:uppercase;" +
            "color:#8b8e98;margin-bottom:6px;text-align:center;";
        slot.appendChild(text);
    }

    function addScript(parent, src, attrs) {
        var s = document.createElement("script");
        s.src = src;
        Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
        parent.appendChild(s);
    }

    /* Top banner: 728x90 on desktop, 320x50 on phones */
    if (topSlot) {
        var wide = window.innerWidth >= 768;
        var key = wide ? "2f2839e4cc5e4b30a5959b280fe0c93f" : "b5257438303b978aa022cccc22c59a7a";

        topSlot.style.cssText =
            "display:flex;flex-direction:column;align-items:center;" +
            "margin:16px auto;min-height:" + (wide ? 110 : 70) + "px;";
        label(topSlot);

        var box = document.createElement("div");
        topSlot.appendChild(box);

        window.atOptions = {
            key: key,
            format: "iframe",
            height: wide ? 90 : 50,
            width: wide ? 728 : 320,
            params: {}
        };
        addScript(box, "https://www.highrevenueformat.com/" + key + "/invoke.js");
    }

    /* Bottom: native banner */
    if (bottomSlot) {
        bottomSlot.style.cssText = "margin:24px auto;max-width:1000px;";
        label(bottomSlot);

        var container = document.createElement("div");
        container.id = "container-2ddcacc3923e4165cc3d26d51517034e";
        bottomSlot.appendChild(container);

        addScript(
            bottomSlot,
            "https://pl31651058.profitableratecpmnetwork.com/2ddcacc3923e4165cc3d26d51517034e/invoke.js",
            { async: "async", "data-cfasync": "false" }
        );
    }
})();
