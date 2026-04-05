let currentPage = 1;
let totalPages = 1;
let editingPostId = null;
let lastKnownUpdate = null;
let updateCheckInterval = null;

// Load posts on page load
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners for buttons
    document.getElementById('prevBtn').addEventListener('click', previousPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);

    loadPosts(1);

    // Start polling for updates every 2 seconds
    startUpdatePolling();
});

// Start polling for updates
function startUpdatePolling() {
    updateCheckInterval = setInterval(checkForUpdates, 2000);
}

// Check if posts have been updated
async function checkForUpdates() {
    try {
        const response = await fetch('/api/last-update');
        const data = await response.json();
        const currentUpdate = data.lastUpdate;

        // First time - just set the value
        if (lastKnownUpdate === null) {
            lastKnownUpdate = currentUpdate;
            return;
        }

        // If different, reload the current page
        if (currentUpdate !== lastKnownUpdate) {
            console.log('📢 Detecté un changement! Mise à jour du tableau...');
            lastKnownUpdate = currentUpdate;
            loadPosts(currentPage);
        }
    } catch (error) {
        console.error('Error checking for updates:', error);
    }
}

// Stop polling when page is closed
window.addEventListener('beforeunload', () => {
    if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
    }
});

// Load posts with pagination
async function loadPosts(page) {
    try {
        showToast('Loading posts...', 'info');
        const response = await fetch(`/api/admin/posts?page=${page}`);
        
        if (!response.ok) {
            if (response.status === 403) {
                showToast('You are not an admin!', 'error');
                window.location.href = '/';
            }
            throw new Error('Failed to load posts');
        }

        const data = await response.json();
        
        if (!data.success) {
            showToast('Failed to load posts', 'error');
            return;
        }

        currentPage = data.pagination.page;
        totalPages = data.pagination.totalPages;

        renderPosts(data.data);
        updatePagination(data.pagination);
        showToast('Posts loaded!', 'success');
    } catch (error) {
        console.error('Error loading posts:', error);
        showToast('Error loading posts: ' + error.message, 'error');
    }
}

// Render posts in table
function renderPosts(posts) {
    const tbody = document.getElementById('postsBody');
    const table = document.getElementById('postsTable');
    const spinner = document.getElementById('loadingSpinner');

    tbody.innerHTML = '';

    if (posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No posts found</td></tr>';
    } else {
        posts.forEach(post => {
            const date = new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="post-text" title="${post.text}">${escapeHtml(post.text)}</td>
                <td class="post-author" style="color: ${post.user_color}">● ${post.username}</td>
                <td class="post-date">${date}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" data-post-id="${post.id}" data-post-text="${escapeHtml(post.text).replace(/"/g, '&quot;')}">Edit</button>
                        <button class="btn-delete" data-post-id="${post.id}">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);

            // Add event listeners
            const editBtn = tr.querySelector('.btn-edit');
            const deleteBtn = tr.querySelector('.btn-delete');

            editBtn.addEventListener('click', () => {
                openEditModal(post.id, post.text);
            });

            deleteBtn.addEventListener('click', () => {
                deletePost(post.id);
            });
        });
    }

    spinner.style.display = 'none';
    table.style.display = 'table';
}

// Update pagination buttons
function updatePagination(pagination) {
    document.getElementById('currentPage').textContent = pagination.page;
    document.getElementById('totalPages').textContent = pagination.totalPages;
    document.getElementById('totalCount').textContent = pagination.total;

    document.getElementById('prevBtn').disabled = !pagination.hasPrev;
    document.getElementById('nextBtn').disabled = !pagination.hasNext;
}

// Navigate to previous page
function previousPage() {
    if (currentPage > 1) {
        loadPosts(currentPage - 1);
    }
}

// Navigate to next page
function nextPage() {
    if (currentPage < totalPages) {
        loadPosts(currentPage + 1);
    }
}

// Open edit modal
function openEditModal(postId, text) {
    editingPostId = postId;
    document.getElementById('editText').value = text;
    document.getElementById('editModal').classList.add('active');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingPostId = null;
}

// Save edit
async function saveEdit() {
    if (!editingPostId) return;

    const text = document.getElementById('editText').value.trim();
    if (!text) {
        showToast('Text cannot be empty!', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/admin/posts/${editingPostId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('Failed to update post');

        const data = await response.json();
        if (data.success) {
            showToast('Post updated successfully!', 'success');
            closeEditModal();
            loadPosts(currentPage);
        } else {
            showToast(data.error || 'Failed to update post', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error updating post: ' + error.message, 'error');
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const response = await fetch(`/api/admin/posts/${postId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete post');

        const data = await response.json();
        if (data.success) {
            showToast('Post deleted successfully!', 'success');
            loadPosts(currentPage);
        } else {
            showToast(data.error || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error deleting post: ' + error.message, 'error');
    }
}

// Logout
function logout() {
    fetch('/logout', { method: 'POST' }).then(() => {
        window.location.href = '/';
    });
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility: Show toast messages
function showToast(message, type = 'info') {
    if (type === 'error') {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 4000);
    } else if (type === 'success') {
        const successMsg = document.getElementById('successMsg');
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 4000);
    }
}
