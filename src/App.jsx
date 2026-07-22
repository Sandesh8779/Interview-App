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
  Plus,
  Settings,
  ShieldCheck,
  Star,
  Upload,
  UserCheck,
  Users
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
    return <div className="boot">Loading InterviewFlow...</div>;
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
    { id: 'schedule', label: 'Interview Schedule', icon: CalendarClock },
    { id: 'mcq', label: 'Take MCQ Test', icon: ClipboardCheck },
    { id: 'coding', label: 'Coding Test', icon: Code2 },
    { id: 'hr-ai', label: 'HR AI Interview', icon: MessageSquareText },
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
  const candidates = profiles.filter((person) => person.role === 'candidate');
  const interviewers = profiles.filter((person) => person.role === 'interviewer');
  const todayCount = interviews.filter((item) => isToday(item.scheduled_at)).length;
  const selected = interviews.filter((item) => item.status === 'reviewed' && Number(item.rating) >= 7).length;
  const rejected = interviews.filter((item) => item.status === 'reviewed' && Number(item.rating) < 7).length;

  async function createInterview(event) {
    event.preventDefault();
    await api('/interviews', {
      method: 'POST',
      body: JSON.stringify({ ...form, scheduled_at: new Date(form.scheduled_at).toISOString() })
    });
    setForm(emptyInterview);
    setMessage('Interview scheduled and interviewer assigned.');
    await reload();
  }

  async function changeRole(id, role) {
    await api(`/profiles/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    await reload();
  }

  if (section === 'dashboard') {
    return (
      <div className="grid">
        <div className="metric-grid">
          <Metric icon={Users} label="Total Candidates" value={candidates.length} accent="green" trend={8} />
          <Metric icon={UserCheck} label="Total Interviewers" value={interviewers.length} accent="blue" trend={12} />
          <Metric icon={CalendarClock} label="Today's Interviews" value={todayCount} accent="amber" trend={-3} />
          <Metric icon={CheckCircle2} label="Selected Candidates" value={selected} accent="purple" trend={15} />
          <Metric icon={ClipboardCheck} label="Rejected Candidates" value={rejected} />
        </div>
        <div className="grid two" style={{gridColumn:'1/-1'}}>
          <section className="panel">
            <h2><BarChart3 size={20} /> Hiring Trend</h2>
            <TrendChart values={[8, 12, 10, 18, 16, Math.max(interviews.length, 6)]} labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Now']} />
          </section>
          <InterviewDetails interview={activeInterview} />
        </div>
        <section className="panel wide">
          <h2><CalendarClock size={20} /> Recent Interviews</h2>
          <InterviewTable interviews={interviews.slice(0, 5)} />
        </section>
      </div>
    );
  }

  if (section === 'interviewers' || section === 'candidates') {
    const role = section === 'interviewers' ? 'interviewer' : 'candidate';
    return <PeopleManager title={section === 'interviewers' ? 'Manage Interviewers' : 'Manage Candidates'} people={profiles.filter((person) => person.role === role)} allProfiles={profiles} changeRole={changeRole} />;
  }

  if (section === 'jobs') {
    return <JobsPanel />;
  }

  if (section === 'schedule') {
    return (
      <div className="grid two">
        <section className="panel">
          <h2><Plus size={20} /> Schedule Interviews</h2>
          <form className="stack" onSubmit={createInterview}>
            <input placeholder="Interview title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            <textarea placeholder="Job, round, meeting link, or instructions" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <select value={form.candidate_id} onChange={(event) => setForm({ ...form, candidate_id: event.target.value })} required>
              <option value="">Select candidate</option>
              {candidates.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
            </select>
            <select value={form.interviewer_id} onChange={(event) => setForm({ ...form, interviewer_id: event.target.value })} required>
              <option value="">Assign interviewer</option>
              {interviewers.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
            </select>
            <input type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })} required />
            <input type="number" min="15" step="15" value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: Number(event.target.value) })} />
            <button className="primary" type="submit"><Plus size={18} /> Create schedule</button>
          </form>
        </section>
        <InterviewTable interviews={interviews} />
      </div>
    );
  }

  if (section === 'questions') {
    return <QuestionBank />;
  }

  if (section === 'reports') {
    return <ReportsPanel interviews={interviews} candidates={candidates} interviewers={interviewers} />;
  }

  if (section === 'notifications') {
    return <NotificationPanel />;
  }

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
    const iv = activeInterview;
    return (
      <div className="grid two">
        <section className="panel">
          <div className="iv-candidate-hero">
            <div className="iv-candidate-avatar">{(iv.candidate?.full_name || 'C')[0].toUpperCase()}</div>
            <div>
              <h3 style={{margin:'0 0 4px'}}>{iv.candidate?.full_name || 'Candidate'}</h3>
              <p style={{margin:0,color:'#697386',fontSize:'0.9rem'}}>{iv.candidate?.email || 'No email'}</p>
              <span className={`pill ${iv.status}`} style={{marginTop:8,display:'inline-flex'}}>{iv.status}</span>
            </div>
          </div>
          <div className="iv-candidate-stats">
            <div className="iv-cstat"><span>Position</span><strong>{iv.title}</strong></div>
            <div className="iv-cstat"><span>Scheduled</span><strong>{new Date(iv.scheduled_at).toLocaleDateString()}</strong></div>
            <div className="iv-cstat"><span>Duration</span><strong>{iv.duration_minutes} mins</strong></div>
            <div className="iv-cstat"><span>Rating</span><strong>{iv.rating ? `${iv.rating}/10` : 'Pending'}</strong></div>
          </div>
        </section>
        <InterviewDetails interview={iv} />
      </div>
    );
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
  if (section === 'schedule') return <CandidateSchedule interviews={interviews} />;
  if (section === 'mcq') return <MCQTest setMessage={setMessage} />;
  if (section === 'coding') return <CodingTest setMessage={setMessage} />;
  if (section === 'hr-ai') return <HrAiPanel />;
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
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [upcoming]);

  const reviewed = interviews.filter(i => i.status === 'reviewed');
  const avgScore = reviewed.length ? Math.round(reviewed.reduce((s, i) => s + Number(i.rating || 0), 0) / reviewed.length * 10) / 10 : 0;

  const appSteps = [
    { key: 'applied', label: 'Applied', done: true },
    { key: 'screened', label: 'Screened', done: true },
    { key: 'test', label: 'Test', done: interviews.some(i => i.status === 'submitted' || i.status === 'reviewed') },
    { key: 'interview', label: 'Interview', done: interviews.some(i => i.status === 'reviewed') },
    { key: 'result', label: 'Result', done: reviewed.length > 0 },
  ];
  const progressDone = appSteps.filter(s => s.done).length;
  const stepsCount = appSteps.length;

  const activities = [
    { icon: 'success', text: 'Profile created successfully', time: '2 weeks ago' },
    { icon: 'info', text: 'Applied for Frontend Developer', time: '5 days ago' },
    { icon: 'success', text: 'Resume uploaded', time: '4 days ago' },
    ...(interviews.some(i => i.status === 'scheduled')
      ? [{ icon: 'warning', text: `Interview scheduled: ${upcoming?.title || 'Interview'}`, time: 'Today' }]
      : []),
    ...(reviewed.length > 0
      ? [{ icon: 'success', text: `Interview completed - Score: ${avgScore}/10`, time: 'Recently' }]
      : []),
  ];

  return (
    <div className="grid">
      <div className="metric-grid three">
        <Metric icon={BriefcaseBusiness} label="Applied Jobs" value={jobPositions.length} />
        <Metric icon={CalendarClock} label="Interviews" value={interviews.length} />
        <Metric icon={Star} label="Avg Score" value={avgScore ? `${avgScore}/10` : 'Awaiting'} />
      </div>

      {/* Application Progress Timeline */}
      <section className="panel">
        <h2><BarChart3 size={20} /> Application Progress</h2>
        <div className="cd-timeline">
          <div className="cd-timeline-line">
            <div className="cd-timeline-line-fill" style={{width: `${(progressDone / (stepsCount - 1)) * 100}%`}} />
          </div>
          {appSteps.map((step, idx) => (
            <div className="cd-timeline-step" key={step.key}>
              <div className={`cd-timeline-dot ${step.done ? 'completed' : idx === progressDone ? 'active' : ''}`}>
                {step.done ? '✓' : idx + 1}
              </div>
              <span className={`cd-timeline-label ${step.done ? 'completed' : idx === progressDone ? 'active' : ''}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {upcoming && (
        <section className="panel cd-countdown-panel">
          <div className="cd-countdown-left">
            <span className="cd-countdown-label">⏰ Next Interview Countdown</span>
            <div className="cd-countdown-timer" style={{fontSize:'2.4rem',fontWeight:900,color:'#1f8f83'}}>{countdown}</div>
            <p className="muted">{upcoming.title} — {new Date(upcoming.scheduled_at).toLocaleString()}</p>
          </div>
          <div className="cd-countdown-right">
            <span className={`pill ${upcoming.status}`}>{upcoming.status}</span>
            <span className="muted">with {upcoming.interviewer?.full_name || 'Interviewer'}</span>
          </div>
        </section>
      )}

      <section className="panel">
        <h2><BarChart3 size={20} /> Performance Overview</h2>
        <TrendChart
          values={[72, 81, activeInterview?.rating ? activeInterview.rating * 10 : 0]}
          labels={['MCQ', 'Coding', 'Interview']}
        />
      </section>

      {/* Recent Activity Feed */}
      <section className="panel">
        <h2><Bell size={20} /> Recent Activity</h2>
        <div className="cd-activity-feed">
          {activities.map((act, i) => (
            <div className="cd-activity-item" key={i}>
              <div className={`cd-activity-icon ${act.icon}`}>✓</div>
              <div className="cd-activity-content">
                <p>{act.text}</p>
                <span className="cd-activity-time">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2><CalendarClock size={20} /> Recent Interviews</h2>
        {interviews.length === 0 ? <p className="muted">No interviews scheduled yet.</p> : (
          <div className="table-list">
            {interviews.slice(0, 5).map(iv => (
              <div className="row status-row" key={iv.id}>
                <div>
                  <strong>{iv.title}</strong>
                  <span>{new Date(iv.scheduled_at).toLocaleString()} · {iv.interviewer?.full_name || 'Interviewer'}</span>
                </div>
                <span className={`pill ${iv.status}`}>{iv.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, accent, trend }) {
  return (
    <section className={`metric${accent ? ' accent-' + accent : ''}`}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Icon size={22} />
        {trend !== undefined && (
          <span style={{fontSize:'0.78rem',fontWeight:700,display:'flex',alignItems:'center',gap:3,color: trend >= 0 ? '#38a169' : '#e53e3e'}}>
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

function MCQTest({ setMessage }) {
  const MCQ = [
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
  ];
  const TIME = 1800;
  const [sel, setSel] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [currentQ, setCurrentQ] = useState(0);
  const [flagged, setFlagged] = useState({});

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) { submit(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, submitted]);

  function submit() {
    const s = MCQ.reduce((acc, q, i) => acc + (sel[i] === q.ans ? 1 : 0), 0);
    setScore(s);
    setSubmitted(true);
    setMessage(`MCQ submitted! Score: ${s}/${MCQ.length}`);
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const answeredCount = Object.keys(sel).length;

  function toggleFlag(i) {
    setFlagged(prev => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <section className="panel">
      <h2 style={{justifyContent:'space-between'}}>
        <span><ClipboardCheck size={20} /> MCQ Test</span>
        {!submitted && <span className={`cd-timer${timeLeft < 60 ? ' danger' : ''}`} style={{fontSize:'0.95rem',fontWeight:700}}>⏱ {mins}:{secs}</span>}
      </h2>

      {!submitted && (
        <>
          <div className="cd-mcq-progress">
            <div className="cd-mcq-progress-bar">
              <div className="cd-mcq-progress-fill" style={{width:`${(answeredCount / MCQ.length) * 100}%`}} />
            </div>
            <span className="cd-mcq-progress-text">{answeredCount}/{MCQ.length} answered</span>
          </div>

          <div className="cd-mcq-nav">
            {MCQ.map((_, i) => (
              <button
                key={i}
                className={`cd-mcq-nav-btn${currentQ === i ? ' active' : ''}${sel[i] !== undefined ? ' answered' : ''}${flagged[i] ? ' flagged' : ''}`}
                onClick={() => setCurrentQ(i)}
                type="button"
                title={flagged[i] ? 'Flagged' : ''}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {submitted ? (
        <div className="cd-result-box">
          <div className="cd-result-score">{score}/{MCQ.length}</div>
          <p>You answered {score} out of {MCQ.length} correctly.</p>
          <div className="items" style={{marginTop:16}}>
            {MCQ.map((q, i) => (
              <div className="item" key={i} style={{gridTemplateColumns:'34px 1fr'}}>
                <span style={{background: sel[i]===q.ans?'#dff3ef':'#fde7e7', color: sel[i]===q.ans?'#12665d':'#9f1f1f'}}>{sel[i]===q.ans?'✓':'✗'}</span>
                <div><strong>{q.q}</strong><p style={{color:'#1f8f83',marginTop:4}}>Correct: {q.opts[q.ans]}</p></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="cd-mcq-q" key={currentQ}>
            <p style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong>Question {currentQ + 1} of {MCQ.length}</strong>
              <span
                onClick={() => toggleFlag(currentQ)}
                style={{cursor:'pointer',fontSize:'1.2rem',opacity:flagged[currentQ]?1:0.4}}
                title={flagged[currentQ] ? 'Unflag' : 'Flag for review'}
              >
                🚩
              </span>
            </p>
            <p style={{fontSize:'1.1rem',margin:'8px 0 16px'}}><strong>{MCQ[currentQ].q}</strong></p>
            <div className="cd-mcq-opts" style={{display:'grid',gap:10}}>
              {MCQ[currentQ].opts.map((opt, j) => (
                <label key={j} className={`cd-mcq-opt${sel[currentQ]===j?' selected':''}`} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,border:'1.5px solid',borderColor:sel[currentQ]===j?'#1f8f83':'#dde2ea',background:sel[currentQ]===j?'#f0faf9':'#fff',cursor:'pointer',transition:'all 0.15s'}}>
                  <input type="radio" name={`q${currentQ}`} checked={sel[currentQ]===j} onChange={() => setSel(p => ({...p,[currentQ]:j}))} style={{width:18,height:18,accentColor:'#1f8f83'}} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {currentQ > 0 && <button className="secondary" type="button" onClick={() => setCurrentQ(p => p - 1)}>← Previous</button>}
            {currentQ < MCQ.length - 1 && <button className="secondary" type="button" onClick={() => setCurrentQ(p => p + 1)}>Next →</button>}
            <button className="primary" type="submit" style={{marginLeft:'auto'}}><CheckCircle2 size={18} /> Submit MCQ Test</button>
          </div>
        </form>
      )}
    </section>
  );
}

function CodingTest({ setMessage }) {
  const TASKS = [
    { title: 'Palindrome Check', desc: 'Write a function that checks if a given string is a palindrome. Ignore case, spaces, and non-alphanumeric characters.', starter: 'function isPalindrome(str) {\n  // your code here\n}' },
    { title: 'Rotate Array', desc: 'Rotate an array to the right by k steps in-place without using extra space for another array.', starter: 'function rotateArray(nums, k) {\n  // your code here\n}' },
    { title: 'Find Missing Number', desc: 'Given an array containing n distinct numbers taken from 0, 1, 2, ..., n, find the one that is missing from the array.', starter: 'function findMissingNumber(nums) {\n  // your code here\n}' },
  ];
  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState(TASKS.map(t => t.starter));
  const [submitted, setSubmitted] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setMessage('Coding test submitted for review!');
  }

  return (
    <section className="panel">
      <h2><Code2 size={20} /> Coding Test</h2>
      <div className="cd-coding-tabs">
        {TASKS.map((t, i) => (
          <button key={i} className={active===i?'cd-tab active':'cd-tab'} onClick={() => setActive(i)} type="button">Task {i+1}</button>
        ))}
      </div>
      {submitted ? (
        <div className="cd-result-box">
          <CheckCircle2 size={40} color="#1f8f83" />
          <p>All coding tasks submitted successfully. Your interviewer will review them.</p>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
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
          <button className="primary" type="submit"><CheckCircle2 size={18} /> Submit All Tasks</button>
        </form>
      )}
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

function HrAiPanel() {
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hello! I am your AI HR interviewer. I will ask you some common HR questions. Take your time and answer thoughtfully. Would you like to begin?' }
  ]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState('intro');
  const bottomRef = React.useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const hrQuestions = [
    'Tell me about yourself and your background.',
    'Why do you want to work in this role?',
    'What are your greatest strengths and weaknesses?',
    'Describe a challenging situation you faced and how you handled it.',
    'Where do you see yourself in five years?',
    'Why should we hire you over other candidates?',
    'Tell me about a time you worked in a team to achieve a goal.',
    'What motivates you to perform your best?',
    'How do you handle criticism or feedback?',
    'Do you have any questions for us?'
  ];
  const [qIndex, setQIndex] = useState(-1);

  function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');

    if (phase === 'intro') {
      setMessages(prev => [...prev, { from: 'ai', text: 'Great! Let us begin with the first question.' }]);
      setQIndex(0);
      setPhase('ongoing');
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'ai', text: hrQuestions[0] }]);
      }, 600);
    } else if (qIndex < hrQuestions.length - 1) {
      const next = qIndex + 1;
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'ai', text: hrQuestions[next] }]);
        setQIndex(next);
      }, 800);
    } else {
      setPhase('done');
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'ai', text: 'Thank you for completing the HR interview round! Your responses have been recorded and will be reviewed by the hiring team. Good luck! 🎯' }]);
      }, 600);
    }
  }

  const suggestedQs = [
    'Yes, I am ready!',
    'Tell me about yourself',
    'What are my strengths?',
    'Why should we hire you?'
  ];

  return (
    <section className="panel">
      <h2><MessageSquareText size={20} /> HR AI Interview</h2>
      <div className="cd-ai-avatar">
        <div className="cd-ai-avatar-circle">🤖</div>
        <div>
          <strong>AI HR Interviewer</strong>
          <p style={{margin:0,color:'#b8c0ce',fontSize:'0.85rem'}}>Powered by smart questioning</p>
        </div>
      </div>

      <div className="chat-panel">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-line ${msg.from}`}>{msg.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>

      {phase === 'done' ? (
        <div className="cd-result-box" style={{textAlign:'center',padding:20}}>
          <CheckCircle2 size={36} color="#1f8f83" />
          <p style={{fontWeight:700,marginTop:8}}>HR Interview Completed</p>
        </div>
      ) : (
        <form className="inline-form" onSubmit={send}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={phase === 'intro' ? 'Type "Yes" to begin or ask a question...' : 'Type your answer...'}
          />
          <button className="primary" type="submit"><MessageSquareText size={16} /> Send</button>
        </form>
      )}

      {phase === 'intro' && (
        <div className="cd-ai-suggested">
          {suggestedQs.map((sq, i) => (
            <button key={i} type="button" onClick={() => { setInput(sq); }}>{sq}</button>
          ))}
        </div>
      )}
    </section>
  );
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
