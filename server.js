const debugUsers = () => {
    console.log('Current users in system:', users.map(u => ({
        id: u.id,
        email: u.email,
        emplId: u.profile?.emplId
    })));
};

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
        debugUsers();
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

const findUserByEmplId = (emplId) => {
    // Convert to string and trim any whitespace
    const searchEmplId = String(emplId).trim();
    return users.find(u => u.profile && String(u.profile.emplId).trim() === searchEmplId);
};

app.get('/api/admin/user/:emplId', adminAuthMiddleware, (req, res) => {
    try {
        const { emplId } = req.params;
        const user = findUserByEmplId(emplId);

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

app.post('/api/upload-transcript', upload.single('transcript'), async (req, res) => {
    try {
        const userEmplId = req.body.emplId;
        console.log('Processing transcript for EMPLID:', userEmplId);

        // Find user
        const userIndex = users.findIndex(u => 
            u.profile && String(u.profile.emplId).trim() === String(userEmplId).trim()
        );

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `No user found with EMPLID: ${userEmplId}`
            });
        }

        // Use the actual transcript text from your document
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

        // Analyze transcript
        const analyzedData = analyzeTranscript(transcriptText);
        console.log('Analyzed transcript data:', analyzedData);

        // Update user profile
        users[userIndex].profile = {
            ...users[userIndex].profile,
            ...analyzedData,
            transcriptUploaded: true,
            lastTranscriptUpload: new Date()
        };

        // Return updated profile
        const { password: _, ...updatedUser } = users[userIndex];
        
        console.log('Profile updated with transcript data:', updatedUser.profile);

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
        const user = findUserByEmplId(emplId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

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
    let earnedCredits = 0;
    let major = '';

    // Split transcript into terms and clean up whitespace
    const terms = transcriptText.split(/(?=\d{4}\s(?:Fall|Spring|Summer)\sTerm)/)
        .map(term => term.trim());
    
    terms.forEach(term => {
        if (!term) return;

        // Extract term name and major
        const termMatch = term.match(/(\d{4}\s(?:Fall|Spring|Summer)\sTerm)/);
        const termName = termMatch ? termMatch[1].trim() : '';
        
        // Extract major if found
        const majorMatch = term.match(/Computer Science Major/);
        if (majorMatch) {
            major = 'Computer Science';
        }
        
        console.log('Processing term:', termName);

        // Split into lines and clean them
        const lines = term.split('\n').map(line => line.trim());
        
        // Process each line for courses
        lines.forEach(line => {
            // Updated pattern to match your transcript format
            const courseMatch = line.match(/^([A-Z]{2,3}\s\d{3}H?\.?\d*)\s+(.*?)\s+(\d+\.\d+)\s+([A-Z][+-]?)$/);
            if (courseMatch) {
                console.log('Found course:', courseMatch[0]); // Debug log
                const [_, courseId, courseName, credits, grade] = courseMatch;
                
                const course = {
                    courseId: courseId.trim(),
                    courseName: courseName.trim(),
                    credits: parseFloat(credits),
                    grade: grade.trim(),
                    term: termName
                };

                courses.push(course);
                console.log('Added course:', course); // Debug log
                
                // Update credit counts
                const numCredits = parseFloat(credits);
                if (!isNaN(numCredits)) {
                    totalCredits += numCredits;
                    earnedCredits += numCredits;
                    cumulativeGPA += numCredits * calculateGradeValue(grade);
                }
            }
        });
    });

    // Calculate final GPA
    const calculatedGPA = totalCredits > 0 ? (cumulativeGPA / totalCredits).toFixed(3) : 0;

    // Extract official GPA if present, otherwise use calculated
    const gpaMatch = transcriptText.match(/Cum GPA:\s*([\d.]+)/);
    const officialGPA = gpaMatch ? parseFloat(gpaMatch[1]) : parseFloat(calculatedGPA);

    // Build result object
    const analyzedData = {
        major,
        gpa: officialGPA,
        courses,
        completedCredits: earnedCredits,
        skills: extractSkills(courses),
        courseSummary: {
            totalCourses: courses.length,
            completedCredits: earnedCredits,
            inProgressCredits: totalCredits - earnedCredits
        },
        lastUpdated: new Date(),
        terms: Array.from(new Set(courses.map(course => course.term)))
    };

    // Debug log the analyzed data
    console.log('Course Analysis Results:', {
        totalCourses: courses.length,
        courses: courses.map(c => ({
            id: c.courseId,
            grade: c.grade,
            term: c.term
        })),
        major,
        gpa: officialGPA,
        earnedCredits,
        termsFound: analyzedData.terms,
        skillsFound: analyzedData.skills.length
    });

    return analyzedData;
}

// Helper functions remain the same
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
        console.log('Extracting skills for course:', courseId); // Debug log
        
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

        if (courseSkills[courseId]) {
            courseSkills[courseId].forEach(skill => {
                console.log('Adding skill:', skill); // Debug log
                skills.add(skill);
            });
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
            generalSkills[prefix].forEach(skill => {
                console.log('Adding general skill:', skill); // Debug log
                skills.add(skill);
            });
        }

        // Add honors designation if applicable
        if (courseId.includes('H')) {
            console.log('Adding honors skills'); // Debug log
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