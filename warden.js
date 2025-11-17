// Check if localStorage is available
function checkLocalStorage() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.error('localStorage is not available:', e);
        alert('localStorage is not available in your browser. Data cannot be saved. Please enable cookies/localStorage.');
        return false;
    }
}

// Initialize default admin user if not exists
function initializeDefaultAdmin() {
    if (!checkLocalStorage()) {
        return;
    }
    
    try {
        let users = [];
        const stored = localStorage.getItem('wardenUsers');
        users = stored ? JSON.parse(stored) : [];
        
        const adminExists = users.some(function(user) {
            return user.username === 'admin';
        });
        
        if (!adminExists) {
            users.push({
                id: Date.now(),
                fullName: 'Administrator',
                username: 'admin',
                email: 'admin@wastemanagement.com',
                password: '1234',
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('wardenUsers', JSON.stringify(users));
        }
        
        if (!localStorage.getItem('wasteRequests')) {
            localStorage.setItem('wasteRequests', '[]');
        }
    } catch (e) {
        console.error('Error initializing admin:', e);
    }
}

// Initialize on load
initializeDefaultAdmin();

// Flag to prevent checkAuth from interfering during redirect
let isRedirecting = false;

// Check authentication and show/hide sections
function checkAuth() {
    // Don't check if we're in the middle of a redirect
    if (isRedirecting) {
        return true;
    }
    
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    const isLoggedIn = localStorage.getItem('wardenLoggedIn') === 'true';
    const userLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    
    // Block access to user pages if warden is logged in
    if (isLoggedIn) {
        if (currentPage === 'user-login.html' || currentPage.includes('user-login') ||
            currentPage === 'user-signup.html' || currentPage.includes('user-signup') ||
            currentPage === 'user-dashboard.html' || currentPage.includes('user-dashboard')) {
            alert('Access denied. You are logged in as a warden. Please logout first to access user portal.');
            window.location.href = 'warden-dashboard.html';
            return false;
        }
    }
    
    // Block access if user is logged in (user should not access warden pages)
    if (userLoggedIn && !isLoggedIn) {
        if (currentPage === 'warden-login.html' || currentPage.includes('warden-login') ||
            currentPage === 'warden-signup.html' || currentPage.includes('warden-signup') ||
            currentPage === 'warden-dashboard.html' || currentPage.includes('warden-dashboard') ||
            currentPage === 'warden.html' || currentPage.includes('warden')) {
            alert('Access denied. You are logged in as a user. Please logout first to access warden portal.');
            window.location.href = 'user-dashboard.html';
            return false;
        }
    }
    
    // If on login/signup page and already logged in, redirect to dashboard
    if (currentPage === 'warden-login.html' || currentPage.includes('warden-login') ||
        currentPage === 'warden-signup.html' || currentPage.includes('warden-signup')) {
        if (isLoggedIn) {
            window.location.href = 'warden-dashboard.html';
            return false;
        }
    }
    
    return true;
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    
    // Regular login form handler (for warden-login.html)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Dashboard login form handler
    const dashboardLoginForm = document.getElementById('dashboardLoginForm');
    if (dashboardLoginForm) {
        dashboardLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleDashboardLogin();
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleSignup();
            return false;
        });
    }

    // Handle dashboard page - show/hide sections based on login status
    if (currentPage === 'warden-dashboard.html' || currentPage.includes('warden-dashboard')) {
        const isLoggedIn = localStorage.getItem('wardenLoggedIn') === 'true';
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (loginSection && dashboardSection) {
            if (isLoggedIn) {
                // User is logged in - show dashboard, hide login
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadDashboard();
                updateStats();
                updateWelcomeMessage();
            } else {
                // User is not logged in - show login, hide dashboard
                loginSection.style.display = 'block';
                dashboardSection.style.display = 'none';
            }
        }
    }
    
    // Check auth for other pages
    checkAuth();
});

// Update welcome message with user's name
function updateWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const wardenName = document.getElementById('wardenName');
    const currentWarden = JSON.parse(localStorage.getItem('currentWarden') || '{}');
    
    if (welcomeMessage) {
        welcomeMessage.textContent = 'Welcome back!';
    }
    
    if (wardenName) {
        if (currentWarden.fullName) {
            wardenName.textContent = '👤 Warden: ' + escapeHtml(currentWarden.fullName);
            wardenName.style.display = 'block';
        } else if (currentWarden.username) {
            wardenName.textContent = '👤 Warden: ' + escapeHtml(currentWarden.username);
            wardenName.style.display = 'block';
        } else {
            wardenName.style.display = 'none';
        }
    }
}

