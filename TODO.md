# Dashboard Enhancement Plan

## Phase 1: CSS Enhancements
- [ ] Add design tokens and modern CSS variables
- [ ] Enhance panel/card styles with hover elevation and gradients
- [ ] Create premium metric card styles with trend indicators
- [ ] Add glass morphism effects and backdrop blur
- [ ] Add smooth animations and transitions
- [ ] Add custom scrollbar styling
- [ ] Add timeline/step progress enhancements
- [ ] Add notification badge animations
- [ ] Add gradient text and divider styles
- [ ] Add loading skeleton animation

## Phase 2: Component Updates (App.jsx)
- [ ] Update Metric component with trend arrows
- [ ] Update Admin Dashboard with enhanced layout
- [ ] Update Interviewer Dashboard with better panels
- [ ] Update Candidate Dashboard with richer UI
- [ ] Update PeopleManager with avatar badges
- [ ] Update InterviewTable with status icons
- [ ] Update TrendChart with better colors

## Phase 3: Build & Verify
- [ ] Build production bundle
- [ ] Verify no errors

## Phase 4: Interview Management System

### Candidate Registration & Profile
- [ ] Create candidate sign-up, login, password reset, and email/phone verification flows
- [ ] Build candidate profile with personal details, education, work experience, location, and availability
- [ ] Add resume upload with PDF/DOCX validation, secure storage, replacement, and download controls
- [ ] Extract resume details (skills, education, experience) to pre-fill the candidate profile for review
- [ ] Let candidates select primary skills, proficiency level, preferred course/track, and target role
- [ ] Add portfolio, LinkedIn, GitHub, and project-link fields
- [ ] Require candidate consent for data processing and define profile visibility settings

### Application & Request Management
- [ ] Create an interview-request form for selected course, skill, role, or certification path
- [ ] Capture requested interview type, preferred dates/time slots, language, and accessibility needs
- [ ] Validate required profile details and resume before allowing a request submission
- [ ] Generate a unique application/reference number for every request
- [ ] Allow candidates to view, edit, withdraw, or resubmit requests within defined rules
- [ ] Maintain an audit timeline of request submission, reviews, assignments, and status changes

### Admin Review Dashboard
- [ ] Build an admin dashboard showing new, under-review, scheduled, completed, rejected, and on-hold requests
- [ ] Add searchable candidate profiles with resume preview, selected skills/courses, experience, and application history
- [ ] Add filters for skill, course, role, experience level, request status, application date, and interview date
- [ ] Create review actions for approve, reject, request more information, place on hold, and mark as duplicate
- [ ] Add internal notes, tags, priority labels, and reasons for decisions
- [ ] Show interviewer availability, workload, specializations, and upcoming interviews during assignment

### Interviewer Management & Skill-Based Assignment
- [ ] Create interviewer profiles with skills, course expertise, experience level, timezone, capacity, and availability
- [ ] Match interviewers to candidates based on selected skills, course/domain, seniority, language, and conflict-free time slots
- [ ] Provide recommended interviewers with match score and allow admins to override assignments
- [ ] Prevent double-booking and enforce configurable daily/weekly interviewer capacity limits
- [ ] Support single interviewer, panel interview, backup interviewer, reassignment, and escalation workflows
- [ ] Notify interviewers of new assignments and require assignment acknowledgement

### Interview Scheduling & Conduct
- [ ] Build calendar scheduling with candidate and interviewer timezones, available slots, and buffer times
- [ ] Integrate meeting links for online interviews and location details for in-person interviews
- [ ] Send calendar invitations, confirmations, reschedule options, cancellations, and automated reminders
- [ ] Define interview templates by skill/course with duration, rounds, question bank, and scoring rubric
- [ ] Provide an interviewer workspace with candidate resume, selected skills, interview agenda, and private notes
- [ ] Track no-shows, late cancellations, rescheduled sessions, and technical issues

### Feedback, Evaluation & Status Tracking
- [ ] Create structured feedback forms with skill-wise ratings, strengths, gaps, comments, and recommendation
- [ ] Support draft feedback, submission deadlines, review/approval, and feedback locking after finalization
- [ ] Calculate configurable overall scores and pass/fail/recommendation outcomes
- [ ] Track candidate status from Submitted through Review, Assigned, Scheduled, Interviewed, Selected, Rejected, or On Hold
- [ ] Show a candidate-facing status timeline with only permitted information and next steps
- [ ] Let admins reopen an application, schedule follow-up rounds, or close the case with a documented reason

### Notifications, Security & Access Control
- [ ] Send in-app, email, and optional SMS/WhatsApp notifications for key workflow events
- [ ] Add notification preferences, templates, delivery logs, retry handling, and reminder schedules
- [ ] Implement role-based access for Super Admin, Admin, Coordinator, Interviewer, Candidate, and Read-only Viewer
- [ ] Restrict resumes, interviewer notes, feedback, and reports according to role and need-to-know permissions
- [ ] Add secure authentication, session management, activity/audit logs, and data-retention controls
- [ ] Protect uploaded documents with file scanning, access checks, and signed download links

### Reports & Operational Insights
- [ ] Build reports for application volume, status funnel, time-to-review, time-to-schedule, and completion rate
- [ ] Report interviewer workload, assignment acceptance, utilization, feedback turnaround, and skill coverage gaps
- [ ] Add course/skill-level outcomes, candidate pass rates, no-show rates, and rejection reason analysis
- [ ] Provide exportable CSV/PDF reports with date filters and role-appropriate data visibility
- [ ] Create dashboard alerts for overdue reviews, unsubmitted feedback, capacity limits, and stalled applications

### Future Enhancements
- [ ] Add AI-assisted resume parsing, candidate-to-role matching, and interviewer recommendations with human review
- [ ] Add proctoring, identity verification, coding assessments, and recorded-interview integrations
- [ ] Add multi-round interview workflows, offer/placement handoff, and onboarding integration
- [ ] Add multilingual UI, accessibility improvements, mobile app support, and offline-friendly interviewer notes
- [ ] Integrate with LMS, ATS, HRMS, video-conferencing, calendar, and messaging platforms
- [ ] Add configurable workflow automation, SLA rules, custom forms, webhooks, and public APIs

