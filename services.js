// Self-hosted service dashboard, rendered into #services_status.
//
// Sources are tried in order. The Cloudflare Worker is preferred because its
// Cron Trigger actually holds a 15-minute cadence; the GitHub Actions output is
// kept as a fallback but GitHub throttled a '*/15' cron down to roughly one run
// every 190 minutes, so treat it as stale-but-better-than-nothing.
(function () {
    var SOURCES = [
        {
            // Replace <subdomain> with your workers.dev subdomain - `wrangler
            // deploy` prints the full URL. See worker/ in this repo.
            url: "https://nagy-status.<subdomain>.workers.dev",
            label: "Cloudflare Worker, every 15 minutes"
        },
        {
            url: "https://raw.githubusercontent.com/AndrejNagy/andrejnagy.github.io/status/status.json",
            label: "GitHub Actions (throttled, can lag hours)"
        }
    ];

    var LABELS = { up: "Up", down: "Down", degraded: "Degraded" };

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined) { node.textContent = text; }
        return node;
    }

    function ago(iso) {
        var then = Date.parse(iso);
        if (isNaN(then)) { return "unknown"; }
        var mins = Math.max(0, Math.round((Date.now() - then) / 60000));
        if (mins < 1)   { return "just now"; }
        if (mins === 1) { return "1 minute ago"; }
        if (mins < 60)  { return mins + " minutes ago"; }
        var hrs = Math.round(mins / 60);
        if (hrs === 1)  { return "1 hour ago"; }
        if (hrs < 24)   { return hrs + " hours ago"; }
        var days = Math.round(hrs / 24);
        return days === 1 ? "1 day ago" : days + " days ago";
    }

    function card(svc) {
        var state = LABELS[svc.status] ? svc.status : "unknown";

        var row = el("div", "svc-card");
        var head = el("div", "svc-head");
        head.appendChild(el("span", "svc-dot svc-" + state));

        var link = el("a", "svc-name", svc.name);
        link.href = svc.url;
        link.rel = "noopener";
        head.appendChild(link);
        head.appendChild(el("span", "pill pill-" + state, LABELS[state] || "Unknown"));
        row.appendChild(head);

        if (svc.description) { row.appendChild(el("div", "svc-desc", svc.description)); }

        // code 0 means the probe never got a reply at all (DNS / TLS / timeout)
        var detail = svc.code ? ("HTTP " + svc.code + " \u00b7 " + svc.ms + " ms")
                              : "no response";
        row.appendChild(el("div", "svc-meta", detail));
        return row;
    }

    function render(data, source) {
        var box = document.getElementById("services_status");
        if (!box) { return; }
        box.innerHTML = "";

        var list = el("div", "svc-grid");
        (data.services || []).forEach(function (svc) { list.appendChild(card(svc)); });
        box.appendChild(list);
        box.appendChild(el("div", "svc-foot",
            "Checked " + ago(data.checked_at) + " \u00b7 " + source.label));
    }

    function fail(message) {
        var box = document.getElementById("services_status");
        if (!box) { return; }
        box.innerHTML = "";
        box.appendChild(el("div", "svc-meta", message));
    }

    // Walk the source list until one answers with usable JSON.
    function loadFrom(i) {
        if (i >= SOURCES.length) {
            fail("No status source reachable right now.");
            return;
        }
        var source = SOURCES[i];
        if (source.url.indexOf("<subdomain>") !== -1) {   // not configured yet
            loadFrom(i + 1);
            return;
        }
        fetch(source.url + (source.url.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now(),
              { cache: "no-store" })
            .then(function (r) {
                if (!r.ok) { throw new Error("HTTP " + r.status); }
                return r.json();
            })
            .then(function (data) {
                if (!data || !data.services) { throw new Error("unexpected payload"); }
                render(data, source);
            })
            .catch(function () { loadFrom(i + 1); });
    }

    function load() { loadFrom(0); }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", load);
    } else {
        load();
    }
    setInterval(load, 5 * 60 * 1000);
}());
