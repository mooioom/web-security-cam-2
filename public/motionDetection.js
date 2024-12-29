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

        // Get dimensions
        const width = current.width;
        const height = current.height;

        // Check each pixel
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                // Only check pixels in detection zones
                if (this.motionZones.isInDetectionZone(x, y)) {
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
                    }
                    pixelsChecked++;
                }
            }
        }

        // If no pixels were checked (no zones), return 0
        if (pixelsChecked === 0) return 0;

        // Return percentage of pixels that changed significantly
        return (totalDiff / pixelsChecked) * 400;
    }
} 