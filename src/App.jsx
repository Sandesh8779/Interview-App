import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareText,
  Mic,
  Plus,
  Settings,
  ShieldCheck,
  Star,
  Upload,
  UserCheck,
  Users,
  Video
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { api } from './lib/api';

const emptyInterview = {
  title: '',
  description: '',
  candidate_id: '',
  interviewer_id: '',
  scheduled_at: '',
  duration_minutes: 45
};

const ADMIN_EMAIL = 'amitdyavanal342@gmail.com';

const jobPositions = [
  { title: 'Frontend Developer', department: 'Engineering', applicants: 18, status: 'Open' },
  { title: 'Backend Developer', department: 'Engineering', applicants: 12, status: 'Open' },
  { title: 'QA Analyst', department: 'Quality', applicants: 9, status: 'Screening' }
];

const mcqQuestions = [
  'Which hook is used for side effects in React?',
  'What is the purpose of database indexing?',
  'Which HTTP status code means unauthorized?'
];

const codingTasks = [
  'Check if a string is a palindrome (ignore case and non-alphanumeric).',
  'Rotate an array to the right by k steps (in-place).',
  'Find the missing number in an array of 1 to n.'
];

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [activeInterviewId, setActiveInterviewId] = useState(null);
  const [sectionHistory, setSectionHistory] = useState(['dashboard']);
  const activeSection = sectionHistory[sectionHistory.length - 1];
  const [authMode, setAuthModeState] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('page') || 'home';
  });
  const [adminBypass, setAdminBypass] = useState(() => {
    const saved = localStorage.getItem('if_admin_bypass');
    return saved ? JSON.parse(saved) : null;
  });

  function setAuthMode(mode) {
    window.history.pushState({ page: mode }, '', `?page=${mode}`);
    setAuthModeState(mode);
  }

  function navigateSection(section) {
    setSectionHistory((prev) => [...prev, section]);
  }

  function goSectionBack() {
    setSectionHistory((prev) => prev.length > 1 ? prev.slice(0, -1) : prev);
  }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const activeInterview = useMemo(
    () => interviews.find((interview) => interview.id === activeInterviewId) || interviews[0],
    [interviews, activeInterviewId]
  );

  async function loadData() {
    const me = await api('/profiles/me');
    setProfile(me);

    const list = await api('/interviews');
    setInterviews(list);
    if (!activeInterviewId && list[0]) setActiveInterviewId(list[0].id);

    if (me.role === 'admin') {
      setProfiles(await api('/profiles'));
    }
  }

  function adminBypassLogin() {
    const adminProfile = {
      id: 'admin-bypass-' + Date.now(),
      full_name: 'Admin (Bypass)',
      email: ADMIN_EMAIL,
      role: 'admin'
    };
    setProfile(adminProfile);
    setAdminBypass(adminProfile);
    localStorage.setItem('if_admin_bypass', JSON.stringify(adminProfile));
    setMessage('Logged in as Admin (bypass mode). Full Supabase login is also available.');
  }

  function adminBypassLogout() {
    setProfile(null);
    setAdminBypass(null);
    localStorage.removeItem('if_admin_bypass');
    setAuthMode('home');
  }

  useEffect(() => {
    function handlePopState() {
      const p = new URLSearchParams(window.location.search);
      const page = p.get('page');
      if (page) setAuthModeState(page);
      else setAuthModeState('home');
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        try {
          await loadData();
        } catch (error) {
          setMessage(error.message);
        }
      } else if (adminBypass) {
        setProfile(adminBypass);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession && !adminBypass) {
        setProfile(null);
        setInterviews([]);
        setProfiles([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    adminBypassLogout();
  }

  if (loading) {
    return (
      <div className="boot">
        <div className="loading-skeleton" style={{ width: 'min(820px, 100%)' }}>
          <div className="skeleton-card" />
          <div className="skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton-line" style={{ width: '70%' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <div className="skeleton-chip" />
            <div className="skeleton-chip" />
            <div className="skeleton-chip" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    // If admin bypass is active, skip login screens and show dashboard
    if (adminBypass && profile) {
      // Continue to render the dashboard below
    } else {
      if (authMode === 'home') {
        return <HomePage setMode={setAuthMode} onAdminBypass={adminBypassLogin} />;
      }
      return <AuthScreen mode={authMode} setMode={setAuthMode} setMessage={setMessage} message={message} />;
    }
  }

  const moduleTitle = profile?.role === 'admin' ? 'Admin' : profile?.role === 'interviewer' ? 'Interviewer' : 'Candidate';
  const menu = getMenu(profile?.role);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand" style={{cursor:'pointer'}} onClick={() => setAuthMode('home')}>
          <ShieldCheck />
          <span>InterviewFlow</span>
        </div>
        <div className="profile-block">
          <strong>{profile?.full_name}</strong>
          <span>{moduleTitle} module</span>
        </div>
        <nav>
          {menu.map((item) => (
            <button
              className={activeSection === item.id ? 'nav-item active' : 'nav-item'}
              key={item.id}
              onClick={() => navigateSection(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="signout-btn action-bottom" onClick={handleSignOut}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="back-circle" onClick={goSectionBack} title="Go back">
              <ArrowLeft size={18} />
            </button>
            <div>
            <p>{moduleTitle} module</p>
            <h1>{menu.find((item) => item.id === activeSection)?.label || 'Dashboard'}</h1>
            </div>
          </div>
          <button className="primary" onClick={loadData}>
            <CheckCircle2 size={18} />
            Refresh
          </button>
        </header>

        {message && <div className="notice">{message}</div>}

        {profile?.role === 'admin' && (
          <AdminModule
            section={activeSection}
            profiles={profiles}
            interviews={interviews}
            activeInterview={activeInterview}
            reload={loadData}
            setMessage={setMessage}
          />
        )}

        {profile?.role === 'interviewer' && (
          <InterviewerModule section={activeSection} activeInterview={activeInterview} interviews={interviews} reload={loadData} setMessage={setMessage} />
        )}

        {profile?.role === 'candidate' && (
          <CandidateModule section={activeSection} profile={profile} activeInterview={activeInterview} interviews={interviews} reload={loadData} setMessage={setMessage} />
        )}
      </main>
    </div>
  );
}

function HomePage({ setMode, onAdminBypass }) {
  const [showTop, setShowTop] = React.useState(false);
  const [showAdminInput, setShowAdminInput] = React.useState(false);
  const [adminEmailInput, setAdminEmailInput] = React.useState('');
  const [adminError, setAdminError] = React.useState('');
  useEffect(() => {
    function onScroll() { setShowTop(window.scrollY > 300); }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleAdminSubmit(e) {
    e.preventDefault();
    if (adminEmailInput.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      onAdminBypass();
      setShowAdminInput(false);
      setAdminEmailInput('');
      setAdminError('');
    } else {
      setAdminError('This email is not authorized for admin bypass. Use: ' + ADMIN_EMAIL);
    }
  }

  return (
    <main className="home-page">
      {showAdminInput && (
        <div className="admin-bypass-overlay" onClick={() => { setShowAdminInput(false); setAdminError(''); }}>
          <div className="admin-bypass-modal" onClick={e => e.stopPropagation()}>
            <button className="admin-bypass-close" onClick={() => { setShowAdminInput(false); setAdminError(''); }}>✕</button>
            <ShieldCheck size={32} color="#1f8f83" />
            <h3>Admin Quick Access</h3>
            <p style={{color:'#697386',fontSize:'0.9rem',margin:0}}>Enter the admin email to bypass login and access the admin dashboard directly.</p>
            <form onSubmit={handleAdminSubmit} style={{display:'grid',gap:10,marginTop:16,width:'100%'}}>
              <input type="email" placeholder="Enter admin email..." value={adminEmailInput} onChange={e => setAdminEmailInput(e.target.value)} required autoFocus />
              {adminError && <p style={{color:'#c53030',fontSize:'0.85rem',margin:0}}>{adminError}</p>}
              <button className="primary full" type="submit">Access Admin Dashboard</button>
            </form>
          </div>
        </div>
      )}
      {showTop && (
        <button className="scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Back to top" />
      )}
      <Chatbot offset={showTop} />
      <header className="home-nav">
        <div className="brand large" style={{cursor:'pointer'}} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ShieldCheck size={26} />
          <span>InterviewFlow</span>
        </div>
        <nav className="home-nav-links">
          <a href="#roles">For You</a>
          <a href="#how">How It Works</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="home-actions">
          <button className="nav-admin-bypass" onClick={() => setShowAdminInput(true)} title="Admin quick access">Admin</button>
          <button className="nav-login" onClick={() => setMode('signin')}>Login</button>
          <button className="nav-register" onClick={() => setMode('signup')}>
            <span className="nav-register-text">Get Started</span>
            <span className="nav-register-shine" />
          </button>
        </div>
      </header>

      <section className="home-hero">
        <div>
          <h1>Hire faster with structured interviews, evaluations, and candidate tracking.</h1>
          <span>
            A complete web application for admins, interviewers, and candidates with dashboards, schedules,
            tests, scorecards, reports, and notifications.
          </span>
          <div className="hero-actions">
            <button className="primary" onClick={() => setMode('signup')}><GraduationCap size={18} /> Get started</button>
            <button className="secondary" onClick={() => setMode('signin')}>Login</button>
          </div>
        </div>
      </section>

      <section className="roles-section" id="roles">
        <div className="roles-header">
          <p>Who is it for?</p>
          <h2>Two roles. One seamless experience.</h2>
          <span>InterviewFlow is purpose-built for interviewers who evaluate and candidates who grow.</span>
        </div>
        <div className="roles-grid">
          <div className="role-card interviewer-card">
            <div className="role-icon-wrap"><UserCheck size={28} /></div>
            <div className="role-tag">For Interviewers</div>
            <h3>Evaluate with confidence</h3>
            <p>Everything you need to run structured, fair, and efficient interviews — all in one place.</p>
            <ul className="role-features">
              <li><CheckCircle2 size={15} /> View all assigned interviews at a glance</li>
              <li><CheckCircle2 size={15} /> Access candidate profiles and uploaded resumes</li>
              <li><CheckCircle2 size={15} /> Conduct technical and HR rounds with custom questions</li>
              <li><CheckCircle2 size={15} /> Review MCQ and coding test submissions</li>
              <li><CheckCircle2 size={15} /> Submit scorecards with ratings and recommendations</li>
              <li><CheckCircle2 size={15} /> Track evaluation history across all rounds</li>
            </ul>
          </div>
          <div className="role-card candidate-card">
            <div className="role-icon-wrap"><GraduationCap size={28} /></div>
            <div className="role-tag">For Candidates</div>
            <h3>Own your interview journey</h3>
            <p>From application to result — stay informed, prepared, and in control every step of the way.</p>
            <ul className="role-features">
              <li><CheckCircle2 size={15} /> Build your profile and upload your resume</li>
              <li><CheckCircle2 size={15} /> Browse and apply for open job positions</li>
              <li><CheckCircle2 size={15} /> View your interview schedule and assigned interviewer</li>
              <li><CheckCircle2 size={15} /> Take MCQ tests and coding challenges online</li>
              <li><CheckCircle2 size={15} /> Practice with an AI-powered HR interview round</li>
              <li><CheckCircle2 size={15} /> Track your scores and final result in real time</li>
            </ul>
          </div>
        </div>
      </section>

      <HowItWorks id="how" />

      <section className="about-section" id="about">
        <div>
          <p>About us</p>
          <h2>Built for organized campus and company hiring.</h2>
        </div>
        <div>
          <p>
            InterviewFlow helps hiring teams move from manual spreadsheets and scattered messages to a clear,
            role-based process. Admins can plan hiring rounds, interviewers can evaluate consistently, and
            candidates can follow every step from application to result.
          </p>
          <p>
            The platform is connected with Supabase for authentication and database storage, making it suitable
            for a full-stack college project and easy to extend with resume storage, email delivery, reports, and AI interviews.
          </p>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div>
          <h2>Contact Details</h2>
          <p>For support, setup, or interview workflow questions, contact the hiring team.</p>
        </div>
        <div className="contact-grid">
          <div><strong>Email</strong><span>sandeshvd07@gmail.com</span></div>
          <div><strong>Phone</strong><span>+91 86183 78779</span></div>
          <div><strong>Address</strong><span>Near Reva Circle, Beside Saralaya Hospital, Bagalur Main Road, Kattigenahalli, Sathanur, Bengaluru - 560063</span></div>
        </div>
      </section>
    </main>
  );
}

const HOW_STEPS = [
  { emoji: '📝', step: '01', title: 'Register & Choose Role', desc: 'Sign up and pick your role — Admin, Interviewer, or Candidate. Each role unlocks a dedicated dashboard built for your workflow.' },
  { emoji: '🏢', step: '02', title: 'Admin Sets Up Hiring', desc: 'Admin creates job positions, onboards interviewers and candidates, then schedules interviews by pairing the right people to each round.' },
  { emoji: '📅', step: '03', title: 'Interview Gets Scheduled', desc: 'Candidates instantly see their schedule — assigned interviewer, date, time, and round details — all from their personal dashboard.' },
  { emoji: '💻', step: '04', title: 'Candidate Takes Tests', desc: 'Candidates complete MCQ tests, coding challenges, and an AI-powered HR interview round — all inside the platform before the interview.' },
  { emoji: '🔍', step: '05', title: 'Interviewer Evaluates', desc: 'Interviewers review resumes, conduct technical and HR rounds, add questions, score answers, and submit a structured scorecard.' },
  { emoji: '🏆', step: '06', title: 'Result & Report', desc: 'Admin views final scores, downloads reports, and sends result notifications. Candidates track their outcome in real time.' },
];

function HowStep({ emoji, step, title, desc, index }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect(); } },
      { threshold: 0.18 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="how-step" ref={ref} style={{ '--delay': `${index * 120}ms` }}>
      <div className="how-connector" />
      <div className="how-card">
        <div className="how-emoji">{emoji}</div>
        <div className="how-badge">{step}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function HowItWorks({ id }) {
  return (
    <section className="how-section" id={id}>
      <div className="how-header">
        <p>Simple &amp; structured</p>
        <h2>How InterviewFlow works</h2>
        <span>From registration to result — every step is clear, tracked, and role-based.</span>
      </div>
      <div className="how-steps">
        {HOW_STEPS.map(({ emoji, step, title, desc }, i) => (
          <HowStep key={step} emoji={emoji} step={step} title={title} desc={desc} index={i} />
        ))}
      </div>
    </section>
  );
}

function getMenu(role) {
  if (role === 'admin') {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'requests', label: 'Interviewer Requests', icon: Bell },
      { id: 'interviewers', label: 'Manage Interviewers', icon: UserCheck },
      { id: 'candidates', label: 'Manage Candidates', icon: Users },
      { id: 'jobs', label: 'Create Job Positions', icon: BriefcaseBusiness },
      { id: 'schedule', label: 'Schedule Interviews', icon: CalendarClock },
      { id: 'questions', label: 'Manage Questions', icon: ClipboardList },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'notifications', label: 'Email Notifications', icon: Mail },
      { id: 'settings', label: 'Settings', icon: Settings }
    ];
  }

  if (role === 'interviewer') {
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'requests', label: 'Candidate Requests', icon: Bell },
      { id: 'assigned', label: 'Assigned Interviews', icon: CalendarClock },
      { id: 'candidate', label: 'Candidate Details', icon: Users },
      { id: 'resume', label: 'Resume Viewer', icon: FileText },
      { id: 'technical', label: 'Technical Round', icon: Code2 },
      { id: 'hr', label: 'HR Round', icon: MessageSquareText },
      { id: 'evaluation', label: 'Evaluation', icon: ClipboardCheck },
      { id: 'scorecard', label: 'Scorecard', icon: Star },
      { id: 'result', label: 'Submit Result', icon: CheckCircle2 }
    ];
  }

  return [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'resume', label: 'Upload Resume', icon: Upload },
    { id: 'jobs', label: 'Apply Job', icon: BriefcaseBusiness },
    { id: 'request', label: 'Request Interviewer', icon: Bell },
    { id: 'schedule', label: 'Interview Schedule', icon: CalendarClock },
    { id: 'practice', label: 'Video Practice', icon: Video },
    { id: 'mock', label: 'Mock Interview', icon: Mic },
    { id: 'mcq', label: 'Take MCQ Test', icon: ClipboardCheck },
    { id: 'coding', label: 'Coding Test', icon: Code2 },
    { id: 'progress', label: 'My Progress', icon: BarChart3 },
    { id: 'result', label: 'Interview Result', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];
}

function AuthScreen({ mode, setMode, message, setMessage }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'candidate' });
  const isSignUp = mode === 'signup';

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    const result = isSignUp
      ? await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.fullName, role: form.role } }
        })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.password });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(isSignUp ? 'Account created. Check email confirmation if it is enabled in Supabase.' : 'Signed in.');
    window.location.reload();
  }

  return (
    <main className="auth-page">
      <div className="auth-left">
        <div className="auth-left-brand">
          <ShieldCheck size={26} />
          <span>InterviewFlow</span>
        </div>
        <h2>{isSignUp ? 'Start your interview journey today.' : 'Welcome back to InterviewFlow.'}</h2>
        <p>{isSignUp ? 'Create your account and join as a candidate or interviewer. Everything you need is in one place.' : 'Sign in to access your dashboard, interviews, tests, and results.'}</p>
        <ul className="auth-left-features">
          <li><span>✓</span> Role-based dashboards for every user</li>
          <li><span>✓</span> Schedule and track interviews end-to-end</li>
          <li><span>✓</span> MCQ, coding tests and AI HR rounds</li>
          <li><span>✓</span> Scorecards, reports and real-time results</li>
        </ul>
      </div>
      <div className="auth-right">
        <Chatbot />
        <button className="back-to-home" onClick={() => window.history.back()}>
          <ArrowLeft size={16} /> Back to Home
        </button>
        <section className="auth-panel">
          <div className="brand large" style={{cursor:'pointer'}} onClick={() => setMode('home')}>
            <ShieldCheck />
            <span>InterviewFlow</span>
          </div>
          <h1>{isSignUp ? 'Create your account' : 'Sign in to continue'}</h1>
          <form onSubmit={submit}>
            {isSignUp && (
              <label>
                Full name
                <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            </label>
            {isSignUp && (
              <label>
                Module
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  <option value="candidate">Candidate</option>
                  <option value="interviewer">Interviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            )}
            <button className="primary full" type="submit">{isSignUp ? 'Create account' : 'Sign in'}</button>
          </form>
          {message && <div className="notice">{message}</div>}
          <button className="link-button" onClick={() => setMode(isSignUp ? 'signin' : 'signup')}>
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Register'}
          </button>
        </section>
      </div>
    </main>
  );
}

const BOT_QA = [
  { q: /hello|hi|hey/i, a: 'Hi there! 👋 How can I help you with InterviewFlow?' },
  { q: /register|sign.?up|create account/i, a: 'Click "Register" on the top right to create an account. Choose your role: Admin, Interviewer, or Candidate.' },
  { q: /login|sign.?in/i, a: 'Click "Login" on the top right to sign in with your email and password.' },
  { q: /admin/i, a: 'Admins can manage users, schedule interviews, create job positions, manage questions, view reports, and send notifications.' },
  { q: /interviewer/i, a: 'Interviewers can view assigned interviews, add questions, evaluate candidates, and submit scorecards.' },
  { q: /candidate/i, a: 'Candidates can apply for jobs, view their schedule, take MCQ and coding tests, and check their results.' },
  { q: /interview|schedule/i, a: 'Admins schedule interviews by pairing a candidate with an interviewer. Candidates see their schedule on their dashboard.' },
  { q: /test|mcq|coding/i, a: 'Candidates can take MCQ tests and coding challenges from their dashboard before the interview.' },
  { q: /result|score|rating/i, a: 'After the interview, the interviewer submits a scorecard. Candidates can view their result from the dashboard.' },
  { q: /password|forgot/i, a: 'Password reset is handled by Supabase. Use the email you registered with to recover access.' },
  { q: /role/i, a: 'Roles are Admin, Interviewer, and Candidate. Admins can change roles from the People panel.' },
  { q: /contact|support|help/i, a: 'You can reach support at support@interviewflow.com or call +91 86183 78779.' },
];

function Chatbot({ offset = false }) {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState([{ from: 'bot', text: 'Hi! I\'m the InterviewFlow assistant. Ask me anything about the platform.' }]);
  const [input, setInput] = React.useState('');
  const [hasUnread, setHasUnread] = React.useState(false);
  const bottomRef = React.useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, open]);

  function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const match = BOT_QA.find(({ q }) => q.test(text));
    const reply = match ? match.a : "I'm not sure about that. Try asking about registration, roles, interviews, tests, or results!";
    setMsgs((prev) => [...prev, { from: 'user', text }, { from: 'bot', text: reply }]);
    setInput('');
    if (!open) setHasUnread(true);
  }

  function openChat() {
    setOpen((o) => !o);
    setHasUnread(false);
  }

  return (
    <div className={`chatbot-wrap${offset ? ' chatbot-offset' : ''}`}>
      {open && (
        <div className="chatbot-box">
          <div className="chatbot-head">
            <span>💬 InterviewFlow Assistant</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chatbot-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`chatbot-msg ${m.from}`}>{m.text}</div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form className="chatbot-input" onSubmit={send}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." />
            <button className="primary" type="submit">Send</button>
          </form>
        </div>
      )}
      <button className="chatbot-btn" onClick={openChat} title="Chat with us">
        {open ? '✕' : '💬'}
        {!open && hasUnread && <span className="chatbot-dot" />}
      </button>
    </div>
  );
}

