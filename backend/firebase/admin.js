// backend/firebase/admin.js (REST Edition for Cloudflare Workers)
import { createLocalJWKSet, jwtVerify } from 'jose'

let jwkSetCache = null;

async function signJWT(serviceAccount) {
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '');
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
    })).replace(/=/g, '');

    const message = `${header}.${payload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const pemContents = serviceAccount.private_key
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s/g, '');
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const key = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey.buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return `${message}.${signatureBase64}`;
}

async function getAccessToken(env) {
    const b64 = env.FIREBASE_SERVICE_ACCOUNT_B64 || process.env.FIREBASE_SERVICE_ACCOUNT_B64;
    if (!b64) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_B64');
    const serviceAccount = JSON.parse(atob(b64));
    const jwt = await signJWT(serviceAccount);
    const resp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    const data = await resp.json();
    return data.access_token;
}

export async function verifyIdToken(token, projectId) {
    if (!jwkSetCache) {
        const resp = await fetch('https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com');
        const jwks = await resp.json();
        jwkSetCache = createLocalJWKSet(jwks);
    }
    const { payload } = await jwtVerify(token, jwkSetCache, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
    });
    return payload;
}

export function getAdmin(env) {
    const projectId = env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'traxelon-final';
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

    const request = async (path, options = {}) => {
        const token = await getAccessToken(env);
        const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
        const resp = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await resp.json();
        return data;
    };

    const mapDoc = (doc) => {
        const fields = doc.fields || {};
        const res = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(fields)) {
            if (val.stringValue !== undefined) res[key] = val.stringValue;
            else if (val.integerValue !== undefined) res[key] = parseInt(val.integerValue, 10);
            else if (val.doubleValue !== undefined) res[key] = parseFloat(val.doubleValue);
            else if (val.booleanValue !== undefined) res[key] = val.booleanValue;
            else if (val.timestampValue !== undefined) res[key] = val.timestampValue;
            else if (val.mapValue !== undefined) res[key] = val.mapValue.fields; 
            else if (val.arrayValue !== undefined) res[key] = (val.arrayValue.values || []).map(v => Object.values(v)[0]);
            else res[key] = val;
        }
        return res;
    };

    return {
        firestore: () => ({
            collection: (col) => ({
                doc: (id) => ({
                    get: async () => {
                        const d = await request(`${col}/${id}`);
                        return { exists: !!d.name, data: () => mapDoc(d) };
                    },
                    delete: () => request(`${col}/${id}`, { method: 'DELETE' }),
                    collection: (sub) => ({
                        get: async () => {
                            const data = await request(`${col}/${id}/${sub}?pageSize=100`);
                            return { docs: (data.documents || []).map(d => ({ id: d.name.split('/').pop(), data: () => mapDoc(d) })) };
                        }
                    })
                }),
                get: async () => {
                    const data = await request(`${col}?pageSize=100`);
                    return { docs: (data.documents || []).map(d => ({ id: d.name.split('/').pop(), data: () => mapDoc(d) })) };
                }
            }),
            batch: () => ({ commit: () => {} })
        }),
        auth: () => ({
            deleteUser: async (uid) => {
                const token = await getAccessToken(env);
                await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:delete`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ localId: uid })
                });
            }
        }),
        FieldValue: { increment: (n) => ({ integerValue: n }), delete: () => null }
    };
}

export default { getAdmin, verifyIdToken };
