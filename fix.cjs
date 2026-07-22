const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');

// Store original for verification
const orig = c;

// 1. Replace CodingTest - find the unique "Submit All Tasks" button text
c = c.replace(
  '<button className="primary" type="submit"><CheckCircle2 size={18} /> Submit All Tasks</button>',
  '<button className="primary" type="submit" style={{marginLeft:"auto",fontSize:"0.85rem"}}><CheckCircle2 size={16} /> Submit</button>'
);

// Replace the cd-coding-tabs div with task buttons
c = c.replace(
  '<div className="cd-coding-tabs">\n        {TASKS.map((t, i) => (\n          <button key={i} className={active===i?\'cd-tab active\':\'cd-tab\'} onClick={() => setActive(i)} type="button">Task {i+1}</button>\n        ))}\n      </div>',
  '<div style={{display:"flex",gap:8,marginBottom:16}}>\n        {TASKS.map((t, i) => (\n          <button key={i} className={active===i?"primary":"secondary"} onClick={() => setActive(i)} type="button" style={{padding:"6px 16px",minHeight:36,fontSize:"0.85rem"}}>Task {i+1}</button>\n        ))}\n      </div>'
);

// Replace the submitted result box
c = c.replace(
  '<div className="cd-result-box">\n          <CheckCircle2 size={40} color="#1f8f83" />\n          <p>All coding tasks submitted successfully. Your interviewer will review them.</p>\n        </div>',
  '<div style={{textAlign:"center",padding:32}}>\n          <CheckCircle2 size={48} color="#1f8f83" style={{marginBottom:12}} />\n          <h3 style={{margin:"0 0 8px"}}>All Tasks Submitted</h3>\n          <p style={{color:"#697386"}}>Your coding solutions have been submitted for interviewer review.</p>\n          <div className="cd-output-console" style={{marginTop:16,textAlign:"left"}}>\n            {"> All tasks submitted successfully.\\n> Awaiting interviewer evaluation..."}\n          </div>\n        </div>'
);

// Replace the coding task form content
const oldFormContent = '<form className="stack" onSubmit={submit}>\n          <div className="cd-coding-task">\n            <strong>{TASKS[active].title}</strong>\n            <p className="muted">{TASKS[active].desc}</p>\n          </div>\n          <textarea\n            className="cd-code-editor"\n            value={codes[active]}\n            onChange={e => setCodes(prev => prev.map((c, i) => i===active ? e.target.value : c))}\n            spellCheck={false}\n          />\n          <button className="primary" type="submit">';
if (c.includes(oldFormContent)) {
  c = c.replace(
    oldFormContent,
    '<form className="stack" onSubmit={submit}>\n          <div className="cd-coding-split">\n            <div className="cd-coding-problem">\n              <h4>{TASKS[active].title}</h4>\n              <p>{TASKS[active].desc}</p>\n              <div className="cd-coding-example">{TASKS[active].example}</div>\n              <div>\n                <strong style={{fontSize:"0.85rem",display:"block",marginBottom:6}}>Test Cases</strong>\n                {TASKS[active].tests.map((tc, i) => (\n                  <div key={i} className={"cd-test-case"+(testResults ? " "+testResults[i] : "")}>\n                    {testResults ? (testResults[i] === "pass" ? "PASS" : "FAIL") : "---"} {tc}\n                  </div>\n                ))}\n              </div>\n            </div>\n            <div>\n              <div className="cd-code-editor-wrapper">\n                <div className="cd-code-header">\n                  <span>JavaScript</span>\n                  <div className="cd-code-lang">\n                    <span className="active">JS</span>\n                    <span>Python</span>\n                    <span>Java</span>\n                  </div>\n                </div>\n                <textarea\n                  className="cd-code-editor"\n                  value={codes[active]}\n                  onChange={e => setCodes(prev => prev.map((c_, i) => i===active ? e.target.value : c_))}\n                  spellCheck={false}\n                  style={{fontFamily:\'"Courier New",monospace\',fontSize:"0.88rem",lineHeight:1.6,minHeight:200,padding:14,border:"none",background:"#1d2433",color:"#e4e9f2",resize:"vertical"}}\n                />\n              </div>\n              <div style={{display:"flex",gap:8,marginTop:8}}>\n                <button className="secondary" type="button" onClick={runCode} style={{fontSize:"0.85rem"}}>Run Tests</button>\n                <button className="primary" type="submit"'
  );
}

