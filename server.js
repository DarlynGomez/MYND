const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const app = express();

// Interactivity of Server

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize users array with default admin
const users = [{
    id: 1,
    email: 'admin@admin.bmcc.cuny.edu',
    password: 'admin123', // In production, use hashed passwords
    name: 'Admin User',
    role: 'Admin',
    profile: {
        emplId: '00000000',
        documents: [],
        documentCounts: {
            completed: 0,
            pending: 0,
            processing: 0
        }
    }
}];

// Document template definition
const documentsTemplate = [
    {
        id: 'i9',
        name: 'I-9 Form',
        description: 'Employment Eligibility Verification',
        required: true,
        status: 'pending',
        submitInPerson: true,
        deadline: '3 days before start date'
    },
    {
        id: 'w4',
        name: 'W-4 Form',
        description: 'Federal Tax Withholding',
        required: true,
        status: 'pending',
        submitInPerson: false,
        deadline: 'Before first paycheck'
    },
    {
        id: 'direct-deposit',
        name: 'Direct Deposit Form',
        description: 'Banking Information for Payroll',
        required: true,
        status: 'pending',
        submitInPerson: false,
        deadline: 'Before first paycheck'
    },
    {
        id: 'ssc',
        name: 'Social Security Card',
        description: 'Copy of Social Security Card',
        required: true,
        status: 'pending',
        submitInPerson: true,
        deadline: 'Before first paycheck'
    },
    {
        id: 'id',
        name: 'Photo ID',
        description: 'Government-issued Photo ID',
        required: true,
        status: 'pending',
        submitInPerson: true,
        deadline: 'Before first paycheck'
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

const adminAuthMiddleware = (req, res, next) => {
    const adminToken = req.headers['admin-token'];
    console.log('Received admin token:', adminToken); // Debug log

    if (!adminToken || !activeAdminTokens.has(adminToken)) {
        console.log('Invalid or missing admin token'); // Debug log
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized access' 
        });
    }
    
    // Add the admin user ID to the request
    req.adminUserId = activeAdminTokens.get(adminToken);
    next();
};

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

