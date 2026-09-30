---
marp: true
theme: default
paginate: true
size: 16:9
backgroundColor: "#07080d"
color: "#f4f6fb"
style: |
  section {
    font-family: "Avenir Next", "Segoe UI", Helvetica, Arial, sans-serif;
    background-color: #07080d;
    background-image:
      radial-gradient(880px 420px at 100% 0%, rgba(125, 211, 252, 0.18), transparent 62%),
      radial-gradient(640px 380px at 0% 100%, rgba(99, 102, 241, 0.16), transparent 58%);
    color: #f4f6fb;
    padding: 64px 76px 56px;
    font-size: 32px;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }
  h1 {
    font-size: 64px;
    line-height: 1.02;
    font-weight: 700;
    letter-spacing: -0.04em;
    margin: 0 0 8px 0;
    color: #ffffff;
  }
  h3 {
    margin: 0;
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: #7dd3fc;
  }
  p { margin: 0; }
  strong { color: #7dd3fc; font-weight: 700; }
  section::after {
    color: #667085;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.08em;
  }
  .kicker {
    margin: 0 0 18px 0;
    color: #7dd3fc;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .trio {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 40px;
    margin-top: 72px;
  }
  .trio p {
    margin-top: 12px;
    max-width: 9em;
    font-size: 28px;
    line-height: 1.25;
    color: #d5dbe8;
  }
  section.demo { padding: 46px 60px 36px; }
  section.demo h1 {
    font-size: 54px;
    margin-bottom: 18px;
  }
  pre.term {
    margin: 0;
    padding: 28px 28px 22px;
    background: #10141c;
    border: 1px solid #2a3348;
    border-radius: 16px;
    color: #e7eefc;
    font-family: "SF Mono", ui-monospace, Menlo, Consolas, monospace;
    font-size: 20px;
    line-height: 1.48;
    letter-spacing: 0;
    white-space: pre-wrap;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  }
  pre.term code {
    font-family: inherit;
    font-size: 20px;
    line-height: 1.48;
    color: inherit;
    background: transparent;
  }
  pre.term .cmd { color: #9fb0c8; }
  pre.term .hit { color: #7dd3fc; font-weight: 700; }
  pre.term .time { color: #8b93a7; }
  .grid2, .grid3 {
    display: grid;
    gap: 18px;
    margin-top: 28px;
  }
  .grid2 { grid-template-columns: 1fr 1fr; }
  .grid3 { grid-template-columns: 1fr 1fr 1fr; }
  .grid2 div, .grid3 div, .cards div {
    background: rgba(18, 23, 34, 0.92);
    border-radius: 16px;
    padding: 26px 26px 30px;
    border-top: 3px solid #7dd3fc;
  }
  .grid2 b, .grid3 b, .cards b {
    display: block;
    margin-bottom: 10px;
    color: #7dd3fc;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }
  .grid2 span, .grid3 span, .cards span {
    display: block;
    color: #ffffff;
    font-size: 32px;
    line-height: 1.15;
    letter-spacing: -0.03em;
  }
  .grid3 small, .cards small, .note {
    display: block;
    margin-top: 8px;
    color: #aeb6c8;
    font-size: 20px;
    letter-spacing: -0.01em;
  }
  .note { margin-top: 28px; font-size: 28px; color: #d5dbe8; }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px;
    margin-top: 28px;
  }
  .stats div {
    background: rgba(18, 23, 34, 0.92);
    border-radius: 16px;
    padding: 28px 26px 30px;
    border-top: 3px solid #7dd3fc;
  }
  .stats span {
    display: block;
    color: #7dd3fc;
    font-size: 72px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.04em;
    white-space: nowrap;
  }
  .stats small {
    display: block;
    margin-top: 14px;
    color: #aeb6c8;
    font-size: 20px;
    letter-spacing: -0.01em;
  }
  section.agents {
    padding: 40px 52px 28px;
  }
  section.agents h1 {
    font-size: 46px;
    margin-bottom: 16px;
  }
  section.agents .split {
    display: grid;
    grid-template-columns: 1.12fr 1fr;
    gap: 18px;
    align-items: start;
  }
  section.agents pre.term {
    margin: 0;
    padding: 16px 18px 12px;
    font-size: 15px;
    line-height: 1.38;
  }
  section.agents pre.term code {
    font-size: 15px;
    line-height: 1.38;
  }
  section.agents .cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
  }
  section.agents .cards div {
    padding: 14px 16px 14px;
  }
  section.agents .cards span {
    font-size: 24px;
  }
  section.agents .cards small {
    margin-top: 4px;
    font-size: 16px;
  }
  section.agents .note {
    margin-top: 14px;
    font-size: 22px;
  }
  section.lead {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  section.close h1 {
    font-size: 54px;
    line-height: 1.08;
    font-weight: 600;
    color: #c5cedd;
    margin: 0 0 28px 0;
  }
  section.close h1,
  section.close .punch {
    max-width: 700px;
  }
  section.close .punch {
    font-size: 40px;
    line-height: 1.22;
    font-weight: 700;
    letter-spacing: -0.035em;
    color: #ffffff;
  }
  section.close .qrs {
    position: absolute;
    right: 48px;
    top: 156px;
    display: flex;
    gap: 16px;
    margin: 0;
  }
  section.close .qr {
    width: 168px;
    margin: 0;
    text-align: center;
  }
  section.close .qr img {
    width: 160px;
    height: 160px;
    background: #ffffff;
    border-radius: 16px;
    padding: 10px;
    box-sizing: border-box;
  }
  section.close .qr p {
    margin-top: 10px;
    color: #aeb6c8;
    font-size: 14px;
    line-height: 1.3;
    letter-spacing: 0;
  }
  section.close .qr strong {
    display: block;
    margin-bottom: 2px;
    color: #f4f6fb;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
---

<p class="kicker">The problem</p>

# Three answers before you edit.

<div class="trio">
<div>
<h3>Where</h3>
<p>The exact file and line.</p>
</div>
<div>
<h3>Who</h3>
<p>People who still change that file.</p>
</div>
<div>
<h3>What breaks</h3>
<p>The tests to run, and every importer.</p>
</div>
</div>

---

<!-- _class: demo -->

<p class="kicker">Demo · Express · 5.1s</p>

# lib/response.js:236

<pre class="term"><code><span class="cmd">$ pnpm dev ask "where is the response json method implemented?" -d ../demo-repos/express</span>

scanned 153 files · asking grok-4.6 via grok-cli…

<span class="hit">→ lib/response.js:236</span>
    This is where Express implements res.json() on the response prototype.
   👤 Ask: Sebastian Beltran (2 commits, 8 months ago), cui fliter (1 commit, 2 weeks ago)
   🧪 Run: test/res.json.js, test/res.jsonp.js, test/app.response.js
   ⚠️  Blast radius: low (1 importer: lib/express.js)
<span class="time">5.1s</span></code></pre>

---

<p class="kicker">How it works</p>

# Local files. Checked lines.

<div class="grid2">
<div><b>01</b><span>Scan the repo on disk.</span></div>
<div><b>02</b><span>Send excerpts, not the tree.</span></div>
<div><b>03</b><span>Resolve the line in the file.</span></div>
<div><b>04</b><span>Add owners, tests, blast radius.</span></div>
</div>

---

<!-- _class: agents -->

<p class="kicker">For agents too</p>

# Your agent asks first.

<div class="split">
<pre class="term"><code><span class="cmd">$ whereis ask "where is res.json implemented?"</span>
<span class="cmd">    -d ../demo-repos/express --json</span>
[{ "file": "lib/response.js", "line": 236,
   "why": "Defines res.json on the response.",
   "owners": [{ "name": "Sebastian Beltran", ... }],
   "tests": ["test/res.json.js", ...],
   "blast": { "label": "low", "count": 1,
              "paths": ["lib/express.js"] } }]</code></pre>
<div class="cards">
<div><b>01</b><span>Edit the right line</span><small>verified file:line, not a guess</small></div>
<div><b>02</b><span>Run the right tests</span><small>before and after the change</small></div>
<div><b>03</b><span>Know the risk</span><small>blast radius decides "just do it" vs "ask a human"</small></div>
</div>
</div>

<p class="note">Today: --json for any agent. Next: MCP server + Cursor rule.</p>

---

<p class="kicker">Built in Cursor</p>

# Spec first.

<div class="stats">
<div><span>19 min</span><small>Cursor Agent build time</small></div>
<div><span>9 / 9</span><small>tasks from the spec</small></div>
<div><span>6 / 6</span><small>acceptance tests pass</small></div>
</div>

<p class="note">requirements → design → tasks, checked one task at a time.</p>

---

<!-- _class: lead close -->

<p class="kicker">whereis</p>

# Cursor tells you<br>where the code is.

<p class="punch"><strong>whereis</strong> tells you where it is,<br>who knows it, and what you'll break.</p>

<div class="qrs">
<div class="qr">
<img src="qr-repo.png" alt="QR code for github.com/mlomovskoy/whereis-cli">
<p><strong>The code</strong>github.com/<br>mlomovskoy/<br>whereis-cli</p>
</div>
<div class="qr">
<img src="qr-me.png" alt="QR code for maxim-lomovskoy.link">
<p><strong>Maxim Lomovskoy</strong>maxim-lomovskoy.link</p>
</div>
</div>