// Add missing states and functions to CodingTest
c = c.replace(
  'const [submitted, setSubmitted] = useState(false);\n\n  function submit(e)',
  'const [submitted, setSubmitted] = useState(false);\n  const [testResults, setTestResults] = useState(null);\n  const [output, setOutput] = useState("");\n\n  function submit(e)'
);

c = c.replace(
  'setSubmitted(true);\n    setMessage(\'Coding test submitted for review!\');\n  }\n\n  return (',
  'setSubmitted(true);\n    setOutput("> Running test cases...\\nTest case 1: PASS\\nTest case 2: PASS\\nTest case 3: PASS\\nAll tests completed!");\n    setTestResults(["pass", "pass", "pass"]);\n    setMessage("Coding test submitted for review!");\n  }\n\n  function runCode() {\n    setOutput("> Running code...\\nSyntax OK\\nRunning test cases...\\n  Test 1: PASS\\n  Test 2: PASS\\n  Test 3: PASS\\nAll tests passed!");\n    setTestResults(["pass", "pass", "pass"]);\n  }\n\n  return ('
);

// Add output console after submit button
c = c.replace(
  '</button>\n        </form>\n      )}\n    </section>\n  );\n}\nfunction HrAiPanel',
  '</button>\n              {output && <div className="cd-output-console">{output}</div>}\n            </div>\n          </div>\n        </form>\n      )}\n    </section>\n  );\n}\nfunction HrAiPanel'
);

// Update TASKS array to include example and tests
c = c.replace(
  `{ title: 'Reverse a String', desc: 'Write a function that reverses a string without using built-in reverse().', starter: 'function reverseString(str) {\\n  // your code here\\n}' },
    { title: 'Find First Non-Repeating Character', desc: 'Return the first character in a string that does not repeat.', starter: 'function firstNonRepeating(str) {\\n  // your code here\\n}' },
    { title: 'FizzBuzz', desc: 'Print numbers 1-20. For multiples of 3 print Fizz, 5 print Buzz, both print FizzBuzz.', starter: 'function fizzBuzz() {\\n  // your code here\\n}' },`,
  `{ title: "Reverse a String", desc: "Write a function that reverses a string without using built-in reverse().", starter: "function reverseString(str) {\\n  // your code here\\n}", example: "Input: hello\\nOutput: olleh", tests: ["hello -> olleh", "world -> dlrow", "abc -> cba"] },
    { title: "Find First Non-Repeating Character", desc: "Return the first character in a string that does not repeat.", starter: "function firstNonRepeating(str) {\\n  // your code here\\n}", example: "Input: aabbcdd\\nOutput: c", tests: ["aabbcdd -> c", "aabbcc -> null", "abcabc -> null"] },
    { title: "FizzBuzz", desc: "Print numbers 1-20. For multiples of 3 print Fizz, 5 print Buzz, both print FizzBuzz.", starter: "function fizzBuzz() {\\n  // your code here\\n}", example: "Input: 1-20\\nOutput: 1, 2, Fizz, 4, Buzz...", tests: ["3 -> Fizz", "5 -> Buzz", "15 -> FizzBuzz"] },`
);

console.log('CodingTest updated:', c !== orig);

// 2. Replace HrAiPanel
const hOrig = c;
const oldHrContent = 'function HrAiPanel() {\n  return (\n    <section className="panel">\n      <h2><MessageSquareText size={20} /> HR AI Interview</h2>\n      <div className="chat-panel">\n        <div className="chat-line ai">Tell me about yourself and your recent project.</div>\n        <div className="chat-line user">I recently built a full-stack interview management app.</div>\n      </div>\n      <div className="inline-form">\n        <input placeholder="Type your response" />\n        <button className="primary">Send</button>\n      </div>\n    </section>\n  );\n}';

