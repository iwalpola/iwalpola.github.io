# Contact form setup

`contact.html` posts to a small Google Apps Script web app. The script emails
the message to the Gmail account that owns it and files it under labels
(`Website`, plus `Website/Teaching`, `Website/Coordination layer`,
`Website/Collaborating` or `Website/Other`). It is free and needs no server.

1. Signed in as **iwalpola@gmail.com**, go to https://script.google.com and
   choose **New project**.
2. Replace the contents of `Code.gs` with the file of the same name in this folder.
3. Select the `testSend` function and press **Run**. Approve the Gmail
   permissions when asked. A test message should arrive, labelled
   `Website/Coordination layer`.
4. **Deploy → New deployment → Web app.** Set *Execute as*: **Me** and
   *Who has access*: **Anyone**. Copy the **Web app URL**.
5. Paste that URL into `const ENDPOINT = ''` near the bottom of `contact.html`,
   commit and push.

If you edit the script later, use **Deploy → Manage deployments → Edit → New
version**. The URL stays the same.

## Backup: a Gmail filter

Every subject starts with `[Site · …]`. In Gmail, create a filter for subject
`"[Site ·"` that applies the label, in case a label is ever not applied by the
script (it retries for about eight seconds while Gmail indexes the message).

## Limits

- The web app URL is public. The script ignores a hidden honeypot field,
  validates the fields, trims lengths, and stops after 40 messages a day
  (`DAILY_LIMIT`).
- Consumer Gmail allows about 100 sent emails a day through Apps Script, far
  above what this needs.
- The page cannot read the script's reply (Apps Script sends no CORS headers),
  so it treats a completed request as sent. Check Apps Script's **Executions**
  tab if a message ever goes missing.
