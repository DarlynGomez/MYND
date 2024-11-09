// content-handler.js
// Dynanmically loads in content on the page like stuonboarding and jobs

class ContentHandler {
    constructor() {
        this.mainContent = document.getElementById('mainContent');
        this.setupEventListeners();
        this.currentView = null;
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[href="required-doc.html"]')) {
                e.preventDefault();
                this.loadContent('stuonboarding');
            }

            if (e.target.matches('button[onclick*="window.location.href=\'mentor.html\'"]')) {
                e.preventDefault();
                this.loadContent('mentor');
            }
        });
    }

    async loadContent(contentType) {
        try {
            this.mainContent.classList.add('opacity-0');
            await new Promise(resolve => setTimeout(resolve, 300));

            let content;
            switch (contentType) {
                case 'hr':
                    content = await this.fetchPage('hronboarding.html');
                    break;
                case 'stuonboarding':
                    content = await this.fetchPage('stuonboarding.html');
                    break;
                case 'campus-jobs':
                    content = this.getJobsContent();
                    break;
                case 'mentor':
                    content = this.getMentorContent();
                    break;
                default:
                    console.error('Unknown content type:', contentType);
                    return;
            }

            if (this.mainContent) {
                this.mainContent.innerHTML = content;
                this.currentView = contentType;

                // Add appropriate styling based on content type
                if (contentType === 'campus-jobs' || contentType === 'mentor') {
                    this.mainContent.className = 'main-content';
                } else {
                    this.mainContent.className = 'main-content transition-all duration-300 p-6 bg-gray-50 min-h-screen';
                }

                this.mainContent.classList.remove('opacity-0');
                this.mainContent.classList.add('fade-in');

                if (contentType === 'campus-jobs') {
                    this.setupJobsEventListeners();
                } else if (contentType === 'mentor') {
                    this.setupMentorEventListeners();
                }
            }

        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    getJobsContent() {
        return `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-blue-800 mb-2">Available Positions</h1>
                <p class="text-gray-600">Explore current job opportunities on campus</p>
            </div>

            <!-- Job Cards Grid -->
            <div class="grid md:grid-cols-3 gap-6 mb-12">
                <!-- College Assistant Card -->
                <div class="job-card">
                    <img src="./images/ca.jpg" alt="College Assistant" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-blue-800 mb-2">College Assistant</h3>
                        <p class="text-gray-600 mb-4">Work in various departments while gaining valuable experience.</p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-blue-600">$15.61/hour</span>
                            <button class="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Mentor Card -->
                <div class="job-card">
                    <img src="./images/mentor.jpg" alt="Mentor" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-blue-800 mb-2">Mentor</h3>
                        <p class="text-gray-600 mb-4">Guide and support fellow students in their academic journey.</p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-blue-600">$16.50/hour</span>
                            <button onclick="contentHandler.loadContent('mentor')" 
                                    class="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Student Instructor Card -->
                <div class="job-card">
                    <img src="./images/si.jpg" alt="Student Instructor" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-blue-800 mb-2">Student Instructor</h3>
                        <p class="text-gray-600 mb-4">Help other students succeed in their courses.</p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-blue-600">$17.00/hour</span>
                            <button class="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Why Work on Campus Section -->
            <section class="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 class="text-2xl font-bold text-blue-800 mb-8 text-center">Why Work on Campus?</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="benefit-card bg-blue-50 p-6 rounded-lg text-center">
                        <div class="text-4xl mb-4">⏰</div>
                        <h3 class="text-xl font-bold mb-2 text-blue-800">Flexible Schedule</h3>
                        <p class="text-gray-600">Work hours that fit perfectly around your class schedule</p>
                    </div>

                    <div class="benefit-card bg-blue-50 p-6 rounded-lg text-center">
                        <div class="text-4xl mb-4">💡</div>
                        <h3 class="text-xl font-bold mb-2 text-blue-800">Gain Experience</h3>
                        <p class="text-gray-600">Develop professional skills for your future career</p>
                    </div>

                    <div class="benefit-card bg-blue-50 p-6 rounded-lg text-center">
                        <div class="text-4xl mb-4">🎯</div>
                        <h3 class="text-xl font-bold mb-2 text-blue-800">Convenient Location</h3>
                        <p class="text-gray-600">No commute needed - work right on campus</p>
                    </div>
                </div>
            </section>
        `;
    }

    getMentorContent() {
        return `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-blue-800 mb-2">Mentor Positions</h1>
                <p class="text-gray-600">Explore available mentoring opportunities at BMCC</p>
            </div>

            <!-- Two-Column Layout -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Left Column - Mentor List -->
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                    <div class="mentor-item p-4 cursor-pointer active" data-mentor="impact">
                        <h3 class="font-semibold text-blue-800">Freshman IMPACT Mentor</h3>
                        <p class="text-sm text-gray-600">Help new students transition to college life</p>
                    </div>
                    <div class="mentor-item p-4 cursor-pointer border-t border-gray-100" data-mentor="firstgen">
                        <h3 class="font-semibold text-blue-800">First-Gen Mentor</h3>
                        <p class="text-sm text-gray-600">Support first-generation college students</p>
                    </div>
                    <div class="mentor-item p-4 cursor-pointer border-t border-gray-100" data-mentor="umla">
                        <h3 class="font-semibold text-blue-800">UMLA Mentor</h3>
                        <p class="text-sm text-gray-600">Academic support for math and science</p>
                    </div>
                    <div class="mentor-item p-4 cursor-pointer border-t border-gray-100" data-mentor="peer">
                        <h3 class="font-semibold text-blue-800">Peer Success Mentor</h3>
                        <p class="text-sm text-gray-600">Guide students in academic success</p>
                    </div>
                    <div class="mentor-item p-4 cursor-pointer border-t border-gray-100" data-mentor="career">
                        <h3 class="font-semibold text-blue-800">Career Mentor</h3>
                        <p class="text-sm text-gray-600">Help with career planning</p>
                    </div>
                </div>

                <!-- Right Column - Mentor Details -->
                <div id="mentorDetails" class="md:col-span-2 bg-white rounded-lg shadow-md p-6">
                    <div class="text-center py-8">
                        <div class="max-w-xl mx-auto">
                            <img
                                src="./images/mentor.jpg"
                                alt="Mentor Program"
                                class="w-full h-auto rounded-lg shadow-md"
                                style="max-height: 400px; object-fit: contain">
                        </div>
                    </div>
                </div>
            </div>

            <script>
                // Add the mentor details data and functions from your original mentor.html
                ${this.getMentorScripts()}
            </script>
        `;
    }

    getMentorScripts() {
        return `
            const mentorDetails = {
                impact: {
                    title: "Freshman IMPACT Mentor",
                    pay: "$16.50/hour",
                    schedule: "10-15 hours/week",
                    requirements: [
                        "Minimum 3.0 GPA",
                        "Completed at least 24 credits at BMCC",
                        "Strong communication skills",
                        "Leadership experience preferred"
                    ],
                    responsibilities: [
                        "Guide new students through their first year",
                        "Conduct weekly mentoring sessions",
                        "Assist with orientation programs",
                        "Maintain regular communication with mentees",
                        "Track mentee progress and provide reports"
                    ],
                    benefits: [
                        "Professional development opportunities",
                        "Leadership experience",
                        "Networking with faculty and staff",
                        "Flexible schedule"
                    ]
                },
                // Add other mentor details here
            };

            // Update mentor details when clicked
            document.querySelectorAll('.mentor-item').forEach(item => {
                item.addEventListener('click', function() {
                    document.querySelectorAll('.mentor-item').forEach(i => {
                        i.classList.remove('active');
                    });
                    this.classList.add('active');
                    updateMentorDetails(this.dataset.mentor);
                });
            });

            function updateMentorDetails(mentorId) {
                const details = mentorDetails[mentorId];
                if (!details) return;

                const detailsHtml = \`
                    <h2 class="text-2xl font-bold text-blue-800 mb-6">\${details.title}</h2>
                    <div class="grid md:grid-cols-2 gap-6 mb-6">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-800 mb-2">Position Details</h3>
                            <p class="mb-2"><span class="font-medium">Pay Rate:</span> \${details.pay}</p>
                            <p><span class="font-medium">Schedule:</span> \${details.schedule}</p>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <h3 class="font-semibold text-blue-800 mb-2">Requirements</h3>
                            <ul class="list-disc list-inside space-y-1">
                                \${details.requirements.map(req => \`<li>\${req}</li>\`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <div>
                            <h3 class="font-semibold text-blue-800 mb-2">Key Responsibilities</h3>
                            <ul class="list-disc list-inside space-y-1">
                                \${details.responsibilities.map(resp => \`<li class="text-gray-600">\${resp}</li>\`).join('')}
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-semibold text-blue-800 mb-2">Benefits</h3>
                            <ul class="list-disc list-inside space-y-1">
                                \${details.benefits.map(benefit => \`<li class="text-gray-600">\${benefit}</li>\`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="mt-8 flex justify-end">
                        <button class="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition">
                            Apply Now
                        </button>
                    </div>
                \`;

                document.getElementById('mentorDetails').innerHTML = detailsHtml;
            }
        `;
    }

    setupJobsEventListeners() {
        const jobCards = document.querySelectorAll('.job-card');
        jobCards.forEach(card => {
            card.classList.add('transition', 'transform', 'hover:-translate-y-1', 'duration-300', 'bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden');
        });
    }

    setupMentorEventListeners() {
        const mentorItems = document.querySelectorAll('.mentor-item');
        mentorItems.forEach(item => {
            item.classList.add('transition', 'duration-200');
            item.addEventListener('click', () => {
                mentorItems.forEach(i => i.classList.remove('active', 'bg-blue-50'));
                item.classList.add('active', 'bg-blue-50');
            });
        });
    }

    async fetchPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        } catch (error) {
            console.error('Error fetching page:', error);
            throw error;
        }
    }
}

export default ContentHandler;