// Handle dashboard login
function handleDashboardLogin() {
    const username = document.getElementById('dashboardUsername').value.trim();
    const password = document.getElementById('dashboardPassword').value;
    const errorMessage = document.getElementById('dashboardErrorMessage');

    if (!username || !password) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter both username and password.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    // Get all registered users
    const users = JSON.parse(localStorage.getItem('wardenUsers') || '[]');
    
    // Find user by username
    const user = users.find(function(u) {
        return u.username === username;
    });

    if (user && user.password === password) {
        // Check if user is logged in, logout user first
        if (localStorage.getItem('userLoggedIn') === 'true') {
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('currentUser');
        }
        
        // Set login status and store current user info
        try {
            localStorage.setItem('wardenLoggedIn', 'true');
            localStorage.setItem('userRole', 'warden'); // Set role
            localStorage.setItem('currentWarden', JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email
            }));
            console.log('Warden logged in successfully:', user.username);
        } catch (e) {
            console.error('Error saving login data:', e);
            if (errorMessage) {
                errorMessage.textContent = 'Error saving login. Please check if localStorage is enabled.';
                errorMessage.classList.remove('success');
                errorMessage.classList.add('show');
            }
            return;
        }
        
        // Show success message briefly
        if (errorMessage) {
            errorMessage.textContent = 'Login successful!';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('success', 'show');
        }
        
        // Hide login section and show dashboard
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (loginSection && dashboardSection) {
            setTimeout(function() {
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadDashboard();
                updateStats();
                updateWelcomeMessage();
            }, 500);
        }
    } else {
        // Show error
        if (errorMessage) {
            errorMessage.textContent = 'Invalid username or password. Please try again.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        
        // Clear password field
        document.getElementById('dashboardPassword').value = '';
        
        // Hide error after 3 seconds
        setTimeout(function() {
            if (errorMessage) {
                errorMessage.classList.remove('show');
            }
        }, 3000);
    }
}

// Handle login
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (!username || !password) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter both username and password.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    // Get all registered users
    const users = JSON.parse(localStorage.getItem('wardenUsers') || '[]');
    
    // Find user by username
    const user = users.find(function(u) {
        return u.username === username;
    });

    if (user && user.password === password) {
        // Check if user is logged in, logout user first
        if (localStorage.getItem('userLoggedIn') === 'true') {
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('currentUser');
        }
        
        // Set login status and store current user info
        try {
            localStorage.setItem('wardenLoggedIn', 'true');
            localStorage.setItem('userRole', 'warden'); // Set role
            localStorage.setItem('currentWarden', JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email
            }));
            console.log('Warden logged in successfully:', user.username);
        } catch (e) {
            console.error('Error saving login data:', e);
            if (errorMessage) {
                errorMessage.textContent = 'Error saving login. Please check if localStorage is enabled.';
                errorMessage.classList.remove('success');
                errorMessage.classList.add('show');
            }
            return;
        }
        
        // Show success message briefly
        if (errorMessage) {
            errorMessage.textContent = 'Login successful! Redirecting...';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('success', 'show');
        }
        
        // Redirect to dashboard after short delay
        setTimeout(function() {
            window.location.href = 'warden-dashboard.html';
        }, 500);
    } else {
        // Show error
        if (errorMessage) {
            errorMessage.textContent = 'Invalid username or password. Please try again.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        
        // Clear password field
        document.getElementById('password').value = '';
        
        // Hide error after 3 seconds
        setTimeout(function() {
            if (errorMessage) {
                errorMessage.classList.remove('show');
            }
        }, 3000);
    }
}

