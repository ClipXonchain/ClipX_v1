// Extension Auth Bridge
// This component helps sync Privy auth tokens to the Chrome extension

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export function ExtensionAuthBridge() {
    const { getAccessToken, authenticated } = usePrivy();

    useEffect(() => {
        const syncTokenToExtension = async () => {
            if (authenticated) {
                try {
                    const token = await getAccessToken();

                    // Store in localStorage for extension to access
                    if (token) {
                        localStorage.setItem('clipx_extension_token', token);
                        console.log('[ExtensionAuthBridge] Token stored in localStorage');
                    }

                    // Also send via postMessage for real-time sync
                    window.postMessage({
                        type: 'CLIPX_AUTH_TOKEN',
                        token: token,
                        userAddress: null
                    }, '*');

                    console.log('[ExtensionAuthBridge] Token sent to extension');
                } catch (e) {
                    console.error('[ExtensionAuthBridge] Failed to get token:', e);
                }
            } else {
                // Clear token when logged out
                localStorage.removeItem('clipx_extension_token');
            }
        };

        // Sync on mount and when auth state changes
        syncTokenToExtension();

        // Also sync periodically while authenticated
        const interval = setInterval(syncTokenToExtension, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [authenticated, getAccessToken]);

    return null; // This component doesn't render anything
}
