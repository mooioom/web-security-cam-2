class MotionZones {
    constructor(videoElement) {
        this.video = videoElement;
        this.zones = [];
        this.isDrawing = false;
        this.setupCanvas();
        this.setupControls();
    }

    setupCanvas() {
        this.canvas = document.getElementById('zonesCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Match canvas size to video
        const resizeObserver = new ResizeObserver(() => {
            const rect = this.video.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.drawZones();
        });
        resizeObserver.observe(this.video);
        
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.endDrawing.bind(this));
    }

    setupControls() {
        this.addZoneBtn = document.getElementById('addZoneBtn');
        this.resetZonesBtn = document.getElementById('resetZonesBtn');
        
        this.addZoneBtn.addEventListener('click', () => this.enableDrawing());
        this.resetZonesBtn.addEventListener('click', () => this.resetZones());
    }

    enableDrawing() {
        this.canvas.classList.add('drawing');
    }

    startDrawing(e) {
        if (!this.canvas.classList.contains('drawing')) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.isDrawing = true;
        this.currentZone = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            width: 0,
            height: 0
        };
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.currentZone.width = (e.clientX - rect.left) - this.currentZone.x;
        this.currentZone.height = (e.clientY - rect.top) - this.currentZone.y;
        this.drawZones();
    }

    endDrawing() {
        if (!this.isDrawing) return;
        
        if (Math.abs(this.currentZone.width) > 20 && Math.abs(this.currentZone.height) > 20) {
            // Normalize negative dimensions
            if (this.currentZone.width < 0) {
                this.currentZone.x += this.currentZone.width;
                this.currentZone.width = Math.abs(this.currentZone.width);
            }
            if (this.currentZone.height < 0) {
                this.currentZone.y += this.currentZone.height;
                this.currentZone.height = Math.abs(this.currentZone.height);
            }
            
            this.zones.push({...this.currentZone});
        }

        this.isDrawing = false;
        this.canvas.classList.remove('drawing');
        this.drawZones();
    }

    drawZones() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        [...this.zones, this.isDrawing ? this.currentZone : null]
            .filter(Boolean)
            .forEach(zone => {
                this.ctx.strokeStyle = '#00ff9d';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
                this.ctx.fillStyle = 'rgba(0, 255, 157, 0.1)';
                this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
            });
    }

    resetZones() {
        this.zones = [];
        this.drawZones();
    }

    isInDetectionZone(x, y) {
        // If no zones are defined, detect everywhere
        if (this.zones.length === 0) {
            return true;
        }

        // Check if point is in any detection zone
        return this.zones.some(zone => 
            x >= zone.x && x <= zone.x + zone.width &&
            y >= zone.y && y <= zone.y + zone.height
        );
    }
} 