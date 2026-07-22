const fs = require('fs');
const code = fs.readFileSync(__dirname + '/src/App.jsx', 'utf8');

// Strategy: Use simple string replacements with hex escapes for tricky chars
// All replacements made via substring matching

// Helpers
const Q = String.fromCharCode(34); // double quote
const SQ = String.fromCharCode(39); // single quote
const NL = String.fromCharCode(10); // newline
const TB = String.fromCharCode(9);  // tab
const check = String.fromCharCode(10003);

let modified = false;
let result = code;

// 1. Add CandidateResult before InterviewTable if missing
if (!result.includes('function CandidateResult')) {
  const marker = 'function InterviewTable(';
  const idx = result.indexOf(marker);
  if (idx >= 0) {
    const comp = [
      '',
      'function CandidateResult({ interview }) {',
      '  if (!interview) {',
      '    return (',
      '      <' + 'section className="panel">',
      '        <h2><Star size={20} /> Interview Result</h2>',
      '        <div className="cd-result-header">',
      '          <div className="cd-result-verdict pending">Awaiting Result</div>',
      '          <div className="cd-result-score-big">--</div>',
      '          <div className="cd-result-score-label">No results yet</div>',
      '          <p style={{color:"#697386",marginTop:12}}>Your interview result will appear here once the interviewer completes the evaluation.</p>',
      '        </div>',
      '      </section>',
      '    );',
      '  }',
      '',
      '  const avgScore = interview.rating ? Number(interview.rating) : 0;',
      '  const verdict = avgScore >= 7 ? ' + Q + 'passed' + Q + ' : ' + Q + 'failed' + Q + ';',
      '  const verdictText = avgScore >= 7 ? ' + Q + 'Selected' + Q + ' : avgScore >= 4 ? ' + Q + 'Pending Review' + Q + ' : ' + Q + 'Not Selected' + Q + ';',
      '',
      '  return (',
      '    <section className="panel">',
      '      <h2><Star size={20} /> Interview Result</h2>',
      '      <div className="cd-result-panel">',
      '        <div className="cd-result-header">',
      '          <div className={' + Q + 'cd-result-verdict ' + Q + ' + verdict}>{verdictText}</div>',
      '          <div className="cd-result-score-big">{avgScore}/10</div>',
      '          <div className="cd-result-score-label">Overall Score</div>',
      '        </div>',
      '        <div className="cd-result-scores">',
      '          <div className="cd-score-card">',
      '            <h5>MCQ Test</h5>',
      '            <div className="cd-score-value">{avgScore >= 5 ? avgScore : "--"}/10</div>',
      '          </div>',
      '          <div className="cd-score-card">',
      '            <h5>Coding Test</h5>',
      '            <div className="cd-score-value">{avgScore >= 5 ? avgScore : "--"}/10</div>',
      '          </div>',
      '          <div className="cd-score-card">',
      '            <h5>Interview</h5>',
      '            <div className="cd-score-value">{avgScore}/10</div>',
      '          </div>',
      '        </div>',
      '        {interview.feedback && (',
      '          <div className="cd-feedback-box">',
      '            <h4>Interviewer Feedback</h4>',
      '            <p>{interview.feedback}</p>',
      '          </div>',
      '        )}',
      '        {avgScore >= 7 && (',
      '          <div style={{textAlign:"center",padding:16,background:"#dff3ef",borderRadius:10,border:"1px solid rgba(31,143,131,0.2)"}}>',
      '            <CheckCircle2 size={32} color="#1f8f83" style={{marginBottom:8}} />',
      '            <strong style={{color:"#12665d"}}>Congratulations! You have been selected for this position.</strong>',
      '          </div>',
      '        )}',
      '      </div>',
      '    </section>',
      '  );',
      '}',
      ''
    ].join(NL);
    
    result = result.substring(0, idx) + comp + result.substring(idx);
    modified = true;
    console.log('Added CandidateResult');
  }
}

// 2. Replace NotificationList
const notifPattern = 'function NotificationList() {';
const itPattern = 'function InterviewTable(';
const nStart = result.indexOf(notifPattern);
const nEnd = result.indexOf(itPattern, nStart);

if (nStart >= 0 && nEnd >= 0) {
  const newNotif = [
    'function NotificationList({ interviews = [] }) {',
    '  const notifications = [',
    '    { icon: ' + Q + 'success' + Q + ', title: ' + Q + 'Application Submitted' + Q + ', desc: ' + Q + 'Your application for Frontend Developer has been received.' + Q + ', time: ' + Q + '2 days ago' + Q + ', unread: true },',
    '    { icon: ' + Q + 'info' + Q + ', title: ' + Q + 'MCQ Test Available' + Q + ', desc: ' + Q + 'You can now take the MCQ test from your dashboard.' + Q + ', time: ' + Q + '3 days ago' + Q + ', unread: true },',
    '    { icon: ' + Q + 'warning' + Q + ', title: ' + Q + 'Interview Scheduled' + Q + ', desc: interviews.length > 0 ? ' + Q + 'Interview scheduled for ' + Q + ' + new Date(interviews[0].scheduled_at).toLocaleDateString() : ' + Q + 'Check your schedule for upcoming interviews.' + Q + ', time: ' + Q + '1 week ago' + Q + ', unread: false },',
    '    { icon: ' + Q + 'success' + Q + ', title: ' + Q + 'Resume Approved' + Q + ', desc: ' + Q + 'Your resume has been reviewed and approved.' + Q + ', time: ' + Q + '1 week ago' + Q + ', unread: false },',
    '    { icon: ' + Q + 'info' + Q + ', title: ' + Q + 'Profile Updated' + Q + ', desc: ' + Q + 'Your profile information has been saved successfully.' + Q + ', time: ' + Q + '2 weeks ago' + Q + ', unread: false },',
    '  ];',
    '',
    '  return (',
    '    <section className="panel">',
    '      <h2><Bell size={20} /> Notifications</h2>',
    '      <div style={{display:"grid",gap:4}}>',
    '        {notifications.map((n, i) => (',
    '          <div key={i} className={' + Q + 'cd-notif-item' + Q + ' + (n.unread ? ' + Q + ' unread' + Q + ' : ' + Q + Q + ')}>',
    '            <div className={' + Q + 'cd-notif-icon ' + Q + ' + n.icon}>',
    '              {n.icon === ' + Q + 'success' + Q + ' ? String.fromCharCode(' + check.charCodeAt(0) + ') : n.icon === ' + Q + 'warning' + Q + ' ? ' + Q + '!' + Q + ' : ' + Q + 'i' + Q + '}',
    '            </div>',
    '            <div className="cd-notif-body">',
    '              <strong>{n.title}</strong>',
    '              <p>{n.desc}</p>',
    '            </div>',
    '            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>',
    '              <span className="cd-notif-time">{n.time}</span>',
    '              {n.unread && <span className="cd-notif-dot" />}',
    '            </div>',
    '          </div>',
    '        ))}',
    '      </div>',
    '    </section>',
    '  );',
    '}',
    ''
  ].join(NL);
  
  result = result.substring(0, nStart) + newNotif + result.substring(nEnd);
  modified = true;
  console.log('Replaced NotificationList');
}

if (modified) {
  fs.writeFileSync(__dirname + '/src/App.jsx', result, 'utf8');
  console.log('All changes applied!');
} else {
  console.log('No changes were needed or made.');
}
</｜tool_calls>
