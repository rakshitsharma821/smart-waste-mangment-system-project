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

// Initialize default users storage
function initializeUserStorage() {
    if (!checkLocalStorage()) {
        return;
    }
    
    try {
        if (!localStorage.getItem('portalUsers')) {
            localStorage.setItem('portalUsers', '[]');
        }
        if (!localStorage.getItem('wasteRequests')) {
            localStorage.setItem('wasteRequests', '[]');
        }
    } catch (e) {
        console.error('Error initializing storage:', e);
    }
}

// Initialize on load
initializeUserStorage();

// Check if user is logged in and block warden pages
function checkUserAuth() {
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const wardenLoggedIn = localStorage.getItem('wardenLoggedIn') === 'true';
    
    // If on root/index page (homepage), don't interfere - it handles its own logic
    // Check if we're on homepage by checking if user.js is loaded on index.html
    const isHomepage = !document.getElementById('wasteForm') && !document.getElementById('userLoginForm') && !document.getElementById('userSignupForm');
    
    if (isHomepage || currentPage === 'index.html' || currentPage === '' || currentPage === 'index.html') {
        // Homepage - don't run user.js logic, let homepage script handle it
        return true;
    }
    
    // Block access to warden pages if user is logged in
    if (isLoggedIn) {
        if (currentPage === 'warden-login.html' || currentPage.includes('warden-login') ||
            currentPage === 'warden-signup.html' || currentPage.includes('warden-signup') ||
            currentPage === 'warden-dashboard.html' || currentPage.includes('warden-dashboard') ||
            currentPage === 'warden.html' || currentPage.includes('warden')) {
            alert('Access denied. You are logged in as a user. Please logout first to access warden portal.');
            window.location.href = 'user-dashboard.html';
            return false;
        }
    }
    
    // Block access if warden is logged in (warden should not access user pages)
    if (wardenLoggedIn && !isLoggedIn) {
        if (currentPage === 'user-login.html' || currentPage.includes('user-login') ||
            currentPage === 'user-signup.html' || currentPage.includes('user-signup') ||
            currentPage === 'user-dashboard.html' || currentPage.includes('user-dashboard')) {
            alert('Access denied. You are logged in as a warden. Please logout first to access user portal.');
            window.location.href = 'warden-dashboard.html';
            return false;
        }
    }
    
    // If on user-dashboard.html and not logged in, redirect to login
    if (currentPage === 'user-dashboard.html' || currentPage.includes('user-dashboard')) {
        if (!isLoggedIn) {
            window.location.href = 'user-login.html';
            return false;
        }
    }
    
    // If on login/signup page and already logged in, redirect to user dashboard
    if (currentPage === 'user-login.html' || currentPage.includes('user-login') ||
        currentPage === 'user-signup.html' || currentPage.includes('user-signup')) {
        if (isLoggedIn) {
            window.location.href = 'user-dashboard.html';
            return false;
        }
    }
    
    return true;
}

// Check auth on page load
checkUserAuth();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
    
    // Handle waste form submission (only on user-dashboard.html)
    const wasteForm = document.getElementById('wasteForm');
    if (wasteForm) {
        wasteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            try {
                submitRequest();
            } catch (error) {
                console.error('Error submitting request:', error);
                alert('Error submitting request. Please try again.');
            }
        });
        loadRequests();
        updateUserDisplay();
    }
    
    // Handle user login form
    const userLoginForm = document.getElementById('userLoginForm');
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleUserLogin();
        });
    }
    
    // Handle user signup form
    const userSignupForm = document.getElementById('userSignupForm');
    if (userSignupForm) {
        userSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleUserSignup();
        });
    }
    
    // Check auth again after DOM loads
    checkUserAuth();
});

