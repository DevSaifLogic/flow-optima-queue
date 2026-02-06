const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: 'queue-system-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Global variables
let currentNum = 0;
let lastNum = 0;
let studentQueue = []; // {name, number, timestamp}
let lostFocusStudents = []; // {name, number}
let teacherSessions = new Set();
let studentSessions = new Map(); // name -> session data
let cooldowns = new Map(); // name -> timestamp
let studentHeartbeats = new Map(); // name -> last heartbeat timestamp

// Check for inactive students every 10 seconds
setInterval(() => {
    const now = Date.now();
    const HEARTBEAT_TIMEOUT = 15000; // 15 seconds without heartbeat = disconnected

    studentHeartbeats.forEach((lastHeartbeat, studentName) => {
        if (now - lastHeartbeat > HEARTBEAT_TIMEOUT) {
            // Student hasn't sent heartbeat in 15 seconds - add to lost focus
            // Check if already in lost focus list
            if (!lostFocusStudents.find(s => s.name === studentName)) {
                // Get student's number if they have one
                const student = studentQueue.find(s => s.name === studentName);
                const studentNumber = student ? student.number : null;
                
                lostFocusStudents.push({ 
                    name: studentName, 
                    number: studentNumber,
                    reason: 'Disconnected'
                });
            }
        }
    });
}, 10000);

// Database path
const TEACHERS_DB = path.join(__dirname, 'database', 'teachers.json');

