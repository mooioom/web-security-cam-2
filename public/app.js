class SecurityCamera {
    constructor() {
        this.video = document.getElementById('camera');
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.statusElement = document.getElementById('status');
        this.motionStatus = document.getElementById('motionStatus');
        this.sensitivityInput = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.alarmSelect = document.getElementById('alarmSound');
        this.customSoundInput = document.getElementById('customSound');
        this.testSoundButton = document.getElementById('testSound');
        
        this.isPaused = false;
        this.stream = null;
        this.wakeLockManager = new WakeLockManager();
        this.motionDetector = new MotionDetector(this.video);
        this.audio = new Audio();
        
        this.setupEventListeners();
        
        // Load saved settings
        this.loadSettings();
        
        // Add settings save on changes
        this.setupSettingsSave();
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startCamera());
        this.stopButton.addEventListener('click', () => this.stopCamera());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        
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
                localStorage.setItem('alarmSound', this.alarmSelect.value);
            }
        });
        
        this.customSoundInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const tempURL = URL.createObjectURL(file);
                this.audio.src = tempURL;
                // Cleanup the URL after the audio loads
                this.audio.onload = () => URL.revokeObjectURL(tempURL);
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
            this.pauseButton.disabled = false;
            this.statusElement.textContent = 'Camera active';
            
            await this.wakeLockManager.requestWakeLock();
            if (!this.isPaused) {
                this.startMotionDetection();
            }
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
            this.pauseButton.disabled = true;
            this.statusElement.textContent = 'Camera inactive';
            this.motionStatus.textContent = 'No motion detected';
            this.motionStatus.classList.remove('motion-detected');
            this.motionStatus.classList.remove('paused');
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
        if (soundPath !== 'custom') {
            this.audio.src = `audio/${soundPath}`;
        }
    }

    playAlarm() {
        if (this.isPaused) return;
        
        this.audio.currentTime = 0;
        this.audio.play();
    }

    loadSettings() {
        try {
            // Load sensitivity
            const savedSensitivity = localStorage.getItem('sensitivity');
            if (savedSensitivity) {
                this.sensitivityInput.value = savedSensitivity;
                this.sensitivityValue.textContent = savedSensitivity;
                this.motionDetector.sensitivity = parseInt(savedSensitivity);
            }

            // Load selected alarm sound (only system sounds)
            const savedAlarmSound = localStorage.getItem('alarmSound');
            if (savedAlarmSound && savedAlarmSound !== 'custom') {
                this.alarmSelect.value = savedAlarmSound;
                this.setAlarmSound(savedAlarmSound);
            } else {
                // Default to first sound
                this.alarmSelect.value = 'alarm1.mp3';
                this.setAlarmSound('alarm1.mp3');
            }

            // Load detection zones
            const savedZones = localStorage.getItem('detectionZones');
            if (savedZones) {
                this.motionDetector.motionZones.zones = JSON.parse(savedZones);
                this.motionDetector.motionZones.drawZones();
            }

            // Load pause state
            const savedPauseState = localStorage.getItem('isPaused');
            if (savedPauseState) {
                this.isPaused = savedPauseState === 'true';
                if (this.isPaused) {
                    this.pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume Detection';
                    this.motionStatus.textContent = 'Detection paused';
                    this.motionStatus.classList.add('paused');
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    setupSettingsSave() {
        // Save sensitivity changes
        this.sensitivityInput.addEventListener('change', () => {
            const value = this.sensitivityInput.value;
            localStorage.setItem('sensitivity', value);
        });

        // Simplified alarm sound saving
        this.alarmSelect.addEventListener('change', () => {
            if (this.alarmSelect.value !== 'custom') {
                localStorage.setItem('alarmSound', this.alarmSelect.value);
            }
        });

        // Remove custom sound saving
        this.customSoundInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // No longer saving custom sounds
            }
        });
    }

    // Add method to save zones
    saveZones() {
        if (this.motionDetector && this.motionDetector.motionZones) {
            const zones = this.motionDetector.motionZones.zones;
            localStorage.setItem('detectionZones', JSON.stringify(zones));
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pauseButton.innerHTML = '<i class="fas fa-play"></i> Resume Detection';
            this.motionStatus.textContent = 'Detection paused';
            this.motionStatus.classList.add('paused');
            this.motionDetector.stopDetection();
            this.audio.pause();
            this.audio.currentTime = 0;
        } else {
            this.pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pause Detection';
            this.motionStatus.textContent = 'No motion detected';
            this.motionStatus.classList.remove('paused');
            this.startMotionDetection();
        }
        
        // Save pause state
        localStorage.setItem('isPaused', this.isPaused.toString());
    }
}

// Initialize the application
const app = new SecurityCamera(); 