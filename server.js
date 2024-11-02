const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const natural = require('natural');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize arrays
const users = [];
const jobs = [
    {
        id: 1,
        title: "IT Help Desk Assistant",
        department: "CIS",
        description: "Provide technical support to students and faculty. Help with software installation, troubleshooting, and basic hardware issues.",
        requirements: {
            minimumGPA: 3.0,
            preferredMajors: ["Computer Science", "Information Technology"],
            requiredSkills: ["Technical Support", "Problem Solving"],
            preferredSkills: ["Windows", "Mac OS", "Linux"]
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
        description: "Assist students with research, manage book checkouts, and maintain library organization.",
        requirements: {
            minimumGPA: 3.0,
            preferredMajors: ["Liberal Arts", "English", "Computer Science"],
            requiredSkills: ["Organization", "Customer Service"],
            preferredSkills: ["Research", "Database Management"]
        },
        wage: 16,
        hoursPerWeek: "10-15",
        location: "S-Building",
        type: "Work Study"
    },
    {
        id: 3,
        title: "Web Development Assistant",
        department: "CIS",
        description: "Help maintain and update department websites. Create new web features and ensure site functionality.",
        requirements: {
            minimumGPA: 3.2,
            preferredMajors: ["Computer Science", "Media Arts"],
            requiredSkills: ["HTML", "CSS", "JavaScript"],
            preferredSkills: ["React", "Node.js", "PHP"]
        },
        wage: 20,
        hoursPerWeek: "15-20",
        location: "F-Building",
        type: "Part-Time"
    }
];

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed'));
        }
        cb(null, true);
    }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/job-landing.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'job-landing.html'));
});

app.get('/hrAdmin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'hrAdmin.html'));
});

app.get('/profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

// Registration endpoint
app.post('/api/register', (req, res) => {
    try {
        const { email, password, name, emplId } = req.body;

        // Validate required fields
        if (!email || !password || !name || !emplId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate EMPLID format
        if (!/^\d{8}$/.test(emplId)) {
            return res.status(400).json({
                success: false,
                message: 'EMPLID must be 8 digits'
            });
        }

        // Check if user already exists
        const existingUser = users.find(user => 
            user.email === email || 
            (user.profile && user.profile.emplId === emplId)
        );
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: existingUser.email === email ? 
                    'Email already registered' : 'EMPLID already registered' 
            });
        }

        // Validate email domain
        if (!email.endsWith('@stu.bmcc.cuny.edu') && !email.endsWith('@admin.bmcc.cuny.edu')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please use your BMCC email address' 
            });
        }

        // Create new user with initial profile
        const newUser = {
            id: users.length + 1,
            email,
            password,
            name,
            profile: {
                emplId,
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

        // Add user to array
        users.push(newUser);

        // Log successful registration
        console.log('New user registered:', {
            id: newUser.id,
            email: newUser.email,
            emplId: newUser.profile.emplId
        });

        // Return success response without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(200).json({ 
            success: true, 
            message: 'Registration successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration',
            error: error.message
        });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Determine user type and redirect
        const isAdmin = email.endsWith('@admin.bmcc.cuny.edu');
        const redirectTo = isAdmin ? '/hrAdmin.html' : '/job-landing.html';
        const userRole = isAdmin ? 'Admin' : 'Student';

        // Return user info without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            user: {
                ...userWithoutPassword,
                role: userRole
            },
            userId: user.id,
            redirectTo
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: error.message
        });
    }
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
        isProfileComplete: true,
        lastUpdated: new Date()
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

// Admin endpoint to search user by EMPLID
app.get('/api/admin/user/:emplId', (req, res) => {
    try {
        const emplId = req.params.emplId;
        const user = users.find(u => u.profile.emplId === emplId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this EMPLID'
            });
        }

        // Return user data without sensitive information
        const { password, ...safeUserData } = user;
        res.json({
            success: true,
            user: safeUserData
        });
    } catch (error) {
        console.error('Admin search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching for user',
            error: error.message
        });
    }
});

