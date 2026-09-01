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

    // --- Minecraft MOTD rendering -----------------------------------------
    // The API also ships a pre-rendered "html" field, but that would mean
    // innerHTML-ing third-party markup. Parsing the section codes ourselves
    // costs ~40 lines and every glyph still goes in via textContent.
    var MC_COLORS = {
        "0": "#000000", "1": "#0000aa", "2": "#00aa00", "3": "#00aaaa",
        "4": "#aa0000", "5": "#aa00aa", "6": "#ffaa00", "7": "#aaaaaa",
        "8": "#555555", "9": "#5555ff", "a": "#55ff55", "b": "#55ffff",
        "c": "#ff5555", "d": "#ff55ff", "e": "#ffff55", "f": "#ffffff"
    };
    var OBF_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!@#$%&";
    var obfTimer = null;

    // Minecraft draws each glyph with a drop shadow at a quarter brightness.
    function shadowOf(hex) {
        var n = parseInt(hex.slice(1), 16);
        var r = (n >> 16 & 255) >> 2, g = (n >> 8 & 255) >> 2, b = (n & 255) >> 2;
        return "rgb(" + r + "," + g + "," + b + ")";
    }

    function parseMotd(line) {
        var runs = [];
        var st = { color: "#ffffff", bold: false, italic: false,
                   underline: false, strike: false, obf: false };
        var buf = "";
        function flush() {
            if (buf) { runs.push({ text: buf, color: st.color, bold: st.bold,
                                   italic: st.italic, underline: st.underline,
                                   strike: st.strike, obf: st.obf }); }
            buf = "";
        }
        for (var i = 0; i < line.length; i++) {
            if (line[i] !== "\u00a7" || i + 1 >= line.length) { buf += line[i]; continue; }
            var code = line[++i].toLowerCase();

            // 1.16+ hex: the x is followed by six more section-escaped nibbles
            if (code === "x" && i + 12 < line.length) {
                var hex = "#";
                for (var k = 0; k < 6; k++) { hex += line[i + 2 + k * 2]; }
                i += 12;
                flush(); st.color = hex;
                st.bold = st.italic = st.underline = st.strike = st.obf = false;
                continue;
            }
            flush();
            if (MC_COLORS[code]) {
                // a colour code also clears every active style
                st.color = MC_COLORS[code];
                st.bold = st.italic = st.underline = st.strike = st.obf = false;
            } else if (code === "k") { st.obf = true; }
            else if (code === "l") { st.bold = true; }
            else if (code === "m") { st.strike = true; }
            else if (code === "n") { st.underline = true; }
            else if (code === "o") { st.italic = true; }
            else if (code === "r") {
                st.color = "#ffffff";
                st.bold = st.italic = st.underline = st.strike = st.obf = false;
            }
        }
        flush();
        return runs;
    }

    function scramble(len) {
        var out = "";
        for (var i = 0; i < len; i++) {
            out += OBF_CHARS.charAt(Math.floor(Math.random() * OBF_CHARS.length));
        }
        return out;
    }

    function renderMotd(lines, cleanLines) {
        var wrap = el("div", "mc-motd");
        // Screen readers get the plain text; the spans below are decorative.
        wrap.setAttribute("aria-label", cleanLines.join(" "));
        var obfNodes = [];

        lines.forEach(function (line) {
            var row = el("div", "mc-line");
            parseMotd(line).forEach(function (run) {
                var cls = "";
                if (run.bold)      { cls += " mc-b"; }
                if (run.italic)    { cls += " mc-i"; }
                if (run.underline) { cls += " mc-u"; }
                if (run.strike)    { cls += " mc-s"; }
                var span = el("span", cls.trim() || null, run.text);
                span.style.color = run.color;
                span.style.textShadow = "1px 1px 0 " + shadowOf(run.color);
                if (run.obf) {
                    // keep spaces intact, exactly as the game does
                    obfNodes.push({ node: span, tpl: run.text });
                }
                row.appendChild(span);
            });
            wrap.appendChild(row);
        });

        if (obfTimer) { clearInterval(obfTimer); obfTimer = null; }
        if (obfNodes.length) {
            var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            var tick = function () {
                obfNodes.forEach(function (o) {
                    o.node.textContent = o.tpl.replace(/\S/g, function () {
                        return OBF_CHARS.charAt(Math.floor(Math.random() * OBF_CHARS.length));
                    });
                });
            };
            tick();
            if (!still) { obfTimer = setInterval(tick, 70); }
        }
        return wrap;
    }

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
            // If the payload passes the prefix check but isn't a decodable PNG,
            // fall back rather than leaving an empty box.
            img.addEventListener("error", function () { box.innerHTML = GRASS_SVG; });
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
        if (obfTimer) { clearInterval(obfTimer); obfTimer = null; }
        box.innerHTML = "";
        box.appendChild(art(data));

        var body = el("div", "media-body");
        var top = el("div", "media-top");
        top.appendChild(el("span", "media-title", MC_HOST));
        top.appendChild(el("span", "pill pill-" + state, label));
        body.appendChild(top);

        if (data && data.online) {
            if (data.motd && data.motd.raw && data.motd.raw.length) {
                body.appendChild(renderMotd(data.motd.raw, data.motd.clean || data.motd.raw));
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
