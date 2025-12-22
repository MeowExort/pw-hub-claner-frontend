export function parseJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function isTokenExpired(token: string, thresholdSeconds: number = 60): boolean {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    // Expired if current time + threshold > expiration time
    return now + thresholdSeconds >= payload.exp;
}