// Login endpoint
app.post('/api/login', (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const user = users.find(u => u.email === email);
        console.log('Found user:', user);
        
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isAdmin = email.endsWith('@admin.bmcc.cuny.edu');
        const userRole = isAdmin ? 'Admin' : 'Student';
        const redirectTo = isAdmin ? '/hrAdmin.html' : '/job-landing.html';
        
        // Generate a more secure admin token
        const adminToken = isAdmin ? `admin-${Date.now()}-${Math.random().toString(36).substring(2, 15)}` : null;

        const { password: _, ...userWithoutPassword } = user;
        
        // If admin, store the token in active admin tokens
        if (isAdmin) {
            activeAdminTokens.set(adminToken, user.id);
        }

        res.json({
            success: true,
            user: {
                ...userWithoutPassword,
                role: userRole
            },
            adminToken,
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

const activeAdminTokens = new Map();

// Registration endpoint
app.post('/api/register', (req, res) => {
    try {
        const { email, password, name, emplId } = req.body;

        if (!email || !password || !name || !emplId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!/^\d{8}$/.test(emplId)) {
            return res.status(400).json({
                success: false,
                message: 'EMPLID must be 8 digits'
            });
        }

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

        if (!email.endsWith('@stu.bmcc.cuny.edu')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please use your BMCC student email address' 
            });
        }

        const newUser = {
            id: users.length + 1,
            email,
            password,
            name,
            role: 'Student',
            profile: {
                emplId,
                onboardingStatus: 'not-started',
                documents: [],
                documentCounts: {
                    completed: 0,
                    pending: 0,
                    processing: 0
                },
                createdAt: new Date(),
                isProfileComplete: false
            }
        };

        users.push(newUser);
        console.log('New user registered:', {
            id: newUser.id,
            email: newUser.email,
            emplId: newUser.profile.emplId
        });

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

// Admin endpoint to search user by EMPLID
app.get('/api/admin/user/:emplId', adminAuthMiddleware, (req, res) => {
    try {
        const { emplId } = req.params;
        const user = users.find(u => u.profile.emplId === emplId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this EMPLID'
            });
        }

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

// Update onboarding status
app.put('/api/admin/onboarding-status', adminAuthMiddleware, (req, res) => {
    try {
        const { emplId, status } = req.body;
        
        const userIndex = users.findIndex(u => u.profile.emplId === emplId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update onboarding status
        users[userIndex].profile.onboardingStatus = status;

        // If status is changed to 'in-progress', initialize documents
        if (status === 'in-progress') {
            users[userIndex].profile.documents = documentsTemplate.map(doc => ({...doc}));
            users[userIndex].profile.documentCounts = {
                completed: 0,
                pending: documentsTemplate.length,
                processing: 0
            };
        }

        res.json({
            success: true,
            message: 'Onboarding status updated',
            profile: users[userIndex].profile
        });

    } catch (error) {
        console.error('Error updating onboarding status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating onboarding status',
            error: error.message
        });
    }
});

// Update document status
app.put('/api/admin/document-status', adminAuthMiddleware, (req, res) => {
    try {
        const { emplId, documentId, status } = req.body;
        
        const userIndex = users.findIndex(u => u.profile.emplId === emplId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!users[userIndex].profile.documents) {
            users[userIndex].profile.documents = documentsTemplate.map(doc => ({...doc}));
        }

        const docIndex = users[userIndex].profile.documents.findIndex(d => d.id === documentId);
        if (docIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Update document status
        users[userIndex].profile.documents[docIndex].status = status;

        // Update document counts
        const docs = users[userIndex].profile.documents;
        users[userIndex].profile.documentCounts = {
            completed: docs.filter(d => d.status === 'approved').length,
            pending: docs.filter(d => d.status === 'pending').length,
            processing: docs.filter(d => d.status === 'processing').length
        };

        // Check if all documents are approved and update onboarding status
        if (users[userIndex].profile.documentCounts.completed === docs.length) {
            users[userIndex].profile.onboardingStatus = 'onboarded';
        }

        res.json({
            success: true,
            message: 'Document status updated',
            profile: users[userIndex].profile
        });

    } catch (error) {
        console.error('Error updating document status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating document status',
            error: error.message
        });
    }
});

// Document submission endpoint
app.post('/api/submit-document', upload.single('document'), (req, res) => {
    try {
        const { emplId, documentId } = req.body;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userIndex = users.findIndex(u => u.profile.emplId === emplId);
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!users[userIndex].profile.documents) {
            users[userIndex].profile.documents = documentsTemplate.map(doc => ({...doc}));
        }

        const docIndex = users[userIndex].profile.documents.findIndex(d => d.id === documentId);
        if (docIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Document type not found'
            });
        }

        // Update document status to processing
        users[userIndex].profile.documents[docIndex] = {
            ...users[userIndex].profile.documents[docIndex],
            status: 'processing',
            submittedDate: new Date(),
            fileName: req.file.originalname
        };

        // Update document counts
        const docs = users[userIndex].profile.documents;
        users[userIndex].profile.documentCounts = {
            completed: docs.filter(d => d.status === 'approved').length,
            pending: docs.filter(d => d.status === 'pending').length,
            processing: docs.filter(d => d.status === 'processing').length
        };

        res.json({
            success: true,
            message: 'Document submitted successfully',
            profile: users[userIndex].profile
        });

    } catch (error) {
        console.error('Error submitting document:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting document',
            error: error.message
        });
    }
});

// Get document status
app.get('/api/document-status/:emplId', (req, res) => {
    try {
        const { emplId } = req.params;
        const user = users.find(u => u.profile.emplId === emplId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            documents: user.profile.documents || [],
            documentCounts: user.profile.documentCounts,
            onboardingStatus: user.profile.onboardingStatus
        });

    } catch (error) {
        console.error('Error getting document status:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting document status',
            error: error.message
        });
    }
});

