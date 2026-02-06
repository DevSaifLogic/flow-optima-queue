// Check session on page load
window.addEventListener('DOMContentLoaded', async () => {
    const storedUsername = localStorage.getItem('teacherUsername');
    const isLoggedIn = localStorage.getItem('teacherLoggedIn');

    if (storedUsername && isLoggedIn === 'true') {
        // Verify session with server
        const response = await fetch('/teacher/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: storedUsername })
        });

        const data = await response.json();

        if (data.success && data.valid) {
            // Session is valid, redirect to dashboard
            window.location.href = '../main/teacher.html';
        } else {
            // Session invalid, clear localStorage
            localStorage.removeItem('teacherUsername');
            localStorage.removeItem('teacherLoggedIn');
        }
    }
});

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.spinner');
    const messageDiv = document.getElementById('message');

    // Clear previous messages
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    // Disable button and show spinner
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        const response = await fetch('/teacher/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store in localStorage
            localStorage.setItem('teacherUsername', username);
            localStorage.setItem('teacherLoggedIn', 'true');

            // Show success message
            messageDiv.textContent = 'Login successful! Redirecting...';
            messageDiv.classList.add('success');

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '../main/teacher.html';
            }, 1000);
        } else {
            // Show error message
            messageDiv.textContent = data.message || 'Login failed';
            messageDiv.classList.add('error');
            
            // Re-enable button
            loginBtn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    } catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        messageDiv.classList.add('error');
        
        // Re-enable button
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});

// Add input animation
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});