// Ensure database directory exists
async function ensureDatabase() {
    try {
        await fs.mkdir(path.join(__dirname, 'database'), { recursive: true });
        try {
            await fs.access(TEACHERS_DB);
        } catch {
            await fs.writeFile(TEACHERS_DB, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Error creating database:', error);
    }
}

// Read teachers from file
async function readTeachers() {
    try {
        const data = await fs.readFile(TEACHERS_DB, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Write teachers to file
async function writeTeachers(teachers) {
    await fs.writeFile(TEACHERS_DB, JSON.stringify(teachers, null, 2));
}

// Initialize database
ensureDatabase();

// ==================== TEACHER ENDPOINTS ====================

// Teacher signup
app.post('/teacher/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const teachers = await readTeachers();
        
        // Check if teacher already exists
        if (teachers.find(t => t.username === username)) {
            return res.status(400).json({ success: false, message: 'Teacher already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Add teacher
        teachers.push({ username, password: hashedPassword });
        await writeTeachers(teachers);

        res.json({ success: true, message: 'Teacher account created' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Teacher login
app.post('/teacher/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required' });
        }

        const teachers = await readTeachers();
        const teacher = teachers.find(t => t.username === username);

        if (!teacher) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, teacher.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check for duplicate session
        if (teacherSessions.has(username)) {
            return res.status(400).json({ success: false, message: 'Teacher already logged in' });
        }

        // Create session
        req.session.teacherName = username;
        req.session.isTeacher = true;
        teacherSessions.add(username);

        res.json({ success: true, message: 'Login successful', username });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Teacher verify session
app.post('/teacher/verify-session', (req, res) => {
    const { username } = req.body;
    
    if (req.session.isTeacher && req.session.teacherName === username && teacherSessions.has(username)) {
        res.json({ success: true, valid: true });
    } else {
        res.json({ success: true, valid: false });
    }
});

// Get list of teachers
app.get('/teacher/list', async (req, res) => {
    try {
        const teachers = await readTeachers();
        const teacherList = teachers.map(t => ({ username: t.username }));
        res.json({ success: true, teachers: teacherList });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Teacher next button
app.post('/teacher/next', (req, res) => {
    if (!req.session.isTeacher) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (currentNum < lastNum) {
        // Remove the previously served student (if any)
        if (currentNum > 0) {
            const prevIndex = studentQueue.findIndex(s => s.number === currentNum);
            if (prevIndex !== -1) {
                studentQueue.splice(prevIndex, 1);
            }
        }
        
        // Move to next student
        currentNum++;
        
        res.json({ success: true, currentNum, lastNum });
    } else {
        res.json({ success: false, message: 'No more students in queue' });
    }
});

// Get waiting list
app.get('/teacher/waiting-list', (req, res) => {
    if (!req.session.isTeacher) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const waitingList = studentQueue.map(s => ({
        name: s.name,
        number: s.number
    }));

    // Find current student (the one being served right now)
    // Only if currentNum > 0 (meaning teacher has started calling students)
    let currentStudent = null;
    if (currentNum > 0) {
        currentStudent = studentQueue.find(s => s.number === currentNum);
    }

    res.json({ 
        success: true, 
        waitingList,
        currentNum,
        lastNum,
        currentStudent: currentStudent,
        lostFocusStudents
    });
});

// Get list of joined students (no auth required - for testing)
app.get('/teacher/joined-students', (req, res) => {
    // Get all students who have active sessions
    const joinedStudents = Array.from(studentSessions.values()).map(student => ({
        name: student.name,
        number: student.number,
        hasFocus: student.hasFocus
    }));

    res.json({ 
        success: true, 
        students: joinedStudents,
        totalStudents: joinedStudents.length
    });
});

// Teacher logout
app.post('/teacher/logout', (req, res) => {
    if (req.session.teacherName) {
        teacherSessions.delete(req.session.teacherName);
    }
    req.session.destroy();
    res.json({ success: true });
});

// ==================== STUDENT ENDPOINTS ====================

// Student join
app.post('/student/join', (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        const trimmedName = name.trim();

        // Check for duplicate session
        if (studentSessions.has(trimmedName)) {
            return res.status(400).json({ success: false, message: 'Student already logged in' });
        }

        // Create session
        req.session.studentName = trimmedName;
        req.session.isStudent = true;
        studentSessions.set(trimmedName, { 
            name: trimmedName, 
            number: null,
            hasFocus: true 
        });

        // Initialize heartbeat
        studentHeartbeats.set(trimmedName, Date.now());

        res.json({ success: true, message: 'Joined successfully', name: trimmedName });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Student verify session
app.post('/student/verify-session', (req, res) => {
    const { name } = req.body;
    
    if (req.session.isStudent && req.session.studentName === name && studentSessions.has(name)) {
        res.json({ success: true, valid: true });
    } else {
        res.json({ success: true, valid: false });
    }
});

// Student get number
app.post('/student/get-number', (req, res) => {
    const { name } = req.body;

    if (!req.session.isStudent || req.session.studentName !== name) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if student already has a number
    const existingStudent = studentQueue.find(s => s.name === name);
    if (existingStudent) {
        return res.status(400).json({ success: false, message: 'You already have a number' });
    }

    // Check cooldown
    if (cooldowns.has(name)) {
        const cooldownEnd = cooldowns.get(name);
        const now = Date.now();
        if (now < cooldownEnd) {
            const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000);
            return res.status(400).json({ 
                success: false, 
                message: `Please wait ${remainingSeconds} seconds before getting a new number` 
            });
        } else {
            cooldowns.delete(name);
        }
    }

    lastNum++;
    const newNumber = lastNum;
    
    studentQueue.push({
        name,
        number: newNumber,
        timestamp: Date.now()
    });

    // Update session
    const sessionData = studentSessions.get(name);
    if (sessionData) {
        sessionData.number = newNumber;
    }

    res.json({ success: true, number: newNumber });
});

// Student remove number
app.post('/student/remove-number', (req, res) => {
    const { name } = req.body;

    if (!req.session.isStudent || req.session.studentName !== name) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const index = studentQueue.findIndex(s => s.name === name);
    if (index === -1) {
        return res.status(400).json({ success: false, message: 'You do not have a number' });
    }

    studentQueue.splice(index, 1);

    // Set 2-minute cooldown
    cooldowns.set(name, Date.now() + 2 * 60 * 1000);

    // Update session
    const sessionData = studentSessions.get(name);
    if (sessionData) {
        sessionData.number = null;
    }

    // Remove from lost focus if present
    const lostFocusIndex = lostFocusStudents.findIndex(s => s.name === name);
    if (lostFocusIndex !== -1) {
        lostFocusStudents.splice(lostFocusIndex, 1);
    }

    res.json({ success: true, message: 'Number removed. 2-minute cooldown applied.' });
});

// Student lost focus
app.post('/student/lost-focus', (req, res) => {
    const { name } = req.body;

    if (!req.session.isStudent || req.session.studentName !== name) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Add to lost focus if not already there
    if (!lostFocusStudents.find(s => s.name === name)) {
        // Get student's number if they have one
        const student = studentQueue.find(s => s.name === name);
        const studentNumber = student ? student.number : null;
        
        lostFocusStudents.push({ 
            name, 
            number: studentNumber 
        });
    }

    res.json({ success: true });
});

// Student regain focus
app.post('/student/regain-focus', (req, res) => {
    const { name } = req.body;

    if (!req.session.isStudent || req.session.studentName !== name) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const index = lostFocusStudents.findIndex(s => s.name === name);
    if (index !== -1) {
        lostFocusStudents.splice(index, 1);
    }

    res.json({ success: true });
});

// Student heartbeat - sent every 5 seconds to indicate they're still active
app.post('/student/heartbeat', (req, res) => {
    const { name } = req.body;

    if (!req.session.isStudent || req.session.studentName !== name) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Update last heartbeat timestamp
    studentHeartbeats.set(name, Date.now());

    // Remove from lost focus list if they were there (they're active again)
    const lostFocusIndex = lostFocusStudents.findIndex(s => s.name === name);
    if (lostFocusIndex !== -1) {
        lostFocusStudents.splice(lostFocusIndex, 1);
    }

    res.json({ success: true });
});

// Get student dashboard data
app.get('/student/dashboard-data', (req, res) => {
    const name = req.query.name;

    if (!req.session.isStudent || req.session.studentName !== name) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const student = studentQueue.find(s => s.name === name);
    const myNumber = student ? student.number : null;
    
    // Calculate position: if myNumber equals currentNum, position is 0 (it's their turn)
    let position = null;
    if (myNumber !== null) {
        position = myNumber - currentNum;
        // Ensure position is at least 0
        if (position < 0) position = 0;
    }

    res.json({
        success: true,
        currentNum,
        lastNum,
        myNumber,
        position
    });
});

// Student logout
app.post('/student/logout', (req, res) => {
    const { name } = req.body;
    
    if (req.session.studentName) {
        studentSessions.delete(req.session.studentName);
        studentHeartbeats.delete(req.session.studentName);
        
        // Remove from queue
        const index = studentQueue.findIndex(s => s.name === req.session.studentName);
        if (index !== -1) {
            studentQueue.splice(index, 1);
        }
        
        // Remove from lost focus
        const lostFocusIndex = lostFocusStudents.findIndex(s => s.name === req.session.studentName);
        if (lostFocusIndex !== -1) {
            lostFocusStudents.splice(lostFocusIndex, 1);
        }
    }
    
    req.session.destroy();
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Queue system server running on http://localhost:${PORT}`);
});