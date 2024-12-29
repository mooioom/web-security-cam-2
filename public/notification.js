class NotificationManager {
    constructor() {
        this.setupServiceWorker();
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/sw.js');
            this.requestNotificationPermission();
        }
    }

    async requestNotificationPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            this.setupNotifications();
        }
    }

    setupNotifications() {
        this.canNotify = true;
    }

    notify(title, options = {}) {
        if (this.canNotify) {
            const notification = new Notification(title, {
                icon: '/icon.png',
                badge: '/badge.png',
                ...options
            });
        }
    }
} 