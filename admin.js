(function () {
    var api = window.JoblyAPI;
    var kind = new URLSearchParams(location.search).get("kind") === "scholarships" ? "scholarships" : "internships";
    var imageData = null;

    var $ = function (id) { return document.getElementById(id); };
    var loginPanel = $("loginPanel"), dash = $("dash"), logoutBtn = $("logoutBtn");

    function msg(node, text, type) { node.textContent = text || ""; node.className = "ad-msg" + (type ? " " + type : ""); }

    function show() {
        var on = api.isAdmin();
        loginPanel.classList.toggle("hidden", on);
        dash.classList.toggle("hidden", !on);
        logoutBtn.classList.toggle("hidden", !on);
        if (on) { setKind(kind); }
    }

    $("loginForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = $("loginBtn");
        btn.disabled = true; msg($("loginMsg"), "Checking…");
        api.request("/admin/login", { method: "POST", body: { email: $("aEmail").value.trim(), password: $("aPass").value } })
            .then(function (d) {
                api.setAdminSession(d.token);
                $("aPass").value = "";
                msg($("loginMsg"), "");
                show();
            })
            .catch(function (err) { msg($("loginMsg"), err.message || "Login failed", "error"); })
            .then(function () { btn.disabled = false; });
    });

    logoutBtn.addEventListener("click", function () { api.adminLogout(); show(); });

    document.querySelectorAll(".ad-tab").forEach(function (t) {
        t.addEventListener("click", function () { setKind(t.getAttribute("data-kind")); });
    });

    function setKind(k) {
        kind = k;
        document.querySelectorAll(".ad-tab").forEach(function (t) {
            t.classList.toggle("active", t.getAttribute("data-kind") === k);
        });
        $("listTitle").textContent = "Current " + k;
        loadList();
    }

    function loadList() {
        var list = $("adList");
        var k = kind;
        api.request("/" + k).then(function (items) {
            if (k !== kind) return;
            list.textContent = "";
            if (!items.length) {
                var p = document.createElement("p");
                p.className = "ad-sub"; p.textContent = "Nothing posted yet.";
                list.appendChild(p);
                return;
            }
            items.forEach(function (it) {
                var row = document.createElement("div"); row.className = "ad-row";
                if (it.imageUrl) { var im = document.createElement("img"); im.src = it.imageUrl; im.alt = ""; row.appendChild(im); }
                else { var th = document.createElement("div"); th.className = "thumb"; row.appendChild(th); }
                var tx = document.createElement("div"); tx.className = "ad-row-text";
                var s = document.createElement("strong"); s.textContent = it.title;
                var sp = document.createElement("span"); sp.textContent = "Posted " + (it.postedDaysAgo || 0) + "d ago";
                tx.appendChild(s); tx.appendChild(sp); row.appendChild(tx);
                var del = document.createElement("button");
                del.className = "op-btn danger"; del.type = "button"; del.textContent = "Delete";
                del.onclick = function () {
                    if (!confirm("Delete this listing?")) return;
                    del.disabled = true;
                    api.request("/" + k + "/" + encodeURIComponent(it.id), { method: "DELETE", admin: true })
                        .then(loadList)
                        .catch(function (e) { del.disabled = false; alert(e.message || "Could not delete"); });
                };
                row.appendChild(del);
                list.appendChild(row);
            });
        }).catch(function () {});
    }

    /* ---- image: resize + compress to a JPEG data URL under the server limit ---- */
    var MAX_CHARS = 382000; /* ~280KB decoded */
    function compress(file) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function () {
                URL.revokeObjectURL(url);
                var maxDim = 1000, quality = 0.85, out = null;
                for (var tries = 0; tries < 12; tries++) {
                    var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                    var c = document.createElement("canvas");
                    c.width = Math.max(1, Math.round(img.width * scale));
                    c.height = Math.max(1, Math.round(img.height * scale));
                    var ctx = c.getContext("2d");
                    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
                    ctx.drawImage(img, 0, 0, c.width, c.height);
                    out = c.toDataURL("image/jpeg", quality);
                    if (out.length <= MAX_CHARS) return resolve(out);
                    if (quality > 0.5) quality -= 0.1; else maxDim = Math.round(maxDim * 0.8);
                }
                reject(new Error("Image is too large to compress"));
            };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Could not read that image")); };
            img.src = url;
        });
    }

    $("fImage").addEventListener("change", function () {
        var f = this.files && this.files[0];
        var pv = $("preview");
        imageData = null; pv.classList.remove("visible");
        if (!f) return;
        msg($("addMsg"), "Processing image…");
        compress(f).then(function (d) {
            imageData = d; pv.src = d; pv.classList.add("visible"); msg($("addMsg"), "");
        }).catch(function (e) { msg($("addMsg"), e.message, "error"); });
    });

    $("addForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = $("addBtnSubmit");
        var body = {
            title: $("fTitle").value.trim(),
            description: $("fDesc").value.trim(),
            link: $("fLink").value.trim(),
            deadline: $("fDeadline").value.trim()
        };
        if (imageData) body.image = imageData;
        btn.disabled = true; msg($("addMsg"), "Publishing…");
        api.request("/" + kind, { method: "POST", body: body, admin: true })
            .then(function () {
                $("addForm").reset(); imageData = null; $("preview").classList.remove("visible");
                msg($("addMsg"), "Published!", "ok");
                loadList();
            })
            .catch(function (err) {
                msg($("addMsg"), err.message || "Could not publish", "error");
                if (!api.isAdmin()) show();
            })
            .then(function () { btn.disabled = false; });
    });

    show();
})();
