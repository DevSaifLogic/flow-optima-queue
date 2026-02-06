let updateInterval;

// Verify session on page load
window.addEventListener('DOMContentLoaded', async () => {
    const storedUsername = localStorage.getItem('teacherUsername');
    const isLoggedIn = localStorage.getItem('teacherLoggedIn');

    if (!storedUsername || isLoggedIn !== 'true') {
        // Not logged in, redirect to login
        window.location.href = '../login/teacher.html';
        return;
    }

    // Verify session with server
    const response = await fetch('/teacher/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: storedUsername })
    });

    const data = await response.json();

    if (!data.success || !data.valid) {
        // Session invalid, clear localStorage and redirect
        localStorage.removeItem('teacherUsername');
        localStorage.removeItem('teacherLoggedIn');
        window.location.href = '../login/teacher.html';
        return;
    }

    // Display teacher name
    document.getElementById('teacherName').textContent = storedUsername;

    // Load initial data
    await updateDashboard();

    // Start auto-update every 5 seconds
    updateInterval = setInterval(updateDashboard, 5000);
});

// Update dashboard data
async function updateDashboard() {
    try {
        const response = await fetch('/teacher/waiting-list');
        const data = await response.json();

        if (data.success) {
            // Update current number display
            document.getElementById('currentNumber').textContent = data.currentNum;
            document.getElementById('currentNumDisplay').textContent = data.currentNum;
            document.getElementById('lastNumDisplay').textContent = data.lastNum;

            // Update current student
            const currentStudentEl = document.getElementById('currentStudent');
            if (data.currentStudent) {
                currentStudentEl.textContent = data.currentStudent.name;
                currentStudentEl.style.color = '#22c55e';
            } else {
                currentStudentEl.textContent = 'No student';
                currentStudentEl.style.color = '#64748b';
            }

            // Update waiting list
            updateWaitingList(data.waitingList, data.currentNum);

            // Update lost focus students
            updateLostFocusStudents(data.lostFocusStudents);
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Update waiting list
function updateWaitingList(waitingList, currentNum) {
    const container = document.getElementById('waitingListContainer');

    if (!waitingList || waitingList.length === 0) {
        container.innerHTML = '<div class="empty-state">No students in queue</div>';
        return;
    }

    // Filter out current number and sort
    const upcoming = waitingList
        .filter(s => s.number > currentNum)
        .sort((a, b) => a.number - b.number);

    if (upcoming.length === 0) {
        container.innerHTML = '<div class="empty-state">No upcoming students</div>';
        return;
    }

    container.innerHTML = upcoming
        .map(student => `
            <div class="student-card">
                <div class="student-number">#${student.number}</div>
                <div class="student-name">${student.name}</div>
            </div>
        `)
        .join('');
}

// Update lost focus students
function updateLostFocusStudents(lostFocusStudents) {
    const section = document.getElementById('lostFocusSection');
    const container = document.getElementById('lostFocusContainer');

    if (!lostFocusStudents || lostFocusStudents.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = lostFocusStudents
        .map(student => `
            <div class="student-card alert">
                <div class="student-number">${student.number ? '#' + student.number : '-'}</div>
                <div class="student-name">${student.name}</div>
                <div class="student-status">Lost Focus</div>
            </div>
        `)
        .join('');
}

// Next button handler
document.getElementById('nextBtn').addEventListener('click', async () => {
    const button = document.getElementById('nextBtn');
    button.disabled = true;

    try {
        const response = await fetch('/teacher/next', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            // Immediate update
            await updateDashboard();
            
            // Add animation
            const currentNumberEl = document.getElementById('currentNumber');
            currentNumberEl.classList.add('pulse');
            setTimeout(() => currentNumberEl.classList.remove('pulse'), 600);
        } else {
            alert(data.message || 'No more students in queue');
        }
    } catch (error) {
        console.error('Error calling next:', error);
        alert('Error processing request');
    } finally {
        button.disabled = false;
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }

    try {
        await fetch('/teacher/logout', {
            method: 'POST'
        });

        // Clear interval
        if (updateInterval) {
            clearInterval(updateInterval);
        }

        // Clear localStorage
        localStorage.removeItem('teacherUsername');
        localStorage.removeItem('teacherLoggedIn');

        // Redirect to login
        window.location.href = '../login/teacher.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});