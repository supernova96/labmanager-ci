import api from './api';
import { toast } from 'react-toastify';

interface OfflineRequest {
    id: string;
    url: string;
    method: string;
    data: any;
    timestamp: number;
}

const STORAGE_KEY = 'offline_queue';

export const OfflineManager = {
    saveRequest: (config: any) => {
        const queue: OfflineRequest[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const request: OfflineRequest = {
            id: crypto.randomUUID(),
            url: config.url,
            method: config.method,
            data: config.data,
            timestamp: Date.now()
        };
        queue.push(request);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        toast.info('Sin conexión. Solicitud guardada para sincronizar luego.');
    },

    sync: async () => {
        const queue: OfflineRequest[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (queue.length === 0) return;

        toast.info(`Sincronizando ${queue.length} solicitudes pendientes...`);

        const failed: OfflineRequest[] = [];

        for (const req of queue) {
            try {
                await api.request({
                    url: req.url,
                    method: req.method,
                    data: req.data
                });
            } catch (error) {
                console.error('Sync failed for request:', req);
                // If it's a 4xx error (validation), don't retry. If 5xx or Network, retry.
                // @ts-ignore
                if (!error.response || error.response.status >= 500) {
                    failed.push(req);
                }
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(failed));

        if (failed.length === 0) {
            toast.success('¡Sincronización completada!');
            // Refresh page to show updated data
            window.location.reload();
        } else {
            toast.warning(`${failed.length} solicitudes no se pudieron sincronizar.`);
        }
    }
};

// Auto-sync listener
window.addEventListener('online', () => {
    OfflineManager.sync();
});

// Sync on load if online
if (navigator.onLine) {
    OfflineManager.sync();
}
