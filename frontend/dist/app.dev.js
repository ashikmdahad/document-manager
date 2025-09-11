"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// API Configuration
var API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://your-backend-domain.com'; // Update this with your actual backend URL

var DocumentManager =
/*#__PURE__*/
function () {
  function DocumentManager() {
    _classCallCheck(this, DocumentManager);

    this.documents = [];
    this.currentUser = null;
    this.init();
  }

  _createClass(DocumentManager, [{
    key: "init",
    value: function init() {
      this.bindEvents();
      this.checkAPIStatus();
      this.loadUserFromStorage();
    }
  }, {
    key: "bindEvents",
    value: function bindEvents() {
      var _this = this;

      // User form submission
      document.getElementById('user-form').addEventListener('submit', function (e) {
        e.preventDefault();

        _this.handleUserLogin();
      }); // Document upload form submission

      document.getElementById('upload-form').addEventListener('submit', function (e) {
        e.preventDefault();

        _this.uploadDocument();
      }); // Share form submission

      document.getElementById('share-form').addEventListener('submit', function (e) {
        e.preventDefault();

        _this.shareDocument();
      }); // Filter and search

      document.getElementById('filter-type').addEventListener('change', function () {
        _this.loadDocuments();
      });
      document.getElementById('search-documents').addEventListener('input', function (e) {
        _this.filterDocuments(e.target.value);
      }); // Modal close events

      document.querySelectorAll('.close').forEach(function (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
          _this.closeModal(e.target.closest('.modal'));
        });
      });
      document.querySelectorAll('.cancel-btn').forEach(function (cancelBtn) {
        cancelBtn.addEventListener('click', function (e) {
          _this.closeModal(e.target.closest('.modal'));
        });
      }); // Close modal when clicking outside

      window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
          _this.closeModal(e.target);
        }
      }); // Logout

      document.getElementById('logout-btn').addEventListener('click', function () {
        _this.logout();
      }); // File input change

      document.getElementById('document-file').addEventListener('change', function (e) {
        _this.handleFileSelect(e.target.files[0]);
      });
    }
  }, {
    key: "checkAPIStatus",
    value: function checkAPIStatus() {
      var statusIndicator, statusDot, statusText, response, data;
      return regeneratorRuntime.async(function checkAPIStatus$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              statusIndicator = document.getElementById('api-status');
              statusDot = statusIndicator.querySelector('.status-dot');
              statusText = statusIndicator.querySelector('.status-text');
              _context.prev = 3;
              _context.next = 6;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/health")));

            case 6:
              response = _context.sent;

              if (!response.ok) {
                _context.next = 15;
                break;
              }

              _context.next = 10;
              return regeneratorRuntime.awrap(response.json());

            case 10:
              data = _context.sent;
              statusDot.className = 'status-dot online';
              statusText.textContent = "API Online - ".concat(data.database, " - ").concat(data.s3);
              _context.next = 16;
              break;

            case 15:
              throw new Error('API not responding');

            case 16:
              _context.next = 23;
              break;

            case 18:
              _context.prev = 18;
              _context.t0 = _context["catch"](3);
              statusDot.className = 'status-dot offline';
              statusText.textContent = 'API Offline';
              console.error('API Status Check Failed:', _context.t0);

            case 23:
            case "end":
              return _context.stop();
          }
        }
      }, null, null, [[3, 18]]);
    }
  }, {
    key: "loadUserFromStorage",
    value: function loadUserFromStorage() {
      var savedUser = localStorage.getItem('currentUser');

      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.showMainContent();
      }
    }
  }, {
    key: "handleUserLogin",
    value: function handleUserLogin() {
      var formData, userData, response;
      return regeneratorRuntime.async(function handleUserLogin$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              formData = new FormData(document.getElementById('user-form'));
              userData = {
                name: formData.get('name'),
                email: formData.get('email')
              };
              _context2.prev = 2;
              _context2.next = 5;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/api/users"), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
              }));

            case 5:
              response = _context2.sent;

              if (!(response.ok || response.status === 400)) {
                _context2.next = 12;
                break;
              }

              // User created or already exists
              this.currentUser = userData;
              localStorage.setItem('currentUser', JSON.stringify(userData));
              this.showMainContent();
              _context2.next = 13;
              break;

            case 12:
              throw new Error('Failed to authenticate user');

            case 13:
              _context2.next = 19;
              break;

            case 15:
              _context2.prev = 15;
              _context2.t0 = _context2["catch"](2);
              console.error('User login error:', _context2.t0);
              this.showMessage('Failed to authenticate. Please try again.', 'error');

            case 19:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[2, 15]]);
    }
  }, {
    key: "showMainContent",
    value: function showMainContent() {
      document.getElementById('user-section').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      document.getElementById('user-info').style.display = 'block';
      document.getElementById('current-user').textContent = "Welcome, ".concat(this.currentUser.name);
      this.loadDocuments();
    }
  }, {
    key: "logout",
    value: function logout() {
      localStorage.removeItem('currentUser');
      this.currentUser = null;
      document.getElementById('user-section').style.display = 'block';
      document.getElementById('main-content').style.display = 'none';
      document.getElementById('user-info').style.display = 'none';
      document.getElementById('user-form').reset();
    }
  }, {
    key: "handleFileSelect",
    value: function handleFileSelect(file) {
      if (!file) return;
      var maxSize = 50 * 1024 * 1024; // 50MB

      if (file.size > maxSize) {
        this.showMessage('File too large. Maximum size is 50MB.', 'error');
        document.getElementById('document-file').value = '';
        return;
      } // Show file info


      var fileInfo = "Selected: ".concat(file.name, " (").concat(this.formatFileSize(file.size), ")");
      this.showMessage(fileInfo, 'info');
    }
  }, {
    key: "uploadDocument",
    value: function uploadDocument() {
      var form, formData, fileInput, uploadBtn, progressBar, response, error, _document;

      return regeneratorRuntime.async(function uploadDocument$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              form = document.getElementById('upload-form');
              formData = new FormData(form);
              fileInput = document.getElementById('document-file');

              if (fileInput.files[0]) {
                _context3.next = 6;
                break;
              }

              this.showMessage('Please select a file to upload', 'error');
              return _context3.abrupt("return");

            case 6:
              // Add current user email
              formData.append('uploadedBy', this.currentUser.email);
              uploadBtn = document.getElementById('upload-btn');
              progressBar = document.getElementById('upload-progress');
              _context3.prev = 9;
              uploadBtn.disabled = true;
              uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
              progressBar.style.display = 'block';
              _context3.next = 15;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/api/documents/upload"), {
                method: 'POST',
                body: formData
              }));

            case 15:
              response = _context3.sent;

              if (response.ok) {
                _context3.next = 21;
                break;
              }

              _context3.next = 19;
              return regeneratorRuntime.awrap(response.json());

            case 19:
              error = _context3.sent;
              throw new Error(error.error || 'Upload failed');

            case 21:
              _context3.next = 23;
              return regeneratorRuntime.awrap(response.json());

            case 23:
              _document = _context3.sent;
              this.showMessage('Document uploaded successfully!', 'success');
              form.reset();
              this.loadDocuments();
              _context3.next = 33;
              break;

            case 29:
              _context3.prev = 29;
              _context3.t0 = _context3["catch"](9);
              console.error('Upload error:', _context3.t0);
              this.showMessage(_context3.t0.message, 'error');

            case 33:
              _context3.prev = 33;
              uploadBtn.disabled = false;
              uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Document';
              progressBar.style.display = 'none';
              return _context3.finish(33);

            case 38:
            case "end":
              return _context3.stop();
          }
        }
      }, null, this, [[9, 29, 33, 38]]);
    }
  }, {
    key: "loadDocuments",
    value: function loadDocuments() {
      var _this2 = this;

      var loading, errorMessage, documentsContainer, filterType, url, params, response;
      return regeneratorRuntime.async(function loadDocuments$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              loading = document.getElementById('loading');
              errorMessage = document.getElementById('error-message');
              documentsContainer = document.getElementById('documents-container');
              filterType = document.getElementById('filter-type').value;
              _context4.prev = 4;
              loading.style.display = 'block';
              errorMessage.style.display = 'none';
              url = "".concat(API_BASE_URL, "/api/documents");
              params = new URLSearchParams();

              if (filterType === 'my' || filterType === 'shared') {
                params.append('user', this.currentUser.email);
              } else if (filterType === 'public') {
                params.append('public', 'true');
              }

              if (params.toString()) {
                url += '?' + params.toString();
              }

              _context4.next = 13;
              return regeneratorRuntime.awrap(fetch(url));

            case 13:
              response = _context4.sent;

              if (response.ok) {
                _context4.next = 16;
                break;
              }

              throw new Error("HTTP error! status: ".concat(response.status));

            case 16:
              _context4.next = 18;
              return regeneratorRuntime.awrap(response.json());

            case 18:
              this.documents = _context4.sent;

              // Filter based on type
              if (filterType === 'my') {
                this.documents = this.documents.filter(function (doc) {
                  return doc.uploadedBy === _this2.currentUser.email;
                });
              } else if (filterType === 'shared') {
                this.documents = this.documents.filter(function (doc) {
                  return doc.uploadedBy !== _this2.currentUser.email && doc.sharedWith.some(function (share) {
                    return share.email === _this2.currentUser.email;
                  });
                });
              }

              this.renderDocuments();
              _context4.next = 29;
              break;

            case 23:
              _context4.prev = 23;
              _context4.t0 = _context4["catch"](4);
              console.error('Error loading documents:', _context4.t0);
              errorMessage.textContent = 'Failed to load documents. Please check your connection.';
              errorMessage.style.display = 'block';
              documentsContainer.innerHTML = '';

            case 29:
              _context4.prev = 29;
              loading.style.display = 'none';
              return _context4.finish(29);

            case 32:
            case "end":
              return _context4.stop();
          }
        }
      }, null, this, [[4, 23, 29, 32]]);
    }
  }, {
    key: "renderDocuments",
    value: function renderDocuments() {
      var _this3 = this;

      var documentsToRender = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.documents;
      var documentsContainer = document.getElementById('documents-container');

      if (documentsToRender.length === 0) {
        documentsContainer.innerHTML = '<p class="no-documents">No documents found. Upload some documents to get started!</p>';
        return;
      }

      documentsContainer.innerHTML = documentsToRender.map(function (doc) {
        return "\n            <div class=\"document-card\" data-id=\"".concat(doc.id, "\">\n                <div class=\"document-icon\">\n                    <i class=\"").concat(_this3.getFileIcon(doc.mimeType), "\"></i>\n                </div>\n                <div class=\"document-info\">\n                    <h3>").concat(_this3.escapeHtml(doc.originalName), "</h3>\n                    <p class=\"document-description\">").concat(_this3.escapeHtml(doc.description || 'No description'), "</p>\n                    <div class=\"document-meta\">\n                        <span class=\"file-size\">").concat(_this3.formatFileSize(doc.size), "</span>\n                        <span class=\"upload-date\">").concat(new Date(doc.uploadedAt).toLocaleDateString(), "</span>\n                        <span class=\"uploaded-by\">by ").concat(_this3.escapeHtml(doc.uploadedBy), "</span>\n                    </div>\n                    ").concat(doc.tags.length > 0 ? "\n                        <div class=\"document-tags\">\n                            ".concat(doc.tags.map(function (tag) {
          return "<span class=\"tag\">".concat(_this3.escapeHtml(tag), "</span>");
        }).join(''), "\n                        </div>\n                    ") : '', "\n                    <div class=\"document-stats\">\n                        <span><i class=\"fas fa-download\"></i> ").concat(doc.downloadCount, "</span>\n                        ").concat(doc.isPublic ? '<span class="public-badge"><i class="fas fa-globe"></i> Public</span>' : '', "\n                        ").concat(doc.sharedWith.length > 0 ? "<span><i class=\"fas fa-users\"></i> ".concat(doc.sharedWith.length, "</span>") : '', "\n                    </div>\n                </div>\n                <div class=\"document-actions\">\n                    <button class=\"action-btn download-btn\" onclick=\"documentManager.downloadDocument('").concat(doc.id, "')\" title=\"Download\">\n                        <i class=\"fas fa-download\"></i>\n                    </button>\n                    <button class=\"action-btn view-btn\" onclick=\"documentManager.viewDocument('").concat(doc.id, "')\" title=\"View Details\">\n                        <i class=\"fas fa-eye\"></i>\n                    </button>\n                    <button class=\"action-btn share-btn\" onclick=\"documentManager.openShareModal('").concat(doc.id, "')\" title=\"Share\">\n                        <i class=\"fas fa-share-alt\"></i>\n                    </button>\n                    ").concat(doc.uploadedBy === _this3.currentUser.email ? "\n                        <button class=\"action-btn delete-btn\" onclick=\"documentManager.deleteDocument('".concat(doc.id, "')\" title=\"Delete\">\n                            <i class=\"fas fa-trash\"></i>\n                        </button>\n                    ") : '', "\n                </div>\n            </div>\n        ");
      }).join('');
    }
  }, {
    key: "filterDocuments",
    value: function filterDocuments(searchTerm) {
      if (!searchTerm.trim()) {
        this.renderDocuments();
        return;
      }

      var filtered = this.documents.filter(function (doc) {
        return doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) || doc.description.toLowerCase().includes(searchTerm.toLowerCase()) || doc.tags.some(function (tag) {
          return tag.toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
      this.renderDocuments(filtered);
    }
  }, {
    key: "downloadDocument",
    value: function downloadDocument(documentId) {
      var response, data, link;
      return regeneratorRuntime.async(function downloadDocument$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/api/documents/").concat(documentId, "/download")));

            case 3:
              response = _context5.sent;

              if (response.ok) {
                _context5.next = 6;
                break;
              }

              throw new Error('Download failed');

            case 6:
              _context5.next = 8;
              return regeneratorRuntime.awrap(response.json());

            case 8:
              data = _context5.sent;
              // Create temporary link and trigger download
              link = document.createElement('a');
              link.href = data.downloadUrl;
              link.download = data.filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              this.showMessage('Download started!', 'success');
              _context5.next = 22;
              break;

            case 18:
              _context5.prev = 18;
              _context5.t0 = _context5["catch"](0);
              console.error('Download error:', _context5.t0);
              this.showMessage('Download failed. Please try again.', 'error');

            case 22:
            case "end":
              return _context5.stop();
          }
        }
      }, null, this, [[0, 18]]);
    }
  }, {
    key: "viewDocument",
    value: function viewDocument(documentId) {
      var response, _document2;

      return regeneratorRuntime.async(function viewDocument$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.prev = 0;
              _context6.next = 3;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/api/documents/").concat(documentId)));

            case 3:
              response = _context6.sent;

              if (response.ok) {
                _context6.next = 6;
                break;
              }

              throw new Error('Failed to load document details');

            case 6:
              _context6.next = 8;
              return regeneratorRuntime.awrap(response.json());

            case 8:
              _document2 = _context6.sent;
              this.showDocumentDetails(_document2);
              _context6.next = 16;
              break;

            case 12:
              _context6.prev = 12;
              _context6.t0 = _context6["catch"](0);
              console.error('View document error:', _context6.t0);
              this.showMessage('Failed to load document details.', 'error');

            case 16:
            case "end":
              return _context6.stop();
          }
        }
      }, null, this, [[0, 12]]);
    }
  }, {
    key: "showDocumentDetails",
    value: function showDocumentDetails(document) {
      var _this4 = this;

      var detailsContainer = document.getElementById('document-details');
      detailsContainer.innerHTML = "\n            <h2><i class=\"".concat(this.getFileIcon(document.mimeType), "\"></i> ").concat(this.escapeHtml(document.originalName), "</h2>\n            <div class=\"document-detail-info\">\n                <p><strong>Description:</strong> ").concat(this.escapeHtml(document.description || 'No description'), "</p>\n                <p><strong>Size:</strong> ").concat(this.formatFileSize(document.size), "</p>\n                <p><strong>Type:</strong> ").concat(document.mimeType, "</p>\n                <p><strong>Uploaded by:</strong> ").concat(this.escapeHtml(document.uploadedBy), "</p>\n                <p><strong>Upload date:</strong> ").concat(new Date(document.uploadedAt).toLocaleString(), "</p>\n                <p><strong>Last accessed:</strong> ").concat(new Date(document.lastAccessed).toLocaleString(), "</p>\n                <p><strong>Downloads:</strong> ").concat(document.downloadCount, "</p>\n                <p><strong>Public:</strong> ").concat(document.isPublic ? 'Yes' : 'No', "</p>\n                ").concat(document.tags.length > 0 ? "\n                    <p><strong>Tags:</strong> ".concat(document.tags.map(function (tag) {
        return "<span class=\"tag\">".concat(_this4.escapeHtml(tag), "</span>");
      }).join(''), "</p>\n                ") : '', "\n                ").concat(document.sharedWith.length > 0 ? "\n                    <div class=\"shared-with\">\n                        <strong>Shared with:</strong>\n                        <ul>\n                            ".concat(document.sharedWith.map(function (share) {
        return "\n                                <li>".concat(_this4.escapeHtml(share.email), " (").concat(share.permission, ") - ").concat(new Date(share.sharedAt).toLocaleDateString(), "</li>\n                            ");
      }).join(''), "\n                        </ul>\n                    </div>\n                ") : '', "\n            </div>\n            <div class=\"document-actions\">\n                <button onclick=\"documentManager.downloadDocument('").concat(document.id, "')\" class=\"btn-primary\">\n                    <i class=\"fas fa-download\"></i> Download\n                </button>\n                <button onclick=\"documentManager.openShareModal('").concat(document.id, "')\" class=\"btn-secondary\">\n                    <i class=\"fas fa-share-alt\"></i> Share\n                </button>\n            </div>\n        ");
      document.getElementById('document-modal').style.display = 'block';
    }
  }, {
    key: "openShareModal",
    value: function openShareModal(documentId) {
      document.getElementById('share-document-id').value = documentId;
      document.getElementById('share-modal').style.display = 'block';
    }
  }, {
    key: "shareDocument",
    value: function shareDocument() {
      var documentId, emailsText, permission, emails, response, error;
      return regeneratorRuntime.async(function shareDocument$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              documentId = document.getElementById('share-document-id').value;
              emailsText = document.getElementById('share-emails').value;
              permission = document.getElementById('share-permission').value;

              if (emailsText.trim()) {
                _context7.next = 6;
                break;
              }

              this.showMessage('Please enter at least one email address', 'error');
              return _context7.abrupt("return");

            case 6:
              emails = emailsText.split(',').map(function (email) {
                return email.trim();
              }).filter(function (email) {
                return email;
              });
              _context7.prev = 7;
              _context7.next = 10;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/api/documents/").concat(documentId, "/share"), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  emails: emails,
                  permission: permission
                })
              }));

            case 10:
              response = _context7.sent;

              if (response.ok) {
                _context7.next = 16;
                break;
              }

              _context7.next = 14;
              return regeneratorRuntime.awrap(response.json());

            case 14:
              error = _context7.sent;
              throw new Error(error.error || 'Share failed');

            case 16:
              this.showMessage('Document shared successfully!', 'success');
              this.closeModal(document.getElementById('share-modal'));
              document.getElementById('share-form').reset();
              this.loadDocuments();
              _context7.next = 26;
              break;

            case 22:
              _context7.prev = 22;
              _context7.t0 = _context7["catch"](7);
              console.error('Share error:', _context7.t0);
              this.showMessage(_context7.t0.message, 'error');

            case 26:
            case "end":
              return _context7.stop();
          }
        }
      }, null, this, [[7, 22]]);
    }
  }, {
    key: "deleteDocument",
    value: function deleteDocument(documentId) {
      var response, error;
      return regeneratorRuntime.async(function deleteDocument$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                _context8.next = 2;
                break;
              }

              return _context8.abrupt("return");

            case 2:
              _context8.prev = 2;
              _context8.next = 5;
              return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/api/documents/").concat(documentId), {
                method: 'DELETE'
              }));

            case 5:
              response = _context8.sent;

              if (response.ok) {
                _context8.next = 11;
                break;
              }

              _context8.next = 9;
              return regeneratorRuntime.awrap(response.json());

            case 9:
              error = _context8.sent;
              throw new Error(error.error || 'Delete failed');

            case 11:
              this.showMessage('Document deleted successfully!', 'success');
              this.loadDocuments();
              _context8.next = 19;
              break;

            case 15:
              _context8.prev = 15;
              _context8.t0 = _context8["catch"](2);
              console.error('Delete error:', _context8.t0);
              this.showMessage(_context8.t0.message, 'error');

            case 19:
            case "end":
              return _context8.stop();
          }
        }
      }, null, this, [[2, 15]]);
    }
  }, {
    key: "closeModal",
    value: function closeModal(modal) {
      modal.style.display = 'none';
    }
  }, {
    key: "getFileIcon",
    value: function getFileIcon(mimeType) {
      var iconMap = {
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
  }, {
    key: "formatFileSize",
    value: function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      var k = 1024;
      var sizes = ['Bytes', 'KB', 'MB', 'GB'];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }, {
    key: "showMessage",
    value: function showMessage(message, type) {
      // Create message element
      var messageEl = document.createElement('div');
      messageEl.className = "message ".concat(type);
      messageEl.textContent = message; // Add to page

      document.body.appendChild(messageEl); // Remove after 4 seconds

      setTimeout(function () {
        messageEl.remove();
      }, 4000);
    }
  }, {
    key: "escapeHtml",
    value: function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }]);

  return DocumentManager;
}(); // Initialize the application


var documentManager;
document.addEventListener('DOMContentLoaded', function () {
  documentManager = new DocumentManager();
});
//# sourceMappingURL=app.dev.js.map
