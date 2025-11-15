

function initializeMultiSelect() {
  const multiselectInputs = document.querySelectorAll('.multiselect-input');
  
  multiselectInputs.forEach(input => {
    const container = input.closest('.multiselect-container');
    const tagsContainer = container.querySelector('.selected-tags');
    let selectedValues = [];
    
    // Handle input events
    input.addEventListener('input', function(e) {
      const value = e.target.value.trim();
      if (value && !selectedValues.includes(value)) {
        addTag(value, tagsContainer, selectedValues, input);
      }
      e.target.value = '';
    });
    
    // Handle keydown events
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const value = e.target.value.trim();
        if (value && !selectedValues.includes(value)) {
          addTag(value, tagsContainer, selectedValues, input);
          e.target.value = '';
        }
      } else if (e.key === 'Backspace' && e.target.value === '' && selectedValues.length > 0) {
        removeLastTag(tagsContainer, selectedValues, input);
      }
    });
    
    // Handle datalist selection
    input.addEventListener('change', function(e) {
      const value = e.target.value.trim();
      if (value && !selectedValues.includes(value)) {
        addTag(value, tagsContainer, selectedValues, input);
        e.target.value = '';
      }
    });
  });
}

function addTag(value, tagsContainer, selectedValues, input) {
  if (value && !selectedValues.includes(value)) {
    selectedValues.push(value);
    
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      <span>${value}</span>
      <button type="button" class="tag-remove" onclick="removeTag(this, '${value}', this.closest('.multiselect-container').querySelector('.selected-tags'), this.closest('.multiselect-container').querySelector('.multiselect-input'))">×</button>
    `;
    
    tagsContainer.appendChild(tag);
    input.focus();
  }
}

function removeTag(button, value, tagsContainer, input) {
  const tag = button.closest('.tag');
  const container = button.closest('.multiselect-container');
  const selectedValues = Array.from(tagsContainer.querySelectorAll('.tag span')).map(span => span.textContent);
  
  // Remove from selectedValues array
  const index = selectedValues.indexOf(value);
  if (index > -1) {
    selectedValues.splice(index, 1);
  }
  
  // Remove tag element
  tag.remove();
  input.focus();
}

function removeLastTag(tagsContainer, selectedValues, input) {
  const lastTag = tagsContainer.querySelector('.tag:last-child');
  if (lastTag) {
    const value = lastTag.querySelector('span').textContent;
    removeTag(lastTag.querySelector('.tag-remove'), value, tagsContainer, input);
  }
}

// Initialize multi-select when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeMultiSelect();
});
