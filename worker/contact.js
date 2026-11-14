function jsonResponse(body, status, headers) {
    return new Response(JSON.stringify(body), {
        status: status,
        headers: Object.assign({
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        }, headers)
    });
}

async function readBoundedBody(request, maxBytes) {
    if (!request.body) return '';

    const reader = request.body.getReader();
    const chunks = [];
    let length = 0;
    while (true) {
        const result = await reader.read();
        if (result.done) break;
        length += result.value.byteLength;
        if (length > maxBytes) {
            await reader.cancel();
            return null;
        }
        chunks.push(result.value);
    }

    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin');
        if (!origin || origin !== env.ALLOWED_ORIGIN) {
            return new Response('Forbidden', { status: 403 });
        }

        const corsHeaders = {
            'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Vary': 'Origin'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }
        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
        }
        if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) {
            return jsonResponse({ error: 'Unsupported media type' }, 415, corsHeaders);
        }
        if (!env.DISCORD_WEBHOOK_URL || !env.CONTACT_LIMITER) {
            return jsonResponse({ error: 'Contact service unavailable' }, 503, corsHeaders);
        }

        const clientIp = request.headers.get('CF-Connecting-IP');
        if (!clientIp) {
            return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
        }
        const rateLimit = await env.CONTACT_LIMITER.limit({ key: clientIp });
        if (!rateLimit.success) {
            return jsonResponse({ error: 'Too many requests' }, 429, corsHeaders);
        }

        const contentLength = Number(request.headers.get('Content-Length') || 0);
        if (contentLength > 8192) {
            return jsonResponse({ error: 'Request too large' }, 413, corsHeaders);
        }

        const rawBody = await readBoundedBody(request, 8192);
        if (rawBody === null) {
            return jsonResponse({ error: 'Request too large' }, 413, corsHeaders);
        }

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (error) {
            return jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders);
        }
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders);
        }

        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const message = typeof body.message === 'string' ? body.message.trim() : '';
        if (
            !name || name.length > 100 ||
            !email || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            !message || message.length > 1000
        ) {
            return jsonResponse({ error: 'Invalid contact details' }, 400, corsHeaders);
        }

        let webhook;
        try {
            webhook = new URL(env.DISCORD_WEBHOOK_URL);
        } catch (error) {
            return jsonResponse({ error: 'Contact service unavailable' }, 503, corsHeaders);
        }
        if (
            webhook.protocol !== 'https:' ||
            webhook.hostname !== 'discord.com' ||
            !/^\/api\/webhooks\/\d+\/[^/]+$/.test(webhook.pathname)
        ) {
            return jsonResponse({ error: 'Contact service unavailable' }, 503, corsHeaders);
        }

        const discordResponse = await fetch(webhook.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Portfolio contact',
                allowed_mentions: { parse: [] },
                embeds: [{
                    title: 'New message from the portfolio',
                    color: 547284,
                    fields: [
                        { name: 'Name', value: name, inline: true },
                        { name: 'Email', value: email, inline: true },
                        { name: 'Message', value: message }
                    ],
                    timestamp: new Date().toISOString()
                }]
            }),
            redirect: 'error'
        });
        if (!discordResponse.ok) {
            return jsonResponse({ error: 'Message delivery failed' }, 502, corsHeaders);
        }

        return jsonResponse({ ok: true }, 200, corsHeaders);
    }
};
