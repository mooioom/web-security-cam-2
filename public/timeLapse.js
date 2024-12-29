class TimeLapse {
    constructor() {
        this.frames = [];
        this.isRecording = false;
        this.interval = 1000; // 1 frame per second
    }

    startRecording(canvas) {
        this.isRecording = true;
        this.recordInterval = setInterval(() => {
            this.frames.push(canvas.toDataURL('image/jpeg', 0.7));
        }, this.interval);
    }

    stopRecording() {
        this.isRecording = false;
        clearInterval(this.recordInterval);
    }

    async generateVideo() {
        const video = document.createElement('video');
        const mediaRecorder = new MediaRecorder(video.captureStream());
        const chunks = [];

        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            this.downloadVideo(url);
        };

        mediaRecorder.start();

        for (const frame of this.frames) {
            const img = new Image();
            img.src = frame;
            await new Promise(resolve => setTimeout(resolve, 100));
            video.currentTime = this.frames.indexOf(frame) / 10;
        }

        mediaRecorder.stop();
    }

    downloadVideo(url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `timelapse-${new Date().toISOString()}.webm`;
        a.click();
    }
} 