// Add or update these parts in your server.js

// Updated transcript upload endpoint with proper profile handling
app.post('/api/upload-transcript', upload.single('transcript'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const userEmplId = req.body.emplId;
        console.log('Processing transcript for EMPLID:', userEmplId);

        if (!userEmplId) {
            return res.status(400).json({
                success: false,
                message: 'No EMPLID provided'
            });
        }

        // Find user by EMPLID
        const userIndex = users.findIndex(u => u.profile && u.profile.emplId === userEmplId);
        
        if (userIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: `No user found with EMPLID: ${userEmplId}` 
            });
        }

        // Initialize profile if it doesn't exist
        if (!users[userIndex].profile) {
            users[userIndex].profile = {
                emplId: userEmplId,
                documents: [],
                documentCounts: {
                    completed: 0,
                    pending: 0,
                    processing: 0
                },
                onboardingStatus: 'not-started'
            };
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
Req Designation: Flexible Core - Creative Expression`;

        // Parse transcript data
        const analyzedData = analyzeTranscript(transcriptText);
        
        // Update user profile with transcript data
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
            error: error.message
        });
    }
});

// Add this to your server.js

// Get profile data endpoint
app.get('/api/profile/:emplId', (req, res) => {
    try {
        const { emplId } = req.params;
        
        // Find user by EMPLID
        const user = users.find(u => u.profile && u.profile.emplId === emplId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return profile data without sensitive information
        const { password, ...safeUser } = user;
        
        res.json({
            success: true,
            profile: safeUser.profile
        });

    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting profile data',
            error: error.message
        });
    }
});

// Update profile endpoint
app.put('/api/profile/:emplId', (req, res) => {
    try {
        const { emplId } = req.params;
        const updates = req.body;
        
        // Find user by EMPLID
        const userIndex = users.findIndex(u => u.profile && u.profile.emplId === emplId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update profile
        users[userIndex].profile = {
            ...users[userIndex].profile,
            ...updates,
            lastUpdated: new Date()
        };

        // Return updated profile without sensitive information
        const { password, ...safeUser } = users[userIndex];
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile: safeUser.profile
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Updated transcript analysis helper function
// Update this function in your server.js

function analyzeTranscript(transcriptText) {
    console.log('Starting transcript analysis');

    const courses = [];
    let cumulativeGPA = 0;
    let totalCredits = 0;

    // Split transcript into terms
    const terms = transcriptText.split(/(?=\d{4}\s(?:Fall|Spring|Summer)\sTerm)/);
    
    terms.forEach(term => {
        if (!term.trim()) return;

        // Extract term name
        const termMatch = term.match(/(\d{4}\s(?:Fall|Spring|Summer)\sTerm)/);
        const termName = termMatch ? termMatch[1] : '';
        
        console.log('Processing term:', termName);

        // Match course patterns
        const courseLines = term.split('\n');
        courseLines.forEach(line => {
            // Updated regex to match your transcript format more precisely
            const courseMatch = line.match(/^([A-Z]{2,3}\s\d{3}H?\.?\d*)\s+([\w\s&()-]+?)\s+(\d+\.\d+)\s+([A-Z][+-]?)\s*$/);
            
            if (courseMatch) {
                const courseId = courseMatch[1].trim();
                const courseName = courseMatch[2].trim();
                const credits = parseFloat(courseMatch[3]);
                const grade = courseMatch[4].trim();

                // Only add courses with actual grades and credits
                if (credits > 0 && grade) {
                    const course = {
                        courseId,
                        courseName,
                        credits,
                        grade,
                        term: termName
                    };

                    console.log('Found course:', course);
                    courses.push(course);
                    
                    // Update GPA calculation
                    const gradeValue = calculateGradeValue(grade);
                    totalCredits += credits;
                    cumulativeGPA += credits * gradeValue;
                }
            }
        });
    });

    // Extract major (look for "Computer Science Major" specifically)
    const majorMatch = transcriptText.match(/Computer Science Major/);
    const major = majorMatch ? 'Computer Science' : '';

    // Calculate GPA if not found in transcript
    const calculatedGPA = totalCredits > 0 ? (cumulativeGPA / totalCredits).toFixed(3) : 0;
    
    // Extract cumulative GPA from transcript
    const gpaMatch = transcriptText.match(/Cum GPA:\s*([\d.]+)/);
    const officialGPA = gpaMatch ? parseFloat(gpaMatch[1]) : parseFloat(calculatedGPA);

    // Extract completed credits
    const creditsMatch = transcriptText.match(/Cum Total:.*?(\d+\.\d+)/);
    const completedCredits = creditsMatch ? parseFloat(creditsMatch[1]) : totalCredits;

    const analyzedData = {
        major,
        gpa: officialGPA,
        courses,
        completedCredits,
        skills: extractSkills(courses),
        courseSummary: {
            totalCourses: courses.length,
            completedCredits,
            inProgressCredits: 0
        },
        lastUpdated: new Date(),
        terms: courses.reduce((acc, course) => {
            if (!acc.includes(course.term)) {
                acc.push(course.term);
            }
            return acc;
        }, [])
    };

    console.log('Analyzed Data:', {
        major: analyzedData.major,
        gpa: analyzedData.gpa,
        totalCourses: analyzedData.courses.length,
        courses: analyzedData.courses.map(c => ({
            courseId: c.courseId,
            grade: c.grade,
            term: c.term
        })),
        completedCredits: analyzedData.completedCredits,
        skills: analyzedData.skills
    });

    return analyzedData;
}

function calculateGradeValue(grade) {
    const gradeValues = {
        'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0,
        'F': 0.0
    };
    return gradeValues[grade] || 0;
}

function extractSkills(courses) {
    const skills = new Set();
    
    courses.forEach(course => {
        const courseId = course.courseId.trim();
        
        // Course-specific skills
        const courseSkills = {
            'CSC 101': ['Computer Fundamentals', 'Information Technology', 'Digital Literacy'],
            'CSC 111': ['Programming Fundamentals', 'Java Programming', 'Software Development'],
            'CIS 385': ['Web Development', 'HTML/CSS', 'JavaScript'],
            'MAT 301': ['Calculus', 'Analytical Geometry', 'Advanced Mathematics'],
            'MAT 206.5': ['Pre-Calculus', 'Algebra', 'Mathematical Reasoning'],
            'ENG 121': ['Academic Writing', 'Literature Analysis', 'Research Writing'],
            'CRT 100': ['Critical Thinking', 'Analytical Reasoning', 'Logic'],
            'SPE 100': ['Public Speaking', 'Oral Communication', 'Presentation Skills'],
            'ECO 201H': ['Economic Analysis', 'Macroeconomics', 'Research Methods']
        };

        // Add course-specific skills
        if (courseSkills[courseId]) {
            courseSkills[courseId].forEach(skill => skills.add(skill));
        }

        // Add general skills based on course prefix
        const prefix = courseId.split(' ')[0];
        const generalSkills = {
            'CSC': ['Computer Science', 'Technical Problem Solving'],
            'CIS': ['Information Systems', 'Technical Documentation'],
            'MAT': ['Mathematics', 'Analytical Thinking'],
            'ENG': ['Written Communication', 'Composition'],
            'SPE': ['Communication', 'Public Speaking'],
            'CRT': ['Critical Analysis', 'Logical Reasoning'],
            'ECO': ['Economic Principles', 'Data Analysis']
        };

        if (generalSkills[prefix]) {
            generalSkills[prefix].forEach(skill => skills.add(skill));
        }

        // Add honors designation if applicable
        if (courseId.includes('H')) {
            skills.add('Honors Level Work');
            skills.add('Advanced Academic Research');
        }
    });

    return Array.from(skills);
}








// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Users array initialized with admin user');
});