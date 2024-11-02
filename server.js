const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve files from root directory

// Local storage for users and jobs
const users = [];
const jobs = [
    {
        id: 1,
        title: "IT Help Desk Assistant",
        department: "CIS",
        description: "Provide technical support to students and faculty.",
        requirements: {
            minimumGPA: 3.0,
            preferredMajors: ["Computer Science", "Information Technology"],
            requiredSkills: ["Technical Support", "Problem Solving"]
        },
        wage: 18,
        hoursPerWeek: "15-20",
        location: "S-Building",
        type: "Part-Time"
    },
    {
        id: 2,
        title: "Library Assistant",
        department: "Library",
        description: "Help students find resources and maintain library organization.",
        requirements: {
            minimumGPA: 3.0,
            preferredMajors: ["Computer Science", "Liberal Arts"],
            requiredSkills: ["Organization", "Customer Service"]
        },
        wage: 15,
        hoursPerWeek: "10-15",
        location: "S-Building",
        type: "Work Study"
    },
    {
        id: 3,
        title: "Web Development Assistant",
        department: "CIS",
        description: "Assist in maintaining department websites and applications.",
        requirements: {
            minimumGPA: 3.2,
            preferredMajors: ["Computer Science"],
            requiredSkills: ["HTML", "CSS", "JavaScript"]
        },
        wage: 20,
        hoursPerWeek: "15-20",
        location: "F-Building",
        type: "Part-Time"
    }
];

// Route to serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Routes to serve other HTML files
app.get('/job-landing.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'job-landing.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/onboarding.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'onboarding.html'));
});

// Authentication endpoints
app.post('/api/register', (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Validate email domain
    if (!email.endsWith('@stu.bmcc.cuny.edu') && !email.endsWith('@admin.bmcc.cuny.edu')) {
        return res.status(400).json({ success: false, message: 'Invalid email domain' });
    }

    // Create new user with initial profile
    const newUser = {
        id: users.length + 1,
        email,
        password,
        name,
        profile: {
            emplId: '',
            major: '',
            gpa: null,
            courses: [],
            skills: [],
            interests: [],
            preferredWorkType: '',
            createdAt: new Date(),
            isProfileComplete: false
        },
        isFirstLogin: true
    };

    // Add user to local storage
    users.push(newUser);

    // Return success without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ 
        success: true, 
        message: 'Registration successful',
        user: userWithoutPassword
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
        });
    }

    // Determine if this is first login
    const isFirstLogin = user.isFirstLogin;
    if (isFirstLogin) {
        user.isFirstLogin = false;
    }

    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
        success: true,
        isFirstLogin,
        user: userWithoutPassword,
        redirectTo: isFirstLogin ? '/onboarding.html' : 
                   email.includes('admin') ? '/admin-dashboard.html' : '/job-landing.html'
    });
});

// Profile endpoints
app.put('/api/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user profile
    users[userIndex].profile = {
        ...users[userIndex].profile,
        ...req.body,
        isProfileComplete: true
    };

    // Return updated user without password
    const { password: _, ...updatedUser } = users[userIndex];
    res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
    });
});

app.get('/api/profile/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// Job recommendations endpoint
app.get('/api/recommendations/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Simple recommendation based on major
    const recommendedJobs = jobs.filter(job => 
        job.requirements.preferredMajors.includes(user.profile.major)
    );

    res.json(recommendedJobs);
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
    res.json(jobs);
});

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});