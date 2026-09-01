// Live status card for the Minecraft server, rendered into #mc_status.
// Uses api.mcsrvstat.us, which sends Access-Control-Allow-Origin: * and does the
// actual server ping for us, so this works from a static page with no backend.
(function () {
    var MC_HOST = "minecraft.nagy.lol";   // what players type into the client
    var API = "https://api.mcsrvstat.us/3/" + MC_HOST;

    // Pixel grass block, used whenever the server has no icon of its own.
    var GRASS_SVG =
        '<svg viewBox="0 0 16 16" preserveAspectRatio="none" shape-rendering="crispEdges"' +
        ' xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Minecraft">' +
        '<rect width="16" height="16" fill="#7a4f28"/>' +
        '<rect width="16" height="4" fill="#5ab552"/>' +
        '<rect y="4" width="16" height="1" fill="#4a9443"/>' +
        '<rect x="1" y="5" width="1" height="2" fill="#4a9443"/>' +
        '<rect x="6" y="5" width="1" height="2" fill="#4a9443"/>' +
        '<rect x="11" y="5" width="1" height="2" fill="#4a9443"/>' +
        '<rect x="2" y="8" width="2" height="2" fill="#6b4423"/>' +
        '<rect x="9" y="7" width="2" height="2" fill="#8d5e2f"/>' +
        '<rect x="5" y="11" width="2" height="2" fill="#6b4423"/>' +
        '<rect x="12" y="10" width="2" height="2" fill="#8d5e2f"/>' +
        '<rect x="7" y="10" width="1" height="1" fill="#8d5e2f"/>' +
        '</svg>';

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        // Always textContent, never innerHTML: the MOTD comes from a third-party
        // API and mcsrvstat's "html" field is markup we would be injecting blind.
        if (text !== undefined) { node.textContent = text; }
        return node;
    }

    function art(data) {
        var box = el("span", "media-art");
        // The API returns the server icon as a base64 PNG data URI when the
        // server has one. Check the prefix rather than trusting it blindly.
        var icon = data && typeof data.icon === "string" ? data.icon : "";
        if (icon.indexOf("data:image/png;base64,") === 0) {
            var img = document.createElement("img");
            img.src = icon;
            img.alt = "";
            box.appendChild(img);
        } else {
            box.innerHTML = GRASS_SVG;   // our own static markup, not API data
        }
        if (!(data && data.online)) { box.style.filter = "grayscale(1)"; box.style.opacity = ".55"; }
        return box;
    }

    function copyButton() {
        var btn = el("button", "btn-accent btn-sm", "Copy address");
        btn.type = "button";
        btn.addEventListener("click", function () {
            navigator.clipboard.writeText(MC_HOST).then(function () {
                btn.textContent = "Copied";
                setTimeout(function () { btn.textContent = "Copy address"; }, 1500);
            });
        });
        return btn;
    }

    function paint(state, label, data) {
        var box = document.getElementById("mc_status");
        if (!box) { return; }
        box.innerHTML = "";
        box.appendChild(art(data));

        var body = el("div", "media-body");
        var top = el("div", "media-top");
        top.appendChild(el("span", "media-title", MC_HOST));
        top.appendChild(el("span", "pill pill-" + state, label));
        body.appendChild(top);

        if (data && data.online) {
            if (data.motd && data.motd.clean && data.motd.clean.length) {
                body.appendChild(el("pre", "mc-motd media-sub", data.motd.clean.join("\n")));
            }

            var bits = [];
            if (data.players) { bits.push(data.players.online + " / " + data.players.max + " players"); }
            if (data.version) { bits.push("MC " + data.version); }
            // players.list only exists when the server has enable-query=true
            if (data.players && data.players.list && data.players.list.length) {
                bits.push(data.players.list.map(function (p) {
                    return typeof p === "string" ? p : p.name;
                }).join(", "));
            }
            if (bits.length) { body.appendChild(el("div", "media-meta", bits.join("  ·  "))); }

            var actions = el("div", "media-actions");
            actions.appendChild(copyButton());
            body.appendChild(actions);
        } else {
            body.appendChild(el("div", "media-sub",
                state === "unknown" ? "Could not reach the status API."
                                    : "Server is not responding right now."));
        }

        box.appendChild(body);
    }

    function load() {
        fetch(API, { cache: "no-store" })
            .then(function (r) {
                if (!r.ok) { throw new Error("HTTP " + r.status); }
                return r.json();
            })
            .then(function (data) {
                paint(data.online ? "up" : "down", data.online ? "Online" : "Offline", data);
            })
            .catch(function () { paint("unknown", "Unknown", null); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", load);
    } else {
        load();
    }
    // The API caches for ~5 min upstream, so refreshing faster than that is pointless.
    setInterval(load, 5 * 60 * 1000);
}());
