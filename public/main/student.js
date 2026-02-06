let updateInterval;
let heartbeatInterval;
let studentName;
let hasFocus = true;

// Verify session on page load
window.addEventListener('DOMContentLoaded', async () => {
    studentName = localStorage.getItem('studentName');
    const isLoggedIn = localStorage.getItem('studentLoggedIn');

    if (!studentName || isLoggedIn !== 'true') {
        // Not logged in, redirect to login
        window.location.href = '../login/student.html';
        return;
    }

    // Verify session with server
    const response = await fetch('/student/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName })
    });

    const data = await response.json();

    if (!data.success || !data.valid) {
        // Session invalid, clear localStorage and redirect
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentLoggedIn');
        window.location.href = '../login/student.html';
        return;
    }

    // Display student name
    document.getElementById('studentName').textContent = studentName;

    // Load initial data
    await updateDashboard();

    // Send immediate heartbeat
    await sendHeartbeat();

    // Start auto-update every 5 seconds
    updateInterval = setInterval(updateDashboard, 5000);

    // Start heartbeat every 5 seconds
    heartbeatInterval = setInterval(sendHeartbeat, 5000);

    // Setup focus detection
    setupFocusDetection();

    // Handle browser close/refresh
    setupBeforeUnload();
});

// Setup focus detection
function setupFocusDetection() {
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden && hasFocus) {
            // Lost focus
            hasFocus = false;
            await fetch('/student/lost-focus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName })
            });
        } else if (!document.hidden && !hasFocus) {
            // Regained focus
            hasFocus = true;
            await fetch('/student/regain-focus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName })
            });
        }
    });

    window.addEventListener('blur', async () => {
        if (hasFocus) {
            hasFocus = false;
            await fetch('/student/lost-focus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName })
            });
        }
    });

    window.addEventListener('focus', async () => {
        if (!hasFocus) {
            hasFocus = true;
            await fetch('/student/regain-focus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName })
            });
        }
    });
}

// Send heartbeat to server
async function sendHeartbeat() {
    try {
        await fetch('/student/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName })
        });
    } catch (error) {
        console.error('Heartbeat failed:', error);
    }
}

// Setup beforeunload handler
function setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
        // Use sendBeacon for reliable delivery even when page is closing
        const blob = new Blob(
            [JSON.stringify({ name: studentName })], 
            { type: 'application/json' }
        );
        navigator.sendBeacon('/student/lost-focus', blob);
    });
}

// Update dashboard data
async function updateDashboard() {
    try {
        const response = await fetch(`/student/dashboard-data?name=${encodeURIComponent(studentName)}`);
        const data = await response.json();

        if (data.success) {
            const currentNum = data.currentNum;
            const myNumber = data.myNumber;
            const position = data.position;

            // Update displays
            document.getElementById('currentNumDisplay').textContent = currentNum;

            if (myNumber !== null && myNumber !== undefined) {
                // Student has a number
                document.getElementById('myNumber').textContent = myNumber;
                
                if (position !== null && position !== undefined) {
                    document.getElementById('positionDisplay').textContent = position > 0 ? position : 'Next!';
                    
                    // Update status message
                    const statusMsg = document.getElementById('statusMessage');
                    if (position === 0) {
                        statusMsg.textContent = "🎉 It's your turn!";
                        statusMsg.style.color = '#22c55e';
                    } else if (position > 0 && position <= 3) {
                        statusMsg.textContent = `⏳ ${position} ${position === 1 ? 'person' : 'people'} ahead of you`;
                        statusMsg.style.color = '#eab308';
                    } else {
                        statusMsg.textContent = `Waiting... ${position} ahead`;
                        statusMsg.style.color = '#64748b';
                    }

                    // Change background color based on position
                    updateBackgroundColor(position);
                } else {
                    document.getElementById('positionDisplay').textContent = '-';
                }

                // Show/hide buttons
                document.getElementById('getNumberBtn').style.display = 'none';
                document.getElementById('removeNumberBtn').style.display = 'flex';
            } else {
                // Student doesn't have a number
                document.getElementById('myNumber').textContent = '-';
                document.getElementById('positionDisplay').textContent = '-';
                document.getElementById('statusMessage').textContent = 'Get a number to join the queue';
                document.getElementById('statusMessage').style.color = '#64748b';

                // Show/hide buttons
                document.getElementById('getNumberBtn').style.display = 'flex';
                document.getElementById('removeNumberBtn').style.display = 'none';

                // Reset background color
                document.getElementById('studentBody').className = 'student-dashboard';
            }
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Update background color based on position
function updateBackgroundColor(position) {
    const body = document.getElementById('studentBody');
    
    if (position === 0) {
        // It's their turn - GREEN
        body.className = 'student-dashboard bg-green';
    } else if (position >= 1 && position <= 3) {
        // 1-3 people ahead - YELLOW
        body.className = 'student-dashboard bg-yellow';
    } else {
        // More than 3 people ahead - WHITE (default)
        body.className = 'student-dashboard';
    }
}

// Get number button handler
document.getElementById('getNumberBtn').addEventListener('click', async () => {
    const button = document.getElementById('getNumberBtn');
    const btnText = button.querySelector('.btn-text');
    const originalText = btnText.textContent;
    
    button.disabled = true;
    btnText.textContent = 'Getting number...';

    try {
        const response = await fetch('/student/get-number', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName })
        });

        const data = await response.json();

        if (data.success) {
            // Immediate update
            await updateDashboard();
            
            // Add animation
            const myNumberEl = document.getElementById('myNumber');
            myNumberEl.classList.add('pulse');
            setTimeout(() => myNumberEl.classList.remove('pulse'), 600);
        } else {
            alert(data.message || 'Failed to get number');
        }
    } catch (error) {
        console.error('Error getting number:', error);
        alert('Error processing request');
    } finally {
        button.disabled = false;
        btnText.textContent = originalText;
    }
});

// Remove number button handler
document.getElementById('removeNumberBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to remove your number? You will have a 2-minute cooldown.')) {
        return;
    }

    const button = document.getElementById('removeNumberBtn');
    const btnText = button.querySelector('.btn-text');
    const originalText = btnText.textContent;
    
    button.disabled = true;
    btnText.textContent = 'Removing...';

    try {
        const response = await fetch('/student/remove-number', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName })
        });

        const data = await response.json();

        if (data.success) {
            // Show cooldown message
            showCooldownMessage();
            
            // Immediate update
            await updateDashboard();
        } else {
            alert(data.message || 'Failed to remove number');
        }
    } catch (error) {
        console.error('Error removing number:', error);
        alert('Error processing request');
    } finally {
        button.disabled = false;
        btnText.textContent = originalText;
    }
});

// Show cooldown message
function showCooldownMessage() {
    const cooldownMsg = document.getElementById('cooldownMessage');
    cooldownMsg.textContent = '⏱️ 2-minute cooldown active. Please wait before getting a new number.';
    cooldownMsg.style.display = 'block';

    // Hide after 120 seconds
    setTimeout(() => {
        cooldownMsg.style.display = 'none';
    }, 120000);
}

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to logout? Your number will be removed.')) {
        return;
    }

    try {
        await fetch('/student/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName })
        });

        // Clear interval
        if (updateInterval) {
            clearInterval(updateInterval);
        }

        // Clear localStorage
        localStorage.removeItem('studentName');
        localStorage.removeItem('studentLoggedIn');

        // Redirect to login
        window.location.href = '../login/student.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
});