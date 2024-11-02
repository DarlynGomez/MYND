// content-handler.js

class ContentHandler {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle checklist navigation from HR onboarding
        document.addEventListener('click', (e) => {
            if (e.target.closest('[href="required-doc.html"]')) {
                e.preventDefault();
                this.loadContent('stuonboarding');
            }
        });
    }

    async loadContent(contentType) {
        try {
            // Add fade-out effect
            this.mainContent.classList.add('opacity-0');
            await new Promise(resolve => setTimeout(resolve, 300));

            let content;
            switch (contentType) {
                case 'hr':
                    content = await this.fetchPage('hronboarding.html');
                    break;
                case 'stuonboarding':
                    content = await this.fetchPage('stuonboarding.html');
                    break;
                default:
                    console.error('Unknown content type:', contentType);
                    return;
            }

            // Update main content
            if (this.mainContent) {
                // Remove the content wrapper since it's in the loaded HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                
                // Find the main content section in the loaded HTML
                const mainSection = tempDiv.querySelector('main') || tempDiv.querySelector('.container');
                
                if (mainSection) {
                    this.mainContent.innerHTML = mainSection.innerHTML;
                } else {
                    this.mainContent.innerHTML = content;
                }

                // Fade back in
                this.mainContent.classList.remove('opacity-0');
            }

        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    async fetchPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('Error fetching page:', error);
            throw error;
        }
    }
}

export default ContentHandler;