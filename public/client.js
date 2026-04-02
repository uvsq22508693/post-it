// Global variables
let currentUserId = null;
let currentUsername = null;
let currentUserColor = null;
let currentRole = null;
let postits = [];
let selectedX = null;
let selectedY = null;
let connections = []; // Store node connections
let selectedPostForConnection = null; // Track which note is selected for connection

// User color assignment (expanded palette - 20 colors)
const USER_COLORS = [
    'user-color-0', 'user-color-1', 'user-color-2', 'user-color-3', 
    'user-color-4', 'user-color-5', 'user-color-6', 'user-color-7', 
    'user-color-8', 'user-color-9', 'user-color-10', 'user-color-11',
    'user-color-12', 'user-color-13', 'user-color-14', 'user-color-15',
    'user-color-16', 'user-color-17', 'user-color-18', 'user-color-19'
];

// Canvas panning variables
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panStartScrollLeft = 0;
let panStartScrollTop = 0;

// Color palette for fallback (random)
const COLORS = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];

function getRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Get color for a username (for creating new notes)
function getUserColorByUsername(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        const char = username.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const colorIndex = Math.abs(hash) % USER_COLORS.length;
    return USER_COLORS[colorIndex];
}

// Get user color (from database or fallback to hash)
function getUserColor(post) {
    // If the post has a stored user_color, use it
    if (post.user_color) {
        return post.user_color;
    }
    
    // Fallback: hash username for color (for backward compatibility)
    const username = post.username || '';
    return getUserColorByUsername(username);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Get user info from page
    const authNav = document.getElementById('auth-nav');
    if (authNav) {
        const welcomeMsg = authNav.querySelector('.welcome-msg');
        if (welcomeMsg) {
            // Extract username from "Welcome back, username!"
            const text = welcomeMsg.textContent;
            const match = text.match(/Welcome back, (.+)!/);
            if (match) {
                currentUsername = match[1];
                currentUserId = true;
                
                // Fetch current user's color from backend
                try {
                    const response = await fetch('/me');
                    if (response.ok) {
                        const user = await response.json();
                        currentUserColor = user.user_color;
                        
                        // Apply user color to the Add Note button
                        const addNoteBtn = document.getElementById('add-note-btn');
                        if (addNoteBtn && currentUserColor) {
                            addNoteBtn.setAttribute('style', `background: ${currentUserColor} !important;`);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch user color:', error);
                }
            }
        }
    }

    // Load all postits
    loadPostits();

    // Setup event listeners
    setupEventListeners();

    // Setup double-click on container
    const positsContainer = document.getElementById('postits-container');
    if (positsContainer) {
        positsContainer.addEventListener('dblclick', (e) => {
            // Make sure we're not clicking on an existing postit
            if (!e.target.closest('.postit')) {
                handleDoubleClick(e);
            }
        });

        // Setup panning functionality
        setupCanvasPanning(positsContainer);
        
        // Setup SVG canvas for connections
        setupSVGCanvas(positsContainer);
    }
});

// Setup SVG canvas for drawing connections
function setupSVGCanvas(container) {
    const svg = document.getElementById('connections-canvas');
    if (!svg) return;
    
    function resizeSVG() {
        svg.setAttribute('width', window.innerWidth);
        svg.setAttribute('height', window.innerHeight);
        svg.style.width = window.innerWidth + 'px';
        svg.style.height = window.innerHeight + 'px';
    }
    
    resizeSVG();
    window.addEventListener('resize', resizeSVG);
    
    // Redraw connections when container scrolls or notes move
    container.addEventListener('scroll', drawConnections);
    document.addEventListener('mousemove', drawConnections);
}

// Setup canvas panning - allows dragging the board like a map
function setupCanvasPanning(container) {
    container.addEventListener('mousedown', (e) => {
        // Only pan if clicking on empty space and right-click or shift+click
        if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
            if (!e.target.closest('.postit')) {
                isPanning = true;
                panStartX = e.clientX;
                panStartY = e.clientY;
                panStartScrollLeft = container.scrollLeft;
                panStartScrollTop = container.scrollTop;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const deltaX = e.clientX - panStartX;
            const deltaY = e.clientY - panStartY;
            
            container.scrollLeft = panStartScrollLeft - deltaX;
            container.scrollTop = panStartScrollTop - deltaY;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            container.style.cursor = 'grab';
        }
    });

    // Prevent context menu on right-click
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}


// Load all postits from server
async function loadPostits() {
    try {
        const response = await fetch('/liste');
        if (!response.ok) throw new Error('Failed to load postits');
        
        postits = await response.json();
        renderPostits();
    } catch (error) {
        console.error('Error loading postits:', error);
    }
}

// Render postits on page
function renderPostits() {
    const container = document.getElementById('postits-container');
    if (!container) return;

    // Clear existing postits
    container.querySelectorAll('.postit').forEach(el => el.remove());

    // Render each postit
    postits.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
    
    // Draw connections after rendering
    drawConnections();
}

// Create postit element
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'postit';
    postElement.setAttribute('data-postit-id', post.id);
    
    // Add user-specific color based on stored user_color
    const userColor = getUserColor(post);
    // If it's a hex color, apply as inline style; otherwise add as class
    if (userColor && userColor.startsWith('#')) {
        postElement.style.backgroundColor = userColor;
    } else {
        postElement.classList.add(userColor);
    }
    
    // Check if this postit belongs to current user
    const isOwn = currentUsername === post.username;
    if (isOwn) {
        postElement.classList.add('own');
    }

    // Set position
    postElement.style.left = post.x + 'px';
    postElement.style.top = post.y + 'px';
    postElement.style.zIndex = post.id;

    // Format date
    const date = new Date(post.created_at);
    const formattedDate = date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Create HTML
    postElement.innerHTML = `
        <div class="postit-text" style="color: #000 !important; text-shadow: 0 0 0 #000; filter: invert(0) !important;">${escapeHtml(post.text)}</div>
        <div class="postit-meta">
            <div class="postit-author" style="color: #000 !important; text-shadow: 0 0 0 #000;">Par: ${escapeHtml(post.username)}</div>
            <div class="postit-date" style="color: #333 !important; text-shadow: 0 0 0 #333;">Date: ${formattedDate}</div>
        </div>
        <div class="postit-controls">
            <button class="postit-btn postit-edit" title="Edit">✏️</button>
            <button class="postit-btn postit-delete" data-id="${post.id}" title="Supprimer">×</button>
        </div>
    `;

    // Add event listeners
    const editBtn = postElement.querySelector('.postit-edit');
    if (editBtn) {
        editBtn.addEventListener('click', () => handleEditPostit(post.id, post.text));
    }
    
    const deleteBtn = postElement.querySelector('.postit-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePostit(post.id));
    }

    // Make draggable
    if (isOwn) {
        makeDraggable(postElement, post.id);
    }

    return postElement;
}