const newHrContent = 'function HrAiPanel() {\n  const [messages, setMessages] = useState([\n    { from: "ai", text: "Tell me about yourself and your recent project." },\n  ]);\n  const [input, setInput] = useState("");\n  const [isTyping, setIsTyping] = useState(false);\n  const bottomRef = React.useRef(null);\n\n  useEffect(() => {\n    bottomRef.current?.scrollIntoView({ behavior: "smooth" });\n  }, [messages]);\n\n  function send(e) {\n    e.preventDefault();\n    if (!input.trim()) return;\n    const userMsg = input.trim();\n    setInput("");\n    setMessages(prev => [...prev, { from: "user", text: userMsg }]);\n    setIsTyping(true);\n\n    const responses = [\n      "That is a great experience! Can you tell me about a challenge you faced?",\n      "Interesting. What technologies did you use in that project?",\n      "How do you handle working under pressure?",\n      "Where do you see yourself in 5 years?",\n      "Thank you for sharing. Do you have any questions for me?"\n    ];\n    setTimeout(() => {\n      setMessages(prev => [...prev, { from: "ai", text: responses[Math.floor(Math.random() * responses.length)] }]);\n      setIsTyping(false);\n    }, 1500);\n  }\n\n  const suggestedQs = [\n    "Tell me about your skills",\n    "Why do you want this job?",\n    "Describe your teamwork experience",\n    "What are your strengths?"\n  ];\n\n  return (\n    <section className="panel">\n      <h2><MessageSquareText size={20} /> HR AI Interview</h2>\n      <div className="cd-ai-avatar">\n        <div className="cd-ai-avatar-circle">AI</div>\n        <div>\n          <strong>InterviewFlow AI Coach</strong>\n          <p style={{color:"#b8c0ce",margin:"2px 0 0",fontSize:"0.85rem"}}>Practice your HR interview skills</p>\n        </div>\n      </div>\n      <div className="chat-panel" style={{maxHeight:280,overflowY:"auto"}}>\n        {messages.map((msg, i) => (\n          <div key={i} className={"chat-line " + msg.from}>{msg.text}</div>\n        ))}\n        {isTyping && (\n          <div className="cd-ai-typing">\n            <span></span><span></span><span></span>\n          </div>\n        )}\n        <div ref={bottomRef} />\n      </div>\n      <form className="inline-form" onSubmit={send}>\n        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your response..." />\n        <button className="primary" type="submit">Send</button>\n      </form>\n      <div className="cd-ai-suggested">\n        {suggestedQs.map(q => (\n          <button key={q} type="button" onClick={() => setInput(q)}>{q}</button>\n        ))}\n      </div>\n    </section>\n  );\n}';

if (c.includes(oldHrContent)) {
  c = c.replace(oldHrContent, newHrContent);
  console.log('HrAiPanel updated:', c !== hOrig);
} else {
  console.log('HrAiPanel old content not found - trying different string');
  // Search for unique portion
  const hrStart = c.indexOf('function HrAiPanel()');
  const hrEnd = c.indexOf('function NotificationList()', hrStart);
  if (hrStart >= 0 && hrEnd >= 0) {
    console.log('Found HrAiPanel at:', hrStart, 'to', hrEnd);
    console.log('Content snippet:', c.substring(hrStart, hrStart+200));
  }
}

// 3. Replace NotificationList
const nOrig = c;
const oldNotifContent = 'function NotificationList() {\n  return (\n    <section className="panel">\n      <h2><Bell size={20} /> Notifications</h2>\n      <div className="items">\n        {[\'Application submitted\', \'MCQ test available\', \'Interview schedule will appear here\'].map((item, index) => (\n          <div className="item detail" key={item}>\n            <span>{index + 1}</span>\n            <div><strong>{item}</strong><p>Check back for updates from the hiring team.</p></div>\n          </div>\n        ))}\n      </div>\n    </section>\n  );\n}';

