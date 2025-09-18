// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://your-backend-domain.com'; // Update this with your actual backend URL

class DocumentManager {
    constructor() {
        this.documents = [];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAPIStatus();
        this.loadUserFromStorage();
    }

    bindEvents() {
        // User form submission
        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserLogin();
        });

        // Document upload form submission
        document.getElementById('upload-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadDocument();
        });

        // Share form submission
        document.getElementById('share-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.shareDocument();
        });

        // Filter and search
        document.getElementById('filter-type').addEventListener('change', () => {
            this.loadDocuments();
        });

        document.getElementById('search-documents').addEventListener('input', (e) => {
            this.filterDocuments(e.target.value);
        });

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.querySelectorAll('.cancel-btn').forEach(cancelBtn => {
            cancelBtn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // File input change
        document.getElementById('document-file').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });
    }

    async checkAPIStatus() {
        const statusIndicator = document.getElementById('api-status');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                statusDot.className = 'status-dot online';
                statusText.textContent = `API Online - ${data.database} - ${data.s3}`;
            } else {
                throw new Error('API not responding');
            }
        } catch (error) {
            statusDot.className = 'status-dot offline';
            statusText.textContent = 'API Offline';
            console.error('API Status Check Failed:', error);
        }
    }

    loadUserFromStorage() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainContent();
        }
    }

    async handleUserLogin() {
        const formData = new FormData(document.getElementById('user-form'));
        const userData = {
            name: formData.get('name'),
            email: formData.get('email')
        };

        try {
            // Try to create or get user
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (response.ok || response.status === 400) {
                // User created or already exists
                this.currentUser = userData;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                this.showMainContent();
            } else {
                throw new Error('Failed to authenticate user');
            }
        } catch (error) {
            console.error('User login error:', error);
            this.showMessage('Failed to authenticate. Please try again.', 'error');
        }
    }

    showMainContent() {
        document.getElementById('user-section').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('current-user').textContent = `Welcome, ${this.currentUser.name}`;
        this.loadDocuments();
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        document.getElementById('user-section').style.display = 'block';
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('user-form').reset();
    }

    handleFileSelect(file) {
        if (!file) return;

        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.showMessage('File too large. Maximum size is 50MB.', 'error');
            document.getElementById('document-file').value = '';
            return;
        }

        // Show file info
        const fileInfo = `Selected: ${file.name} (${this.formatFileSize(file.size)})`;
        this.showMessage(fileInfo, 'info');
    }

    async uploadDocument() {
        const form = document.getElementById('upload-form');
        const formData = new FormData(form);
        const fileInput = document.getElementById('document-file');

        if (!fileInput.files[0]) {
            this.showMessage('Please select a file to upload', 'error');
            return;
        }

        // Add current user email
        formData.append('uploadedBy', this.currentUser.email);

        const uploadBtn = document.getElementById('upload-btn');
        const progressBar = document.getElementById('upload-progress');

        try {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            progressBar.style.display = 'block';

            const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const document = await response.json();
            this.showMessage('Document uploaded successfully!', 'success');
            form.reset();
            this.loadDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
            progressBar.style.display = 'none';
        }
    }

    async loadDocuments() {
        const loading = document.getElementById('loading');
        const errorMessage = document.getElementById('error-message');
        const documentsContainer = document.getElementById('documents-container');
        const filterType = document.getElementById('filter-type').value;

        try {
            loading.style.display = 'block';
            errorMessage.style.display = 'none';

            let url = `${API_BASE_URL}/api/documents`;
            const params = new URLSearchParams();

            if (filterType === 'my' || filterType === 'shared') {
                params.append('user', this.currentUser.email);
            } else if (filterType === 'public') {
                params.append('public', 'true');
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.documents = await response.json();

            // Filter based on type
            if (filterType === 'my') {
                this.documents = this.documents.filter(doc => doc.uploadedBy === this.currentUser.email);
            } else if (filterType === 'shared') {
                this.documents = this.documents.filter(doc =>
                    doc.uploadedBy !== this.currentUser.email &&
                    doc.sharedWith.some(share => share.email === this.currentUser.email)
                );
            }

            this.renderDocuments();
        } catch (error) {
            console.error('Error loading documents:', error);
            errorMessage.textContent = 'Failed to load documents. Please check your connection.';
            errorMessage.style.display = 'block';
            documentsContainer.innerHTML = '';
        } finally {
            loading.style.display = 'none';
        }
    }

    renderDocuments(documentsToRender = this.documents) {
        const documentsContainer = document.getElementById('documents-container');

        if (documentsToRender.length === 0) {
            documentsContainer.innerHTML = '<p class="no-documents">No documents found. Upload some documents to get started!</p>';
            return;
        }

        documentsContainer.innerHTML = documentsToRender.map(doc => `
            <div class="document-card" data-id="${doc.id}">
                <div class="document-icon">
                    <i class="${this.getFileIcon(doc.mimeType)}"></i>
                </div>
                <div class="document-info">
                    <h3>${this.escapeHtml(doc.originalName)}</h3>
                    <p class="document-description">${this.escapeHtml(doc.description || 'No description')}</p>
                    <div class="document-meta">
                        <span class="file-size">${this.formatFileSize(doc.size)}</span>
                        <span class="upload-date">${new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        <span class="uploaded-by">by ${this.escapeHtml(doc.uploadedBy)}</span>
                    </div>
                    ${doc.tags.length > 0 ? `
                        <div class="document-tags">
                            ${doc.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="document-stats">
                        <span><i class="fas fa-download"></i> ${doc.downloadCount}</span>
                        ${doc.isPublic ? '<span class="public-badge"><i class="fas fa-globe"></i> Public</span>' : ''}
                        ${doc.sharedWith.length > 0 ? `<span><i class="fas fa-users"></i> ${doc.sharedWith.length}</span>` : ''}
                    </div>
                </div>
                <div class="document-actions">
                    <button class="action-btn download-btn" onclick="documentManager.downloadDocument('${doc.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-btn view-btn" onclick="documentManager.viewDocument('${doc.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn share-btn" onclick="documentManager.openShareModal('${doc.id}')" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    ${doc.uploadedBy === this.currentUser.email ? `
                        <button class="action-btn delete-btn" onclick="documentManager.deleteDocument('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    filterDocuments(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderDocuments();
            return;
        }

        const filtered = this.documents.filter(doc =>
            doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        this.renderDocuments(filtered);
    }

    async downloadDocument(documentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/download`);
            if (!response.ok) {
                throw new Error('Download failed');
            }

            const data = await response.json();

            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showMessage('Download started!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showMessage('Download failed. Please try again.', 'error');
        }
    }

    async viewDocument(documentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`);
            if (!response.ok) {
                throw new Error('Failed to load document details');
            }

            const document = await response.json();
            this.showDocumentDetails(document);
        } catch (error) {
            console.error('View document error:', error);
            this.showMessage('Failed to load document details.', 'error');
        }
    }

    showDocumentDetails(document) {
        const detailsContainer = document.getElementById('document-details');
        detailsContainer.innerHTML = `
            <h2><i class="${this.getFileIcon(document.mimeType)}"></i> ${this.escapeHtml(document.originalName)}</h2>
            <div class="document-detail-info">
                <p><strong>Description:</strong> ${this.escapeHtml(document.description || 'No description')}</p>
                <p><strong>Size:</strong> ${this.formatFileSize(document.size)}</p>
                <p><strong>Type:</strong> ${document.mimeType}</p>
                <p><strong>Uploaded by:</strong> ${this.escapeHtml(document.uploadedBy)}</p>
                <p><strong>Upload date:</strong> ${new Date(document.uploadedAt).toLocaleString()}</p>
                <p><strong>Last accessed:</strong> ${new Date(document.lastAccessed).toLocaleString()}</p>
                <p><strong>Downloads:</strong> ${document.downloadCount}</p>
                <p><strong>Public:</strong> ${document.isPublic ? 'Yes' : 'No'}</p>
                ${document.tags.length > 0 ? `
                    <p><strong>Tags:</strong> ${document.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</p>
                ` : ''}
                ${document.sharedWith.length > 0 ? `
                    <div class="shared-with">
                        <strong>Shared with:</strong>
                        <ul>
                            ${document.sharedWith.map(share => `
                                <li>${this.escapeHtml(share.email)} (${share.permission}) - ${new Date(share.sharedAt).toLocaleDateString()}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="document-actions">
                <button onclick="documentManager.downloadDocument('${document.id}')" class="btn-primary">
                    <i class="fas fa-download"></i> Download
                </button>
                <button onclick="documentManager.openShareModal('${document.id}')" class="btn-secondary">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
        `;

        document.getElementById('document-modal').style.display = 'block';
    }

    openShareModal(documentId) {
        document.getElementById('share-document-id').value = documentId;
        document.getElementById('share-modal').style.display = 'block';
    }

    async shareDocument() {
        const documentId = document.getElementById('share-document-id').value;
        const emailsText = document.getElementById('share-emails').value;
        const permission = document.getElementById('share-permission').value;

        if (!emailsText.trim()) {
            this.showMessage('Please enter at least one email address', 'error');
            return;
        }

        const emails = emailsText.split(',').map(email => email.trim()).filter(email => email);

        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emails, permission })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Share failed');
            }

            this.showMessage('Document shared successfully!', 'success');
            this.closeModal(document.getElementById('share-modal'));
            document.getElementById('share-form').reset();
            this.loadDocuments();
        } catch (error) {
            console.error('Share error:', error);
            this.showMessage(error.message, 'error');
        }
    }

    async deleteDocument(documentId) {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Delete failed');
            }

            this.showMessage('Document deleted successfully!', 'success');
            this.loadDocuments();
        } catch (error) {
            console.error('Delete error:', error);
            this.showMessage(error.message, 'error');
        }
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    getFileIcon(mimeType) {
        const iconMap = {
            'application/pdf': 'fas fa-file-pdf',
            'application/msword': 'fas fa-file-word',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
            'application/vnd.ms-excel': 'fas fa-file-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel',
            'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fas fa-file-powerpoint',
            'text/plain': 'fas fa-file-alt',
            'text/csv': 'fas fa-file-csv',
            'image/jpeg': 'fas fa-file-image',
            'image/jpg': 'fas fa-file-image',
            'image/png': 'fas fa-file-image',
            'image/gif': 'fas fa-file-image',
            'application/zip': 'fas fa-file-archive',
            'application/x-rar-compressed': 'fas fa-file-archive'
        };

        return iconMap[mimeType] || 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;

        // Add to page
        document.body.appendChild(messageEl);

        // Remove after 4 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
let documentManager;
document.addEventListener('DOMContentLoaded', () => {
    documentManager = new DocumentManager();
});