// Make postit draggable
function makeDraggable(element, postId) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;

    function handleMouseMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        
        let newX = elementStartX + dx;
        let newY = elementStartY + dy;
        
        // Keep in bounds
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        
        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
    }

    function handleMouseUp(e) {
        if (!isDragging) return;
        
        isDragging = false;
        element.classList.remove('dragging');
        
        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Save position to server
        const finalX = parseInt(element.style.left);
        const finalY = parseInt(element.style.top);
        
        fetch(`/deplacer/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ x: finalX, y: finalY })
        }).catch(err => console.error('Error saving position:', err));
    }

    element.addEventListener('mousedown', (e) => {
        // Don't drag if in edit mode
        if (element.dataset.isEditing === 'true') return;
        
        // Don't drag if clicking a button or not left mouse button
        if (e.target.closest('.postit-btn') || e.button !== 0) return;
        
        isDragging = true;
        element.classList.add('dragging');
        
        // Bring to front
        element.style.zIndex = 10000;
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        elementStartX = parseInt(element.style.left) || 0;
        elementStartY = parseInt(element.style.top) || 0;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Prevent text selection and default behavior
        e.preventDefault();
        document.body.style.userSelect = 'none';
    });
}

// Open create modal as zoomed note
function openCreateModalAsZoomedNote() {
    const container = document.getElementById('postits-container');
    const userColor = currentUserColor || getUserColorByUsername(currentUsername || 'user');
    
    // Create temporary note element
    const tempNote = document.createElement('div');
    tempNote.id = 'temp-create-note';
    tempNote.className = 'postit';
    tempNote.style.backgroundColor = userColor;
    tempNote.style.position = 'fixed';
    tempNote.style.width = '280px';
    tempNote.style.height = '200px';
    tempNote.style.left = (window.innerWidth / 2 - 140) + 'px';
    tempNote.style.top = (window.innerHeight / 2 - 100) + 'px';
    tempNote.style.transform = 'scale(1.6)';
    tempNote.style.zIndex = '1001';
    tempNote.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    tempNote.style.pointerEvents = 'auto';
    
    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.id = 'create-textarea-overlay';
    textarea.placeholder = 'Write your note...';
    textarea.style.position = 'absolute';
    textarea.style.top = '8px';
    textarea.style.left = '8px';
    textarea.style.right = '8px';
    textarea.style.width = 'calc(100% - 16px)';
    textarea.style.height = 'calc(100% - 70px)';
    textarea.style.padding = '8px';
    textarea.style.fontSize = '14px';
    textarea.style.fontFamily = "'Comic Sans MS', cursive";
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.backgroundColor = 'inherit';
    textarea.style.color = '#111';
    textarea.style.whiteSpace = 'pre-wrap';
    textarea.style.wordWrap = 'break-word';
    textarea.style.zIndex = '5';
    textarea.style.pointerEvents = 'auto';
    
    // Create buttons container
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.position = 'absolute';
    buttonsDiv.style.bottom = '10px';
    buttonsDiv.style.right = '10px';
    buttonsDiv.style.display = 'flex';
    buttonsDiv.style.gap = '8px';
    buttonsDiv.style.zIndex = '10';
    buttonsDiv.style.pointerEvents = 'auto';
    
    // Cancel button (X)
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✕';
    cancelBtn.style.width = 'auto';
    cancelBtn.style.height = 'auto';
    cancelBtn.style.padding = '0';
    cancelBtn.style.backgroundColor = 'transparent';
    cancelBtn.style.color = '#dc3545';
    cancelBtn.style.border = 'none';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.fontSize = '16px';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.transition = 'transform 0.2s ease';
    cancelBtn.style.pointerEvents = 'auto';
    cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.3)'; };
    cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
    cancelBtn.onmousedown = (e) => {
        e.stopPropagation();
        cancelBtn.style.transform = 'scale(0.9)';
    };
    cancelBtn.onmouseup = (e) => {
        e.stopPropagation();
        cancelBtn.style.transform = 'scale(1.3)';
    };
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        cancelCreateNote();
    };
    
    // Save button (V)
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✓';
    saveBtn.style.width = 'auto';
    saveBtn.style.height = 'auto';
    saveBtn.style.padding = '0';
    saveBtn.style.backgroundColor = 'transparent';
    saveBtn.style.color = '#28a745';
    saveBtn.style.border = 'none';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.fontSize = '16px';
    saveBtn.style.fontWeight = 'bold';
    saveBtn.style.transition = 'transform 0.2s ease';
    saveBtn.style.pointerEvents = 'auto';
    saveBtn.onmouseenter = () => { saveBtn.style.transform = 'scale(1.3)'; };
    saveBtn.onmouseleave = () => { saveBtn.style.transform = 'scale(1)'; };
    saveBtn.onmousedown = (e) => {
        e.stopPropagation();
        saveBtn.style.transform = 'scale(0.9)';
    };
    saveBtn.onmouseup = (e) => {
        e.stopPropagation();
        saveBtn.style.transform = 'scale(1.3)';
    };
    saveBtn.onclick = (e) => {
        e.stopPropagation();
        saveNewPostit(textarea.value);
    };
    
    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(saveBtn);
    
    tempNote.appendChild(textarea);
    tempNote.appendChild(buttonsDiv);
    document.body.appendChild(tempNote);
    
    document.body.style.overflow = 'hidden';
    textarea.focus();
}

// Cancel create note
function cancelCreateNote() {
    const tempNote = document.getElementById('temp-create-note');
    if (tempNote) {
        tempNote.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        tempNote.style.transform = 'scale(0)';
        tempNote.style.opacity = '0';
        
        setTimeout(() => {
            if (tempNote.parentNode) {
                tempNote.parentNode.removeChild(tempNote);
            }
            document.body.style.overflow = '';
        }, 400);
    }
}

// Open create modal (old modal version - keeping for compatibility)
function openCreateModal() {
    openCreateModalAsZoomedNote();
}

// Handle double click to create postit
function handleDoubleClick(e) {
    const authNav = document.getElementById('auth-nav');
    const isLoggedIn = authNav && (authNav.innerHTML.includes('welcome') || authNav.innerHTML.includes('Welcome'));

    if (!isLoggedIn) {
        alert('Please login to create a note');
        openAuthModal();
        return;
    }

    const container = document.getElementById('postits-container');
    
    // Get position relative to scrollable container
    // Convert client position to container-relative position accounting for scroll
    const containerRect = container.getBoundingClientRect();
    selectedX = (e.clientX - containerRect.left) + container.scrollLeft;
    selectedY = (e.clientY - containerRect.top) + container.scrollTop;

    // Clamp values to reasonable bounds (not at the very edge)
    selectedX = Math.max(10, Math.min(selectedX, container.scrollWidth - 210));
    selectedY = Math.max(80, Math.min(selectedY, container.scrollHeight - 210));

    openCreateModal();
}

// Save new postit
async function saveNewPostit(text) {
    const trimmedText = (text || '').trim();

    if (!trimmedText) {
        alert('Please enter a message');
        return;
    }

    try {
        const response = await fetch('/ajouter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: trimmedText,
                x: selectedX || 100,
                y: selectedY || 100
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create postit');
        }

        // Zoom out and remove temp note
        const tempNote = document.getElementById('temp-create-note');
        if (tempNote) {
            tempNote.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            tempNote.style.transform = 'scale(0)';
            tempNote.style.opacity = '0';
            
            setTimeout(() => {
                if (tempNote.parentNode) {
                    tempNote.parentNode.removeChild(tempNote);
                }
                document.body.style.overflow = '';
                loadPostits();
            }, 400);
        } else {
            // Fallback if temp note doesn't exist
            document.body.style.overflow = '';
            loadPostits();
        }
    } catch (error) {
        console.error('Error creating postit:', error);
        alert('Error creating note');
    }
}

// Delete postit
async function handleDeletePostit(postId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post-it?')) {
        return;
    }

    try {
        const response = await fetch(`/effacer/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to delete postit');
        }

        // Reload postits
        loadPostits();
    } catch (error) {
        console.error('Error deleting postit:', error);
        alert('Erreur lors de la suppression');
    }
}