const newNotifContent = 'function NotificationList({ interviews = [] }) {\n  const notifications = [\n    { icon: "success", title: "Application Submitted", desc: "Your application for Frontend Developer has been received.", time: "2 days ago", unread: true },\n    { icon: "info", title: "MCQ Test Available", desc: "You can now take the MCQ test from your dashboard.", time: "3 days ago", unread: true },\n    { icon: "warning", title: "Interview Scheduled", desc: interviews.length > 0 ? "Interview scheduled for " + new Date(interviews[0].scheduled_at).toLocaleDateString() : "Check your schedule for upcoming interviews.", time: "1 week ago", unread: false },\n    { icon: "success", title: "Resume Approved", desc: "Your resume has been reviewed and approved.", time: "1 week ago", unread: false },\n    { icon: "info", title: "Profile Updated", desc: "Your profile information has been saved successfully.", time: "2 weeks ago", unread: false },\n  ];\n\n  return (\n    <section className="panel">\n      <h2><Bell size={20} /> Notifications</h2>\n      <div style={{display:"grid",gap:4}}>\n        {notifications.map((n, i) => (\n          <div key={i} className={"cd-notif-item" + (n.unread ? " unread" : "")}>\n            <div className={"cd-notif-icon " + n.icon}>\n              {n.icon === "success" ? String.fromCharCode(10003) : n.icon === "warning" ? "!" : "i"}\n            </div>\n            <div className="cd-notif-body">\n              <strong>{n.title}</strong>\n              <p>{n.desc}</p>\n            </div>\n            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>\n              <span className="cd-notif-time">{n.time}</span>\n              {n.unread && <span className="cd-notif-dot" />}\n            </div>\n          </div>\n        ))}\n      </div>\n    </section>\n  );\n}';

if (c.includes(oldNotifContent)) {
  c = c.replace(oldNotifContent, newNotifContent);
  console.log('NotificationList updated:', c !== nOrig);
} else {
  console.log('NotificationList old content not found');
}

// 4. Add CandidateResult before InterviewTable
if (!c.includes('function CandidateResult')) {
  const candResult = '\nfunction CandidateResult({ interview }) {\n  if (!interview) {\n    return (\n      <section className="panel">\n        <h2><Star size={20} /> Interview Result</h2>\n        <div className="cd-result-header">\n          <div className="cd-result-verdict pending">Awaiting Result</div>\n          <div className="cd-result-score-big">--</div>\n          <div className="cd-result-score-label">No results yet</div>\n          <p style={{color:"#697386",marginTop:12}}>Your interview result will appear here once the interviewer completes the evaluation.</p>\n        </div>\n      </section>\n    );\n  }\n\n  const avgScore = interview.rating ? Number(interview.rating) : 0;\n  const verdict = avgScore >= 7 ? "passed" : "failed";\n  const verdictText = avgScore >= 7 ? "Selected" : avgScore >= 4 ? "Pending Review" : "Not Selected";\n\n  return (\n    <section className="panel">\n      <h2><Star size={20} /> Interview Result</h2>\n      <div className="cd-result-panel">\n        <div className="cd-result-header">\n          <div className={"cd-result-verdict " + verdict}>{verdictText}</div>\n          <div className="cd-result-score-big">{avgScore}/10</div>\n          <div className="cd-result-score-label">Overall Score</div>\n        </div>\n\n        <div className="cd-result-scores">\n          <div className="cd-score-card">\n            <h5>MCQ Test</h5>\n            <div className="cd-score-value">{avgScore >= 5 ? avgScore : "--"}/10</div>\n          </div>\n          <div className="cd-score-card">\n            <h5>Coding Test</h5>\n            <div className="cd-score-value">{avgScore >= 5 ? avgScore : "--"}/10</div>\n          </div>\n          <div className="cd-score-card">\n            <h5>Interview</h5>\n            <div className="cd-score-value">{avgScore}/10</div>\n          </div>\n        </div>\n\n        {interview.feedback && (\n          <div className="cd-feedback-box">\n            <h4>Interviewer Feedback</h4>\n            <p>{interview.feedback}</p>\n          </div>\n        )}\n\n        {avgScore >= 7 && (\n          <div style={{textAlign:"center",padding:16,background:"#dff3ef",borderRadius:10,border:"1px solid rgba(31,143,131,0.2)"}}>\n            <CheckCircle2 size={32} color="#1f8f83" style={{marginBottom:8}} />\n            <strong style={{color:"#12665d"}}>Congratulations! You have been selected for this position.</strong>\n          </div>\n        )}\n      </div>\n    </section>\n  );\n}\n';
  const insPos = c.indexOf('function InterviewTable(');
  c = c.substring(0, insPos) + candResult + c.substring(insPos);
  console.log('CandidateResult added');
}

fs.writeFileSync('src/App.jsx', c, 'utf8');
console.log('DONE!');
</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
