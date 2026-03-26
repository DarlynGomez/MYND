# BMCC Job Portal

<div align="center">

![BMCC Jobs](https://img.shields.io/badge/BMCC-Job_Portal-003d82?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-REST_API-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS_Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-File_Uploads-333333?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-In_Development-orange?style=for-the-badge)

**A campus employment platform for BMCC students to find jobs, track onboarding, and get matched to positions based on their academic profile.**

[Features](#features) • [Setup](#setup-and-installation) • [User Roles](#user-roles) • [Team](#team)

</div>


---

## Project Overview

The BMCC Job Portal allows students to:

- Browse and apply for on-campus job positions
- Upload their unofficial transcript for automatic skill and GPA extraction
- Receive personalized job recommendations based on their academic profile
- Track their HR onboarding progress and document submission status

HR Administrators can:

- Search for students by EMPLID
- Update onboarding status to initiate the document collection process
- Review uploaded documents and approve or deny them with feedback notes
- Track document counts across all students

---
## Setup and Installation

### Prerequisites

- Node.js v16 or higher
- npm

### Steps

1. Clone or download the repository:
```bash
git clone https://github.com/DarlynGomez/MYND.git
cd MYND
```

2. Install dependencies:
```bash
npm install
```

3. Verify the following packages are in `package.json`:
```json
"dependencies": {
  "cors": "^2.8.5",
  "express": "^4.18.0",
  "multer": "^1.4.5"
}
```

---

## Running the Application
```bash
npm start
```

The server will start on port 3000. Open your browser and navigate to:
```
http://localhost:3000
```

If port 3000 is already in use, run the following to free it before starting:
```bash
lsof -ti:3000 | xargs kill -9
```

---

## User Roles

### Student

Register with a BMCC student email ending in `@stu.bmcc.cuny.edu` and an 8-digit EMPLID.

Default test account (register via the form):
- Email: any valid `@stu.bmcc.cuny.edu` address
- EMPLID: any 8-digit number

### HR Administrator

A default admin account is pre-loaded on server start:
- Email: `admin@admin.bmcc.cuny.edu`
- Password: `admin123`

The admin is redirected to `hrAdmin.html` after login.

---

## Features

### Student Features

**Dashboard and Job Recommendations**

- The dashboard displays the top 3 job recommendations scored against the student's skills, GPA, and major
- Recommendations update after the student uploads their transcript
- An Onboarding Status tab shows current document progress or the onboarding not-started flow

**Profile Page**

- Students can set their major, GPA, and expected graduation date
- Uploading an unofficial transcript (PDF) automatically extracts courses, GPA, and skills
- Extracted skills are displayed as tags on the profile
- The Save Profile button persists changes to the in-memory user object

**Mentor Positions**

- Detailed view of all available mentor roles including IMPACT, First-Gen, UMLA, Peer Success, and Career Mentor
- Clicking Apply Now opens a modal where the student uploads a resume to submit their application

**Onboarding Portal**

- Students can see which documents are pending, under review, or approved
- Online documents can be uploaded directly from the portal
- If a document is denied, the student sees a View HR Feedback button explaining why
- When HR marks the student as fully onboarded, a congratulations modal appears with a confetti animation

### HR Administrator Features

**Student Search**

- Search any student by their 8-digit EMPLID
- View their name, email, onboarding status, and document counts

**Onboarding Management**

- Change a student's onboarding status between Not Started, In Progress, and Onboarded
- Changing to In Progress automatically initializes the 5 required documents for that student

**Document Review**

- Click View Document to open an uploaded file in a full modal viewer
- Approve or deny documents with an optional written note to the student
- Status changes are immediately reflected on the student's onboarding page

---

## Team

<div align="center">

| Darlyn G. | Mekhribon Y. | Nuria S. | Yangmei L. |
|:---:|:---:|:---:|:---:|
| [![Darlyn](https://img.shields.io/badge/GitHub-DarlynGomez-003d82?style=for-the-badge&logo=github&logoColor=white)](https://github.com/DarlynGomez) | [![Bonnie](https://img.shields.io/badge/GitHub-Bonnie04-003d82?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Bonnie04) | [![Nuria](https://img.shields.io/badge/GitHub-nuriacurry-003d82?style=for-the-badge&logo=github&logoColor=white)](https://github.com/nuriacurry) | [![Amy](https://img.shields.io/badge/GitHub-AmyLuSunshine-003d82?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AmyLuSunshine) |

</div>