// Convert image to Base64
function convertImageToBase64(file, callback) {
    if (!file) {
        callback('');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.onerror = function() {
        callback('');
    };
    reader.readAsDataURL(file);
}

// Handle user login
function handleUserLogin() {
    const username = document.getElementById('userUsername').value.trim();
    const password = document.getElementById('userPassword').value;
    const errorMessage = document.getElementById('userErrorMessage');

    if (!username || !password) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter both username and password.';
            errorMessage.classList.add('show');
        }
        return;
    }

    let users = [];
    try {
        const stored = localStorage.getItem('portalUsers');
        users = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading users from localStorage:', e);
        if (errorMessage) {
            errorMessage.textContent = 'Error accessing user data. Please refresh the page.';
            errorMessage.classList.add('show');
        }
        return;
    }
    
    const user = users.find(function(u) {
        return u.username === username;
    });

    if (user && user.password === password) {
        // Check if warden is logged in, logout warden first
        if (localStorage.getItem('wardenLoggedIn') === 'true') {
            localStorage.removeItem('wardenLoggedIn');
            localStorage.removeItem('currentWarden');
        }
        
        try {
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userRole', 'user'); // Set role
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email
            }));
            console.log('User logged in successfully:', user.username);
        } catch (e) {
            console.error('Error saving login data:', e);
            if (errorMessage) {
                errorMessage.textContent = 'Error saving login. Please check if localStorage is enabled.';
                errorMessage.classList.add('show');
            }
            return;
        }
        
        if (errorMessage) {
            errorMessage.textContent = 'Login successful! Redirecting...';
            errorMessage.classList.add('success', 'show');
        }
        
        setTimeout(function() {
            window.location.href = 'user-dashboard.html';
        }, 500);
    } else {
        if (errorMessage) {
            errorMessage.textContent = 'Invalid username or password.';
            errorMessage.classList.add('show');
        }
        document.getElementById('userPassword').value = '';
    }
}

