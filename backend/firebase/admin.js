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

let accessTokenCache = {
    token: null,
    expiry: 0
};

async function getAccessToken(env) {
    if (accessTokenCache.token && Date.now() < accessTokenCache.expiry) {
        return accessTokenCache.token;
    }

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
    if (data.error) throw new Error(`Token Error: ${data.error_description || data.error}`);
    
    accessTokenCache = {
        token: data.access_token,
        expiry: Date.now() + (parseInt(data.expires_in || 3600, 10) - 60) * 1000
    };
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

    const mapValue = (v) => {
        if (!v) return null;
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.timestampValue !== undefined) return v.timestampValue;
        if (v.nullValue !== undefined) return null;
        if (v.mapValue !== undefined) {
            const mFields = v.mapValue.fields || {};
            const mRes = {};
            for (const [mk, mv] of Object.entries(mFields)) {
                mRes[mk] = mapValue(mv);
            }
            return mRes;
        }
        if (v.arrayValue !== undefined) {
            return (v.arrayValue.values || []).map(mapValue);
        }
        return v;
    };

    const mapDoc = (doc) => {
        const fields = doc.fields || {};
        const res = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(fields)) {
            res[key] = mapValue(val);
        }
        return res;
    };

    const toValue = (v) => {
        if (v === null || v === undefined) return { nullValue: null }
        if (typeof v === 'boolean') return { booleanValue: v }
        if (typeof v === 'number') {
            // Firestore REST API requires strings for integerValue
            if (Number.isInteger(v)) return { integerValue: v.toString() }
            return { doubleValue: v }
        }
        if (typeof v === 'string') return { stringValue: v }
        if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
        if (typeof v === 'object') {
            const fields = {}
            for (const [k, val] of Object.entries(v)) {
                fields[k] = toValue(val)
            }
            return { mapValue: { fields } }
        }
        return { stringValue: String(v) }
    }

    return {
        firestore: () => ({
            collection: (col) => ({
                doc: (id) => ({
                    get: async () => {
                        const d = await request(`${col}/${id}`);
                        if (d.error) return { exists: false, data: () => ({}) };
                        return { exists: !!d.name, data: () => mapDoc(d) };
                    },
                    update: async (dataProps) => {
                        const fields = {}
                        const updateMask = []
                        for (const [k, v] of Object.entries(dataProps)) {
                            fields[k] = toValue(v)
                            updateMask.push(`updateMask.fieldPaths=${k}`)
                        }
                        const query = updateMask.join('&')
                        return request(`${col}/${id}?${query}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ fields })
                        })
                    },
                    set: async (dataProps) => {
                        const fields = {}
                        for (const [k, v] of Object.entries(dataProps)) {
                            fields[k] = toValue(v)
                        }
                        return request(`${col}/${id}`, {
                            method: 'PATCH', 
                            body: JSON.stringify({ fields })
                        })
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