// Global variables for editing
let editingElement = null;
let editingOriginalStyles = {
    position: '',
    left: '',
    top: '',
    zIndex: '',
    pointerEvents: ''
};

// Edit postit - zoom into the note
function handleEditPostit(postId, currentText, username) {
    const postElement = document.querySelector(`[data-postit-id="${postId}"]`);
    if (!postElement) return;
    
    // Mark as editing to prevent drag actions
    postElement.dataset.isEditing = 'true';
    
    // Store original styles
    editingOriginalStyles = {
        position: postElement.style.position,
        left: postElement.style.left,
        top: postElement.style.top,
        zIndex: postElement.style.zIndex,
        pointerEvents: postElement.style.pointerEvents
    };
    
    // Get current dimensions
    const width = postElement.offsetWidth;
    const height = postElement.offsetHeight;
    
    // Get absolute position on screen
    const rect = postElement.getBoundingClientRect();
    
    // Store original state
    editingElement = postElement;
    
    // Prevent scrolling while editing
    document.body.style.overflow = 'hidden';
    
    // Make note fixed and zoom it to center
    postElement.style.position = 'fixed';
    postElement.style.zIndex = '1001';
    postElement.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    postElement.style.pointerEvents = 'auto';
    
    // Set to current screen position first (fixed coordinates)
    postElement.style.left = rect.left + 'px';
    postElement.style.top = rect.top + 'px';
    
    // Calculate center position
    const centerX = (window.innerWidth / 2) - (width / 2);
    const centerY = (window.innerHeight / 2) - (height / 2);
    const scale = 1.6;
    
    // Trigger zoom animation
    setTimeout(() => {
        postElement.style.left = centerX + 'px';
        postElement.style.top = centerY + 'px';
        postElement.style.transform = `scale(${scale})`;
    }, 10);
    
    // Hide controls and metadata during edit
    const controlsDiv = postElement.querySelector('.postit-controls');
    const metaDiv = postElement.querySelector('.postit-meta');
    if (controlsDiv) controlsDiv.style.display = 'none';
    if (metaDiv) metaDiv.style.display = 'none';
    
    // Create small X and V buttons
    const editControls = document.createElement('div');
    editControls.id = 'edit-controls';
    editControls.style.position = 'absolute';
    editControls.style.bottom = '10px';
    editControls.style.right = '10px';
    editControls.style.display = 'flex';
    editControls.style.gap = '8px';
    editControls.style.zIndex = '10';
    editControls.style.pointerEvents = 'auto';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✕';
    cancelBtn.style.width = 'auto';
    cancelBtn.style.height = 'auto';
    cancelBtn.style.padding = '0';
    cancelBtn.style.backgroundColor = 'transparent';
    cancelBtn.style.color = '#dc3545';
    cancelBtn.style.border = 'none';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.fontSize = '16px';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.transition = 'transform 0.2s ease';
    cancelBtn.style.pointerEvents = 'auto';
    cancelBtn.onmouseenter = () => { cancelBtn.style.transform = 'scale(1.3)'; };
    cancelBtn.onmouseleave = () => { cancelBtn.style.transform = 'scale(1)'; };
    cancelBtn.onmousedown = (e) => {
        e.stopPropagation();
        cancelBtn.style.transform = 'scale(0.9)';
    };
    cancelBtn.onmouseup = (e) => {
        e.stopPropagation();
        cancelBtn.style.transform = 'scale(1.3)';
    };
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        cancelZoomedEdit();
    };
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✓';
    saveBtn.style.width = 'auto';
    saveBtn.style.height = 'auto';
    saveBtn.style.padding = '0';
    saveBtn.style.backgroundColor = 'transparent';
    saveBtn.style.color = '#28a745';
    saveBtn.style.border = 'none';
    saveBtn.style.cursor = 'pointer';
    saveBtn.style.fontSize = '16px';
    saveBtn.style.fontWeight = 'bold';
    saveBtn.style.transition = 'transform 0.2s ease';
    saveBtn.style.pointerEvents = 'auto';
    saveBtn.onmouseenter = () => { saveBtn.style.transform = 'scale(1.3)'; };
    saveBtn.onmouseleave = () => { saveBtn.style.transform = 'scale(1)'; };
    saveBtn.onmousedown = (e) => {
        e.stopPropagation();
        saveBtn.style.transform = 'scale(0.9)';
    };
    saveBtn.onmouseup = (e) => {
        e.stopPropagation();
        saveBtn.style.transform = 'scale(1.3)';
    };
    saveBtn.onclick = (e) => {
        e.stopPropagation();
        saveZoomedEdit(postId);
    };
    
    editControls.appendChild(cancelBtn);
    editControls.appendChild(saveBtn);
    postElement.appendChild(editControls);
    
    // Make text editable after animation completes
    setTimeout(() => {
        const textElement = postElement.querySelector('.postit-text');
        if (textElement) {
            // Get current text content
            const currentText = textElement.textContent;
            
            // Create textarea overlay
            const textarea = document.createElement('textarea');
            textarea.id = 'edit-textarea-overlay';
            textarea.value = currentText;
            textarea.style.position = 'absolute';
            textarea.style.top = '8px';
            textarea.style.left = '8px';
            textarea.style.right = '8px';
            textarea.style.width = 'calc(100% - 16px)';
            textarea.style.height = 'calc(100% - 70px)';
            textarea.style.padding = '8px';
            textarea.style.fontSize = '14px';
            textarea.style.fontFamily = "'Comic Sans MS', cursive";
            textarea.style.border = 'none';
            textarea.style.outline = 'none';
            textarea.style.resize = 'none';
            textarea.style.backgroundColor = 'inherit';
            textarea.style.color = '#111';
            textarea.style.whiteSpace = 'pre-wrap';
            textarea.style.wordWrap = 'break-word';
            textarea.style.zIndex = '5';
            textarea.style.pointerEvents = 'auto';
            
            // Hide original text
            textElement.style.opacity = '0';
            textElement.style.pointerEvents = 'none';
            
            postElement.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            // Store reference for save/cancel
            postElement.dataset.editTextarea = true;
        }
    }, 450);
}

