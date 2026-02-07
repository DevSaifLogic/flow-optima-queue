# Flow-Optima-Queue

A mobile-first queue management system designed for teachers and students. Teachers can manage the queue in real-time while students can join, get numbers, and track their position with visual feedback.

## Features

### Teacher Features
- Secure login with password hashing (bcrypt)
- Real-time queue management dashboard
- "Next" button to call students one by one
- View waiting list with student names and numbers
- Track ALL students who lose focus (with or without queue numbers)
- Auto-refresh every 5 seconds
- Prevent duplicate login sessions
- View current student being served with their name
- Monitor disconnected students automatically

### Student Features
- Simple join with name only (no password required)
- Get queue number with one click
- Remove number (with 2-minute cooldown to prevent spam)
- Real-time position tracking
- Visual feedback based on queue position:
  - 🟢 **Green Background**: It's your turn!
  - 🟡 **Yellow Background**: 1-3 people ahead of you
  - ⚪ **White Background**: More than 3 people ahead
- Automatic lost focus detection (tab switching, minimizing, closing browser)
- Heartbeat mechanism (detects browser closure without logout)
- Auto-refresh every 5 seconds
- Prevent duplicate sessions

## Technology Stack

- **Backend**: Node.js, Express
- **Session Management**: express-session
- **Security**: bcrypt for password hashing
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: JSON file-based database
- **Language**: Full English interface

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Landing Page
![Landing Page](https://snipboard.io/iJblSa.jpg)

### Teacher Login
![Teacher Login](https://snipboard.io/rj9ca5.jpg)

### Teacher Dashboard
![Teacher Dashboard](https://snipboard.io/D71V5k.jpg)

### Teacher Dashboard (Lost Focus)
![Teacher Dashboard Lost Focus](https://snipboard.io/dacybq.jpg)
![Teacher Dashboard Lost Focus2](https://snipboard.io/lRTg8j.jpg)

### Student Join
![Student Join](https://snipboard.io/sk0Nbn.jpg)

### Student Dashboard (Green - Your Turn)
![Student Dashboard Green](https://snipboard.io/Exd8sB.jpg)

### Student Dashboard (Yellow - Almost There)
![Student Dashboard Yellow](https://snipboard.io/t4Zl1W.jpg)

### Student Dashboard (White - Waiting)
![Student Dashboard White](https://snipboard.io/amiDX6.jpg)

### Student Dashboard (White - No Number)
![Student Dashboard No Number](https://snipboard.io/IT4VnS.jpg)

</details>

## Installation

### 1. Download the Project

Clone or download the project files.

### 2. Install Dependencies

```bash
cd flow-optima-queue
npm install
```

### 3. Create Teacher Account (First Time Only)

Before starting the server, you need to create a teacher account. This should be done on a secure device to prevent students from creating teacher accounts.

The system stores teachers in `database/teachers.json`. On first run, the server will create this file automatically.

### 4. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Usage Guide

### For Teachers

#### 1. Initial Setup (On Your Device Only)

You'll need to create a teacher account by making a POST request to `/teacher/signup`:

**Using Browser Console:**
```javascript
fetch('http://localhost:3000/teacher/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password'
  })
}).then(r => r.json()).then(console.log);
```

**Using curl (Terminal):**
```bash
curl -X POST http://localhost:3000/teacher/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'
```

#### 2. Login

- Go to `http://localhost:3000/login/teacher.html`
- Enter your username and password
- You'll be redirected to the teacher dashboard

#### 3. Teacher Dashboard

- **View Current Number**: See who is being served right now
- **Student Name**: The current student's name is displayed under their number
- **Next Button**: Click to advance to the next student in queue
- **Lost Focus Section**: See ALL students who lost focus (shows "-" for students without numbers, "#5" for students with number 5)
- **Waiting List**: View upcoming students in the queue
- **Auto-Update**: Dashboard refreshes every 5 seconds automatically

### For Students

#### 1. Join the Queue

- Navigate to `http://localhost:3000/login/student.html`
- Enter your name
- You'll be redirected to the student dashboard

#### 2. Student Dashboard

- **Get a Number**: Click the button to join the queue
- **Your Number**: Displayed prominently at the top
- **Position**: Shows how many people are ahead of you
- **Background Color Changes**:
  - Green when it's your turn
  - Yellow when 1-3 people ahead
  - White when waiting or without number
- **Remove Number**: Click to leave the queue (2-minute cooldown applies)
- **Auto-Update**: Dashboard refreshes every 5 seconds

## Project Structure

```
flow-optima-queue/
├── database/
│   └── teachers.json          # Teacher credentials (auto-created)
├── public/
│   ├── login/
│   │   ├── teacher.html       # Teacher login page
│   │   ├── teacher.js         # Teacher login logic
│   │   ├── student.html       # Student join page
│   │   └── student.js         # Student join logic
│   ├── main/
│   │   ├── teacher.html       # Teacher dashboard
│   │   ├── teacher.js         # Teacher dashboard logic
│   │   ├── student.html       # Student dashboard
│   │   └── student.js         # Student dashboard logic
│   ├── styles/
│   │   ├── login-style.css    # Login pages styling
│   │   └── main-style.css     # Dashboard styling
│   └── index.html             # Landing page
├── server.js                  # Main server file
├── package.json               # Dependencies
└── README.md                  # This file
```

## API Endpoints

### Teacher Endpoints

- `POST /teacher/signup` - Create teacher account (username, password)
- `POST /teacher/login` - Teacher login (creates session)
- `POST /teacher/verify-session` - Verify active teacher session
- `GET /teacher/list` - Get list of all teachers
- `POST /teacher/next` - Advance to next student (increments currentNum)
- `GET /teacher/waiting-list` - Get waiting list, current student, lost focus students
- `GET /teacher/joined-students` - Get list of all joined students (no auth - for testing)
- `POST /teacher/logout` - Teacher logout (destroys session)

### Student Endpoints

- `POST /student/join` - Student join (name only, creates session)
- `POST /student/verify-session` - Verify active student session
- `POST /student/get-number` - Get queue number (increments lastNum)
- `POST /student/remove-number` - Remove queue number (applies 2-min cooldown)
- `POST /student/lost-focus` - Report lost focus (tab switch, minimize)
- `POST /student/regain-focus` - Report regained focus
- `POST /student/heartbeat` - Send heartbeat ping (every 5 seconds)
- `GET /student/dashboard-data` - Get student's queue data (position, number)
- `POST /student/logout` - Student logout (removes from queue, destroys session)

## Security Features

- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Session Management**: express-session with secure cookies
- **Duplicate Prevention**: Only one session per username allowed
- **Session Verification**: All protected routes verify valid sessions
- **Secure Signup**: Teacher signup should only be done on controlled devices
- **No SQL Injection**: Uses in-memory storage with proper validation

## Mobile Optimization

- **Mobile-First Design**: Optimized primarily for mobile devices
- **Touch-Friendly**: Large buttons and touch-optimized interactions
- **No Zoom on Input**: Prevents iOS auto-zoom when focusing on inputs
- **Responsive Layout**: Works on all screen sizes
- **Smooth Animations**: Professional transitions and feedback

## Lost Focus Tracking System

### How It Works:

#### 1. Client-Side (Student Dashboard)
- Sends heartbeat ping to server every 5 seconds
- Uses `navigator.sendBeacon()` when browser closes to ensure delivery
- Automatically starts when student logs in
- Detects tab switching, window minimizing, and browser closure

#### 2. Server-Side
- Tracks last heartbeat timestamp for each student
- Checks every 10 seconds if any student hasn't sent heartbeat in 15 seconds
- If student misses heartbeats (browser closed, internet lost, etc.), automatically adds to "Lost Focus" list
- Includes **ALL logged-in students**, whether they have queue numbers or not

#### 3. What Teachers See
- Students who close browser or lose connection appear in "Lost Focus Students" section within 15 seconds
- Shows "-" for students without queue numbers
- Shows "#5" for students with number 5, etc.
- Students automatically removed from list when they reconnect

### Technical Details:
- **Heartbeat Interval**: 5 seconds
- **Timeout Threshold**: 15 seconds (student marked as disconnected)
- **Check Frequency**: Server checks every 10 seconds
- **Recovery**: Students removed from lost focus when heartbeat resumes
- Uses `sendBeacon` API for reliable delivery during page unload

### Example Scenarios:

**Scenario 1: Student Without Number**
- John joins but doesn't get a number
- Switches tab → Shows in lost focus as: **"- John Lost Focus"**
- Comes back → Automatically removed from lost focus ✅

**Scenario 2: Student With Number**
- Sarah gets number #5
- Closes browser → Shows in lost focus as: **"#5 Sarah Lost Focus"**
- Reopens browser → Automatically removed from lost focus ✅

**Scenario 3: Student Gets Number After Losing Focus**
- Mike joins, loses focus (shows as **"- Mike"**)
- Regains focus
- Gets number #7
- Loses focus again → Now shows as **"#7 Mike"** ✅

## Important Notes

- **In-Memory Storage**: Queue data resets when server restarts
- **Persistent Data**: Teacher credentials are saved in `database/teachers.json`
- **Session Expiry**: Sessions expire after 24 hours
- **Auto-Refresh**: Both dashboards update every 5 seconds automatically
- **Lost Focus**: Helps teachers identify distracted or disconnected students
- **Heartbeat**: Students send ping every 5 seconds; 15 seconds without ping = disconnected
- **Browser Close**: Uses `sendBeacon` to notify server when student closes browser
- **Cooldown**: 2-minute cooldown prevents students from spamming numbers

## Troubleshooting

### Issue: Cannot Create Teacher Account
**Solution**: 
- Make sure server is running
- Check if you're using correct command in browser console or terminal
- Verify the server URL is `http://localhost:3000`

### Issue: Student Not Showing in Lost Focus List
**Solution**: 
- Ensure student has logged in (joined the system)
- Wait 15 seconds after closing browser
- Check that server is running
- Verify heartbeat mechanism is working (check browser network tab)

### Issue: Background Not Turning Green
**Solution**: 
- Ensure student's number equals current number
- Manually refresh the page
- Verify auto-update is working (check console for errors)
- Make sure teacher has clicked "Next" to call your number

### Issue: Student Name Not Showing in Teacher Dashboard
**Solution**:
- Verify student has received a number
- Wait for auto-update or manually refresh page
- Check server is running correctly
- Ensure student hasn't been removed from queue

### Issue: "Already Logged In" Error
**Solution**:
- Only one session per username allowed
- Logout from other device/tab first
- Clear browser localStorage if needed
- Restart server to clear all sessions

## Future Development Ideas

Some ideas for future improvements:
- **Persistent Database**: Add MongoDB or PostgreSQL instead of in-memory storage
- **Audio Notifications**: Sound alert when it's student's turn
- **Statistics Dashboard**: Analytics for wait times, peak hours, etc.
- **Multiple Queues**: Support for different queues/departments
- **Native Mobile App**: iOS and Android apps
- **Appointment System**: Pre-booking with time slots
- **SMS Notifications**: Text message alerts for students
- **QR Code Check-in**: Quick join via QR code scan
- **Admin Panel**: Manage teachers, view logs, export data
- **Multi-Language**: Add support for other languages

## Deployment Considerations

**⚠️ Important**: This system is designed for local use or internal networks. If deploying to the internet:

### Security Checklist:
- ✅ Use HTTPS (required for secure cookies)
- ✅ Set `secure: true` in session configuration
- ✅ Use environment variables for secrets
- ✅ Add rate limiting (prevent brute force attacks)
- ✅ Use persistent database (not in-memory)
- ✅ Add CSRF protection
- ✅ Implement proper logging
- ✅ Set up monitoring and alerts
- ✅ Regular security updates

### Recommended Setup for Production:
```javascript
// Use environment variables
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

// Configure session for production
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,  // HTTPS only
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
```

## Testing the System

### Quick Test Checklist:

1. **Teacher Flow**:
   - [ ] Create teacher account via API
   - [ ] Login successfully
   - [ ] View empty dashboard
   - [ ] Click "Next" with no students (should show error)
   - [ ] Logout successfully

2. **Student Flow**:
   - [ ] Join with name
   - [ ] Get queue number
   - [ ] See number displayed
   - [ ] Remove number (verify cooldown)
   - [ ] Get new number after cooldown
   - [ ] Logout successfully

3. **Lost Focus Flow**:
   - [ ] Join as student (don't get number)
   - [ ] Switch tabs → appears in lost focus with "-"
   - [ ] Return → removed from lost focus
   - [ ] Get number
   - [ ] Close browser → appears with number after 15 sec
   - [ ] Reopen → removed from lost focus

4. **Queue Flow**:
   - [ ] Multiple students get numbers (1, 2, 3, 4, 5)
   - [ ] Teacher clicks "Next" → current becomes 1
   - [ ] Student #1 sees green background
   - [ ] Students #2-3 see yellow
   - [ ] Students #4+ see white
   - [ ] Teacher clicks "Next" → student #1 removed, current becomes 2
   - [ ] Verify colors update correctly

## License

MIT License

Copyright (c) 2024 Flow-Optima-Queue

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

If you encounter any issues or have questions:

1. Check the **Troubleshooting** section above
2. Review server console logs for errors
3. Ensure all dependencies are properly installed
4. Verify you're using a modern browser (Chrome, Firefox, Safari, Edge)
5. Check network connectivity

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with detailed description

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Full English interface
- Teacher and student dashboards
- Real-time queue management
- Lost focus tracking for all students
- Heartbeat mechanism for disconnect detection
- Mobile-first responsive design
- Session management and security

---

**Built with ❤️ for efficient queue management**