// Transcript upload and analysis endpoint
// Updated transcript upload endpoint
app.post('/api/upload-transcript', upload.single('transcript'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        // Get the user's EMPLID from the form data
        const userEmplId = req.body.emplId;
        console.log('Received EMPLID:', userEmplId); // Debug log

        if (!userEmplId) {
            return res.status(400).json({
                success: false,
                message: 'No EMPLID provided'
            });
        }

        // Find user by EMPLID
        const userIndex = users.findIndex(u => u.profile.emplId === userEmplId);
        console.log('Found user index:', userIndex); // Debug log

        if (userIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: `No user found with EMPLID: ${userEmplId}` 
            });
        }

        // For testing, use the hardcoded transcript text
        const transcriptText = `2023 Fall Term
Computer Science Major
Academic Standing Effective 01/02/2024: Good Academic Standing
Course Description Earn Grd
CSC 101 Principles In Info Tech & Comp 3.00 A
Req Designation: Flexible Core - Scientific World
Contact Hours: 4.00
ENG 121 Eng Comp & Intro to Literature 6.00 A
Req Designation: Required Core - English Composition
Contact Hours: 7.00
MAT 206.5 Intermed Algebra & Precalculus 4.00 C+
Req Designation: Required Core - Mathematical&QuantitativeReasoning
Contact Hours: 8.00

2024 Spring Term
Computer Science Major
Academic Standing Effective 06/03/2024: Good Academic Standing
Course Description Earn Grd
CRT 100 Critical Thinking 3.00 A
Req Designation: Flexible Core - Individual and Society
CSC 111 Introduction to Programming 4.00 A
Req Designation: Flexible Core - Scientific World
MAT 301 Analytic Geometry & Calc I 4.00 A
Req Designation: Required Core - Mathematical&QuantitativeReasoning
SPE 100 Fund of Public Speaking 3.00 A
Req Designation: Flexible Core - Creative Expression

2024 Summer Term
Computer Science Major
Course Description Earn Grd
CIS 385 Web Programming I 3.00 A
Contact Hours: 4.00
ECO 201H Macroeconomics (Honors) 3.00 A
Req Designation: Flexible Core - US Experience in its Diversity`;

        console.log('Processing transcript for EMPLID:', userEmplId);

        // Parse transcript data
        const analyzedData = analyzeTranscript(transcriptText);
        console.log('Analyzed data:', analyzedData);

        // Update user profile
        users[userIndex].profile = {
            ...users[userIndex].profile,
            ...analyzedData,
            transcriptUploaded: true,
            lastTranscriptUpload: new Date()
        };

        // Return updated profile without password
        const { password: _, ...updatedUser } = users[userIndex];
        
        console.log('Profile updated successfully for EMPLID:', userEmplId);

        res.json({
            success: true,
            message: 'Transcript analyzed successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Transcript analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing transcript',
            error: error.message,
            stack: error.stack
        });
    }
});

// job endpoints
app.get('/api/jobs', (req, res) => {
    res.json(jobs);
});

app.get('/api/recommendations/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate job recommendations
    const recommendations = jobs.map(job => {
        let score = 0;
        const matchDetails = [];

        // Major match
        if (job.requirements.preferredMajors.includes(user.profile.major)) {
            score += 30;
            matchDetails.push('Major match');
        }

        // GPA match
        if (user.profile.gpa >= job.requirements.minimumGPA) {
            score += 20;
            matchDetails.push('GPA requirement met');
        }

        // Skills match
        const matchedSkills = job.requirements.requiredSkills.filter(
            skill => user.profile.skills.includes(skill)
        );
        score += matchedSkills.length * 10;
        
        const preferredSkillsMatch = job.requirements.preferredSkills.filter(
            skill => user.profile.skills.includes(skill)
        );
        score += preferredSkillsMatch.length * 5;

        if (matchedSkills.length > 0) {
            matchDetails.push(`Matching skills: ${matchedSkills.join(', ')}`);
        }

        return {
            ...job,
            matchScore: score,
            matchDetails
        };
    });

    // Sort by match score and return top recommendations
    const sortedRecommendations = recommendations
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

    res.json(sortedRecommendations);
});

