class PictureInPicture {
    constructor(videoElement) {
        this.video = videoElement;
        this.setupPiP();
    }

    setupPiP() {
        if (document.pictureInPictureEnabled) {
            const pipButton = document.createElement('button');
            pipButton.innerHTML = '<i class="fas fa-external-link-alt"></i>';
            pipButton.className = 'pip-button';
            pipButton.addEventListener('click', () => this.togglePiP());
            this.video.parentElement.appendChild(pipButton);
        }
    }

    async togglePiP() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await this.video.requestPictureInPicture();
            }
        } catch (error) {
            console.error('PiP error:', error);
        }
    }
} 