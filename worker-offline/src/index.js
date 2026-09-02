// One shared "the server is off" screen for every self-hosted subdomain.
//
// This exists because when the box is off, nothing of ours is running - not
// Jellyfin, not SWAG, not nginx - so the error page has to be served by
// Cloudflare. Custom Error Pages would do this natively but they are Pro+
// (Free gets 0 error rules), so a Worker on the route is the free equivalent.
//
// Scope is deliberately narrow: ONLY Cloudflare's own 52x codes, which mean
// "Cloudflare could not reach your origin". Origin 5xx responses are passed
// through untouched, because Jellyfin's API returns 500s as normal protocol
// and replacing those with a full-page gif would break the app. Container-down
// (502 from nginx) stays the job of the SWAG error page, which is styled to
// match this one so the two are indistinguishable to a visitor.

// 520-527 + 530: Cloudflare-generated "origin unreachable" family.
const ORIGIN_UNREACHABLE = new Set([520, 521, 522, 523, 524, 525, 526, 527, 530]);

const GIF = "https://nagy.lol/triggered_nagy_high_res.gif";

const REASONS = {
    521: "Server je vypnutý.",
    522: "Server neodpovedá.",
    523: "Server je nedostupný.",
    524: "Server odpovedá príliš pomaly.",
};

function page(host, code) {
    const reason = REASONS[code] || "Server je dole.";
    return `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${code} &ndash; ${host}</title>
<link rel="icon" type="image/x-icon" href="https://nagy.lol/icon.png">
<style>
:root{--bg:#fff;--surface:#f7f8fa;--border:#e2e6eb;--text:#14171a;--dim:#5b6570;
--accent:#008bda;--accent-hi:#0073b6;--on-accent:#fff}
@media(prefers-color-scheme:dark){:root{--bg:#121212;--surface:#181818;--border:#2b2b2b;
--text:#f2f2f2;--dim:#a7a7a7;--accent:#00a2fe;--accent-hi:#69bcff;--on-accent:#051018}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;
justify-content:center;padding:32px 20px;text-align:center;background:var(--bg);color:var(--text);
font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
h1{font-size:clamp(72px,20vw,168px);margin:0;line-height:.9;letter-spacing:-.05em;font-weight:700}
p{margin:10px 0 0;font-size:17px;color:var(--dim)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;
background:var(--surface);border:1px solid var(--border);padding:2px 7px;border-radius:6px}
figure{margin:26px 0 0;padding:10px;background:var(--surface);border:1px solid var(--border);
border-radius:16px;max-width:min(92vw,520px)}
img{display:block;width:100%;height:auto;border-radius:9px}
a{margin-top:24px;display:inline-block;padding:11px 22px;border-radius:999px;
background:var(--accent);color:var(--on-accent);text-decoration:none;font-weight:600;font-size:14px}
a:hover{background:var(--accent-hi)}
</style>
</head>
<body>
<h1>${code}</h1>
<p>${reason}</p>
<p style="margin-top:6px"><code>${host}</code></p>
<figure><img src="${GIF}" alt="Triggered Nagy"></figure>
<a href="https://nagy.lol/">nagy.lol</a>
</body>
</html>`;
}

function offlineResponse(request, code) {
    const host = new URL(request.url).hostname;
    return new Response(page(host, code), {
        // Keep the real status code. Returning 200 here would make this page
        // look like a healthy response to the status probe and to any monitor.
        status: code,
        headers: {
            "content-type": "text/html; charset=UTF-8",
            "cache-control": "no-store",
            "retry-after": "120",
        },
    });
}

export default {
    async fetch(request, env, ctx) {
        // WebSocket upgrades must pass through untouched - Jellyfin uses them.
        const upgrade = request.headers.get("Upgrade");
        if (upgrade && upgrade.toLowerCase() === "websocket") {
            return fetch(request);
        }

        let res;
        try {
            res = await fetch(request);
        } catch (e) {
            // Could not even get a response object: treat as origin down.
            return offlineResponse(request, 522);
        }

        if (ORIGIN_UNREACHABLE.has(res.status)) {
            return offlineResponse(request, res.status);
        }
        return res;   // untouched, body streamed, Range/redirects intact
    },
};
