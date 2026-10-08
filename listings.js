(function () {
    var kind = document.body.getAttribute("data-kind");
    var api = window.JoblyAPI;
    var grid = document.getElementById("opGrid");
    var empty = document.getElementById("opEmpty");
    var count = document.getElementById("opCount");
    var search = document.getElementById("opSearch");
    var toastEl = document.getElementById("opToast");
    var addBtn = document.getElementById("addBtn");
    var items = [];
    var admin = api.isAdmin();

    if (admin) addBtn.hidden = false;

    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
    }

    function safeUrl(u) {
        try {
            var x = new URL(u);
            return x.protocol === "http:" || x.protocol === "https:" ? x.href : null;
        } catch (e) { return null; }
    }

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    function card(it) {
        var c = el("article", "op-card");
        if (it.imageUrl) {
            var img = el("img", "op-card-img");
            img.src = it.imageUrl; img.alt = it.title; img.loading = "lazy";
            c.appendChild(img);
        } else {
            c.appendChild(el("div", "op-card-img placeholder"));
        }
        var b = el("div", "op-card-body");
        if (it.deadline) b.appendChild(el("span", "op-chip", "Deadline: " + it.deadline));
        b.appendChild(el("h3", "", it.title));
        var p = el("p", "", it.description);
        b.appendChild(p);
        if ((it.description || "").length > 140) {
            var more = el("button", "op-more", "Read more");
            more.type = "button";
            more.onclick = function () {
                var open = p.classList.toggle("open");
                more.textContent = open ? "Show less" : "Read more";
            };
            b.appendChild(more);
        }
        var acts = el("div", "op-actions");
        var url = safeUrl(it.link);
        if (url) {
            var go = el("button", "op-btn primary", "Learn more");
            go.type = "button";
            go.onclick = function () { window.open(url, "_blank", "noopener,noreferrer"); };
            acts.appendChild(go);
        }
        if (admin) {
            var del = el("button", "op-btn danger", "Delete");
            del.type = "button";
            del.onclick = function () {
                if (!confirm("Delete this " + kind.slice(0, -1) + "?")) return;
                del.disabled = true;
                api.request("/" + kind + "/" + encodeURIComponent(it.id), { method: "DELETE", admin: true })
                    .then(function () {
                        items = items.filter(function (x) { return x.id !== it.id; });
                        render(); toast("Deleted");
                    })
                    .catch(function (e) { del.disabled = false; toast(e.message || "Could not delete"); });
            };
            acts.appendChild(del);
        }
        b.appendChild(acts);
        c.appendChild(b);
        return c;
    }

    function render() {
        var q = search.value.trim().toLowerCase();
        var list = items.filter(function (i) {
            return !q || (i.title + " " + i.description).toLowerCase().indexOf(q) !== -1;
        });
        grid.textContent = "";
        list.forEach(function (i) { grid.appendChild(card(i)); });
        count.textContent = list.length + " " + (list.length === 1 ? kind.slice(0, -1) : kind);
        empty.classList.toggle("visible", list.length === 0);
    }

    search.addEventListener("input", render);

    api.request("/" + kind)
        .then(function (data) {
            items = Array.isArray(data) ? data : (data && data[kind]) || [];
            render();
        })
        .catch(function (e) { render(); toast(e.message || "Could not load"); });
})();
