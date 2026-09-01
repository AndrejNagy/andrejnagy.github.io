// Live status card for the Minecraft server, rendered into #mc_status.
// Uses api.mcsrvstat.us, which sends Access-Control-Allow-Origin: * and does the
// actual server ping for us, so this works from a static page with no backend.
(function () {
    var MC_HOST = "minecraft.nagy.lol";   // what players type into the client
    var API = "https://api.mcsrvstat.us/3/" + MC_HOST;

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        // Always textContent, never innerHTML: the MOTD comes from a third-party
        // API and mcsrvstat's "html" field is markup we would be injecting blind.
        if (text !== undefined) { node.textContent = text; }
        return node;
    }

    function render(data) {
        var box = document.getElementById("mc_status");
        if (!box) { return; }
        box.innerHTML = "";

        var online = !!(data && data.online);
        var head = el("div", "svc-head");
        head.appendChild(el("span", "svc-dot " + (online ? "svc-up" : "svc-down")));
        head.appendChild(el("strong", null, online ? "Online" : "Offline"));
        if (online && data.players) {
            head.appendChild(el("span", "svc-meta",
                data.players.online + " / " + data.players.max + " players"));
        }
        if (online && data.version) {
            head.appendChild(el("span", "svc-meta", "MC " + data.version));
        }
        box.appendChild(head);

        if (online && data.motd && data.motd.clean && data.motd.clean.length) {
            box.appendChild(el("pre", "mc-motd", data.motd.clean.join("\n")));
        }

        // players.list only exists when the server has enable-query=true
        if (online && data.players && data.players.list && data.players.list.length) {
            var names = data.players.list.map(function (p) {
                return typeof p === "string" ? p : p.name;
            });
            box.appendChild(el("div", "svc-meta", "Online now: " + names.join(", ")));
        }

        var addr = el("div", "svc-meta");
        addr.appendChild(el("span", null, "Connect: "));
        addr.appendChild(el("code", null, MC_HOST));
        box.appendChild(addr);
    }

    function fail(message) {
        var box = document.getElementById("mc_status");
        if (!box) { return; }
        box.innerHTML = "";
        var head = el("div", "svc-head");
        head.appendChild(el("span", "svc-dot svc-unknown"));
        head.appendChild(el("strong", null, "Status unavailable"));
        box.appendChild(head);
        box.appendChild(el("div", "svc-meta", message));
    }

    function load() {
        fetch(API, { cache: "no-store" })
            .then(function (r) {
                if (!r.ok) { throw new Error("api returned HTTP " + r.status); }
                return r.json();
            })
            .then(render)
            .catch(function (e) { fail("Could not reach api.mcsrvstat.us (" + e.message + ")"); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", load);
    } else {
        load();
    }
    // The API caches for ~5 min upstream, so refreshing faster than that is pointless.
    setInterval(load, 5 * 60 * 1000);
}());
