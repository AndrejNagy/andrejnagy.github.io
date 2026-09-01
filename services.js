// Self-hosted service dashboard, rendered into #services_status.
// Reads the status.json published by .github/workflows/status.yml onto the
// `status` branch. The probing happens in CI rather than here on purpose:
// everything sits behind Cloudflare, so a browser-side check would get an
// answer from Cloudflare even when the origin is dead and report "up".
(function () {
    var STATUS_URL =
        "https://raw.githubusercontent.com/AndrejNagy/andrejnagy.github.io/status/status.json";

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
        if (mins < 1)  { return "just now"; }
        if (mins === 1) { return "1 minute ago"; }
        if (mins < 60) { return mins + " minutes ago"; }
        var hrs = Math.round(mins / 60);
        if (hrs === 1) { return "1 hour ago"; }
        if (hrs < 24)  { return hrs + " hours ago"; }
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
        head.appendChild(el("span", "svc-badge svc-badge-" + state, LABELS[state] || "Unknown"));
        row.appendChild(head);

        if (svc.description) { row.appendChild(el("div", "svc-desc", svc.description)); }

        // code 0 means curl never got a reply at all (DNS / TLS / timeout)
        var detail = svc.code ? ("HTTP " + svc.code + " \u00b7 " + svc.ms + " ms")
                              : "no response";
        row.appendChild(el("div", "svc-meta", detail));
        return row;
    }

    function render(data) {
        var box = document.getElementById("services_status");
        if (!box) { return; }
        box.innerHTML = "";

        var list = el("div", "svc-grid");
        (data.services || []).forEach(function (svc) { list.appendChild(card(svc)); });
        box.appendChild(list);
        box.appendChild(el("div", "svc-foot",
            "Checked " + ago(data.checked_at) + " from GitHub Actions, every 15 minutes."));
    }

    function fail(message) {
        var box = document.getElementById("services_status");
        if (!box) { return; }
        box.innerHTML = "";
        box.appendChild(el("div", "svc-meta", message));
    }

    function load() {
        // cache-bust: raw.githubusercontent.com serves Cache-Control: max-age=300
        fetch(STATUS_URL + "?t=" + Date.now(), { cache: "no-store" })
            .then(function (r) {
                if (r.status === 404) {
                    throw new Error(
                        "No status published yet - run the 'Service status' " +
                        "workflow once to create the status branch.");
                }
                if (!r.ok) { throw new Error("HTTP " + r.status); }
                return r.json();
            })
            .then(render)
            .catch(function (e) { fail(e.message); });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", load);
    } else {
        load();
    }
    setInterval(load, 5 * 60 * 1000);
}());
