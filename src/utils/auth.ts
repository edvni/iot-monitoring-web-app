// src/utils/auth.ts

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const AUTH_KEY = (() => {
    const parts = ['a', 'u', 'th', '_k', 'ey'];
    return parts.join('');
})();

export const secureAuth = {
    async setAuthenticated() {
        const token = `${Date.now()}_${crypto.randomUUID()}`;
        const signedToken = await this.signToken(token);
        localStorage.setItem(AUTH_KEY, signedToken);
    },

    async isAuthenticated() {
    const signedToken = localStorage.getItem(AUTH_KEY);
    if (!signedToken) return false;
    
    const isValid = await this.verifyToken(signedToken);
    if (!isValid) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    
    const [timestamp] = atob(signedToken.split('.')[0]).split('_');
    return Date.now() - Number(timestamp) < 86400000; // 24h expiry
  },

  async signToken(token: string) {
    const secret = import.meta.env.VITE_APP_HMAC_SECRET;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
        );
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(token)
        );
        return `${btoa(token)}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
    },

    async verifyToken(signedToken: string) {
        const [encodedToken, encodedSig] = signedToken.split('.');
        if (!encodedToken || !encodedSig) return false;

        try {
            const token = atob(encodedToken);
            const signature = Uint8Array.from(atob(encodedSig), c => c.charCodeAt(0));

            const secret = import.meta.env.VITE_APP_HMAC_SECRET;
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(secret),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['verify']
            );

            return await crypto.subtle.verify(
                'HMAC',
                key,
                signature,
                encoder.encode(token)
            );
        } catch {
            return false; // Handle any errors in decoding or verification
        }
    },

    async logout() {
        localStorage.removeItem(AUTH_KEY);
        window.location.reload(); // Reload the page to show the password gate again
    },

    clear() {
        localStorage.removeItem(AUTH_KEY);
    }
}