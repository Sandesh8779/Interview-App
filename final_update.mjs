import fs from 'fs';
let c = fs.readFileSync('src/App.jsx', 'utf8');

// ===== 1. REPLACE CODING TEST =====
let s = c.indexOf('function CodingTest');
let e = c.indexOf('function HrAiPanel', s);
let oldFunc = c.substring(s, e);
let newFunc = `function CodingTest({ setMessage }) {
  const TASKS = [
    { title: "Reverse a String", desc: "Write a function that reverses a string without using built-in reverse().", starter: "function reverseString(str) {\\n  // your code here\\n}", example: "Input: hello\\nOutput: olleh", tests: ["hello -> olleh", "world -> dlrow", "abc -> cba"] },
    { title: "Find First Non-Repeating Character", desc: "Return the first character in a string that does not repeat.", starter: "function firstNonRepeating(str) {\\n  // your code here\\n}", example: "Input: aabbcdd\\nOutput: c", tests: ["aabbcdd -> c", "aabbcc -> null", "abcabc -> null"] },
    { title: "FizzBuzz", desc: "Print numbers 1-20. For multiples of 3 print Fizz, 5 print Buzz, both print FizzBuzz.", starter: "function fizzBuzz() {\\n  // your code here\\n}", example: "Input: 1-20\\nOutput: 1, 2, Fizz, 4, Buzz...", tests: ["3 -> Fizz", "5 -> Buzz", "15 -> FizzBuzz"] },
  ];
  const [active, setActive] = useState(0);
  const [codes, setCodes] = useState(TASKS.map(t => t.starter));
  const [submitted, setSubmitted] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [output, setOutput] = useState("");

  function submit(e) {
    e.preventDefault();
    setSubmitted(true);
    setOutput("> Running test cases...\\nTest case 1: PASS\\nTest case 2: PASS\\nTest case 3: PASS\\nAll tests completed!");
    setTestResults(["pass", "pass", "pass"]);
    setMessage("Coding test submitted for review!");
  }

  function runCode() {
    setOutput("> Running code...\\nSyntax OK\\nRunning test cases...\\n  Test 1: PASS\\n  Test 2: PASS\\n  Test 3: PASS\\nAll tests passed!");
    setTestResults(["pass", "pass", "pass"]);
  }

  return (
    <section className="panel">
      <h2><Code2 size={20} /> Coding Test</h2>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {TASKS.map((t, i) => (
          <button key={i} className={active===i?"primary":"secondary"} onClick={() => setActive(i)} type="button" style={{padding:"6px 16px",minHeight:36,fontSize:"0.85rem"}}>Task {i+1}</button>
        ))}
      </div>
      {submitted ? (
        <div style={{textAlign:"center",padding:32}}>
          <CheckCircle2 size={48} color="#1f8f83" style={{marginBottom:12}} />
          <h3 style={{margin:"0 0 8px"}}>All Tasks Submitted</h3>
          <p style={{color:"#697386"}}>Your coding solutions have been submitted for interviewer review.</p>
          <div className="cd-output-console" style={{marginTop:16,textAlign:"left"}}>
            {"> All tasks submitted successfully.\\n> Awaiting interviewer evaluation..."}
          </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <div className="cd-coding-split">
            <div className="cd-coding-problem">
              <h4>{TASKS[active].title}</h4>
              <p>{TASKS[active].desc}</p>
              <div className="cd-coding-example">{TASKS[active].example}</div>
              <div>
                <strong style={{fontSize:"0.85rem",display:"block",marginBottom:6}}>Test Cases</strong>
                {TASKS[active].tests.map((tc, i) => (
                  <div key={i} className={"cd-test-case"+(testResults ? " "+testResults[i] : "")}>
                    {testResults ? (testResults[i] === "pass" ? "PASS" : "FAIL") : "---"} {tc}
                  </div>
                ))}
              </div>
            <div>
              <div className="cd-code-editor-wrapper">
                <div className="cd-code-header">
                  <span>JavaScript</span>
                  <div className="cd-code-lang">
                    <span className="active">JS</span>
                    <span>Python</span>
                    <span>Java</span>
                  </div>
                <textarea
                  className="cd-code-editor"
                  value={codes[active]}
                  onChange={e => setCodes(prev => prev.map((c_, i) => i===active ? e.target.value : c_))}
                  spellCheck={false}
                  style={{fontFamily:'"Courier New",monospace',fontSize:"0.88rem",lineHeight:1.6,minHeight:200,padding:14,border:"none",background:"#1d2433",color:"#e4e9f2",resize:"vertical"}}
                />
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button className="secondary" type="button" onClick={runCode} style={{fontSize:"0.85rem"}}>Run Tests</button>
                <button className="primary" type="submit" style={{marginLeft:"auto",fontSize:"0.85rem"}}><CheckCircle2 size={16} /> Submit</button>
              </div>
              {output && <div className="cd-output-console">{output}</div>}
            </div>
        </form>
      )}
    </section>
  );
}`;
c = c.substring(0, s) + newFunc + c.substring(e);
console.log('Replaced CodingTest');

