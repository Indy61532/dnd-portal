
// Initialize TinyMCE for all description textareas
function initializeTinyMCE() {
  tinymce.init({
    selector: 'textarea[id="class-description"], textarea[id="text"],textarea[id="traits"], textarea[id="actions"], textarea[id="bonus-actions"], textarea[id="reactions"], textarea[id="characteristics"], textarea[id="mythic-actions"], textarea[id="legendary-actions"], textarea[id="lair"], textarea[id="lair-actions"], textarea[id="spell-description"], textarea[id="spell-higher-levels"]',
    menubar: false,
    plugins: 'lists link image table code',
    toolbar: 'undo redo | bold italic underline | bullist ',
    height: 200,
    resize: 'vertical',
    content_style: `
      body { 
        font-family: 'Roboto', sans-serif; 
        color: #ffffff; 
        background: transparent; 
        font-size: 14px; 
        line-height: 1.5; 
      }
    `,
    skin: 'oxide-dark',
    content_css: 'dark'
  });
}

// Initialize TinyMCE when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeTinyMCE();
});
