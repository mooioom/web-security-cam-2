class SecurityCamera {
    constructor() {
        this.video = document.getElementById('camera');
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.statusElement = document.getElementById('status');
        this.motionStatus = document.getElementById('motionStatus');
        this.sensitivityInput = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.alarmSelect = document.getElementById('alarmSound');
        this.customSoundInput = document.getElementById('customSound');
        this.testSoundButton = document.getElementById('testSound');
        
        this.stream = null;
        this.wakeLockManager = new WakeLockManager();
        this.motionDetector = new MotionDetector(this.video);
        this.audio = new Audio();
        this.customAudioURL = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startCamera());
        this.stopButton.addEventListener('click', () => this.stopCamera());
        
        this.sensitivityInput.addEventListener('input', () => {
            const value = this.sensitivityInput.value;
            this.sensitivityValue.textContent = value;
            this.motionDetector.sensitivity = parseInt(value);
        });
        
        this.alarmSelect.addEventListener('change', () => {
            if (this.alarmSelect.value === 'custom') {
                this.customSoundInput.click();
            } else {
                this.setAlarmSound(this.alarmSelect.value);
            }
        });
        
        this.customSoundInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (this.customAudioURL) {
                    URL.revokeObjectURL(this.customAudioURL);
                }
                this.customAudioURL = URL.createObjectURL(file);
                this.setAlarmSound(this.customAudioURL);
            }
        });
        
        this.testSoundButton.addEventListener('click', () => {
            this.playAlarm();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.stream) {
                this.wakeLockManager.requestWakeLock();
            } else {
                this.wakeLockManager.releaseWakeLock();
            }
        });
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            this.video.srcObject = this.stream;
            await this.video.play();
            
            this.startButton.disabled = true;
            this.stopButton.disabled = false;
            this.statusElement.textContent = 'Camera active';
            
            await this.wakeLockManager.requestWakeLock();
            this.startMotionDetection();
            this.setAlarmSound(this.alarmSelect.value);
        } catch (err) {
            console.error('Camera access failed:', err);
            this.statusElement.textContent = 'Camera access failed';
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            this.motionDetector.stopDetection();
            this.wakeLockManager.releaseWakeLock();
            
            this.startButton.disabled = false;
            this.stopButton.disabled = true;
            this.statusElement.textContent = 'Camera inactive';
            this.motionStatus.textContent = 'No motion detected';
            this.motionStatus.classList.remove('motion-detected');
        }
    }

    startMotionDetection() {
        this.motionDetector.startDetection((diff) => {
            this.motionStatus.textContent = `Motion detected! (Difference: ${diff.toFixed(2)}%)`;
            this.motionStatus.classList.add('motion-detected');
            this.playAlarm();
            
            // Reset the motion status after 2 seconds
            setTimeout(() => {
                this.motionStatus.classList.remove('motion-detected');
                this.motionStatus.textContent = 'No motion detected';
            }, 2000);
        });
    }

    setAlarmSound(soundPath) {
        if (soundPath.startsWith('blob:')) {
            this.audio.src = soundPath;
        } else {
            this.audio.src = `audio/${soundPath}`;
        }
    }

    playAlarm() {
        this.audio.currentTime = 0;
        this.audio.play();
    }
}

// Initialize the application
const app = new SecurityCamera(); 