// Debug endpoint
app.get('/api/debug/users', (req, res) => {
    const sanitizedUsers = users.map(({password, ...user}) => user);
    res.json(sanitizedUsers);
});

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Transcript analysis helper function
function analyzeTranscript(transcriptText) {
    console.log('Starting transcript analysis');

    const courses = [];
    const termRegex = /\d{4}\s(?:Fall|Spring|Summer)\sTerm([\s\S]*?)(?=\d{4}\s(?:Fall|Spring|Summer)\sTerm|\Z)/g;
    const courseRegex = /([A-Z]{2,4}\s\d{3}(?:\.5)?)\s+((?:[A-Za-z]|\s|&|-)+?)\s+(\d+\.\d+)\s+([A-Z][+-]?)/g;

    let termMatch;
    while ((termMatch = termRegex.exec(transcriptText)) !== null) {
        const termContent = termMatch[1];
        let courseMatch;
        
        while ((courseMatch = courseRegex.exec(termContent)) !== null) {
            if (courseMatch[4]) { // If there's a grade
                const course = {
                    courseId: courseMatch[1].trim(),
                    courseName: courseMatch[2].trim(),
                    credits: parseFloat(courseMatch[3]),
                    grade: courseMatch[4].trim()
                };
                console.log('Found course:', course);
                courses.push(course);
            }
        }
    }

    console.log(`Found ${courses.length} courses`);

    const gpaMatch = transcriptText.match(/Cum GPA: ([\d.]+)/);
    const majorMatch = transcriptText.match(/Computer Science Major/);

    return {
        major: majorMatch ? 'Computer Science' : '',
        gpa: gpaMatch ? parseFloat(gpaMatch[1]) : null,
        courses: courses,
        skills: extractSkills(courses),
        completedCredits: courses.reduce((sum, course) => sum + course.credits, 0)
    };
}

function extractSkills(courses) {
    const skills = new Set();
    courses.forEach(course => {
        const prefix = course.courseId.split(' ')[0];
        switch(prefix) {
            case 'CSC':
                skills.add('Programming');
                skills.add('Computer Science');
                if (course.courseId === 'CSC 111') {
                    skills.add('Software Development');
                    skills.add('Java Programming');
                }
                break;
            case 'CIS':
                skills.add('Information Technology');
                if (course.courseId === 'CIS 385') {
                    skills.add('Web Development');
                }
                break;
            case 'MAT':
                skills.add('Mathematics');
                skills.add('Analytical Thinking');
                if (course.courseId.includes('301')) {
                    skills.add('Calculus');
                }
                break;
            case 'ENG':
                skills.add('Writing');
                skills.add('Communication');
                break;
            case 'SPE':
                skills.add('Public Speaking');
                skills.add('Communication');
                break;
            case 'CRT':
                skills.add('Critical Thinking');
                skills.add('Analysis');
                break;
            case 'ECO':
                skills.add('Economic Analysis');
                skills.add('Data Analysis');
                break;
        }
    });
    return Array.from(skills);
}

// Helper function to calculate expected graduation
function calculateExpectedGraduation(completedCourses) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Assuming average 5 courses per semester and 20 courses total needed
    const remainingSemesters = Math.ceil((20 - completedCourses) / 5);
    
    // Add remaining semesters to current date
    const expectedYear = year + Math.floor((month + remainingSemesters * 4) / 12);
    const expectedMonth = ((month + remainingSemesters * 4) % 12) < 6 ? 'Spring' : 'Fall';
    
    return `${expectedMonth} ${expectedYear}`;
}

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Users array initialized');
});