// ===== 2. REPLACE HR AI PANEL =====
s = c.indexOf('function HrAiPanel');
e = c.indexOf('function NotificationList', s);
oldFunc = c.substring(s, e);
newFunc = `function HrAiPanel() {
  const [messages, setMessages] = useState([
    { from: "ai", text: "Tell me about yourself and your recent project." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = React.useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setIsTyping(true);

    const responses = [
      "That is a great experience! Can you tell me about a challenge you faced?",
      "Interesting. What technologies did you use in that project?",
      "How do you handle working under pressure?",
      "Where do you see yourself in 5 years?",
      "Thank you for sharing. Do you have any questions for me?"
    ];
    setTimeout(() => {
      setMessages(prev => [...prev, { from: "ai", text: responses[Math.floor(Math.random() * responses.length)] }]);
      setIsTyping(false);
    }, 1500);
  }

  const suggestedQs = [
    "Tell me about your skills",
    "Why do you want this job?",
    "Describe your teamwork experience",
    "What are your strengths?"
  ];

  return (
    <section className="panel">
      <h2><MessageSquareText size={20} /> HR AI Interview</h2>
      <div className="cd-ai-avatar">
        <div className="cd-ai-avatar-circle">AI</div>
        <div>
          <strong>InterviewFlow AI Coach</strong>
          <p style={{color:"#b8c0ce",margin:"2px 0 0",fontSize:"0.85rem"}}>Practice your HR interview skills</p>
        </div>
      <div className="chat-panel" style={{maxHeight:280,overflowY:"auto"}}>
        {messages.map((msg, i) => (
          <div key={i} className={"chat-line " + msg.from}>{msg.text}</div>
        ))}
        {isTyping && (
          <div className="cd-ai-typing">
            <span></span><span></span><span></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form className="inline-form" onSubmit={send}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your response..." />
        <button className="primary" type="submit">Send</button>
      </form>
      <div className="cd-ai-suggested">
        {suggestedQs.map(q => (
          <button key={q} type="button" onClick={() => setInput(q)}>{q}</button>
        ))}
      </div>
    </section>
  );
}`;
c = c.substring(0, s) + newFunc + c.substring(e);
console.log('Replaced HrAiPanel');