// Handle signup
function handleSignup() {
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const authCode = document.getElementById('authCode').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    // Default authorization code (fallback)
    const defaultAuthCode = 'WARDEN2024';
    
    // Get generated codes from localStorage
    const generatedCodes = JSON.parse(localStorage.getItem('wardenAuthCodes') || '[]');
    const validCodes = generatedCodes.map(function(item) { return item.code; });
    validCodes.push(defaultAuthCode); // Add default code

    // Validation
    if (!fullName || !username || !email || !password || !confirmPassword || !authCode) {
        if (errorMessage) {
            errorMessage.textContent = 'Please fill in all fields.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    // Check authorization code (case insensitive)
    const isCodeValid = validCodes.some(function(code) {
        return code.toUpperCase() === authCode.toUpperCase();
    });

    if (!isCodeValid) {
        if (errorMessage) {
            errorMessage.textContent = 'Invalid authorization code. Only authorized personnel can create warden accounts.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        document.getElementById('authCode').value = '';
        return;
    }

    // Mark code as used if it's a generated code
    const usedCodeIndex = generatedCodes.findIndex(function(item) {
        return item.code.toUpperCase() === authCode.toUpperCase() && !item.used;
    });
    
    if (usedCodeIndex !== -1) {
        generatedCodes[usedCodeIndex].used = true;
        generatedCodes[usedCodeIndex].usedBy = username;
        generatedCodes[usedCodeIndex].usedAt = new Date().toISOString();
        localStorage.setItem('wardenAuthCodes', JSON.stringify(generatedCodes));
    }

    if (password.length < 4) {
        if (errorMessage) {
            errorMessage.textContent = 'Password must be at least 4 characters long.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    if (password !== confirmPassword) {
        if (errorMessage) {
            errorMessage.textContent = 'Passwords do not match.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        document.getElementById('confirmPassword').value = '';
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter a valid email address.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    // Get all users
    let users = [];
    try {
        const stored = localStorage.getItem('wardenUsers');
        users = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading wardenUsers:', e);
        users = [];
    }
    
    // Check if username already exists
    const usernameExists = users.some(function(u) {
        return u.username.toLowerCase() === username.toLowerCase();
    });

    if (usernameExists) {
        if (errorMessage) {
            errorMessage.textContent = 'Username already exists. Please choose another.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    // Check if email already exists
    const emailExists = users.some(function(u) {
        return u.email.toLowerCase() === email.toLowerCase();
    });

    if (emailExists) {
        if (errorMessage) {
            errorMessage.textContent = 'Email already registered. Please use another email.';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('show');
        }
        return;
    }

    try {
        // Create new user
        const newUser = {
            id: Date.now(),
            fullName: fullName,
            username: username,
            email: email,
            password: password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        
        try {
            localStorage.setItem('wardenUsers', JSON.stringify(users));
            localStorage.setItem('userRole', 'warden');
            console.log('Warden saved successfully:', newUser);
        } catch (e) {
            console.error('Error saving warden to localStorage:', e);
            if (errorMessage) {
                errorMessage.textContent = 'Error saving account. Please check if localStorage is enabled.';
                errorMessage.classList.remove('success');
                errorMessage.classList.add('show');
            }
            return;
        }

        // Set redirecting flag FIRST
        isRedirecting = true;

        // Show success message with manual link
        if (errorMessage) {
            errorMessage.innerHTML = 'Account created successfully! Redirecting...<br><a href="warden-login.html" onclick="window.location.href=\'warden-login.html\'; return false;" style="display: inline-block; margin-top: 10px; padding: 8px 20px; background: #155724; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Login Page</a>';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('success', 'show');
        }

        // Clear form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.reset();
        }

        // IMMEDIATE REDIRECT - Try multiple methods
        const loginPage = 'warden-login.html';
        
        // Add meta refresh as backup (works even if JS is blocked)
        let metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
        if (!metaRefresh) {
            metaRefresh = document.createElement('meta');
            metaRefresh.httpEquiv = 'refresh';
            document.head.appendChild(metaRefresh);
        }
        metaRefresh.content = '1;url=' + loginPage;
        
        // Use requestAnimationFrame to ensure redirect happens after render
        requestAnimationFrame(function() {
            // Method 1: Try replace first (prevents back button)
            try {
                window.location.replace(loginPage);
            } catch (e1) {
                // Method 2: Use href
                try {
                    window.location.href = loginPage;
                } catch (e2) {
                    // Method 3: Create and click a link (most reliable)
                    const link = document.createElement('a');
                    link.href = loginPage;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                }
            }
        });
        
        // Backup: Also try immediate redirect
        try {
            window.location.href = loginPage;
        } catch (e) {
            // Ignore - will use other methods
        }
    } catch (error) {
        // If there's any error, still try to redirect
        isRedirecting = true;
        if (errorMessage) {
            errorMessage.innerHTML = 'Account created! <a href="warden-login.html" style="display: inline-block; margin-top: 10px; padding: 8px 20px; background: #155724; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Login Page</a>';
            errorMessage.classList.remove('success');
            errorMessage.classList.add('success', 'show');
        }
        // Force redirect even on error
        try {
            window.location.href = 'warden-login.html';
        } catch (e) {
            window.location.replace('warden-login.html');
        }
    }
}

// Load dashboard data
function loadDashboard() {
    let requests = [];
    try {
        const stored = localStorage.getItem('wasteRequests');
        requests = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading wasteRequests:', e);
        requests = [];
    }
    
    const tbody = document.getElementById('requestsBody');
    const noRequests = document.getElementById('noRequests');

    // Clear existing rows
    if (tbody) {
        tbody.innerHTML = '';
    }

    if (requests.length === 0) {
        if (noRequests) {
            noRequests.classList.add('show');
        }
        return;
    }

    if (noRequests) {
        noRequests.classList.remove('show');
    }

    // Display each request
    requests.forEach(function(request, index) {
        const row = document.createElement('tr');

        // Photo cell
        let photoHtml = '<span style="color: #999;">No photo</span>';
        if (request.photo) {
            photoHtml = `<img src="${request.photo}" alt="Waste photo" class="photo-preview">`;
        }

        // Status cell
        const statusClass = request.status === 'Collected' ? 'collected' : 'pending';
        const statusHtml = `<span class="status ${statusClass}">${request.status}</span>`;

        // Action button
        let actionHtml = '';
        if (request.status === 'Pending') {
            actionHtml = `<button class="action-btn" onclick="markCollected(${request.id})">Mark Collected</button>`;
        } else {
            actionHtml = '<span style="color: #999;">Already collected</span>';
        }

        row.innerHTML = `
            <td>${escapeHtml(request.name)}</td>
            <td>${escapeHtml(request.location)}</td>
            <td>${escapeHtml(request.type)}</td>
            <td>${escapeHtml(request.description)}</td>
            <td>${photoHtml}</td>
            <td>${statusHtml}</td>
            <td>${actionHtml}</td>
        `;

        if (tbody) {
            tbody.appendChild(row);
        }
    });
}

// Mark request as collected
function markCollected(id) {
    let requests = [];
    try {
        const stored = localStorage.getItem('wasteRequests');
        requests = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading requests:', e);
        alert('Error loading requests. Please refresh the page.');
        return;
    }
    
    // Find and update the request
    requests = requests.map(function(request) {
        if (request.id === id) {
            request.status = 'Collected';
        }
        return request;
    });

    // Save back to localStorage
    try {
        localStorage.setItem('wasteRequests', JSON.stringify(requests));
        console.log('Request marked as collected:', id);
    } catch (e) {
        console.error('Error saving requests:', e);
        alert('Error updating request. Please try again.');
        return;
    }

    // Reload dashboard
    loadDashboard();
    updateStats();
}

// Update statistics
function updateStats() {
    let requests = [];
    try {
        const stored = localStorage.getItem('wasteRequests');
        requests = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading requests for stats:', e);
        requests = [];
    }
    
    const totalRequests = document.getElementById('totalRequests');
    const pendingRequests = document.getElementById('pendingRequests');
    const collectedRequests = document.getElementById('collectedRequests');

    const total = requests.length;
    const pending = requests.filter(function(r) { return r.status === 'Pending'; }).length;
    const collected = requests.filter(function(r) { return r.status === 'Collected'; }).length;

    if (totalRequests) totalRequests.textContent = total;
    if (pendingRequests) pendingRequests.textContent = pending;
    if (collectedRequests) collectedRequests.textContent = collected;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('wardenLoggedIn');
        localStorage.removeItem('currentWarden');
        localStorage.removeItem('userRole');
        
        // Show login section and hide dashboard
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (loginSection && dashboardSection) {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
            
            // Clear login form
            const loginForm = document.getElementById('dashboardLoginForm');
            if (loginForm) {
                loginForm.reset();
            }
        } else {
            // Fallback: redirect to login page if elements not found
            window.location.href = 'index.html?role=warden';
        }
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

