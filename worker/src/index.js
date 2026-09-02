// Probes the self-hosted services and serves the result as JSON.
//
// Why a Worker rather than GitHub Actions: GitHub's scheduler honoured a
// '*/15' cron roughly once every 190 minutes, so the page was hours stale.
// Cloudflare's Cron Triggers actually run on time.
//
// Why not probe from the browser: every service sits behind Cloudflare, which
// answers with its own 52x error page when the origin is dead. A page-side
// check cannot read the status of an opaque cross-origin response and would
// report "up" almost unconditionally. Probing server-side sees the real code.

const SERVICES = [
    { name: "Dynmap",      url: "https://dynmap.nagy.lol/",      description: "Live map of the Minecraft world" },
    { name: "EarthWalker", url: "https://earthwalker.nagy.lol/", description: "Self-hosted GeoGuessr" },
    { name: "Jellyfin",    url: "https://jellyfin.nagy.lol/",    description: "Media server" },
];

const KV_KEY = "status";
const TIMEOUT_MS = 15000;

const ALLOWED_ORIGINS = new Set([
    "https://nagy.lol",
    "https://www.nagy.lol",
    "https://andrejnagy.github.io",
]);

function classify(code) {
    if (code >= 200 && code < 400) return "up";
    if (code === 0)                return "down";   // DNS / TLS / timeout
    if (code >= 520 && code <= 530) return "down";  // Cloudflare up, origin dead
    if (code >= 500)               return "down";
    return "degraded";
}

async function probe(svc) {
    const started = Date.now();
    let code = 0;
    try {
        const res = await fetch(svc.url, {
            method: "GET",
            redirect: "follow",
            signal: AbortSignal.timeout(TIMEOUT_MS),
            // Bypass the edge cache: we want to know about the origin, not
            // whether Cloudflare still holds a copy of the homepage.
            cf: { cacheTtl: 0, cacheEverything: false },
        });
        code = res.status;
    } catch (e) {
        code = 0;
    }
    return {
        name: svc.name,
        url: svc.url,
        description: svc.description,
        status: classify(code),
        code,
        ms: Date.now() - started,
    };
}

async function probeAll() {
    const services = await Promise.all(SERVICES.map(probe));
    return { checked_at: new Date().toISOString(), services };
}

function corsHeaders(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "content-type": "application/json; charset=UTF-8",
        // Clients may re-request freely; the data itself is refreshed by cron.
        "cache-control": "public, max-age=60",
    };
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        headers["access-control-allow-origin"] = origin;
        headers["vary"] = "Origin";
    }
    return headers;
}

export default {
    // Cron Trigger: probe and store.
    async scheduled(event, env, ctx) {
        const payload = await probeAll();
        await env.STATUS.put(KV_KEY, JSON.stringify(payload));
    },

    // HTTP: serve what the last cron stored.
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    ...corsHeaders(request),
                    "access-control-allow-methods": "GET, OPTIONS",
                    "access-control-max-age": "86400",
                },
            });
        }
        if (request.method !== "GET") {
            return new Response("method not allowed", { status: 405 });
        }

        let body = await env.STATUS.get(KV_KEY);
        if (!body) {
            // Cold start: nothing stored yet because no cron has fired. Probe
            // inline so the first visitor sees real data, and persist it.
            const payload = await probeAll();
            body = JSON.stringify(payload);
            ctx.waitUntil(env.STATUS.put(KV_KEY, body));
        }
        return new Response(body, { headers: corsHeaders(request) });
    },
};
