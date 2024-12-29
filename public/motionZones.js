class MotionZones {
    constructor(videoElement) {
        this.video = videoElement;
        this.zones = [];
        this.isDrawing = false;
        this.isDragging = false;
        this.draggedZoneIndex = -1;
        this.dragStartPos = { x: 0, y: 0 };
        this.setupCanvas();
        this.setupControls();
        this.loadZones();
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
        
        // Mouse events for drawing and dragging
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchend', this.onMouseUp.bind(this));
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

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on existing zone
        const clickedZoneIndex = this.zones.findIndex(zone => 
            x >= zone.x && x <= zone.x + zone.width &&
            y >= zone.y && y <= zone.y + zone.height
        );

        if (clickedZoneIndex !== -1 && !this.canvas.classList.contains('drawing')) {
            // Start dragging existing zone
            this.isDragging = true;
            this.draggedZoneIndex = clickedZoneIndex;
            this.dragStartPos = { x, y };
            this.canvas.style.cursor = 'move';
        } else if (this.canvas.classList.contains('drawing')) {
            // Start drawing new zone
            this.isDrawing = true;
            this.currentZone = {
                x,
                y,
                width: 0,
                height: 0,
                detectionCount: 0
            };
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDrawing) {
            // Update new zone size
            this.currentZone.width = x - this.currentZone.x;
            this.currentZone.height = y - this.currentZone.y;
            this.drawZones();
        } else if (this.isDragging && this.draggedZoneIndex !== -1) {
            // Move existing zone
            const dx = x - this.dragStartPos.x;
            const dy = y - this.dragStartPos.y;
            
            const zone = this.zones[this.draggedZoneIndex];
            zone.x += dx;
            zone.y += dy;

            // Keep zone within canvas bounds
            zone.x = Math.max(0, Math.min(zone.x, this.canvas.width - zone.width));
            zone.y = Math.max(0, Math.min(zone.y, this.canvas.height - zone.height));

            this.dragStartPos = { x, y };
            this.drawZones();
        } else {
            // Update cursor based on hover
            const isOverZone = this.zones.some(zone => 
                x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height
            );
            this.canvas.style.cursor = isOverZone ? 'move' : 'crosshair';
        }
    }

    onMouseUp() {
        if (this.isDrawing) {
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
                this.saveZones();
            }
            this.isDrawing = false;
            this.canvas.classList.remove('drawing');
        }
        
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedZoneIndex = -1;
            this.saveZones();
        }

        this.canvas.style.cursor = 'crosshair';
        this.drawZones();
    }

    drawZones() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        [...this.zones, this.isDrawing ? this.currentZone : null]
            .filter(Boolean)
            .forEach((zone, index) => {
                // Draw zone rectangle
                this.ctx.strokeStyle = '#00ff9d';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
                this.ctx.fillStyle = 'rgba(0, 255, 157, 0.1)';
                this.ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

                // Draw zone number and detection count
                if (!this.isDrawing || zone !== this.currentZone) {
                    this.ctx.fillStyle = '#00ff9d';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'left';
                    const text = `Zone ${index + 1}: ${zone.detectionCount || 0}`;
                    this.ctx.fillText(text, zone.x + 5, zone.y + 20);
                }
            });
    }

    resetZones() {
        this.zones = [];
        this.drawZones();
        this.saveZones();
    }

    incrementZoneCounter(zoneIndex) {
        if (this.zones[zoneIndex]) {
            this.zones[zoneIndex].detectionCount = (this.zones[zoneIndex].detectionCount || 0) + 1;
            this.drawZones();
            this.saveZones();
        }
    }

    getZoneIndex(x, y) {
        return this.zones.findIndex(zone => this.isPointInZone(x, y, zone));
    }

    isPointInZone(x, y, zone) {
        return x >= zone.x && x <= zone.x + zone.width &&
               y >= zone.y && y <= zone.y + zone.height;
    }

    isInDetectionZone(x, y) {
        // Always return true if no zones defined
        return this.zones.length === 0 || this.getZoneIndex(x, y) !== -1;
    }

    loadZones() {
        const savedZones = localStorage.getItem('detectionZones');
        if (savedZones) {
            try {
                this.zones = JSON.parse(savedZones).map(zone => ({
                    ...zone,
                    detectionCount: zone.detectionCount || 0
                }));
                this.drawZones();
            } catch (error) {
                console.error('Error loading zones:', error);
                this.zones = [];
            }
        }
    }

    saveZones() {
        localStorage.setItem('detectionZones', JSON.stringify(this.zones));
    }
} 