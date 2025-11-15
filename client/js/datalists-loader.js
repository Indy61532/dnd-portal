//Datalists Loader
 

async function loadDatalists() {
    try {
        const response = await fetch('/client/pages/datalists.html');
        if (!response.ok) {
            console.error('Failed to load datalists:', response.status);
            return;
        }
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get all datalists from the loaded HTML
        const datalists = doc.querySelectorAll('datalist');
        
        // Check if we already have a container, if not create one
        let container = document.getElementById('datalists-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'datalists-container';
            container.style.display = 'none'; // Hide the container
            document.body.appendChild(container);
        }
        
        // Add each datalist to the page (if it doesn't already exist)
        datalists.forEach(datalist => {
            const existing = document.getElementById(datalist.id);
            if (!existing) {
                container.appendChild(datalist.cloneNode(true));
            }
        });
        
        console.log(`Loaded ${datalists.length} datalists`);
    } catch (error) {
        console.error('Error loading datalists:', error);
    }
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDatalists);
} else {
    // DOM is already ready
    loadDatalists();
}

