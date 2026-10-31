/* Receives the contact form, emails it to the account that owns this script,
   and files it under Gmail labels. Runs free on Google Apps Script.
   Setup steps are in README.md. */

const LABEL_ROOT = 'Website';
const DAILY_LIMIT = 40;
const TOPICS = {
  teaching: 'Teaching',
  network: 'Coordination layer',
  collab: 'Collaborating',
  other: 'Other'
};

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return done();                       // honeypot tripped: pretend success

  const name = clean(p.name, 100);
  const email = clean(p.email, 200);
  const message = String(p.message || '').trim().slice(0, 5000);
  const topic = TOPICS[p.topic] ? p.topic : 'other';
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) return done();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!underLimit()) return done();
    const ref = Utilities.getUuid().slice(0, 8);
    const subject = '[Site · ' + TOPICS[topic] + '] ' + name + ' (' + ref + ')';
    const body = message + '\n\n--\nFrom: ' + name + ' <' + email + '>\nTopic: ' + TOPICS[topic];
    GmailApp.sendEmail(Session.getEffectiveUser().getEmail(), subject, body,
      { replyTo: email, name: 'iwalpola.github.io' });
    labelThread(ref, topic);
  } finally {
    lock.releaseLock();
  }
  return done();
}

function doGet() {
  return ContentService.createTextOutput('Contact form endpoint. POST only.');
}

function done() {
  return ContentService.createTextOutput('ok');
}

function clean(s, max) {
  return String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

/* A shared daily cap, so a leaked URL cannot flood the inbox. */
function underLimit() {
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  const rec = JSON.parse(props.getProperty('count') || '{}');
  const n = rec.day === today ? rec.n : 0;
  if (n >= DAILY_LIMIT) return false;
  props.setProperty('count', JSON.stringify({ day: today, n: n + 1 }));
  return true;
}

function label(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

/* Gmail can take a moment to index the new message, so retry the search. */
function labelThread(ref, topic) {
  for (let i = 0; i < 5; i++) {
    Utilities.sleep(1500);
    const threads = GmailApp.search('subject:' + ref + ' newer_than:1d', 0, 1);
    if (threads.length) {
      threads[0].addLabel(label(LABEL_ROOT));
      threads[0].addLabel(label(LABEL_ROOT + '/' + TOPICS[topic]));
      return;
    }
  }
}

/* Run once from the editor to authorise Gmail and check the whole path. */
function testSend() {
  doPost({ parameter: { name: 'Test', email: Session.getEffectiveUser().getEmail(),
                        topic: 'network', message: 'Test message from the editor.' } });
}