// Save and zoom back out
async function saveZoomedEdit(postId) {
    if (!editingElement) return;
    
    const textarea = editingElement.querySelector('#edit-textarea-overlay');
    const newText = textarea ? textarea.value.trim() : '';
    
    if (!newText) {
        alert('Note cannot be empty');
        return;
    }
    
    try {
        const response = await fetch(`/modifier/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: newText })
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        // Zoom back out
        zoomOutNote();
        
        // Reload to show updated text
        setTimeout(() => {
            loadPostits();
        }, 400);
    } catch (error) {
        console.error('Error:', error);
        alert('Error saving note');
    }
}

// Cancel editing and zoom out
function cancelZoomedEdit() {
    if (!editingElement) return;
    zoomOutNote();
}

// Animate note back to original position
function zoomOutNote() {
    if (!editingElement) return;
    
    editingElement.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    editingElement.style.left = editingOriginalStyles.left;
    editingElement.style.top = editingOriginalStyles.top;
    editingElement.style.transform = 'scale(1)';
    
    // Clean up after animation
    setTimeout(() => {
        // Restore all original styles
        editingElement.style.position = editingOriginalStyles.position;
        editingElement.style.zIndex = editingOriginalStyles.zIndex;
        editingElement.style.transition = '';
        editingElement.style.transform = '';
        editingElement.style.pointerEvents = editingOriginalStyles.pointerEvents;
        editingElement.dataset.isEditing = 'false';
        
        const textElement = editingElement.querySelector('.postit-text');
        if (textElement) {
            textElement.style.opacity = '';
            textElement.style.pointerEvents = '';
        }
        
        const controlsDiv = editingElement.querySelector('.postit-controls');
        if (controlsDiv) controlsDiv.style.display = '';
        
        const metaDiv = editingElement.querySelector('.postit-meta');
        if (metaDiv) metaDiv.style.display = '';
        
        const editControls = editingElement.querySelector('#edit-controls');
        if (editControls) editControls.remove();
        
        const textarea = editingElement.querySelector('#edit-textarea-overlay');
        if (textarea) textarea.remove();
        
        document.body.style.overflow = '';
        editingElement = null;
    }, 400);
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Open auth modal
function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
}

// Setup all event listeners
function setupEventListeners() {
    // Add Note button
    const addNoteBtn = document.getElementById('add-note-btn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => {
            const authNav = document.getElementById('auth-nav');
            const isLoggedIn = authNav && (authNav.innerHTML.includes('welcome') || authNav.innerHTML.includes('Welcome'));

            if (!isLoggedIn) {
                alert('Please login to create a note');
                openAuthModal();
                return;
            }

            const container = document.getElementById('postits-container');
            // Place note at center of current viewport + scroll offset
            selectedX = container.scrollLeft + (container.clientWidth / 2);
            selectedY = container.scrollTop + (container.clientHeight / 2);
            
            openCreateModal();
        });
    }

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openAuthModal);
    }

    // Signup button
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            openAuthModal();
            setTimeout(() => {
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('signup-form').classList.remove('hidden');
            }, 100);
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Postit modal
    const savePostitBtn = document.getElementById('save-postit-btn');
    if (savePostitBtn) {
        savePostitBtn.addEventListener('click', saveNewPostit);
    }

    const cancelPostitBtn = document.getElementById('cancel-postit-btn');
    if (cancelPostitBtn) {
        cancelPostitBtn.addEventListener('click', () => {
            const createModal = document.getElementById('create-modal');
            const modalContent = createModal.querySelector('.modal-content');
            modalContent.classList.add('zoom-out');
            
            setTimeout(() => {
                createModal.classList.add('hidden');
                modalContent.classList.remove('zoom-out');
                document.getElementById('postit-text').value = '';
            }, 250);
        });
    }

    const postItText = document.getElementById('postit-text');
    if (postItText) {
        postItText.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                saveNewPostit();
            }
        });
    }

    // Edit modal
    const saveEditBtn = document.getElementById('save-edit-btn');
    if (saveEditBtn) {
        // Removed - using zoom-based editing now
    }

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        // Removed - using zoom-based editing now
    }

    const editPostitText = document.getElementById('edit-postit-text');
    if (editPostitText) {
        // Removed - using zoom-based editing now
    }

    // Auth modal
    const switchToSignupBtn = document.getElementById('switch-to-signup');
    if (switchToSignupBtn) {
        switchToSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('signup-form').classList.remove('hidden');
        });
    }

    const switchToLoginBtn = document.getElementById('switch-to-login');
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        });
    }

    const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', () => {
            document.getElementById('auth-modal').classList.add('hidden');
        });
    }

    // Login form submit
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', handleLoginSubmit);
    }

    // Signup form submit
    const signupSubmitBtn = document.getElementById('signup-submit-btn');
    if (signupSubmitBtn) {
        signupSubmitBtn.addEventListener('click', handleSignupSubmit);
    }

    // Close modal when clicking outside
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                authModal.classList.add('hidden');
            }
        });
    }

    const createModal = document.getElementById('create-modal');
    if (createModal) {
        createModal.addEventListener('click', (e) => {
            if (e.target === createModal) {
                createModal.classList.add('hidden');
            }
        });
    }
}

// Handle login submit from modal
async function handleLoginSubmit() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('Identifiants incorrects');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Erreur de connexion');
    }
}

// Handle signup submit from modal
async function handleSignupSubmit() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;

    if (!username || !password || !passwordConfirm) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    if (password !== passwordConfirm) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            window.location.href = '/';
        } else {
            const data = await response.json();
            alert(data.error || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        console.error('Error signing up:', error);
        alert('Erreur d\'inscription');
    }
}

// Draw connections between notes
function drawConnections() {
    const svg = document.getElementById('connections-canvas');
    if (!svg) {
        console.error('SVG canvas not found!');
        return;
    }
    
    // Clear existing lines
    svg.querySelectorAll('line').forEach(line => line.remove());
    
    console.log('Drawing', connections.length, 'connections');
    
    // Draw each connection
    connections.forEach(conn => {
        const startElement = document.querySelector(`[data-postit-id="${conn.from}"]`);
        const endElement = document.querySelector(`[data-postit-id="${conn.to}"]`);
        
        if (startElement && endElement) {
            const startRect = startElement.getBoundingClientRect();
            const endRect = endElement.getBoundingClientRect();
            
            // Account for header height
            const headerHeight = 70;
            const pinOffset = 16; // Pin is 16px from top (8px position + 8px radius)
            
            const x1 = startRect.left + startRect.width / 2;
            const y1 = startRect.top - headerHeight + pinOffset;
            const x2 = endRect.left + endRect.width / 2;
            const y2 = endRect.top - headerHeight + pinOffset;
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#dc3545');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', '0.7');
            line.setAttribute('data-from', conn.from);
            line.setAttribute('data-to', conn.to);
            
            svg.appendChild(line);
            console.log('✓ Line drawn from', conn.from, 'to', conn.to);
        }
    });
}

// Simple click-to-connect: select first note, then click another to connect
function startConnection(event) {
    event.stopPropagation();
    event.preventDefault();
    
    // Get the postit element from the button's closest parent
    const postElement = event.currentTarget.closest('.postit');
    if (!postElement) {
        console.error('Could not find postit element');
        return;
    }
    
    const postId = parseInt(postElement.getAttribute('data-postit-id'));
    console.log('Link clicked! Current selection:', selectedPostForConnection, 'Clicked note:', postId);
    
    if (selectedPostForConnection === null) {
        // First click: select this note
        selectedPostForConnection = postId;
        postElement.classList.add('connection-selected');
        console.log('✓ Selected note:', postId);
    } else if (selectedPostForConnection === postId) {
        // Clicking same note: deselect
        selectedPostForConnection = null;
        postElement.classList.remove('connection-selected');
        console.log('✗ Deselected note:', postId);
    } else {
        // Second click: create connection
        const startId = selectedPostForConnection;
        const endId = postId;
        
        console.log('→ Creating connection from', startId, 'to', endId);
        
        // Add connection if it doesn't exist
        const exists = connections.find(c => (c.from === startId && c.to === endId) || (c.from === endId && c.to === startId));
        
        if (!exists) {
            connections.push({ from: startId, to: endId });
            console.log('✓ Connection created! Total:', connections.length, 'Connection:', { from: startId, to: endId });
            drawConnections();
        } else {
            console.log('⚠ Connection already exists');
        }
        
        // Clear selection
        const selectedElement = document.querySelector(`[data-postit-id="${selectedPostForConnection}"]`);
        if (selectedElement) {
            selectedElement.classList.remove('connection-selected');
        }
        selectedPostForConnection = null;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
