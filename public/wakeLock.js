class WakeLockManager {
    constructor() {
        this.wakeLock = null;
    }

    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock is active');
                this.wakeLock.addEventListener('release', () => {
                    console.log('Wake lock was released');
                });
            } else {
                this.fallbackPreventSleep();
            }
        } catch (err) {
            console.error(`Wake lock request failed: ${err.name}, ${err.message}`);
            this.fallbackPreventSleep();
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock !== null) {
            await this.wakeLock.release();
            this.wakeLock = null;
            console.log('Wake lock released');
        }
        if (this.keepAwakeInterval) {
            clearInterval(this.keepAwakeInterval);
        }
    }

    fallbackPreventSleep() {
        this.keepAwakeInterval = setInterval(() => {
            console.log('Keeping awake...');
            document.body.style.visibility = 'hidden';
            document.body.style.visibility = 'visible';
        }, 50000);
    }
} 