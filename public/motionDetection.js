class MotionDetector {
    constructor(videoElement, sensitivity = 25) {
        this.video = videoElement;
        this.sensitivity = 50 - sensitivity;
        this.canvas = document.getElementById('motionCanvas');
        this.context = this.canvas.getContext('2d');
        this.previousImageData = null;
        this.isDetecting = false;
        this.onMotionCallback = null;
        this.motionZones = new MotionZones(videoElement);
        this.lastDetectionTime = 0;
        this.pixelThreshold = 8;
        this.debounceTime = 200;
    }

    startDetection(callback) {
        this.onMotionCallback = callback;
        this.isDetecting = true;
        this.detectMotion();
    }

    stopDetection() {
        this.isDetecting = false;
        this.previousImageData = null;
    }

    detectMotion() {
        if (!this.isDetecting) return;

        // Match canvas size to video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        this.context.drawImage(this.video, 0, 0);
        const currentImageData = this.context.getImageData(
            0, 0, this.canvas.width, this.canvas.height
        );

        if (this.previousImageData) {
            const diff = this.compareFrames(currentImageData, this.previousImageData);
            
            // Debounce detections
            const now = Date.now();
            if (diff > (50 - this.sensitivity) && now - this.lastDetectionTime > this.debounceTime) {
                this.lastDetectionTime = now;
                if (this.onMotionCallback) {
                    this.onMotionCallback(diff);
                }
            }
        }

        this.previousImageData = currentImageData;
        requestAnimationFrame(() => this.detectMotion());
    }

    compareFrames(current, previous) {
        let totalDiff = 0;
        let pixelsChecked = 0;
        let activeZones = new Set();

        // Get dimensions
        const width = current.width;
        const height = current.height;

        // Check each pixel
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                // Get zone index (-1 means no zones, so check everywhere)
                const zoneIndex = this.motionZones.getZoneIndex(x, y);
                // Process pixel if in a zone or if no zones exist
                if (zoneIndex !== -1 || this.motionZones.zones.length === 0) {
                    const i = (y * width + x) * 4;
                    
                    // Compare RGB values (skip alpha)
                    const rDiff = Math.abs(current.data[i] - previous.data[i]);
                    const gDiff = Math.abs(current.data[i + 1] - previous.data[i + 1]);
                    const bDiff = Math.abs(current.data[i + 2] - previous.data[i + 2]);
                    
                    // Average difference for this pixel
                    const pixelDiff = (rDiff + gDiff + bDiff) / 3;
                    
                    // Only count significant changes
                    if (pixelDiff > this.pixelThreshold) {
                        totalDiff++;
                        // Only track zone if it exists
                        if (zoneIndex !== -1) {
                            activeZones.add(zoneIndex);
                        }
                    }
                    pixelsChecked++;
                }
            }
        }

        // If no pixels were checked, return 0
        if (pixelsChecked === 0) return 0;

        // Calculate motion percentage
        const motionPercentage = (totalDiff / pixelsChecked) * 400;

        // Only increment zone counters if motion threshold is exceeded
        if (motionPercentage > (50 - this.sensitivity) && this.motionZones.zones.length > 0) {
            activeZones.forEach(zoneIndex => {
                this.motionZones.incrementZoneCounter(zoneIndex);
            });
        }

        return motionPercentage;
    }
} 