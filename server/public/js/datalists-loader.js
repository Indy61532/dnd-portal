//Datalists Loader
 

async function loadDatalists() {
    try {
        // Try multiple candidate paths so loader works from pages in different folders
        async function tryFetchDatalists() {
            const candidates = [];

            // If pathname contains /pages/, build path relative to that root (works for file:// and http)
            try {
                const path = window.location.pathname || '';
                const pagesIdx = path.indexOf('/pages/');
                if (pagesIdx !== -1) {
                    const base = path.substring(0, pagesIdx + '/pages/'.length);
                    candidates.push(base + 'datalists.html');
                }
            } catch (e) {
                // ignore
            }

            // Common absolute / relative candidates
            candidates.push('/pages/datalists.html');
            candidates.push('pages/datalists.html');
            candidates.push('../datalists.html');
            candidates.push('../pages/datalists.html');
            candidates.push('../../pages/datalists.html');

            // Also try relative to the currently-running script file (if available)
            try {
                const script = document.currentScript && document.currentScript.src;
                if (script) {
                    const url = new URL('../pages/datalists.html', script).href;
                    candidates.push(url);
                }
            } catch (e) {
                // ignore
            }

            for (const c of candidates) {
                try {
                    const r = await fetch(c);
                    if (r && r.ok) return r;
                } catch (e) {
                    // try next
                }
            }
            return null;
        }

        const response = await tryFetchDatalists();
        if (!response) {
            console.error('Failed to fetch datalists: tried multiple paths');
            return;
        }
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

