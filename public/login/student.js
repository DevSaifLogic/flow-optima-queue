// Check session on page load
window.addEventListener('DOMContentLoaded', async () => {
    const storedName = localStorage.getItem('studentName');
    const isLoggedIn = localStorage.getItem('studentLoggedIn');

    if (storedName && isLoggedIn === 'true') {
        // Verify session with server
        const response = await fetch('/student/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: storedName })
        });

        const data = await response.json();

        if (data.success && data.valid) {
            // Session is valid, redirect to dashboard
            window.location.href = '../main/student.html';
        } else {
            // Session invalid, clear localStorage
            localStorage.removeItem('studentName');
            localStorage.removeItem('studentLoggedIn');
        }
    }
});

// Handle form submission
document.getElementById('joinForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const joinBtn = document.getElementById('joinBtn');
    const btnText = joinBtn.querySelector('.btn-text');
    const spinner = joinBtn.querySelector('.spinner');
    const messageDiv = document.getElementById('message');

    if (!name) {
        messageDiv.textContent = 'Please enter your name';
        messageDiv.classList.add('error');
        return;
    }

    // Clear previous messages
    messageDiv.textContent = '';
    messageDiv.className = 'message';

    // Disable button and show spinner
    joinBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        const response = await fetch('/student/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (data.success) {
            // Store in localStorage
            localStorage.setItem('studentName', name);
            localStorage.setItem('studentLoggedIn', 'true');

            // Show success message
            messageDiv.textContent = 'Welcome! Redirecting...';
            messageDiv.classList.add('success');

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '../main/student.html';
            }, 1000);
        } else {
            // Show error message
            messageDiv.textContent = data.message || 'Failed to join';
            messageDiv.classList.add('error');
            
            // Re-enable button
            joinBtn.disabled = false;
            btnText.style.display = 'inline';
            spinner.style.display = 'none';
        }
    } catch (error) {
        messageDiv.textContent = 'Network error. Please try again.';
        messageDiv.classList.add('error');
        
        // Re-enable button
        joinBtn.disabled = false;
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