// ===== 3. REPLACE NOTIFICATION LIST =====
s = c.indexOf('function NotificationList');
e = c.indexOf('function InterviewTable', s);
oldFunc = c.substring(s, e);
newFunc = `function NotificationList({ interviews = [] }) {
  const notifications = [
    { icon: "success", title: "Application Submitted", desc: "Your application for Frontend Developer has been received.", time: "2 days ago", unread: true },
    { icon: "info", title: "MCQ Test Available", desc: "You can now take the MCQ test from your dashboard.", time: "3 days ago", unread: true },
    { icon: "warning", title: "Interview Scheduled", desc: interviews.length > 0 ? "Interview scheduled for " + new Date(interviews[0].scheduled_at).toLocaleDateString() : "Check your schedule for upcoming interviews.", time: "1 week ago", unread: false },
    { icon: "success", title: "Resume Approved", desc: "Your  has been reviewed and approved.", time: "1 week ago", unread: false },
    { icon: "info", title: "Profile Updated", desc: "Your profile information has been saved successfully.", time: "2 weeks ago", unread: false },
  ];

  return (
    <section className="panel">
      <h2><Bell size={20} /> Notifications</h2>
      <div style={{display:"grid",gap:4}}>
        {notifications.map((n, i) => (
          <div key={i} className={"cd-notif-item" + (n.unread ? " unread" : "")}>
            <div className={"cd-notif-icon " + n.icon}>
              {n.icon === "success" ? String.fromCharCode(10003) : n.icon === "warning" ? "!" : "i"}
            </div>
            <div className="cd-notif-body">
              <strong>{n.title}</strong>
              <p>{n.desc}</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <span className="cd-notif-time">{n.time}</span>
              {n.unread && <span className="cd-notif-dot" />}
            </div>
        ))}
      </div>
    </section>
  );
}`;
c = c.substring(0, s) + newFunc + c.substring(e);
console.log('Replaced NotificationList');

// ===== 4. ADD CANDIDATE RESULT =====
if (!c.includes('function CandidateResult')) {
  let insPos = c.indexOf('function InterviewTable(');
  let candResult = `
function CandidateResult({ interview }) {
  if (!interview) {
    return (
      <section className="panel">
        <h2><Star size={20} /> Interview Result</h2>
        <div className="cd-result-header">
          <div className="cd-result-verdict pending">Awaiting Result</div>
          <div className="cd-result-score-big">--</div>
          <div className="cd-result-score-label">No results yet</div>
          <p style={{color:"#697386",marginTop:12}}>Your interview result will appear here once the interviewer completes the evaluation.</p>
        </div>
      </section>
    );
  }

  const avgScore = interview.rating ? Number(interview.rating) : 0;
  const verdict = avgScore >= 7 ? "passed" : "failed";
  const verdictText = avgScore >= 7 ? "Selected" : avgScore >= 4 ? "Pending Review" : "Not Selected";

  return (
    <section className="panel">
      <h2><Star size={20} /> Interview Result</h2>
      <div className="cd-result-panel">
        <div className="cd-result-header">
          <div className={"cd-result-verdict " + verdict}>{verdictText}</div>
          <div className="cd-result-score-big">{avgScore}/10</div>
          <div className="cd-result-score-label">Overall Score</div>

        <div className="cd-result-scores">
          <div className="cd-score-card">
            <h5>MCQ Test</h5>
            <div className="cd-score-value">{avgScore >= 5 ? avgScore : "--"}/10</div>
          <div className="cd-score-card">
            <h5>Coding Test</h5>
            <div className="cd-score-value">{avgScore >= 5 ? avgScore : "--"}/10</div>
          <div className="cd-score-card">
            <h5>Interview</h5>
            <div className="cd-score-value">{avgScore}/10</div>
        </div>

        {interview.feedback && (
          <div className="cd-feedback-box">
            <h4>Interviewer Feedback</h4>
            <p>{interview.feedback}</p>
          </div>
        )}

        {avgScore >= 7 && (
          <div style={{textAlign:"center",padding:16,background:"#dff3ef",borderRadius:10,border:"1px solid rgba(31,143,131,0.2)"}}>
            <CheckCircle2 size={32} color="#1f8f83" style={{marginBottom:8}} />
            <strong style={{color:"#12665d"}}>Congratulations! You have been selected for this position.</strong>
          </div>
        )}
      </div>
    </section>
  );
}
`;
  c = c.substring(0, insPos) + candResult + c.substring(insPos);
  console.log('Added CandidateResult');
}

fs.writeFileSync('src/App.jsx', c, 'utf8');
console.log('DONE! All updates applied.');
</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