// Handle user signup
function handleUserSignup() {
    const fullName = document.getElementById('userFullName').value.trim();
    const username = document.getElementById('userUsername').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('userConfirmPassword').value;
    const errorMessage = document.getElementById('userErrorMessage');

    if (!fullName || !username || !email || !password || !confirmPassword) {
        if (errorMessage) {
            errorMessage.textContent = 'Please fill in all fields.';
            errorMessage.classList.add('show');
        }
        return;
    }

    if (password.length < 4) {
        if (errorMessage) {
            errorMessage.textContent = 'Password must be at least 4 characters.';
            errorMessage.classList.add('show');
        }
        return;
    }

    if (password !== confirmPassword) {
        if (errorMessage) {
            errorMessage.textContent = 'Passwords do not match.';
            errorMessage.classList.add('show');
        }
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (errorMessage) {
            errorMessage.textContent = 'Please enter a valid email.';
            errorMessage.classList.add('show');
        }
        return;
    }

    let users = [];
    try {
        const stored = localStorage.getItem('portalUsers');
        users = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading users from localStorage:', e);
        users = [];
    }
    
    if (users.some(function(u) { return u.username.toLowerCase() === username.toLowerCase(); })) {
        if (errorMessage) {
            errorMessage.textContent = 'Username already exists.';
            errorMessage.classList.add('show');
        }
        return;
    }

    if (users.some(function(u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
        if (errorMessage) {
            errorMessage.textContent = 'Email already registered.';
            errorMessage.classList.add('show');
        }
        return;
    }

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
        localStorage.setItem('portalUsers', JSON.stringify(users));
        localStorage.setItem('userRole', 'user');
        console.log('User saved successfully:', newUser);
    } catch (e) {
        console.error('Error saving user to localStorage:', e);
        if (errorMessage) {
            errorMessage.textContent = 'Error saving account. Please check if localStorage is enabled.';
            errorMessage.classList.add('show');
        }
        return;
    }

    if (errorMessage) {
        errorMessage.textContent = 'Account created! Redirecting to login...';
        errorMessage.classList.add('success', 'show');
    }

    setTimeout(function() {
        window.location.href = 'user-login.html';
    }, 1000);
}

// Submit waste request
function submitRequest() {
    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value.trim();
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value.trim();
    const photoFile = document.getElementById('photo').files[0];

    // Validate required fields
    if (!name || !location || !type || !description) {
        alert('Please fill in all required fields.');
        return;
    }

    // Get current user info
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id || null;

    // Convert image to Base64
    convertImageToBase64(photoFile, function(photoBase64) {
        try {
            // Get existing requests from localStorage
            let requests = [];
            try {
                const stored = localStorage.getItem('wasteRequests');
                requests = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                requests = [];
            }

            // Create new request object
            const newRequest = {
                id: Date.now(), // Unique ID based on timestamp
                userId: userId, // Link to user account
                name: name,
                location: location,
                type: type,
                description: description,
                photo: photoBase64,
                status: 'Pending',
                timestamp: new Date().toISOString()
            };

            // Add to array
            requests.push(newRequest);

            // Save back to localStorage
            try {
                localStorage.setItem('wasteRequests', JSON.stringify(requests));
                console.log('Request saved successfully:', newRequest);
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                alert('Error saving request. Please check if localStorage is enabled in your browser.');
                return;
            }

            // Reset form
            const form = document.getElementById('wasteForm');
            if (form) {
                form.reset();
            }

            // Reload table
            loadRequests();

            // Show success message
            alert('Request submitted successfully!');
        } catch (error) {
            console.error('Error in submitRequest:', error);
            alert('Error submitting request: ' + error.message);
        }
    });
}

// Load and display requests (only for logged-in user)
function loadRequests() {
    let currentUser = {};
    let allRequests = [];
    
    try {
        const userStored = localStorage.getItem('currentUser');
        currentUser = userStored ? JSON.parse(userStored) : {};
    } catch (e) {
        console.error('Error reading currentUser:', e);
    }
    
    try {
        const requestsStored = localStorage.getItem('wasteRequests');
        allRequests = requestsStored ? JSON.parse(requestsStored) : [];
    } catch (e) {
        console.error('Error reading wasteRequests:', e);
    }
    
    const userId = currentUser.id;
    
    // Filter requests for current user (if userId exists, show only user's requests, else show all)
    const requests = userId ? allRequests.filter(function(r) { return r.userId === userId; }) : allRequests;
    
    const tbody = document.getElementById('requestsBody');
    const noRequests = document.getElementById('noRequests');

    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    if (requests.length === 0) {
        if (noRequests) noRequests.classList.add('show');
        return;
    }

    if (noRequests) noRequests.classList.remove('show');

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

        row.innerHTML = `
            <td>${escapeHtml(request.name)}</td>
            <td>${escapeHtml(request.location)}</td>
            <td>${escapeHtml(request.type)}</td>
            <td>${escapeHtml(request.description)}</td>
            <td>${photoHtml}</td>
            <td>${statusHtml}</td>
            <td>
                <button class="delete-btn" onclick="deleteRequest(${request.id})">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Update user display on index page
function updateUserDisplay() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (userNameDisplay && currentUser.fullName) {
        userNameDisplay.textContent = '👤 Welcome, ' + escapeHtml(currentUser.fullName);
    } else if (userNameDisplay && currentUser.username) {
        userNameDisplay.textContent = '👤 Welcome, ' + escapeHtml(currentUser.username);
    }
}

// Logout function
function userLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html?role=user';
    }
}

// Delete request
function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) {
        return;
    }

    let requests = [];
    try {
        const stored = localStorage.getItem('wasteRequests');
        requests = stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Error reading requests:', e);
        alert('Error loading requests. Please refresh the page.');
        return;
    }
    
    // Filter out the request with matching ID
    requests = requests.filter(function(request) {
        return request.id !== id;
    });

    // Save back to localStorage
    try {
        localStorage.setItem('wasteRequests', JSON.stringify(requests));
        console.log('Request deleted successfully');
    } catch (e) {
        console.error('Error saving requests:', e);
        alert('Error deleting request. Please try again.');
        return;
    }

    // Reload table
    loadRequests();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