function AdminModule({ section, profiles, interviews, activeInterview, reload, setMessage }) {
  const [form, setForm] = useState(emptyInterview);
  const candidates = profiles.filter((p) => p.role === 'candidate');
  const interviewers = profiles.filter((p) => p.role === 'interviewer');
  const todayCount = interviews.filter((i) => isToday(i.scheduled_at)).length;
  const selected = interviews.filter((i) => i.status === 'reviewed' && Number(i.rating) >= 7).length;
  const rejected = interviews.filter((i) => i.status === 'reviewed' && Number(i.rating) < 7).length;
  const passRate = (selected + rejected) > 0 ? Math.round(selected / (selected + rejected) * 100) : 0;

  async function createInterview(event) {
    event.preventDefault();
    await api('/interviews', { method: 'POST', body: JSON.stringify({ ...form, scheduled_at: new Date(form.scheduled_at).toISOString() }) });
    setForm(emptyInterview);
    setMessage('Interview scheduled.');
    await reload();
  }

  async function changeRole(id, role) {
    await api(`/profiles/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
    await reload();
  }

  if (section === 'dashboard') {
    const recentIvs = interviews.slice(0, 5);
    const statusCounts = { scheduled: 0, in_progress: 0, submitted: 0, reviewed: 0, cancelled: 0 };
    interviews.forEach(i => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });
    return (
      <div className="adm-dashboard">
        {/* Hero strip */}
        <div className="adm-hero">
          <div className="adm-hero-left">
            <div className="adm-hero-icon"><ShieldCheck size={28} /></div>
            <div>
              <h2>Admin Control Center</h2>
              <p><strong>{interviews.length}</strong> total interviews &nbsp;·&nbsp; <strong>{todayCount}</strong> today &nbsp;·&nbsp; <strong>{passRate}%</strong> pass rate</p>
            </div>
          </div>
          <div className="adm-hero-chips">
            {[{l:'Candidates',v:candidates.length},{l:'Interviewers',v:interviewers.length},{l:'Selected',v:selected},{l:'Rejected',v:rejected}].map(c=>(
              <div className="adm-chip" key={c.l}><span>{c.v}</span><label>{c.l}</label></div>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="adm-kpi-row">
          {[
            {icon:Users,       label:'Candidates',   value:candidates.length,  cls:'adm-k-green'},
            {icon:UserCheck,   label:'Interviewers', value:interviewers.length, cls:'adm-k-blue'},
            {icon:CalendarClock,label:"Today's",     value:todayCount,          cls:'adm-k-amber'},
            {icon:CheckCircle2,label:'Selected',     value:selected,            cls:'adm-k-teal'},
            {icon:ClipboardCheck,label:'Rejected',   value:rejected,            cls:'adm-k-red'},
          ].map(({icon:Icon,label,value,cls})=>(
            <div className={`adm-kpi ${cls}`} key={label}>
              <div className="adm-kpi-icon"><Icon size={20}/></div>
              <div className="adm-kpi-body"><span>{label}</span><strong>{value}</strong></div>
            </div>
          ))}
        </div>

        <div className="adm-main-grid">
          {/* Hiring trend chart */}
          <section className="panel">
            <div className="adm-panel-hd"><h2><BarChart3 size={18}/> Hiring Trend</h2><span className="adm-badge">6 months</span></div>
            <TrendChart values={[8,12,10,18,16,Math.max(interviews.length,6)]} labels={['Jan','Feb','Mar','Apr','May','Now']} />
          </section>

          {/* Status breakdown */}
          <section className="panel">
            <div className="adm-panel-hd"><h2><BarChart3 size={18}/> Status Breakdown</h2></div>
            <div className="adm-status-grid">
              {Object.entries(statusCounts).map(([k,v])=>(
                <div className={`adm-status-card adm-s-${k}`} key={k}>
                  <strong>{v}</strong><span>{k.replace('_',' ')}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Recent interviews */}
        <section className="panel">
          <div className="adm-panel-hd"><h2><CalendarClock size={18}/> Recent Interviews</h2><span className="adm-badge">{interviews.length} total</span></div>
          <div className="adm-iv-list">
            {recentIvs.length === 0 ? <p className="muted">No interviews yet.</p> : recentIvs.map(iv=>(
              <div className="adm-iv-row" key={iv.id}>
                <div className="adm-iv-avatar">{(iv.candidate?.full_name||'C')[0].toUpperCase()}</div>
                <div className="adm-iv-info">
                  <strong>{iv.title}</strong>
                  <span>{iv.candidate?.full_name||'Candidate'} · {iv.interviewer?.full_name||'Interviewer'} · {new Date(iv.scheduled_at).toLocaleDateString()}</span>
                </div>
                <span className={`pill ${iv.status}`}>{iv.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (section === 'interviewers' || section === 'candidates') {
    const role = section === 'interviewers' ? 'interviewer' : 'candidate';
    const people = profiles.filter((p) => p.role === role);
    return (
      <section className="panel">
        <div className="adm-panel-hd" style={{marginBottom:18}}>
          <h2><Users size={20}/> {section === 'interviewers' ? 'Manage Interviewers' : 'Manage Candidates'}</h2>
          <span className="adm-badge">{people.length} {role}s</span>
        </div>
        <div className="adm-people-list">
          {(people.length ? people : profiles).map((person)=>(
            <div className="adm-person-row" key={person.id}>
              <div className="adm-person-avatar">{(person.full_name||'U')[0].toUpperCase()}</div>
              <div className="adm-person-info">
                <strong>{person.full_name}</strong>
                <span>{person.email}</span>
              </div>
              <select value={person.role} onChange={(e)=>changeRole(person.id,e.target.value)} className="adm-role-select">
                <option value="admin">Admin</option>
                <option value="interviewer">Interviewer</option>
                <option value="candidate">Candidate</option>
              </select>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section === 'jobs') return <JobsPanel />;

  if (section === 'schedule') {
    return (
      <div className="grid two">
        <section className="panel">
          <div className="adm-panel-hd" style={{marginBottom:18}}><h2><Plus size={20}/> Schedule Interview</h2></div>
          <form className="stack" onSubmit={createInterview}>
            <input placeholder="Interview title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required />
            <textarea placeholder="Job, round, meeting link, or instructions" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
            <select value={form.candidate_id} onChange={(e)=>setForm({...form,candidate_id:e.target.value})} required>
              <option value="">Select candidate</option>
              {candidates.map((p)=><option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <select value={form.interviewer_id} onChange={(e)=>setForm({...form,interviewer_id:e.target.value})} required>
              <option value="">Assign interviewer</option>
              {interviewers.map((p)=><option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <input type="datetime-local" value={form.scheduled_at} onChange={(e)=>setForm({...form,scheduled_at:e.target.value})} required />
            <input type="number" min="15" step="15" value={form.duration_minutes} onChange={(e)=>setForm({...form,duration_minutes:Number(e.target.value)})} />
            <button className="primary" type="submit"><Plus size={18}/> Create schedule</button>
          </form>
        </section>
        <section className="panel">
          <div className="adm-panel-hd" style={{marginBottom:18}}><h2><CalendarClock size={18}/> All Interviews</h2><span className="adm-badge">{interviews.length}</span></div>
          <div className="adm-iv-list">
            {interviews.map(iv=>(
              <div className="adm-iv-row" key={iv.id}>
                <div className="adm-iv-avatar">{(iv.candidate?.full_name||'C')[0].toUpperCase()}</div>
                <div className="adm-iv-info">
                  <strong>{iv.title}</strong>
                  <span>{iv.candidate?.full_name||'Candidate'} · {new Date(iv.scheduled_at).toLocaleString()}</span>
                </div>
                <span className={`pill ${iv.status}`}>{iv.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (section === 'questions') return <QuestionBank />;
  if (section === 'reports') return <ReportsPanel interviews={interviews} candidates={candidates} interviewers={interviewers} />;
  if (section === 'notifications') return <NotificationPanel />;
  if (section === 'requests') return <AdminRequestsPanel interviewers={interviewers} setMessage={setMessage} />;
  return <SettingsPanel />;
}

function InterviewerModule({ section, activeInterview, interviews, reload, setMessage }) {
  const [question, setQuestion] = useState('');
  const [review, setReview] = useState({ rating: 8, feedback: '', recommendation: 'Select' });
  const pending = interviews.filter((item) => item.status === 'scheduled' || item.status === 'submitted').length;
  const completed = interviews.filter((item) => item.status === 'reviewed').length;
  const average = averageScore(interviews);
  const passRate = completed ? Math.round(interviews.filter(i => i.status === 'reviewed' && Number(i.rating) >= 7).length / completed * 100) : 0;

  async function addQuestion(event) {
    event.preventDefault();
    await api(`/interviews/${activeInterview.id}/questions`, {
      method: 'POST',
      body: JSON.stringify({ prompt: question, position: (activeInterview.questions?.length || 0) + 1 })
    });
    setQuestion('');
    setMessage('Question added to the interview.');
    await reload();
  }

  async function submitReview(event) {
    event.preventDefault();
    await api(`/interviews/${activeInterview.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ rating: review.rating, feedback: `${review.feedback}\nRecommendation: ${review.recommendation}` })
    });
    setMessage('Result submitted.');
    await reload();
  }

  if (section === 'dashboard') {
    const upcomingToday = interviews.filter(i => isToday(i.scheduled_at) && i.status === 'scheduled');
    const recentActivity = [
      ...interviews.filter(i => i.status === 'reviewed').slice(0, 2).map(i => ({ type: 'reviewed', label: `Reviewed: ${i.title}`, sub: i.candidate?.full_name || 'Candidate', color: 'success' })),
      ...interviews.filter(i => i.status === 'scheduled').slice(0, 2).map(i => ({ type: 'scheduled', label: `Upcoming: ${i.title}`, sub: new Date(i.scheduled_at).toLocaleDateString(), color: 'info' })),
    ].slice(0, 4);

    return (
      <div className="iv-dashboard">
        {/* Hero welcome strip */}
        <div className="iv-hero-strip">
          <div className="iv-hero-left">
            <div className="iv-hero-avatar"><UserCheck size={28} /></div>
            <div>
              <h2>Welcome back, Interviewer 👋</h2>
              <p>You have <strong>{pending}</strong> pending interview{pending !== 1 ? 's' : ''} to evaluate today.</p>
            </div>
          </div>
          <div className="iv-hero-stats">
            <div className="iv-hero-stat"><span>{interviews.length}</span><label>Total</label></div>
            <div className="iv-hero-stat"><span>{pending}</span><label>Pending</label></div>
            <div className="iv-hero-stat"><span>{completed}</span><label>Done</label></div>
            <div className="iv-hero-stat"><span>{passRate}%</span><label>Pass Rate</label></div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="iv-kpi-row">
          <div className="iv-kpi-card iv-kpi-teal">
            <div className="iv-kpi-icon"><CalendarClock size={22} /></div>
            <div className="iv-kpi-body">
              <span>Pending</span>
              <strong>{pending}</strong>
            </div>
            <div className="iv-kpi-trend up">↑ Active</div>
          </div>
          <div className="iv-kpi-card iv-kpi-green">
            <div className="iv-kpi-icon"><CheckCircle2 size={22} /></div>
            <div className="iv-kpi-body">
              <span>Completed</span>
              <strong>{completed}</strong>
            </div>
            <div className="iv-kpi-trend up">✓ Done</div>
          </div>
          <div className="iv-kpi-card iv-kpi-gold">
            <div className="iv-kpi-icon"><Star size={22} /></div>
            <div className="iv-kpi-body">
              <span>Avg Score</span>
              <strong>{average ? `${average}/10` : '—'}</strong>
            </div>
            <div className="iv-kpi-trend">{passRate}% pass</div>
          </div>
          <div className="iv-kpi-card iv-kpi-navy">
            <div className="iv-kpi-icon"><BarChart3 size={22} /></div>
            <div className="iv-kpi-body">
              <span>Today</span>
              <strong>{upcomingToday.length}</strong>
            </div>
            <div className="iv-kpi-trend">Scheduled</div>
          </div>
        </div>

        <div className="iv-main-grid">
          {/* Evaluation chart */}
          <section className="panel iv-chart-panel">
            <div className="iv-panel-header">
              <h2><BarChart3 size={18} /> Evaluation Overview</h2>
              <span className="iv-panel-badge">This cycle</span>
            </div>
            <TrendChart
              values={[pending, completed, average || 0, passRate / 10]}
              labels={['Pending', 'Completed', 'Avg Score', 'Pass/10']}
            />
          </section>

          {/* Today's schedule */}
          <section className="panel iv-today-panel">
            <div className="iv-panel-header">
              <h2><CalendarClock size={18} /> Today's Schedule</h2>
              <span className="iv-panel-badge">{upcomingToday.length} interview{upcomingToday.length !== 1 ? 's' : ''}</span>
            </div>
            {upcomingToday.length === 0 ? (
              <div className="iv-empty-today">
                <CheckCircle2 size={32} color="#49b7a8" />
                <p>No interviews scheduled for today.</p>
              </div>
            ) : (
              <div className="iv-today-list">
                {upcomingToday.map(iv => (
                  <div className="iv-today-item" key={iv.id}>
                    <div className="iv-today-time">{new Date(iv.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="iv-today-info">
                      <strong>{iv.title}</strong>
                      <span>{iv.candidate?.full_name || 'Candidate'}</span>
                    </div>
                    <span className={`pill ${iv.status}`}>{iv.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Recent activity + interview list */}
        <div className="iv-main-grid">
          <section className="panel">
            <div className="iv-panel-header">
              <h2><ClipboardCheck size={18} /> Recent Activity</h2>
            </div>
            {recentActivity.length === 0 ? (
              <p className="muted">No recent activity yet.</p>
            ) : (
              <div className="iv-activity-list">
                {recentActivity.map((act, i) => (
                  <div className="iv-activity-item" key={i}>
                    <div className={`iv-activity-dot ${act.color}`} />
                    <div>
                      <strong>{act.label}</strong>
                      <span>{act.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="iv-panel-header">
              <h2><Users size={18} /> All Interviews</h2>
              <span className="iv-panel-badge">{interviews.length} total</span>
            </div>
            {interviews.length === 0 ? <p className="muted">No interviews assigned yet.</p> : (
              <div className="iv-interview-list">
                {interviews.slice(0, 5).map(iv => (
                  <div className="iv-interview-row" key={iv.id}>
                    <div className="iv-interview-avatar">{(iv.candidate?.full_name || 'C')[0].toUpperCase()}</div>
                    <div className="iv-interview-info">
                      <strong>{iv.title}</strong>
                      <span>{iv.candidate?.full_name || 'Candidate'} · {new Date(iv.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`pill ${iv.status}`}>{iv.status}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (!activeInterview) return <EmptyState />;

  if (section === 'requests') return <InterviewerRequestsPanel />;
  if (section === 'assigned') {
    return (
      <section className="panel">
        <div className="iv-panel-header" style={{marginBottom:18}}>
          <h2><CalendarClock size={20} /> Assigned Interviews</h2>
          <span className="iv-panel-badge">{interviews.length} total</span>
        </div>
        {interviews.length === 0 ? <p className="muted">No interviews assigned yet.</p> : (
          <div className="iv-interview-list">
            {interviews.map(iv => (
              <div className="iv-interview-row" key={iv.id}>
                <div className="iv-interview-avatar">{(iv.candidate?.full_name || 'C')[0].toUpperCase()}</div>
                <div className="iv-interview-info">
                  <strong>{iv.title}</strong>
                  <span>{iv.candidate?.full_name || 'Candidate'} · {new Date(iv.scheduled_at).toLocaleString()}</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                  <span className={`pill ${iv.status}`}>{iv.status}</span>
                  <span style={{fontSize:'0.78rem',color:'#9aa2b2'}}>{iv.duration_minutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (section === 'candidate') {
    return <CandidateDetailView activeInterview={activeInterview} />;
  }

  if (section === 'resume') return <ResumeViewer />;

  if (section === 'technical' || section === 'hr') {
    const istech = section === 'technical';
    return (
      <div className="grid two">
        <section className="panel">
          <div className="iv-round-header">
            <div className={`iv-round-badge ${istech ? 'tech' : 'hr'}`}>
              {istech ? <Code2 size={18} /> : <MessageSquareText size={18} />}
            </div>
            <div>
              <h2 style={{margin:0}}>{istech ? 'Technical Round' : 'HR Round'}</h2>
              <p style={{margin:0,color:'#697386',fontSize:'0.88rem'}}>{activeInterview.questions?.length || 0} questions added</p>
            </div>
          </div>
          <form className="inline-form" onSubmit={addQuestion} style={{marginTop:16}}>
            <input placeholder={istech ? 'Add a technical question...' : 'Add an HR question...'} value={question} onChange={(event) => setQuestion(event.target.value)} required />
            <button className="primary" type="submit"><Plus size={18} /> Add</button>
          </form>
          <QuestionList questions={activeInterview.questions} />
        </section>
        <InterviewDetails interview={activeInterview} />
      </div>
    );
  }

  if (section === 'evaluation') {
    return (
      <div className="grid two">
        <EvaluationPanel title="MCQ Evaluation" items={mcqQuestions} />
        <EvaluationPanel title="Coding Test Evaluation" items={codingTasks} />
      </div>
    );
  }

  if (section === 'scorecard' || section === 'result') {
    const recMap = { 'Strong Hire': 'iv-rec-strong', 'Hire': 'iv-rec-hire', 'Hold': 'iv-rec-hold', 'Reject': 'iv-rec-reject', 'Select': '' };
    return (
      <div className="grid two">
        <section className="panel">
          <div className="iv-panel-header" style={{marginBottom:18}}>
            <h2><Star size={20} /> Scorecard &amp; Recommendation</h2>
          </div>
          <AnswerList submissions={activeInterview.submissions} questions={activeInterview.questions} />
          <form className="stack" onSubmit={submitReview} style={{marginTop:16}}>
            <div className="iv-score-input-row">
              <label style={{flex:1}}>
                Score (1–10)
                <div className="iv-score-slider-wrap">
                  <input type="range" min="1" max="10" value={review.rating} onChange={e => setReview({...review, rating: e.target.value})} className="iv-score-slider" />
                  <span className="iv-score-badge">{review.rating}/10</span>
                </div>
              </label>
            </div>
            <label>
              Recommendation
              <div className="iv-rec-pills">
                {['Strong Hire','Hire','Hold','Reject'].map(r => (
                  <button key={r} type="button"
                    className={`iv-rec-pill ${recMap[r]}${review.recommendation === r ? ' selected' : ''}`}
                    onClick={() => setReview({...review, recommendation: r})}>
                    {r}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Comments
              <textarea placeholder="Write your evaluation notes..." value={review.feedback} onChange={(event) => setReview({ ...review, feedback: event.target.value })} />
            </label>
            <button className="primary" type="submit"><CheckCircle2 size={18} /> Submit Result</button>
          </form>
        </section>
        <InterviewDetails interview={activeInterview} />
      </div>
    );
  }

  return <InterviewDetails interview={activeInterview} />;
}

function CandidateModule({ section, profile, activeInterview, interviews, reload, setMessage }) {
  useEffect(() => {
    if (!activeInterview?.id) return;
    const channel = supabase
      .channel('interview-rt-' + activeInterview.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'interviews', filter: `id=eq.${activeInterview.id}` }, () => reload())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeInterview?.id]);

  if (section === 'dashboard') return <CandidateDashboard profile={profile} interviews={interviews} activeInterview={activeInterview} />;
  if (section === 'profile') return <ProfilePanel profile={profile} setMessage={setMessage} reload={reload} />;
  if (section === 'resume') return <UploadPanel profile={profile} setMessage={setMessage} />;
  if (section === 'jobs') return <ApplyJobsPanel setMessage={setMessage} />;
  if (section === 'request') return <RequestInterviewerPanel profile={profile} setMessage={setMessage} />;
  if (section === 'schedule') return <CandidateSchedule interviews={interviews} />;
  if (section === 'mcq') return <MCQTest profile={profile} setMessage={setMessage} activeInterview={activeInterview} />;
  if (section === 'coding') return <CodingTest profile={profile} setMessage={setMessage} activeInterview={activeInterview} />;

  if (section === 'practice') return <VideoPracticePanel />;
  if (section === 'mock') return <MockInterviewPanel profile={profile} setMessage={setMessage} />;


  if (section === 'progress') return <ProgressTrackingPanel profile={profile} interviews={interviews} />;
  if (section === 'result') return <CandidateResult interview={activeInterview} />;
  if (section === 'notifications') return <NotificationList interviews={interviews} />;
  return <CandidateDashboard profile={profile} interviews={interviews} activeInterview={activeInterview} />;
}

function CandidateDashboard({ profile, interviews, activeInterview }) {
  const [countdown, setCountdown] = useState('');
  const upcoming = interviews.find(i => i.status === 'scheduled' || i.status === 'in_progress');

  useEffect(() => {
    if (!upcoming) return;
    function tick() {
      const diff = new Date(upcoming.scheduled_at) - new Date();
      if (diff <= 0) { setCountdown('Starting now!'); return; }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [upcoming]);

  const reviewed = interviews.filter(i => i.status === 'reviewed');
  const avgScore = reviewed.length ? Math.round(reviewed.reduce((s, i) => s + Number(i.rating || 0), 0) / reviewed.length * 10) / 10 : 0;
  const appSteps = [
    { key: 'applied',   label: 'Applied',   done: true },
    { key: 'screened',  label: 'Screened',  done: true },
    { key: 'test',      label: 'Test',      done: interviews.some(i => i.status === 'submitted' || i.status === 'reviewed') },
    { key: 'interview', label: 'Interview', done: interviews.some(i => i.status === 'reviewed') },
    { key: 'result',    label: 'Result',    done: reviewed.length > 0 },
  ];
  const progressDone = appSteps.filter(s => s.done).length;

  const activities = [
    { icon: 'success', text: 'Profile created successfully', time: '2 weeks ago' },
    { icon: 'info',    text: 'Applied for Frontend Developer', time: '5 days ago' },
    { icon: 'success', text: 'Resume uploaded', time: '4 days ago' },
    ...(upcoming ? [{ icon: 'warning', text: `Interview scheduled: ${upcoming.title}`, time: 'Today' }] : []),
    ...(reviewed.length > 0 ? [{ icon: 'success', text: `Interview completed — Score: ${avgScore}/10`, time: 'Recently' }] : []),
  ];

  return (
    <div className="cd-dash">
      {/* Hero */}
      <div className="cd-hero">
        <div className="cd-hero-left">
          <div className="cd-hero-avatar">{profile?.full_name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <h2>Welcome, {profile?.full_name?.split(' ')[0] || 'Candidate'} 👋</h2>
            <p>{upcoming ? `Next interview: ${upcoming.title}` : 'No upcoming interviews scheduled.'}</p>
          </div>
        </div>
        <div className="cd-hero-chips">
          {[{l:'Applied',v:jobPositions.length},{l:'Interviews',v:interviews.length},{l:'Avg Score',v:avgScore?`${avgScore}/10`:'—'},{l:'Status',v:reviewed.length>0?'Reviewed':'Active'}].map(c=>(
            <div className="cd-hero-chip" key={c.l}><span>{c.v}</span><label>{c.l}</label></div>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="cd-kpi-row">
        <div className="cd-kpi cd-kpi-teal"><div className="cd-kpi-icon"><BriefcaseBusiness size={20}/></div><div className="cd-kpi-body"><span>Applied Jobs</span><strong>{jobPositions.length}</strong></div></div>
        <div className="cd-kpi cd-kpi-blue"><div className="cd-kpi-icon"><CalendarClock size={20}/></div><div className="cd-kpi-body"><span>Interviews</span><strong>{interviews.length}</strong></div></div>
        <div className="cd-kpi cd-kpi-gold"><div className="cd-kpi-icon"><Star size={20}/></div><div className="cd-kpi-body"><span>Avg Score</span><strong>{avgScore ? `${avgScore}/10` : '—'}</strong></div></div>
        <div className="cd-kpi cd-kpi-green"><div className="cd-kpi-icon"><CheckCircle2 size={20}/></div><div className="cd-kpi-body"><span>Completed</span><strong>{reviewed.length}</strong></div></div>
      </div>

      {/* Progress + countdown */}
      <div className="cd-mid-grid">
        <section className="panel">
          <div className="cd-panel-hd"><h2><BarChart3 size={18}/> Application Progress</h2></div>
          <div className="cd-timeline">
            <div className="cd-timeline-line"><div className="cd-timeline-line-fill" style={{width:`${(progressDone/(appSteps.length-1))*100}%`}}/></div>
            {appSteps.map((step,idx)=>(
              <div className="cd-timeline-step" key={step.key}>
                <div className={`cd-timeline-dot ${step.done?'completed':idx===progressDone?'active':''}`}>{step.done?'✓':idx+1}</div>
                <span className={`cd-timeline-label ${step.done?'completed':idx===progressDone?'active':''}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        {upcoming ? (
          <section className="panel cd-countdown-card">
            <div className="cd-panel-hd"><h2>⏰ Next Interview</h2><span className={`pill ${upcoming.status}`}>{upcoming.status}</span></div>
            <div className="cd-countdown-timer">{countdown}</div>
            <p className="muted" style={{margin:'6px 0 0'}}>{upcoming.title} · {new Date(upcoming.scheduled_at).toLocaleString()}</p>
            <p className="muted" style={{margin:'4px 0 0',fontSize:'0.85rem'}}>with {upcoming.interviewer?.full_name || 'Interviewer'}</p>
          </section>
        ) : (
          <section className="panel">
            <div className="cd-panel-hd"><h2><BarChart3 size={18}/> Performance</h2></div>
            <TrendChart values={[72,81,activeInterview?.rating?activeInterview.rating*10:0]} labels={['MCQ','Coding','Interview']} />
          </section>
        )}
      </div>

      {/* Activity + recent interviews */}
      <div className="cd-mid-grid">
        <section className="panel">
          <div className="cd-panel-hd"><h2><Bell size={18}/> Recent Activity</h2></div>
          <div className="cd-act-list">
            {activities.map((a,i)=>(
              <div className="cd-act-item" key={i}>
                <div className={`cd-act-dot ${a.icon}`}/>
                <div><strong>{a.text}</strong><span>{a.time}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="cd-panel-hd"><h2><CalendarClock size={18}/> My Interviews</h2><span className="cd-badge">{interviews.length}</span></div>
          {interviews.length === 0 ? <p className="muted">No interviews yet.</p> : (
            <div className="adm-iv-list">
              {interviews.slice(0,5).map(iv=>(
                <div className="adm-iv-row" key={iv.id}>
                  <div className="adm-iv-avatar" style={{background:'linear-gradient(135deg,#6366f1,#818cf8)'}}>{(iv.title||'I')[0].toUpperCase()}</div>
                  <div className="adm-iv-info">
                    <strong>{iv.title}</strong>
                    <span>{new Date(iv.scheduled_at).toLocaleString()} · {iv.interviewer?.full_name||'Interviewer'}</span>
                  </div>
                  <span className={`pill ${iv.status}`}>{iv.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent, trend }) {
  return (
    <section className={`metric${accent ? ' accent-' + accent : ''}`}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Icon size={22} />
        {trend !== undefined && (
          <span className="metric-trend" style={{ color: trend >= 0 ? '#38a169' : '#e53e3e' }}>
            <span style={{fontSize:'0.7rem'}}>{trend >= 0 ? '↑' : '↓'}</span>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </section>
  );
}

function TrendChart({ values, labels }) {
  const max = Math.max(...values, 1);
  return (
    <div className="chart">
      {values.map((value, index) => (
        <div className="bar-wrap" key={labels[index]}>
          <div className="bar" style={{ height: `${Math.max((value / max) * 100, 12)}%` }} />
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

function PeopleManager({ title, people, allProfiles, changeRole }) {
  return (
    <section className="panel">
      <h2><Users size={20} /> {title}</h2>
      <div className="table-list">
        {(people.length ? people : allProfiles).map((person) => (
          <div className="row" key={person.id}>
            <div>
              <strong>{person.full_name}</strong>
              <span>{person.email}</span>
            </div>
            <select value={person.role} onChange={(event) => changeRole(person.id, event.target.value)}>
              <option value="admin">Admin</option>
              <option value="interviewer">Interviewer</option>
              <option value="candidate">Candidate</option>
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

function JobsPanel() {
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('if_jobs');
    return saved ? JSON.parse(saved) : [...jobPositions];
  });
  const [form, setForm] = useState({ title: '', department: '', description: '', status: 'Open' });

  function saveJob(e) {
    e.preventDefault();
    if (!form.title || !form.department) return;
    const newJob = { ...form, applicants: 0 };
    const updated = [...jobs, newJob];
    setJobs(updated);
    localStorage.setItem('if_jobs', JSON.stringify(updated));
    setForm({ title: '', department: '', description: '', status: 'Open' });
  }

  function deleteJob(title) {
    const updated = jobs.filter(j => j.title !== title);
    setJobs(updated);
    localStorage.setItem('if_jobs', JSON.stringify(updated));
  }

  return (
    <div className="grid two">
      <section className="panel">
        <h2><BriefcaseBusiness size={20} /> Create Job Positions</h2>
        <form className="stack" onSubmit={saveJob}>
          <input placeholder="Job title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          <input placeholder="Department" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required />
          <textarea placeholder="Skills, eligibility, experience, and description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option>Open</option>
            <option>Screening</option>
            <option>Closed</option>
          </select>
          <button className="primary" type="submit"><Plus size={18} /> Save position</button>
        </form>
      </section>
      <section className="panel">
        <h2><ClipboardList size={20} /> Open Positions ({jobs.length})</h2>
        <div className="items">
          {jobs.length === 0 ? <p className="muted">No positions created yet.</p> : jobs.map((job) => (
            <div className="item detail" key={job.title} style={{gridTemplateColumns:'34px 1fr auto',alignItems:'center'}}>
              <span>{job.applicants || 0}</span>
              <div>
                <strong>{job.title}</strong>
                <p>{job.department} · {job.status}</p>
                {job.description && <p style={{fontSize:'0.85rem',marginTop:4,color:'#697386'}}>{job.description}</p>}
              </div>
              <button className="secondary" type="button" onClick={() => deleteJob(job.title)} style={{minHeight:32,padding:'0 10px',fontSize:'0.8rem',color:'#c53030',borderColor:'#fde7e7'}}>Remove</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuestionBank() {
  const [questions, setQuestions] = useState(() => {
    const saved = localStorage.getItem('if_questions');
    return saved ? JSON.parse(saved) : [
      { id: 'q1', type: 'Technical', text: 'What is the difference between let and var in JavaScript?', date: new Date().toLocaleDateString() },
      { id: 'q2', type: 'Technical', text: 'Explain the concept of closures in JavaScript.', date: new Date().toLocaleDateString() },
      { id: 'q3', type: 'HR', text: 'Tell me about a time you resolved a conflict in a team.', date: new Date().toLocaleDateString() },
      { id: 'q4', type: 'MCQ', text: 'Which hook is used for side effects in React?', date: new Date().toLocaleDateString() },
      { id: 'q5', type: 'Coding', text: 'Write a function to reverse a linked list.', date: new Date().toLocaleDateString() },
    ];
  });
  const [form, setForm] = useState({ type: 'Technical', text: '' });
  const [filter, setFilter] = useState('All');

  function addQuestion(e) {
    e.preventDefault();
    if (!form.text.trim()) return;
    const newQ = { id: 'q' + Date.now(), type: form.type, text: form.text, date: new Date().toLocaleDateString() };
    const updated = [newQ, ...questions];
    setQuestions(updated);
    localStorage.setItem('if_questions', JSON.stringify(updated));
    setForm({ ...form, text: '' });
  }

  function deleteQuestion(id) {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    localStorage.setItem('if_questions', JSON.stringify(updated));
  }

  const filtered = filter === 'All' ? questions : questions.filter(q => q.type === filter);
  const counts = {};
  questions.forEach(q => { counts[q.type] = (counts[q.type] || 0) + 1; });

  return (
    <div className="grid two">
      <section className="panel">
        <h2><ClipboardList size={20} /> Manage Questions</h2>
        <form className="stack" onSubmit={addQuestion}>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option>Technical</option>
            <option>HR</option>
            <option>MCQ</option>
            <option>Coding</option>
          </select>
          <textarea placeholder="Enter question text..." value={form.text} onChange={e => setForm({...form, text: e.target.value})} required />
          <button className="primary" type="submit"><Plus size={18} /> Add question</button>
        </form>
        <div className="stats" style={{marginTop:12,gridTemplateColumns:'repeat(4,1fr)'}}>
          {Object.entries(counts).map(([type, count]) => (
            <div className="stat" key={type} style={{textAlign:'center'}}><strong style={{color:'#1f8f83'}}>{count}</strong><span>{type}</span></div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2><ClipboardList size={20} /> Question Bank ({filtered.length})</h2>
        <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
          {['All','Technical','HR','MCQ','Coding'].map(t => (
            <button key={t} className="secondary" type="button" onClick={() => setFilter(t)} style={{minHeight:30,padding:'0 12px',fontSize:'0.82rem',background:filter===t?'#1f8f83':'#fff',color:filter===t?'#fff':'#1d2433',borderColor:filter===t?'#1f8f83':'#cfd7e3'}}>{t}</button>
          ))}
        </div>
        <div className="items" style={{maxHeight:400,overflowY:'auto'}}>
          {filtered.length === 0 ? <p className="muted">No questions in this category.</p> : filtered.map((q) => (
            <div className="item" key={q.id} style={{gridTemplateColumns:'60px 1fr 30px',alignItems:'start'}}>
              <span style={{fontSize:'0.75rem',background:'#eef2f7',color:'#697386',width:60,height:28,borderRadius:6,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center'}}>{q.type}</span>
              <div>
                <p>{q.text}</p>
                <p style={{fontSize:'0.78rem',color:'#9aa2b2',marginTop:4}}>{q.date}</p>
              </div>
              <button type="button" onClick={() => deleteQuestion(q.id)} style={{background:'none',border:'none',color:'#c53030',cursor:'pointer',fontSize:'1.1rem',padding:0}} title="Delete">✕</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportsPanel({ interviews, candidates, interviewers }) {
  const [downloading, setDownloading] = useState('');

  const totals = { scheduled: 0, in_progress: 0, submitted: 0, reviewed: 0, cancelled: 0 };
  interviews.forEach(iv => { totals[iv.status] = (totals[iv.status] || 0) + 1; });

  const totalScores = interviews.filter(iv => iv.status === 'reviewed' && iv.rating);
  const avgScore = totalScores.length ? Math.round(totalScores.reduce((s, iv) => s + Number(iv.rating), 0) / totalScores.length * 10) / 10 : 0;
  const passRate = totalScores.length ? Math.round(totalScores.filter(iv => Number(iv.rating) >= 7).length / totalScores.length * 100) : 0;

  const monthlyData = [8, 12, 10, 18, 16, Math.max(interviews.length, 6)];

  function downloadReport(type) {
    setDownloading(type);
    setTimeout(() => {
      const content = [
        'InterviewFlow Report',
        '==================',
        'Generated: ' + new Date().toLocaleString(),
        '',
        'Total Interviews: ' + interviews.length,
        '  - Scheduled: ' + totals.scheduled,
        '  - In Progress: ' + totals.in_progress,
        '  - Submitted: ' + totals.submitted,
        '  - Reviewed: ' + totals.reviewed,
        '  - Cancelled: ' + totals.cancelled,
        '',
        'Total Candidates: ' + candidates.length,
        'Total Interviewers: ' + interviewers.length,
        'Average Score: ' + avgScore + '/10',
        'Pass Rate: ' + passRate + '%',
        '',
        '--- Interview List ---',
        ...interviews.map(iv => iv.title + ' | ' + (iv.candidate?.full_name || 'N/A') + ' | ' + (iv.interviewer?.full_name || 'N/A') + ' | ' + iv.status + ' | ' + (iv.rating || 'N/A') + '/10'),
      ].join('\n');

      const blob = new Blob([content], { type: type === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interviewflow_report.' + (type === 'pdf' ? 'txt' : 'csv');
      a.click();
      URL.revokeObjectURL(url);
      setDownloading('');
    }, 600);
  }

  return (
    <div className="grid">
      <div className="metric-grid three">
        <Metric icon={CalendarClock} label="Total Interviews" value={interviews.length} />
        <Metric icon={CheckCircle2} label="Reviewed" value={totals.reviewed} />
        <Metric icon={Star} label="Avg Score" value={avgScore + '/10'} />
      </div>
      <div className="grid two">
        <section className="panel">
          <h2><BarChart3 size={20} /> Status Breakdown</h2>
          <div className="stats" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            <Stat label="Scheduled" value={totals.scheduled} />
            <Stat label="In Progress" value={totals.in_progress} />
            <Stat label="Submitted" value={totals.submitted} />
            <Stat label="Reviewed" value={totals.reviewed} />
            <Stat label="Cancelled" value={totals.cancelled} />
            <Stat label="Pass Rate" value={passRate + '%'} />
          </div>
        </section>
        <section className="panel">
          <h2><BarChart3 size={20} /> Hiring Trend</h2>
          <TrendChart values={monthlyData} labels={['Jan','Feb','Mar','Apr','May','Now']} />
        </section>
      </div>
      <section className="panel">
        <h2><Download size={20} /> Download Reports</h2>
        <div className="actions" style={{gap:12}}>
          <button className="secondary" type="button" onClick={() => downloadReport('pdf')} disabled={downloading === 'pdf'}>
            <FileText size={18} /> {downloading === 'pdf' ? 'Generating...' : 'Download Report (TXT)'}
          </button>
          <button className="secondary" type="button" onClick={() => downloadReport('csv')} disabled={downloading === 'csv'}>
            <FileSpreadsheet size={18} /> {downloading === 'csv' ? 'Generating...' : 'Download CSV'}
          </button>
        </div>
      </section>
      <InterviewTable interviews={interviews} />
    </div>
  );
}

function NotificationPanel() {
  const [toggles, setToggles] = useState(() => {
    const saved = localStorage.getItem('if_notifications');
    return saved ? JSON.parse(saved) : {
      scheduled: true,
      result: true,
      reminder: true,
      application: false
    };
  });

  function toggle(key) {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    localStorage.setItem('if_notifications', JSON.stringify(updated));
  }

  return (
    <section className="panel">
      <h2><Mail size={20} /> Email Notifications</h2>
      <div className="grid two">
        <div className="toggle-row">
          <span>Interview scheduled email</span>
          <input type="checkbox" checked={toggles.scheduled} onChange={() => toggle('scheduled')} />
        </div>
        <div className="toggle-row">
          <span>Candidate result email</span>
          <input type="checkbox" checked={toggles.result} onChange={() => toggle('result')} />
        </div>
        <div className="toggle-row">
          <span>Interviewer reminder email</span>
          <input type="checkbox" checked={toggles.reminder} onChange={() => toggle('reminder')} />
        </div>
        <div className="toggle-row">
          <span>Application status email</span>
          <input type="checkbox" checked={toggles.application} onChange={() => toggle('application')} />
        </div>
      </div>
      <p className="muted" style={{marginTop:12,fontSize:'0.85rem'}}>Changes are saved automatically.</p>
    </section>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('if_settings');
    return saved ? JSON.parse(saved) : {
      company: 'InterviewFlow Hiring',
      duration: 45,
      passScore: 7,
      sender: 'hr@company.com'
    };
  });
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    localStorage.setItem('if_settings', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="panel">
      <h2><Settings size={20} /> Settings</h2>
      <div className="grid two">
        <label>
          Company name
          <input value={settings.company} onChange={e => update('company', e.target.value)} />
        </label>
        <label>
          Default interview duration (mins)
          <input type="number" value={settings.duration} onChange={e => update('duration', Number(e.target.value))} />
        </label>
        <label>
          Passing score (1-10)
          <input type="number" min="1" max="10" value={settings.passScore} onChange={e => update('passScore', Number(e.target.value))} />
        </label>
        <label>
          Notification sender email
          <input value={settings.sender} onChange={e => update('sender', e.target.value)} />
        </label>
      </div>
      {saved && <p style={{color:'#1f8f83',fontWeight:700,marginTop:12,fontSize:'0.85rem'}}>✓ Settings saved automatically</p>}
    </section>
  );
}

function CandidateDetails({ interview }) {
  return (
    <section className="panel">
      <h2><Users size={20} /> Candidate Details</h2>
      <div className="stats">
        <Stat label="Name" value={interview.candidate?.full_name || 'Candidate'} />
        <Stat label="Email" value={interview.candidate?.email || 'Not available'} />
        <Stat label="Applied For" value={interview.title} />
        <Stat label="Status" value={interview.status} />
      </div>
    </section>
  );
}

function ResumeViewer() {
  return (
    <section className="panel">
      <h2><FileText size={20} /> Resume Viewer</h2>
      <div className="resume-box">
        <FileText size={42} />
        <strong>Candidate resume preview</strong>
        <p className="muted">Upload storage can be connected to Supabase Storage when you are ready.</p>
      </div>
    </section>
  );
}

function EvaluationPanel({ title, items }) {
  return (
    <section className="panel">
      <h2><ClipboardCheck size={20} /> {title}</h2>
      <div className="items">
        {items.map((item, index) => (
          <div className="item detail" key={item}>
            <span>{index + 1}</span>
            <div>
              <strong>{item}</strong>
              <p>Score, remarks, and pass/fail decision can be recorded here.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePanel({ profile, setMessage, reload }) {
  const [form, setForm] = useState({ full_name: profile.full_name, phone: '+91 98765 43210', skills: 'React, Node.js, JavaScript, SQL, Python', bio: 'Passionate full-stack developer with 2+ years of experience building web applications. Currently pursuing B.Tech in Computer Science.' });
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', profile.id);
      if (error) throw error;
      setMessage('Profile updated.');
      await reload();
    } catch (err) { setMessage(err.message); }
    setSaving(false);
  }

  const skillList = form.skills.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <section className="panel">
      <h2><Users size={20} /> My Profile</h2>
      <div className="cd-profile-header">
        <div className="cd-profile-avatar-large">{profile.full_name?.[0]?.toUpperCase() || '?'}</div>
        <div className="cd-profile-info">
          <h3>{profile.full_name}</h3>
          <p>{profile.email}</p>
          <div className="skills-tags">
            {skillList.map(skill => (
              <span className="skill-tag" key={skill}>{skill}</span>
            ))}
          </div>
        </div>
      </div>
      <form className="grid two" onSubmit={save}>
        <label>Full name<input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></label>
        <label>Email<input value={profile.email} disabled /></label>
        <label>Phone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 00000 00000" /></label>
        <label>Skills<input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, SQL" /></label>
        <label style={{gridColumn:'1/-1'}}>Bio<textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself" /></label>
        <button className="primary" type="submit" disabled={saving}><CheckCircle2 size={18} /> {saving ? 'Saving...' : 'Save Profile'}</button>
      </form>
    </section>
  );
}

function UploadPanel({ profile, setMessage }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  async function upload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 20, 90)), 300);
    try {
      const path = `resumes/${profile.id}/${file.name}`;
      const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true });
      clearInterval(interval);
      if (error) throw error;
      setProgress(100);
      const { data } = supabase.storage.from('resumes').getPublicUrl(path);
      setUrl(data.publicUrl);
      setMessage('Resume uploaded successfully.');
      setTimeout(() => setProgress(0), 1500);
    } catch (err) { setMessage('Upload failed: ' + err.message); setProgress(0); }
    setUploading(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  }

  function handleDragOver(e) { e.preventDefault(); setDragOver(true); }
  function handleDragLeave() { setDragOver(false); }

  return (
    <section className="panel">
      <h2><Upload size={20} /> Upload Resume</h2>
      <div
        className={`cd-dropzone${dragOver ? ' dragover' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('resume-file2')?.click()}
      >
        <Upload size={40} />
        <strong>{file ? file.name : 'Drop your resume here or click to browse'}</strong>
        <p className="muted">PDF or DOCX · Max 5MB</p>
        <input type="file" accept=".pdf,.docx" style={{display:'none'}} id="resume-file2" onChange={e => setFile(e.target.files[0])} />
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginTop:8}}>
          <label htmlFor="resume-file2" className="secondary" style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,padding:'0 14px',minHeight:40,borderRadius:8,border:'1px solid #cfd7e3',fontWeight:800,pointerEvents:'none'}}>Choose file</label>
          {file && !uploading && <button className="primary" type="button" onClick={upload} style={{pointerEvents:'auto'}}><Upload size={16} /> Upload</button>}
        </div>
        {(uploading || progress > 0) && (
          <div className="cd-upload-progress">
            <div className="cd-upload-progress-bar" style={{width:`${progress}%`}} />
          </div>
        )}
        {url && <a href={url} target="_blank" rel="noreferrer" style={{color:'#1f8f83',fontWeight:700,fontSize:'0.92rem',marginTop:8,display:'inline-flex',alignItems:'center',gap:6}}><FileText size={16} /> View Uploaded Resume</a>}
      </div>
    </section>
  );
}

function ApplyJobsPanel({ setMessage }) {
  const [applied, setApplied] = useState([]);

  function toggle(title) {
    setApplied(prev => {
      if (prev.includes(title)) {
        setMessage(`Withdrawn from ${title}.`);
        return prev.filter(t => t !== title);
      }
      setMessage(`Applied to ${title}!`);
      return [...prev, title];
    });
  }

  const getCompanyLogo = (title) => {
    const logos = { 'Frontend': 'FB', 'Backend': 'BB', 'QA': 'QA' };
    const key = Object.keys(logos).find(k => title.startsWith(k));
    return logos[key] || 'IN';
  };

  return (
    <section className="panel">
      <h2><BriefcaseBusiness size={20} /> Apply for Jobs</h2>
      <div className="items" style={{display:'grid',gap:14}}>
        {jobPositions.map((job) => {
          const matched = applied.includes(job.title);
          return (
            <div className="job-card" key={job.title}>
              <div className="job-card-logo">{getCompanyLogo(job.title)}</div>
              <div className="job-card-info">
                <h4>{job.title}</h4>
                <p>{job.department} · Full-time · Bengaluru, India</p>
                <div className="job-card-meta">
                  <span className="job-meta-tag">{job.applicants} applicants</span>
                  <span className="job-meta-tag">{job.status}</span>
                  <span className="job-meta-tag">💰 ₹8L-₹15L/yr</span>
                  <span className="job-meta-tag">📅 Posted 2d ago</span>
                </div>
                <div className="skills-match">
                  <span>Skills match:</span>
                  <div className="skills-match-bar">
                    <div className="skills-match-fill" style={{width:`${Math.min(job.applicants * 5 + 50, 95)}%`}} />
                  </div>
                  <span style={{fontWeight:800,color:'#1f8f83'}}>{Math.min(job.applicants * 5 + 50, 95)}%</span>
                </div>
              </div>
              <button
                className={matched ? 'primary' : 'secondary'}
                onClick={() => toggle(job.title)}
                style={{alignSelf:'center',height:36,whiteSpace:'nowrap'}}
              >
                {matched ? <><CheckCircle2 size={15}/> Applied</> : 'Apply Now'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CandidateSchedule({ interviews }) {
  const [checklist, setChecklist] = useState({});

  function toggleCheck(item) {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  }

  return (
    <section className="panel">
      <h2><CalendarClock size={20} /> Interview Schedule</h2>
      {interviews.length === 0 ? <p className="muted">No interviews scheduled yet.</p> : (
        <div className="items" style={{display:'grid',gap:14}}>
          {interviews.map(iv => {
            const d = new Date(iv.scheduled_at);
            const day = d.getDate();
            const mon = d.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
            const prepItems = [
              'Review job description',
              'Prepare questions for interviewer',
              'Test your microphone & camera',
              'Find a quiet spot with good internet',
              'Keep your resume handy'
            ];
            return (
              <div className="cd-schedule-card" key={iv.id}>
                <div className="cd-schedule-header">
                  <div className="cd-schedule-date-badge">
                    <span className="day">{day}</span>
                    <span className="mon">{mon}</span>
                  </div>
                  <div className="cd-schedule-body">
                    <h4>{iv.title}</h4>
                    <p>{d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })} · {iv.duration_minutes} mins</p>
                    <p>Interviewer: {iv.interviewer?.full_name || 'TBD'}</p>
                    {iv.description && <p style={{marginTop:4,opacity:0.7}}>{iv.description}</p>}
                  </div>
                  <span className={`pill ${iv.status}`}>{iv.status}</span>
                </div>
                <div>
                  <strong style={{fontSize:'0.88rem',display:'block',marginBottom:8}}>📋 Interview Prep Checklist</strong>
                  <div className="cd-checklist">
                    {prepItems.map(item => (
                      <label
                        key={item}
                        className={`cd-checklist-item${checklist[item] ? ' checked' : ''}`}
                        onClick={() => toggleCheck(item)}
                      >
                        <input type="checkbox" checked={!!checklist[item]} readOnly />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_MCQ = [
    { q: 'Which hook is used for side effects in React?', opts: ['useState', 'useEffect', 'useRef', 'useMemo'], ans: 1 },
    { q: 'What does HTTP 401 mean?', opts: ['Not Found', 'Forbidden', 'Unauthorized', 'Server Error'], ans: 2 },
    { q: 'What is the purpose of database indexing?', opts: ['Backup data', 'Speed up queries', 'Encrypt data', 'Normalize tables'], ans: 1 },
    { q: 'Which SQL clause filters grouped results?', opts: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], ans: 1 },
    { q: 'What does CSS "box-sizing: border-box" do?', opts: ['Adds border outside', 'Includes padding/border in width', 'Removes margin', 'Sets box shadow'], ans: 1 },
    { q: 'What is the output of typeof null in JavaScript?', opts: ['"null"', '"undefined"', '"object"', '"boolean"'], ans: 2 },
    { q: 'Which method adds an element to the end of an array?', opts: ['push()', 'pop()', 'shift()', 'unshift()'], ans: 0 },
    { q: 'What does the "key" prop do in React lists?', opts: ['Adds styling', 'Helps identify changed items', 'Binds events', 'Sets the ID attribute'], ans: 1 },
    { q: 'Which HTML tag is used for a hyperlink?', opts: ['<link>', '<href>', '<a>', '<nav>'], ans: 2 },
    { q: 'What is the time complexity of binary search?', opts: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], ans: 1 },
    { q: 'Which Git command creates a new branch?', opts: ['git branch', 'git checkout', 'git clone', 'git commit'], ans: 0 },
    { q: 'What does CSS flexbox property "justify-content: center" do?', opts: ['Centers vertically', 'Centers horizontally', 'Centers both axes', 'Removes spacing'], ans: 1 },
    { q: 'Which HTTP method is used to update a resource?', opts: ['GET', 'POST', 'PUT', 'DELETE'], ans: 2 },
    { q: 'What is a closure in JavaScript?', opts: ['A loop construct', 'Function with access to outer scope', 'A data type', 'A CSS property'], ans: 1 },
    { q: 'Which SQL JOIN returns only matching rows?', opts: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN'], ans: 2 },
    { q: 'What does React.useState return?', opts: ['A single value', 'An object', 'An array with two values', 'A promise'], ans: 2 },
    { q: 'Which data structure operates on LIFO principle?', opts: ['Queue', 'Stack', 'Tree', 'Graph'], ans: 1 },
    { q: 'What is the purpose of the "useEffect" cleanup function?', opts: ['Free memory', 'Remove event listeners or subscriptions', 'Reset state', 'Stop the component'], ans: 1 },
    { q: 'Which CSS property makes a layout responsive with rows and columns?', opts: ['flexbox', 'grid', 'float', 'position'], ans: 1 },
    { q: 'What does === compare in JavaScript?', opts: ['Value only', 'Type only', 'Value and type', 'Reference only'], ans: 2 },
    { q: 'Which HTML element is used for semantic navigation?', opts: ['<div>', '<nav>', '<header>', '<section>'], ans: 1 },
    { q: 'What is a Promise in JavaScript?', opts: ['A callback wrapper', 'An object representing async completion', 'A synchronous loop', 'An error handler'], ans: 1 },
    { q: 'Which sorting algorithm has O(n²) worst-case time?', opts: ['Merge sort', 'Quick sort', 'Bubble sort', 'Heap sort'], ans: 2 },
    { q: 'What does the "git merge" command do?', opts: ['Deletes a branch', 'Combines branches', 'Creates a commit', 'Pushes to remote'], ans: 1 },
    { q: 'Which HTTP status code indicates a successful request?', opts: ['100', '200', '300', '400'], ans: 1 },
    { q: 'What is the virtual DOM in React?', opts: ['The actual browser DOM', 'A lightweight copy of the DOM', 'A database', 'A CSS framework'], ans: 1 },
    { q: 'Which SQL statement is used to delete a table?', opts: ['DELETE', 'DROP', 'TRUNCATE', 'REMOVE'], ans: 1 },
    { q: 'What does the "map()" method return in JavaScript?', opts: ['A boolean', 'A new array', 'The original array mutated', 'An object'], ans: 1 },
    { q: 'Which CSS unit is relative to the parent font-size?', opts: ['px', 'rem', 'em', 'vw'], ans: 2 },
    { q: 'What is hoisting in JavaScript?', opts: ['Moving CSS up', 'Variable/function declarations moved to top', 'Lifting DOM elements', 'A type of loop'], ans: 1 },
    { q: 'What does the spread operator (...) do?', opts: ['Deletes array items', 'Copies/expands iterables', 'Creates a loop', 'Declares a variable'], ans: 1 },
    { q: 'Which method removes the last element of an array?', opts: ['shift()', 'pop()', 'splice()', 'slice()'], ans: 1 },
    { q: 'What is the default display value of a <div>?', opts: ['inline', 'block', 'flex', 'grid'], ans: 1 },
    { q: 'Which event fires when a page finishes loading?', opts: ['onload', 'onready', 'onstart', 'onrender'], ans: 0 },
    { q: 'What does async/await do in JavaScript?', opts: ['Runs code in parallel threads', 'Handles promises with cleaner syntax', 'Blocks the main thread', 'Creates a new scope'], ans: 1 },
  ];

function MCQTest({ profile, setMessage, activeInterview }) {
  const storageKey = `if_mcq_result_${profile?.id}`;
  const stored = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();

  // Shuffle 15 questions once per session (stable via useMemo)
  const MCQ = useMemo(() => shuffle(ALL_MCQ).slice(0, 15), []);

  const TIME = 900; // 15 mins for 15 questions
  const [sel, setSel] = useState({});
  const [submitted, setSubmitted] = useState(!!stored);
  const [score, setScore] = useState(stored?.score ?? 0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [currentQ, setCurrentQ] = useState(0);
  const [flagged, setFlagged] = useState({});

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) { doSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  async function doSubmit() {
    const s = MCQ.reduce((acc, q, i) => acc + (sel[i] === q.ans ? 1 : 0), 0);
    setScore(s);
    setSubmitted(true);
    localStorage.setItem(storageKey, JSON.stringify({ score: s, total: MCQ.length, date: new Date().toISOString() }));
    setMessage(`MCQ submitted! Score: ${s}/${MCQ.length}`);
    // Persist to DB if interview exists
    if (activeInterview?.id) {
      try {
        await api(`/interviews/${activeInterview.id}/mcq-score`, {
          method: 'PATCH',
          body: JSON.stringify({ mcq_score: s, mcq_total: MCQ.length })
        });
      } catch {}
    }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const answeredCount = Object.keys(sel).length;

  // Already submitted — show locked result
  if (submitted) {
    return (
      <section className="panel">
        <h2><ClipboardCheck size={20} /> MCQ Test — Submitted</h2>
        <div className="test-locked-banner">
          <CheckCircle2 size={28} color="#1f8f83" />
          <div>
            <strong>Test already submitted</strong>
            <p>You scored <strong>{score}/{stored?.total ?? MCQ.length}</strong>. You cannot retake the test until the interviewer resets it after the result.</p>
          </div>
        </div>
        {stored?.date && <p className="muted" style={{fontSize:'0.82rem',marginTop:8}}>Submitted on {new Date(stored.date).toLocaleString()}</p>}
      </section>
    );
  }

  return (
    <section className="panel">
      <h2 style={{justifyContent:'space-between'}}>
        <span><ClipboardCheck size={20} /> MCQ Test</span>
        <span className={`cd-timer${timeLeft < 60 ? ' danger' : ''}`} style={{fontSize:'0.95rem',fontWeight:700}}>⏱ {mins}:{secs}</span>
      </h2>

      <div className="cd-mcq-progress">
        <div className="cd-mcq-progress-bar">
          <div className="cd-mcq-progress-fill" style={{width:`${(answeredCount / MCQ.length) * 100}%`}} />
        </div>
        <span className="cd-mcq-progress-text">{answeredCount}/{MCQ.length} answered</span>
      </div>

      <div className="cd-mcq-nav">
        {MCQ.map((_, i) => (
          <button key={i}
            className={`cd-mcq-nav-btn${currentQ===i?' active':''}${sel[i]!==undefined?' answered':''}${flagged[i]?' flagged':''}`}
            onClick={() => setCurrentQ(i)} type="button">{i + 1}
          </button>
        ))}
      </div>

      <form className="stack" onSubmit={e => { e.preventDefault(); doSubmit(); }}>
        <div className="cd-mcq-q" key={currentQ}>
          <p style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <strong>Question {currentQ + 1} of {MCQ.length}</strong>
            <span onClick={() => setFlagged(p=>({...p,[currentQ]:!p[currentQ]}))} style={{cursor:'pointer',fontSize:'1.2rem',opacity:flagged[currentQ]?1:0.4}} title="Flag">🚩</span>
          </p>
          <p style={{fontSize:'1.05rem',margin:'8px 0 16px'}}><strong>{MCQ[currentQ].q}</strong></p>
          <div style={{display:'grid',gap:10}}>
            {MCQ[currentQ].opts.map((opt, j) => (
              <label key={j} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,border:'1.5px solid',borderColor:sel[currentQ]===j?'#1f8f83':'#dde2ea',background:sel[currentQ]===j?'#f0faf9':'#fff',cursor:'pointer',transition:'all 0.15s'}}>
                <input type="radio" name={`q${currentQ}`} checked={sel[currentQ]===j} onChange={() => setSel(p=>({...p,[currentQ]:j}))} style={{width:18,height:18,accentColor:'#1f8f83'}} />
                {opt}
              </label>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {currentQ > 0 && <button className="secondary" type="button" onClick={() => setCurrentQ(p=>p-1)}>← Previous</button>}
          {currentQ < MCQ.length - 1 && <button className="secondary" type="button" onClick={() => setCurrentQ(p=>p+1)}>Next →</button>}
          <button className="primary" type="submit" style={{marginLeft:'auto'}}><CheckCircle2 size={18}/> Submit MCQ Test</button>
        </div>
      </form>
    </section>
  );
}

const ALL_CODING_TASKS = [
  { title: 'Palindrome Check', desc: 'Check if a string is a palindrome (ignore case and non-alphanumeric).', starter: 'function isPalindrome(str) {\n  // your code here\n}' },
  { title: 'Rotate Array', desc: 'Rotate an array to the right by k steps in-place.', starter: 'function rotateArray(nums, k) {\n  // your code here\n}' },
  { title: 'Find Missing Number', desc: 'Find the missing number in an array of 0 to n.', starter: 'function findMissingNumber(nums) {\n  // your code here\n}' },
  { title: 'Reverse a String', desc: 'Reverse a string without using the built-in reverse method.', starter: 'function reverseString(str) {\n  // your code here\n}' },
  { title: 'FizzBuzz', desc: 'Print numbers 1-n. Multiples of 3 print Fizz, 5 print Buzz, both print FizzBuzz.', starter: 'function fizzBuzz(n) {\n  // your code here\n}' },
  { title: 'Count Vowels', desc: 'Count the number of vowels in a given string.', starter: 'function countVowels(str) {\n  // your code here\n}' },
  { title: 'Two Sum', desc: 'Return indices of two numbers that add up to the target.', starter: 'function twoSum(nums, target) {\n  // your code here\n}' },
  { title: 'Flatten Array', desc: 'Flatten a nested array to a single level.', starter: 'function flattenArray(arr) {\n  // your code here\n}' },
  { title: 'Remove Duplicates', desc: 'Remove duplicate values from an array.', starter: 'function removeDuplicates(arr) {\n  // your code here\n}' },
  { title: 'Fibonacci', desc: 'Return the nth Fibonacci number.', starter: 'function fibonacci(n) {\n  // your code here\n}' },
];

function CodingTest({ profile, setMessage, activeInterview }) {
  const storageKey = `if_coding_result_${profile?.id}`;
  const stored = (() => { try { return JSON.parse(localStorage.getItem(storageKey)); } catch { return null; } })();

  // Pick 3 random tasks per session
  const TASKS = useMemo(() => shuffle(ALL_CODING_TASKS).slice(0, 3), []);

  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState(TASKS.map(t => t.starter));
  const [submitted, setSubmitted] = useState(!!stored);

  async function doSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    localStorage.setItem(storageKey, JSON.stringify({ date: new Date().toISOString() }));
    setMessage('Coding test submitted for review!');
    if (activeInterview?.id) {
      try {
        await api(`/interviews/${activeInterview.id}/coding-submit`, { method: 'PATCH', body: JSON.stringify({}) });
      } catch {}
    }
  }

  if (submitted) {
    return (
      <section className="panel">
        <h2><Code2 size={20} /> Coding Test — Submitted</h2>
        <div className="test-locked-banner">
          <CheckCircle2 size={28} color="#1f8f83" />
          <div>
            <strong>Test already submitted</strong>
            <p>Your coding solutions have been sent for review. You cannot resubmit until the interviewer resets it after the result.</p>
          </div>
        </div>
        {stored?.date && <p className="muted" style={{fontSize:'0.82rem',marginTop:8}}>Submitted on {new Date(stored.date).toLocaleString()}</p>}
      </section>
    );
  }

  return (
    <section className="panel">
      <h2><Code2 size={20} /> Coding Test</h2>
      <div className="cd-coding-tabs">
        {TASKS.map((t, i) => (
          <button key={i} className={active===i?'cd-tab active':'cd-tab'} onClick={() => setActive(i)} type="button">Task {i+1}: {t.title}</button>
        ))}
      </div>
      <form className="stack" onSubmit={doSubmit}>
        <div className="cd-coding-task">
          <strong>{TASKS[active].title}</strong>
          <p className="muted">{TASKS[active].desc}</p>
        </div>
        <textarea
          className="cd-code-editor"
          value={codes[active]}
          onChange={e => setCodes(prev => prev.map((c, i) => i===active ? e.target.value : c))}
          spellCheck={false}
        />
        <button className="primary" type="submit"><CheckCircle2 size={18}/> Submit All Tasks</button>
      </form>
    </section>
  );
}
function InterviewTable({ interviews = [] }) {
  return (
    <section className="panel">
      <h2><CalendarClock size={20} /> View Interview Status</h2>
      {interviews.length === 0 ? (
        <p className="muted">No interviews scheduled yet.</p>
      ) : (
        <div className="table-list">
          {interviews.map((interview) => (
            <div className="row status-row" key={interview.id}>
              <div>
                <strong>{interview.title}</strong>
                <span>{interview.candidate?.full_name || 'Candidate'} with {interview.interviewer?.full_name || 'Interviewer'}</span>
              </div>
              <span className={`pill ${interview.status}`}>{interview.status}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InterviewDetails({ interview }) {
  if (!interview) return <EmptyState />;

  return (
    <section className="panel wide">
      <h2><CalendarClock size={20} /> Interview details</h2>
      <div className="stats">
        <Stat label="Status" value={interview.status} />
        <Stat label="Candidate" value={interview.candidate?.full_name || 'Unassigned'} />
        <Stat label="Interviewer" value={interview.interviewer?.full_name || 'Unassigned'} />
        <Stat label="Schedule" value={new Date(interview.scheduled_at).toLocaleString()} />
        <Stat label="Duration" value={`${interview.duration_minutes} mins`} />
        <Stat label="Rating" value={interview.rating ? `${interview.rating}/10` : 'Pending'} />
      </div>
      {interview.feedback && <p className="feedback">{interview.feedback}</p>}
    </section>
  );
}

function QuestionList({ questions = [] }) {
  if (questions.length === 0) return <p className="muted">No questions added yet.</p>;

  return (
    <div className="items">
      {[...questions].sort((a, b) => a.position - b.position).map((question, index) => (
        <div className="item" key={question.id}>
          <span>{index + 1}</span>
          <p>{question.prompt}</p>
        </div>
      ))}
    </div>
  );
}

function AnswerList({ submissions = [], questions = [] }) {
  if (!submissions?.length) return <p className="muted">No answers submitted yet.</p>;

  return (
    <div className="items">
      {submissions.map((submission) => {
        const question = questions.find((item) => item.id === submission.question_id);
        return (
          <div className="item answer" key={submission.id}>
            <span>Q</span>
            <div>
              <strong>{question?.prompt || 'Question'}</strong>
              <p>{submission.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Admin: view & action all candidate requests ──────────────────────────────
function AdminRequestsPanel({ interviewers, setMessage }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignMap, setAssignMap] = useState({});

  async function load() {
    setLoading(true);
    try { setRequests(await api('/requests')); } catch (e) { setMessage(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function action(id, status) {
    try {
      await api(`/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, interviewer_id: assignMap[id] || undefined })
      });
      setMessage(`Request ${status}.`);
      load();
    } catch (e) { setMessage(e.message); }
  }

  const pending  = requests.filter(r => r.status === 'pending');
  const resolved = requests.filter(r => r.status !== 'pending');

  return (
    <div className="grid" style={{gap:20}}>
      <section className="panel">
        <div className="adm-panel-hd" style={{marginBottom:18}}>
          <h2><Bell size={20}/> Interviewer Requests</h2>
          <span className="adm-badge">{pending.length} pending</span>
        </div>
        {loading ? <p className="muted">Loading…</p> : pending.length === 0 ? (
          <div className="req-empty"><CheckCircle2 size={32} color="#49b7a8"/><p>No pending requests.</p></div>
        ) : (
          <div className="req-list">
            {pending.map(r => (
              <div className="req-card" key={r.id}>
                <div className="req-card-top">
                  <div className="req-avatar">{(r.candidate?.full_name||'C')[0].toUpperCase()}</div>
                  <div className="req-info">
                    <strong>{r.candidate?.full_name || 'Candidate'}</strong>
                    <span>{r.candidate?.email}</span>
                    <span className="req-job">{r.job_title}</span>
                  </div>
                  <span className="req-pill pending">Pending</span>
                </div>
                {r.message && <p className="req-msg">"{r.message}"</p>}
                <div className="req-actions">
                  <select
                    value={assignMap[r.id] || ''}
                    onChange={e => setAssignMap(p => ({...p,[r.id]:e.target.value}))}
                    className="adm-role-select"
                  >
                    <option value="">Assign interviewer (optional)</option>
                    {interviewers.map(iv => <option key={iv.id} value={iv.id}>{iv.full_name}</option>)}
                  </select>
                  <button className="primary" style={{minHeight:36,padding:'0 16px'}} onClick={() => action(r.id,'approved')}>
                    <CheckCircle2 size={15}/> Approve
                  </button>
                  <button className="req-reject-btn" onClick={() => action(r.id,'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section className="panel">
          <div className="adm-panel-hd" style={{marginBottom:18}}>
            <h2><ClipboardCheck size={18}/> Resolved Requests</h2>
            <span className="adm-badge">{resolved.length}</span>
          </div>
          <div className="req-list">
            {resolved.map(r => (
              <div className="req-card resolved" key={r.id}>
                <div className="req-card-top">
                  <div className="req-avatar">{(r.candidate?.full_name||'C')[0].toUpperCase()}</div>
                  <div className="req-info">
                    <strong>{r.candidate?.full_name}</strong>
                    <span>{r.job_title}</span>
                    {r.interviewer && <span>Assigned: {r.interviewer.full_name}</span>}
                  </div>
                  <span className={`req-pill ${r.status}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Candidate: submit a request for interviewer assignment ────────────────────
function RequestInterviewerPanel({ profile, setMessage }) {
  const [form, setForm] = useState({ job_title: '', message: '' });
  const [myRequests, setMyRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try { setMyRequests(await api('/requests/mine')); } catch {}
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/requests', { method: 'POST', body: JSON.stringify(form) });
      setMessage('Request sent to admin!');
      setForm({ job_title: '', message: '' });
      load();
    } catch (err) { setMessage(err.message); }
    setSubmitting(false);
  }

  return (
    <div className="grid two">
      <section className="panel">
        <div className="cd-panel-hd" style={{marginBottom:18}}>
          <h2><Bell size={20}/> Request Interviewer Assignment</h2>
        </div>
        <div className="req-info-box">
          <ShieldCheck size={20} color="#6366f1"/>
          <p>Submit a request to the admin to get an interviewer assigned for your interview. The admin will review and approve it.</p>
        </div>
        <form className="stack" onSubmit={submit} style={{marginTop:16}}>
          <label>
            Job Position
            <input placeholder="e.g. Frontend Developer" value={form.job_title} onChange={e => setForm({...form,job_title:e.target.value})} required />
          </label>
          <label>
            Message to Admin (optional)
            <textarea placeholder="Any specific requirements or notes..." value={form.message} onChange={e => setForm({...form,message:e.target.value})} style={{minHeight:90}} />
          </label>
          <button className="primary" type="submit" disabled={submitting}>
            <Bell size={16}/> {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="cd-panel-hd" style={{marginBottom:18}}>
          <h2><ClipboardList size={18}/> My Requests</h2>
          <span className="cd-badge">{myRequests.length}</span>
        </div>
        {myRequests.length === 0 ? (
          <div className="req-empty"><Bell size={28} color="#9aa2b2"/><p>No requests submitted yet.</p></div>
        ) : (
          <div className="req-list">
            {myRequests.map(r => (
              <div className="req-card" key={r.id}>
                <div className="req-card-top">
                  <div className="req-avatar" style={{background:'linear-gradient(135deg,#6366f1,#818cf8)'}}>
                    {r.job_title[0].toUpperCase()}
                  </div>
                  <div className="req-info">
                    <strong>{r.job_title}</strong>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    {r.interviewer && <span>Interviewer: {r.interviewer.full_name}</span>}
                  </div>
                  <span className={`req-pill ${r.status}`}>{r.status}</span>
                </div>
                {r.message && <p className="req-msg">"{r.message}"</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Interviewer: see approved requests assigned to them ───────────────────────
function InterviewerRequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/requests/assigned')
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="panel">
      <div className="iv-panel-header" style={{marginBottom:18}}>
        <h2><Bell size={20}/> Candidate Requests Assigned to You</h2>
        <span className="iv-panel-badge">{requests.length} approved</span>
      </div>
      {loading ? <p className="muted">Loading…</p> : requests.length === 0 ? (
        <div className="req-empty"><CheckCircle2 size={32} color="#49b7a8"/><p>No requests assigned to you yet.</p></div>
      ) : (
        <div className="req-list">
          {requests.map(r => (
            <div className="req-card" key={r.id}>
              <div className="req-card-top">
                <div className="req-avatar">{(r.candidate?.full_name||'C')[0].toUpperCase()}</div>
                <div className="req-info">
                  <strong>{r.candidate?.full_name}</strong>
                  <span>{r.candidate?.email}</span>
                  <span className="req-job">{r.job_title}</span>
                </div>
                <span className="req-pill approved">Approved</span>
              </div>
              {r.message && <p className="req-msg">"{r.message}"</p>}
              <p style={{margin:'8px 0 0',fontSize:'0.8rem',color:'#9aa2b2'}}>Requested {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Interviewer: fetch and display full candidate profile + test scores
function CandidateDetailView({ activeInterview }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeInterview?.candidate?.id) { setLoading(false); return; }
    api(`/requests/candidate/${activeInterview.candidate.id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeInterview?.candidate?.id]);

  const iv = activeInterview;
  // Merge DB scores into the active interview display
  const dbIv = data?.interviews?.find(i => i.id === iv?.id) || {};
  const mcqScore = dbIv.mcq_score ?? iv?.mcq_score;
  const mcqTotal = dbIv.mcq_total ?? iv?.mcq_total;
  const codingDone = dbIv.coding_submitted ?? iv?.coding_submitted;

  if (loading) return <section className="panel"><p className="muted">Loading candidate data…</p></section>;

  return (
    <div className="grid two">
      <section className="panel">
        <div className="iv-candidate-hero">
          <div className="iv-candidate-avatar">{(iv?.candidate?.full_name || 'C')[0].toUpperCase()}</div>
          <div>
            <h3 style={{margin:'0 0 4px'}}>{iv?.candidate?.full_name || 'Candidate'}</h3>
            <p style={{margin:0,color:'#697386',fontSize:'0.9rem'}}>{iv?.candidate?.email || 'No email'}</p>
            <span className={`pill ${iv?.status}`} style={{marginTop:8,display:'inline-flex'}}>{iv?.status}</span>
          </div>
        </div>
        <div className="iv-candidate-stats">
          <div className="iv-cstat"><span>Position</span><strong>{iv?.title}</strong></div>
          <div className="iv-cstat"><span>Scheduled</span><strong>{iv ? new Date(iv.scheduled_at).toLocaleDateString() : '—'}</strong></div>
          <div className="iv-cstat"><span>Duration</span><strong>{iv?.duration_minutes} mins</strong></div>
          <div className="iv-cstat"><span>Interview Rating</span><strong>{iv?.rating ? `${iv.rating}/10` : 'Pending'}</strong></div>
          <div className="iv-cstat">
            <span>MCQ Score</span>
            <strong style={{color: mcqScore != null ? '#1f8f83' : '#9aa2b2'}}>
              {mcqScore != null ? `${mcqScore}/${mcqTotal}` : 'Not submitted'}
            </strong>
          </div>
          <div className="iv-cstat">
            <span>Coding Test</span>
            <strong style={{color: codingDone ? '#1f8f83' : '#9aa2b2'}}>
              {codingDone ? '✓ Submitted' : 'Not submitted'}
            </strong>
          </div>
        </div>
        {dbIv.mcq_submitted_at && (
          <p style={{fontSize:'0.8rem',color:'#9aa2b2',marginTop:8}}>MCQ submitted: {new Date(dbIv.mcq_submitted_at).toLocaleString()}</p>
        )}
        {dbIv.coding_submitted_at && (
          <p style={{fontSize:'0.8rem',color:'#9aa2b2',marginTop:4}}>Coding submitted: {new Date(dbIv.coding_submitted_at).toLocaleString()}</p>
        )}
      </section>
      <InterviewDetails interview={iv} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="panel">
      <h2>No interviews yet</h2>
      <p className="muted">Once an interview is scheduled, it will appear here.</p>
    </section>
  );
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function averageScore(interviews) {
  const scores = interviews.map((item) => Number(item.rating)).filter(Boolean);
  if (!scores.length) return 0;
  return Math.round((scores.reduce((sum, item) => sum + item, 0) / scores.length) * 10) / 10;
}



function CandidateResult({ interview }) {
  if (!interview) {
    return (
      <section className="panel">
        <h2><Star size={20} /> Interview Result</h2>
        <div className="cd-result-panel">
          <div className="cd-result-header">
            <div className="cd-result-verdict pending">⏳ Pending</div>
            <p className="muted">No interview results available yet. Results will appear here once the interviewer submits the scorecard.</p>
          </div>
        </div>
      </section>
    );
  }

  const isReviewed = interview.status === 'reviewed';
  const rating = Number(interview.rating) || 0;
  const passed = rating >= 7;

  return (
    <section className="panel">
      <h2><Star size={20} /> Interview Result</h2>
      <div className="cd-result-panel">
        <div className="cd-result-header">
          <div className={`cd-result-verdict ${isReviewed ? (passed ? 'passed' : 'failed') : 'pending'}`}>
            {isReviewed ? (passed ? '✅ Passed' : '❌ Not Selected') : '⏳ Pending'}
          </div>
          <div className="cd-result-score-big">{isReviewed ? `${rating}/10` : '--'}</div>
          <div className="cd-result-score-label">Overall Score</div>
        </div>

        <div className="cd-result-scores">
          <div className="cd-score-card">
            <h5>MCQ Test</h5>
            <div className="cd-score-value">--</div>
          </div>
          <div className="cd-score-card">
            <h5>Coding Test</h5>
            <div className="cd-score-value">--</div>
          </div>
          <div className="cd-score-card">
            <h5>Interview</h5>
            <div className="cd-score-value">{isReviewed ? `${rating}/10` : '--'}</div>
          </div>
        </div>

        {interview.feedback && (
          <div className="cd-feedback-box">
            <h4>📝 Interviewer Feedback</h4>
            <p>{interview.feedback}</p>
          </div>
        )}

        <div className="cd-feedback-box">
          <h4>📋 Interview Summary</h4>
          <p><strong>Position:</strong> {interview.title}</p>
          <p><strong>Date:</strong> {new Date(interview.scheduled_at).toLocaleDateString()}</p>
          <p><strong>Interviewer:</strong> {interview.interviewer?.full_name || 'Assigned'}</p>
          <p><strong>Status:</strong> <span className={`pill ${interview.status}`}>{interview.status}</span></p>
        </div>
      </div>
    </section>
  );
}

function NotificationList({ interviews }) {
  const [readItems, setReadItems] = useState({});

  function toggleRead(id) {
    setReadItems(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const notifications = [
    { id: 'n1', icon: 'success', title: 'Profile Created', desc: 'Your candidate profile has been created successfully.', time: '2 weeks ago' },
    { id: 'n2', icon: 'info', title: 'Job Application', desc: 'You applied for Frontend Developer position.', time: '5 days ago' },
    { id: 'n3', icon: 'success', title: 'Resume Uploaded', desc: 'Your resume has been uploaded successfully.', time: '4 days ago' },
    ...interviews.map((iv, idx) => ({
      id: `iv-${iv.id}`,
      icon: iv.status === 'scheduled' ? 'warning' : iv.status === 'reviewed' ? 'success' : 'info',
      title: iv.status === 'scheduled' ? 'Interview Scheduled' : iv.status === 'reviewed' ? 'Interview Completed' : 'Interview Update',
      desc: iv.status === 'scheduled'
        ? `"${iv.title}" scheduled on ${new Date(iv.scheduled_at).toLocaleDateString()} with ${iv.interviewer?.full_name || 'Interviewer'}`
        : iv.status === 'reviewed'
          ? `"${iv.title}" has been reviewed. Check your result.`
          : `"${iv.title}" status updated to ${iv.status}.`,
      time: iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleDateString() : 'Recently'
    })),
  ];

  return (
    <section className="panel">
      <h2><Bell size={20} /> Notifications</h2>
      {notifications.length === 0 ? (
        <p className="muted">No notifications yet.</p>
      ) : (
        <div className="items" style={{gap:4}}>
          {notifications.map((notif) => {
            const isRead = readItems[notif.id];
            return (
              <div
                key={notif.id}
                className={`cd-notif-item${!isRead ? ' unread' : ''}`}
                onClick={() => toggleRead(notif.id)}
                style={{cursor:'pointer'}}
              >
                <div className={`cd-notif-icon ${notif.icon}`}>✓</div>
                <div className="cd-notif-body">
                  <strong>{notif.title}</strong>
                  <p>{notif.desc}</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                  <span className="cd-notif-time">{notif.time}</span>
                  {!isRead && <span className="cd-notif-dot" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Video Practice Panel ──────────────────────────────────────────────────────
function VideoPracticePanel() {
  const videoRef = React.useRef(null);
  const mediaRef = React.useRef(null);
  const [recording, setRecording] = React.useState(false);
  const [blob, setBlob] = React.useState(null);
  const [error, setError] = React.useState('');
  const [timer, setTimer] = React.useState(0);
  const timerRef = React.useRef(null);
  const chunksRef = React.useRef([]);

  const PROMPTS = [
    'Tell me about yourself in 2 minutes.',
    'What is your greatest professional achievement?',
    'Describe a time you handled a difficult situation.',
    'Why do you want this role?',
    'Where do you see yourself in 5 years?',
  ];
  const [promptIdx, setPromptIdx] = React.useState(0);

  async function startRecording() {
    setBlob(null);
    setError('');
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.play();
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: 'video/webm' });
        setBlob(b);
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      };
      mr.start();
      setRecording(true);
      setTimer(0);
      timerRef.current = setInterval(() => setTimer(p => p + 1), 1000);
    } catch (e) {
      setError('Camera/mic access denied. Please allow permissions and try again.');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  }

  useEffect(() => () => { clearInterval(timerRef.current); mediaRef.current?.stream?.getTracks().forEach(t => t.stop()); }, []);

  const mins = String(Math.floor(timer / 60)).padStart(2, '0');
  const secs = String(timer % 60).padStart(2, '0');

  return (
    <section className="panel">
      <h2><Video size={20} /> Video Practice</h2>
      <div className="vp-prompt-bar">
        <span>🎯 Practice Prompt:</span>
        <strong>{PROMPTS[promptIdx]}</strong>
        <button className="secondary" style={{minHeight:32,padding:'0 12px',fontSize:'0.82rem'}} onClick={() => setPromptIdx(i => (i + 1) % PROMPTS.length)}>Next prompt →</button>
      </div>
      {error && <p style={{color:'#c53030',marginTop:8}}>{error}</p>}
      <div className="vp-video-wrap">
        <video ref={videoRef} className="vp-video" playsInline />
        {recording && <div className="vp-rec-badge">⏱ {mins}:{secs}</div>}
        {!recording && !blob && (
          <div className="vp-overlay">
            <Video size={48} color="#fff" />
            <p>Camera preview will appear here</p>
          </div>
        )}
      </div>
      {blob && (
        <div style={{marginTop:12}}>
          <p style={{fontWeight:700,marginBottom:6}}>✅ Recording saved — review your answer:</p>
          <video src={URL.createObjectURL(blob)} controls className="vp-video" style={{borderRadius:10}} />
          <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
            <a href={URL.createObjectURL(blob)} download="practice.webm" className="secondary" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'0 16px',minHeight:38,borderRadius:8,border:'1.5px solid #cfd7e3',fontWeight:700,textDecoration:'none',color:'#172033'}}>⬇ Download</a>
            <button className="secondary" onClick={() => { setBlob(null); setTimer(0); }}>🔄 Record Again</button>
          </div>
        </div>
      )}
      <div style={{display:'flex',gap:12,marginTop:16,flexWrap:'wrap'}}>
        {!recording
          ? <button className="primary" onClick={startRecording}><Video size={16} /> Start Recording</button>
          : <button className="primary" style={{background:'linear-gradient(135deg,#c53030,#e53e3e)'}} onClick={stopRecording}>⏹ Stop Recording</button>
        }
      </div>
      <div className="vp-tips">
        <strong>💡 Tips for a great answer:</strong>
        <ul>
          <li>Look directly at the camera, not the screen</li>
          <li>Speak clearly and at a moderate pace</li>
          <li>Use the STAR method for behavioural questions</li>
          <li>Keep answers between 1–2 minutes</li>
        </ul>
      </div>
    </section>
  );
}

// ── Mock Interview Panel ──────────────────────────────────────────────────────
const MOCK_ROUNDS = [
  {
    label: 'HR Round', icon: '🤝', color: '#6366f1',
    questions: [
      'Tell me about yourself.',
      'Why do you want to join our company?',
      'What are your strengths and weaknesses?',
      'Describe a conflict you resolved at work.',
      'Where do you see yourself in 5 years?',
    ]
  },
  {
    label: 'Technical Round', icon: '💻', color: '#1f8f83',
    questions: [
      'Explain the difference between == and === in JavaScript.',
      'What is the event loop in Node.js?',
      'How does React reconciliation work?',
      'What is a REST API? Give an example.',
      'Explain SQL vs NoSQL databases.',
    ]
  },
  {
    label: 'Behavioural Round', icon: '🧠', color: '#d97706',
    questions: [
      'Tell me about a time you failed and what you learned.',
      'Describe a situation where you showed leadership.',
      'How do you prioritise tasks under pressure?',
      'Give an example of going above and beyond.',
      'How do you handle disagreements with teammates?',
    ]
  },
];

function MockInterviewPanel({ profile, setMessage }) {
  const storageKey = `if_mock_${profile?.id}`;
  const [round, setRound] = React.useState(0);
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [input, setInput] = React.useState('');
  const [done, setDone] = React.useState(false);
  const [saved, setSaved] = React.useState(() => { try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; } });
  const bottomRef = React.useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [answers, qIdx]);

  const currentRound = MOCK_ROUNDS[round];
  const totalQ = currentRound.questions.length;
  const key = `${round}-${qIdx}`;

  function submitAnswer(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const updated = { ...answers, [key]: input.trim() };
    setAnswers(updated);
    setInput('');
    if (qIdx < totalQ - 1) {
      setQIdx(q => q + 1);
    } else {
      const allSaved = { ...saved, [round]: updated };
      setSaved(allSaved);
      localStorage.setItem(storageKey, JSON.stringify(allSaved));
      setMessage(`${currentRound.label} completed!`);
      setDone(true);
    }
  }

  function nextRound() {
    if (round < MOCK_ROUNDS.length - 1) {
      setRound(r => r + 1);
      setQIdx(0);
      setAnswers({});
      setInput('');
      setDone(false);
    }
  }

  const progress = Math.round((qIdx / totalQ) * 100);

  return (
    <section className="panel">
      <h2><Mic size={20} /> Mock Interview</h2>
      <div className="mock-round-tabs">
        {MOCK_ROUNDS.map((r, i) => (
          <button key={i} type="button"
            className={`mock-round-tab${round === i ? ' active' : ''}${saved[i] ? ' done' : ''}`}
            onClick={() => { setRound(i); setQIdx(0); setAnswers({}); setInput(''); setDone(false); }}
            style={round === i ? { borderColor: r.color, color: r.color } : {}}>
            {r.icon} {r.label} {saved[i] ? '✓' : ''}
          </button>
        ))}
      </div>

      {!done ? (
        <>
          <div className="mock-progress-row">
            <div className="mock-progress-bar"><div className="mock-progress-fill" style={{ width: `${progress}%`, background: currentRound.color }} /></div>
            <span>{qIdx + 1}/{totalQ}</span>
          </div>
          <div className="mock-question-card" style={{ borderColor: currentRound.color + '44' }}>
            <span className="mock-q-num" style={{ background: currentRound.color }}>Q{qIdx + 1}</span>
            <p>{currentRound.questions[qIdx]}</p>
          </div>
          {Object.entries(answers).filter(([k]) => k.startsWith(`${round}-`)).map(([k, v]) => {
            const n = parseInt(k.split('-')[1]);
            return (
              <div key={k} className="mock-prev-answer">
                <span style={{ color: currentRound.color, fontWeight: 700 }}>Q{n + 1}:</span> {currentRound.questions[n]}
                <p>{v}</p>
              </div>
            );
          })}
          <div ref={bottomRef} />
          <form className="inline-form" onSubmit={submitAnswer} style={{ marginTop: 16 }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type your answer..." style={{ minHeight: 80, resize: 'vertical' }} />
            <button className="primary" type="submit" style={{ alignSelf: 'flex-end' }}>Submit →</button>
          </form>
        </>
      ) : (
        <div className="mock-done-card">
          <CheckCircle2 size={40} color={currentRound.color} />
          <h3>{currentRound.label} Complete!</h3>
          <p>You answered all {totalQ} questions. Review your answers below.</p>
          {round < MOCK_ROUNDS.length - 1 && (
            <button className="primary" onClick={nextRound}>Next: {MOCK_ROUNDS[round + 1].label} →</button>
          )}
          <div className="mock-review-list">
            {currentRound.questions.map((q, i) => (
              <div key={i} className="mock-review-item">
                <strong>Q{i + 1}: {q}</strong>
                <p>{answers[`${round}-${i}`] || <em style={{ color: '#9aa2b2' }}>No answer</em>}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}





// ── Progress Tracking Panel ───────────────────────────────────────────────────
function ProgressTrackingPanel({ profile, interviews }) {
  const mcqKey = `if_mcq_result_${profile?.id}`;
  const codingKey = `if_coding_result_${profile?.id}`;
  const mockKey = `if_mock_${profile?.id}`;

  const mcqData = (() => { try { return JSON.parse(localStorage.getItem(mcqKey)); } catch { return null; } })();
  const codingDone = (() => { try { return !!JSON.parse(localStorage.getItem(codingKey)); } catch { return false; } })();
  const mockData = (() => { try { return JSON.parse(localStorage.getItem(mockKey)) || {}; } catch { return {}; } })();

  const reviewed = interviews.filter(i => i.status === 'reviewed');
  const avgScore = reviewed.length ? Math.round(reviewed.reduce((s, i) => s + Number(i.rating || 0), 0) / reviewed.length * 10) / 10 : 0;
  const mcqPct = mcqData ? Math.round((mcqData.score / mcqData.total) * 100) : 0;
  const mockRoundsDone = Object.keys(mockData).length;

  const tasks = [
    { label: 'Profile Created', done: true, icon: '👤' },
    { label: 'Resume Uploaded', done: true, icon: '📄' },
    { label: 'Applied for a Job', done: true, icon: '💼' },
    { label: 'MCQ Test Submitted', done: !!mcqData, icon: '📝', detail: mcqData ? `${mcqData.score}/${mcqData.total} (${mcqPct}%)` : null },
    { label: 'Coding Test Submitted', done: codingDone, icon: '💻' },
    { label: 'Mock Interview Rounds', done: mockRoundsDone >= 3, icon: '🎤', detail: `${mockRoundsDone}/3 rounds` },
    { label: 'Interview Reviewed', done: reviewed.length > 0, icon: '🏆', detail: reviewed.length > 0 ? `Score: ${avgScore}/10` : null },
  ];

  const donePct = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

  const scores = [
    { label: 'MCQ', value: mcqPct, color: '#6366f1' },
    { label: 'Coding', value: codingDone ? 100 : 0, color: '#1f8f83' },
    { label: 'Mock', value: Math.round((mockRoundsDone / 3) * 100), color: '#d97706' },
    { label: 'Interview', value: avgScore ? Math.round(avgScore * 10) : 0, color: '#38a169' },
  ];

  return (
    <div className="grid" style={{ gap: 18 }}>
      {/* Overall progress */}
      <section className="panel">
        <h2><BarChart3 size={20} /> My Progress — {donePct}% Complete</h2>
        <div className="prog-overall-bar">
          <div className="prog-overall-fill" style={{ width: `${donePct}%` }} />
        </div>
        <div className="prog-tasks-grid">
          {tasks.map((t, i) => (
            <div key={i} className={`prog-task${t.done ? ' done' : ''}`}>
              <span className="prog-task-icon">{t.icon}</span>
              <div>
                <strong>{t.label}</strong>
                {t.detail && <span className="prog-task-detail">{t.detail}</span>}
              </div>
              <span className={`prog-task-status${t.done ? ' done' : ''}`}>{t.done ? '✓' : '○'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Score breakdown */}
      <section className="panel">
        <h2><Star size={20} /> Score Breakdown</h2>
        <div className="prog-scores-grid">
          {scores.map(s => (
            <div key={s.label} className="prog-score-card">
              <div className="prog-score-ring" style={{ '--pct': s.value, '--clr': s.color }}>
                <span>{s.value}%</span>
              </div>
              <strong>{s.label}</strong>
            </div>
          ))}
        </div>
      </section>

      {/* Interview history */}
      {interviews.length > 0 && (
        <section className="panel">
          <h2><CalendarClock size={20} /> Interview History</h2>
          <div className="adm-iv-list">
            {interviews.map(iv => (
              <div className="adm-iv-row" key={iv.id}>
                <div className="adm-iv-avatar">{(iv.title || 'I')[0].toUpperCase()}</div>
                <div className="adm-iv-info">
                  <strong>{iv.title}</strong>
                  <span>{new Date(iv.scheduled_at).toLocaleDateString()} · {iv.interviewer?.full_name || 'Interviewer'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className={`pill ${iv.status}`}>{iv.status}</span>
                  {iv.rating && <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1f8f83' }}>{iv.rating}/10</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
