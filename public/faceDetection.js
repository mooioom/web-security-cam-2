class FaceDetector {
    constructor(videoElement) {
        this.video = videoElement;
        this.faceAPI = new FaceDetector();
        this.isDetecting = false;
    }

    async startDetection() {
        this.isDetecting = true;
        this.detect();
    }

    stopDetection() {
        this.isDetecting = false;
    }

    async detect() {
        if (!this.isDetecting) return;

        try {
            const faces = await this.faceAPI.detect(this.video);
            if (faces.length > 0) {
                this.onFaceDetected(faces);
            }
        } catch (error) {
            console.error('Face detection error:', error);
        }

        requestAnimationFrame(() => this.detect());
    }

    onFaceDetected(faces) {
        // Trigger special alert for face detection
    }
} 