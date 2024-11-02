const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const app = express();

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

// Error handling for undefined routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Users array initialized with admin user');
});