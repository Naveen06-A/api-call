document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const appIdForm = document.getElementById('appIdForm');
    const appIdInput = document.getElementById('appIdInput');
    const submitAppIdBtn = document.getElementById('submitAppIdBtn');
    const connectBtn = document.getElementById('connectBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userIdDisplay = document.getElementById('userIdDisplay');
    const pageSelect = document.getElementById('pageSelect');
    const retrievePageSelect = document.getElementById('retrievePageSelect');
    const postContent = document.getElementById('postContent');
    const postBtn = document.getElementById('postBtn');
    const postStatus = document.getElementById('postStatus');
    const postStatusText = document.getElementById('postStatusText');
    const retrieveBtn = document.getElementById('retrieveBtn');
    const retrieveStatus = document.getElementById('retrieveStatus');
    const retrieveStatusText = document.getElementById('retrieveStatusText');
    const postsList = document.getElementById('postsList');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const previewContent = document.getElementById('previewContent');
    const previewPageName = document.getElementById('previewPageName');
    const previewMedia = document.getElementById('previewMedia');
    const mediaUpload = document.getElementById('mediaUpload');
    const mediaFile = document.getElementById('mediaFile');
    const mediaPreview = document.getElementById('mediaPreview');
    const pageSelection = document.getElementById('pageSelection');
    const pageList = document.getElementById('pageList');
    
    // State
    let userData = null;
    let pages = [];
    let postsData = [];
    let currentPage = null;
    let selectedMedia = null;
    let accessToken = '';
    let APP_ID = '';
    
    // Configuration - Using localhost for development
    const REDIRECT_URI = window.location.origin;
    const FB_API_VERSION = 'v19.0';
    
    // Tab functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Event Listeners
    submitAppIdBtn.addEventListener('click', submitAppId);
    connectBtn.addEventListener('click', startOAuthFlow);
    logoutBtn.addEventListener('click', logout);
    postBtn.addEventListener('click', createPost);
    retrieveBtn.addEventListener('click', retrievePosts);
    postContent.addEventListener('input', updatePostPreview);
    mediaUpload.addEventListener('click', () => mediaFile.click());
    mediaFile.addEventListener('change', handleMediaUpload);
    
    // Check for OAuth response in URL
    checkOAuthResponse();
    
    function submitAppId() {
        APP_ID = appIdInput.value.trim();
        if (!APP_ID || !/^\d+$/.test(APP_ID)) {
            showStatus('Please enter a valid Facebook App ID (numeric only)', 'error');
            return;
        }
        appIdForm.classList.add('hidden');
        connectBtn.classList.remove('hidden');
        showStatus('App ID submitted. Click "Connect Facebook" to authenticate.', 'success');
    }
    
    function checkOAuthResponse() {
        const urlParams = new URLSearchParams(window.location.hash.substr(1));
        const token = urlParams.get('access_token');
        const error = urlParams.get('error_description');
        
        if (error) {
            showStatus('Authentication failed: ' + decodeURIComponent(error), 'error');
            appIdForm.classList.remove('hidden');
            connectBtn.classList.add('hidden');
            return;
        }
        
        if (token) {
            accessToken = token;
            showStatus('Successfully authenticated! Fetching user data...', 'info');
            getUserData();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    function startOAuthFlow() {
        if (!APP_ID) {
            showStatus('Please submit a valid App ID first', 'error');
            return;
        }
        
        showStatus('Redirecting to Facebook for authentication...', 'info');
        connectBtn.disabled = true;
        connectBtn.innerHTML = '<span class="loading"></span> Connecting...';
        
        const authUrl = `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=pages_show_list,pages_read_engagement,pages_manage_posts&response_type=token`;
        window.location.href = authUrl;
    }
    
    function getUserData() {
        fetch(`https://graph.facebook.com/${FB_API_VERSION}/me?fields=id,name,email,picture&access_token=${accessToken}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch user data: ${response.statusText}`);
                return response.json();
            })
            .then(user => {
                userData = user;
                userName.textContent = userData.name;
                userIdDisplay.textContent = `User ID: ${userData.id}`;
                
                if (userData.picture && userData.picture.data.url) {
                    userAvatar.innerHTML = `<img src="${userData.picture.data.url}" alt="User Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
                }
                
                userInfo.classList.remove('hidden');
                appIdForm.classList.add('hidden');
                connectBtn.classList.add('hidden');
                getPages();
            })
            .catch(error => {
                showStatus('Error fetching user data: ' + error.message, 'error');
                appIdForm.classList.remove('hidden');
                connectBtn.classList.add('hidden');
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fab fa-facebook"></i> Connect Facebook';
            });
    }
    
    function getPages() {
        fetch(`https://graph.facebook.com/${FB_API_VERSION}/me/accounts?access_token=${accessToken}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch pages: ${response.statusText}`);
                return response.json();
            })
            .then(response => {
                pages = response.data;
                
                if (pages.length === 0) {
                    showStatus('No pages found for this account. Please ensure you have admin access to at least one page.', 'error');
                    return;
                }
                
                showPagesSelection();
                showStatus('Authentication complete! Select a page to manage.', 'success');
            })
            .catch(error => {
                showStatus('Error fetching pages: ' + error.message, 'error');
                appIdForm.classList.remove('hidden');
                connectBtn.classList.add('hidden');
            });
    }
    
    function showPagesSelection() {
        pageSelection.classList.remove('hidden');
        pageList.innerHTML = '';
        
        pages.forEach(page => {
            const pageItem = document.createElement('div');
            pageItem.className = 'page-item';
            pageItem.innerHTML = `
                <div class="page-name">${page.name}</div>
                <div class="page-category">${page.category}</div>
            `;
            
            pageItem.addEventListener('click', () => {
                document.querySelectorAll('.page-item').forEach(item => item.classList.remove('selected'));
                pageItem.classList.add('selected');
                selectPage(page);
            });
            
            pageList.appendChild(pageItem);
        });
    }
    
    function selectPage(page) {
        currentPage = page;
        pageSelect.innerHTML = `<option value="${page.id}" selected>${page.name} (${page.category})</option>`;
        retrievePageSelect.innerHTML = `<option value="${page.id}" selected>${page.name} (${page.category})</option>`;
        pageSelect.disabled = false;
        retrievePageSelect.disabled = false;
        postBtn.disabled = !postContent.value.trim() && !selectedMedia;
        
        // Update preview with page name
        previewPageName.textContent = page.name;
        
        document.querySelector('[data-tab="post"]').click();
    }
    
    function handleMediaUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        selectedMedia = file;
        mediaPreview.classList.remove('hidden');
        mediaPreview.innerHTML = '';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            mediaPreview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            mediaPreview.appendChild(video);
        }
        
        updatePostPreview();
    }
    
    function updatePostPreview() {
        const content = postContent.value.trim();
        previewContent.textContent = content || 'Your post content will appear here...';
        
        if (currentPage) {
            previewPageName.textContent = currentPage.name;
        }
        
        previewMedia.innerHTML = '';
        
        if (selectedMedia) {
            if (selectedMedia.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(selectedMedia);
                img.style.maxWidth = '100%';
                previewMedia.appendChild(img);
            } else if (selectedMedia.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(selectedMedia);
                video.controls = true;
                video.style.maxWidth = '100%';
                previewMedia.appendChild(video);
            }
        }
        
        postBtn.disabled = !content && !selectedMedia;
    }
    
    function createPost() {
        if (!currentPage) {
            showPostStatus('Please select a page first', 'error');
            return;
        }
        
        const content = postContent.value.trim();
        if (!content && !selectedMedia) {
            showPostStatus('Please enter content or upload media', 'error');
            return;
        }
        
        showPostStatus('Publishing post to Facebook...', 'info');
        postBtn.disabled = true;
        postBtn.innerHTML = '<span class="loading"></span> Publishing...';
        
        const formData = new FormData();
        if (content) {
            formData.append('message', content);
        }
        formData.append('access_token', currentPage.access_token);
        
        let url = `https://graph.facebook.com/${FB_API_VERSION}/${currentPage.id}/feed`;
        
        if (selectedMedia) {
            if (selectedMedia.type.startsWith('image/')) {
                url = `https://graph.facebook.com/${FB_API_VERSION}/${currentPage.id}/photos`;
                formData.append('source', selectedMedia);
            } else if (selectedMedia.type.startsWith('video/')) {
                url = `https://graph.facebook.com/${FB_API_VERSION}/${currentPage.id}/videos`;
                formData.append('filedata', selectedMedia);
            }
        }
        
        fetch(url, {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) throw new Error(`Failed to post: ${response.statusText}`);
                return response.json();
            })
            .then(response => {
                if (response.error) {
                    throw new Error(response.error.message);
                }
                
                showPostStatus('Successfully posted to your page!', 'success');
                postContent.value = '';
                selectedMedia = null;
                mediaPreview.classList.add('hidden');
                mediaPreview.innerHTML = '';
                mediaFile.value = '';
                previewMedia.innerHTML = '';
                previewContent.textContent = 'Your post content will appear here...';
                postBtn.disabled = false;
                postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Post';
            })
            .catch(error => {
                showPostStatus('Error posting: ' + error.message, 'error');
                postBtn.disabled = false;
                postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Post';
            });
    }
    
    function retrievePosts() {
        if (!currentPage) {
            showRetrieveStatus('Please select a page first', 'error');
            return;
        }
        
        showRetrieveStatus('Loading posts from Facebook...', 'info');
        retrieveBtn.disabled = true;
        retrieveBtn.innerHTML = '<span class="loading"></span> Loading...';
        
        fetch(`https://graph.facebook.com/${FB_API_VERSION}/${currentPage.id}/feed?fields=message,created_time,attachments&access_token=${currentPage.access_token}`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch posts: ${response.statusText}`);
                return response.json();
            })
            .then(response => {
                postsData = response.data;
                displayPosts(postsData);
                showRetrieveStatus(`Loaded ${postsData.length} posts`, 'success');
                retrieveBtn.disabled = false;
                retrieveBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load Posts';
            })
            .catch(error => {
                showRetrieveStatus('Error loading posts: ' + error.message, 'error');
                retrieveBtn.disabled = false;
                retrieveBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Load Posts';
            });
    }
    
    function displayPosts(posts) {
        postsList.innerHTML = '';
        
        if (posts.length === 0) {
            postsList.innerHTML = '<p class="description">No posts found for this page</p>';
            return;
        }
        
        posts.forEach(post => {
            const postEl = document.createElement('div');
            postEl.className = 'post';
            
            const message = document.createElement('div');
            message.className = 'post-message';
            message.textContent = post.message || '(No text content)';
            
            const date = document.createElement('div');
            date.className = 'post-date';
            date.textContent = new Date(post.created_time).toLocaleString();
            
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'post-media';
            
            if (post.attachments && post.attachments.data) {
                post.attachments.data.forEach(attachment => {
                    if (attachment.media && attachment.media.image) {
                        const img = document.createElement('img');
                        img.src = attachment.media.image.src;
                        mediaContainer.appendChild(img);
                    } else if (attachment.media && attachment.media.source) {
                        const video = document.createElement('video');
                        video.src = attachment.media.source;
                        video.controls = true;
                        video.style.maxWidth = '100%';
                        mediaContainer.appendChild(video);
                    }
                });
            }
            
            postEl.appendChild(message);
            postEl.appendChild(date);
            
            if (mediaContainer.children.length > 0) {
                postEl.appendChild(mediaContainer);
            }
            
            postsList.appendChild(postEl);
        });
    }
    
    function logout() {
        userData = null;
        pages = [];
        postsData = [];
        currentPage = null;
        selectedMedia = null;
        accessToken = '';
        APP_ID = '';
        
        userInfo.classList.add('hidden');
        appIdForm.classList.remove('hidden');
        connectBtn.classList.add('hidden');
        pageSelection.classList.add('hidden');
        postContent.value = '';
        mediaPreview.classList.add('hidden');
        mediaPreview.innerHTML = '';
        mediaFile.value = '';
        previewMedia.innerHTML = '';
        postsList.innerHTML = '<p class="description">Your posts will appear here after you load them</p>';
        appIdInput.value = '';
        
        showStatus('Logged out successfully', 'info');
        document.querySelector('[data-tab="connect"]').click();
    }
    
    function showStatus(message, type) {
        statusText.textContent = message;
        status.className = `status ${type}`;
        status.classList.remove('hidden');
    }
    
    function showPostStatus(message, type) {
        postStatusText.textContent = message;
        postStatus.className = `status ${type}`;
        postStatus.classList.remove('hidden');
    }
    
    function showRetrieveStatus(message, type) {
        retrieveStatusText.textContent = message;
        retrieveStatus.className = `status ${type}`;
        retrieveStatus.classList.remove('hidden');
    }
});