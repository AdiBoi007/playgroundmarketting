# Gmail signup and test-brief setup

The `/waitlist` form posts to `/api/waitlist`; `/run-a-test` posts its full brief to `/api/lead` and also joins the waitlist. The `/become-a-tester` form posts to `/api/testers` for a separate tester application. All three use one shared Gmail configuration to notify the owner inbox chosen in `WAITLIST_NOTIFY_EMAIL`. Configure that address privately in `.env.local` or Vercel. Only the sender mailbox authorizes Google access. Visitors do not sign in with Google and do not receive an automatic email. Waitlist and tester signups can use only a phone number or LinkedIn/social profile; email is the last fallback. Notifications include the selected contact method. The owner follows up manually through that channel; only an application that supplies an email gets a `Reply-To` header.

Test requests require explicit consent to join the waitlist and receive early-access and launch updates. The server requires `consent: true` and emails the name, email address, product URL, target user, and test goal with source `run-a-test`, consent, time, and reference in one notification. The form confirms both brief delivery and waitlist registration only after Gmail acceptance. This creates an enquiry, not a test booking or promised date. Saving a brief locally sends nothing and creates no waitlist entry. There is no separate request webhook to configure.

## Simpler setup: Gmail SMTP with an App Password

For this setup, use the Gmail sender already configured in `GMAIL_SENDER_EMAIL`:

1. Sign in to that Google account and enable **2-Step Verification** under **Security** if it is not already enabled.
2. Open [Google App Passwords](https://myaccount.google.com/apppasswords), create an app password named **Playground**, and keep the generated password private.
3. In **Vercel → playground-marketing → Settings → Environment Variables**, add `GMAIL_APP_PASSWORD` for **Production**, marked **Sensitive**. The existing `GMAIL_SENDER_EMAIL` and `WAITLIST_NOTIFY_EMAIL` must be set to your chosen sender and owner inbox. Only the app password is new for this method.
4. Redeploy the website to load the new variable. For local use, set the same three variables in ignored `.env.local` and restart the dev server.

Google requires 2-Step Verification for App Passwords. The option may be unavailable with security-key-only verification, Advanced Protection, or managed-account restrictions. If unavailable, use the OAuth alternative below. App Passwords are shown once and are revoked when you change your Google Account password. [Google App Password guidance](https://support.google.com/accounts/answer/185833?hl=en).

The server authenticates to Gmail SMTP over TLS using the sender address and the App Password. Google documents `smtp.gmail.com` with encrypted SMTP connections and App Password authentication. [Google SMTP setup](https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app), [Gmail SMTP protocol](https://developers.google.com/workspace/gmail/imap/imap-smtp).

The server accepts grouping spaces in `GMAIL_APP_PASSWORD` and requires 16 ASCII letters or digits after removing them. A nonblank value selects SMTP; leave it blank or remove it to use the OAuth alternative. A malformed or rejected App Password reports delivery failure rather than silently switching methods. Your ordinary Google password and OAuth client ID/secret are not SMTP App Passwords. Google Cloud configuration, a refresh token, and `npm run gmail:connect` are unnecessary for this SMTP method.

Keep the password server-only and out of chat, screenshots, logs, and commits. [Vercel environment variables](https://vercel.com/docs/environment-variables), [Sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

## Optional alternative: Gmail API with OAuth

Leave `GMAIL_APP_PASSWORD` blank in each environment intended to use OAuth; otherwise SMTP takes precedence.

Run `npm run gmail:connect` to authorize the sender once. The local helper captures and stores the refresh token, updates Vercel, and deploys; you do not need to copy a token manually. Client ID and client secret identify the app, but Google still requires the mailbox owner's consent before unattended sending. [Google's authorization flow](https://developers.google.com/identity/protocols/oauth2/web-server).

The website refreshes its access token and calls Gmail `users.messages.send`. The connector requests these scopes:

```text
https://www.googleapis.com/auth/gmail.send
openid
email
```

`gmail.send` permits sending without reading the mailbox and is classified as sensitive. `openid email` lets the helper verify that the authorized, verified Google email matches `GMAIL_SENDER_EMAIL`; it does not grant mailbox reading access. [Gmail send method](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send), [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [Google OpenID Connect scopes and claims](https://developers.google.com/identity/openid-connect/openid-connect).

### 1. Configure Google Cloud

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. In **APIs & Services → Library**, enable **Gmail API** for that project. [Enable Google Workspace APIs](https://developers.google.com/workspace/guides/enable-apis).
3. Open **Google Auth Platform → Branding**. Configure the app name, support email, and developer contact details.
4. Under **Audience**, use **External** for a personal Gmail account. During setup in Testing mode, add the sender account under **Test users**.
5. Under **Data Access → Add or remove scopes**, configure `https://www.googleapis.com/auth/gmail.send` and the basic identity scopes `openid` and `https://www.googleapis.com/auth/userinfo.email`. The authorization request uses Google's `email` shorthand. No `profile` or Gmail read scope is needed. [Configure consent and scopes](https://developers.google.com/workspace/guides/configure-oauth-consent).
6. Open your existing **Web application** client under **Clients**, or create one. Add this exact **Authorized redirect URI**, without a trailing slash:

   ```text
   http://localhost:8739/oauth/callback
   ```

7. Save the client ID and client secret privately. The callback runs temporarily on your computer; no production website callback is needed. Google permits localhost HTTP redirects for a Web client, but the registered URI must match exactly. [Create OAuth credentials](https://developers.google.com/workspace/guides/create-credentials), [Google Web server redirect rules](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation).

The sender must be a Gmail-enabled Google account you control. Use that account when authorizing the token and set `GMAIL_SENDER_EMAIL` to its email address. The recipient may be a different account. Keep the sender address fixed; never use a signup address as the `From` mailbox.

### 2. Choose the publishing status

An External app left in **Testing** gets a refresh token that expires after **seven days** when requesting Gmail access. Adding basic identity scopes does not remove that expiry. For unattended production notifications, switch **Audience → Publishing status** to **In production**, then run the connector again to obtain a new refresh token. Publishing and verification are separate steps. [Google's audience and publishing guidance](https://support.google.com/cloud/answer/15549945?hl=en).

Google documents a verification exception for personal-use apps with fewer than 100 OAuth users. A private owner-only sender may fit this exception; that is an assessment of this integration, not a guarantee of approval. The public waitlist visitors are not OAuth users because they never authorize Gmail. An unverified-app warning and user cap may still apply. If you expose Gmail authorization to other customers, reassess verification before doing so. Google Workspace **Internal** apps require an organization-owned project and restrict authorization to its members; a personal Gmail account cannot use that setting. [When verification is not needed](https://support.google.com/cloud/answer/13464323?hl=en).

### 3. Prepare the local configuration

If `.env.local` does not exist, copy `.env.example` to it. Otherwise retain its existing values. This repository ignores `.env.local`. Fill in the values privately:

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Your Web application OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | That client's secret |
| `GOOGLE_REFRESH_TOKEN` | Leave blank before connecting; the helper fills this privately |
| `GMAIL_SENDER_EMAIL` | Email address of the account that will authorize sending |
| `WAITLIST_NOTIFY_EMAIL` | Your chosen owner notification inbox |

Use Node.js 22 and install dependencies with `npm install`. The Vercel CLI must be installed, signed in to the account with project access, and this checkout linked to `playground-marketing`. Use `vercel login` or `vercel link` if needed. Put the four non-token variables in the project's **Production** environment as well; the connector adds or updates `GOOGLE_REFRESH_TOKEN` there as **Sensitive**. Mark `GOOGLE_CLIENT_SECRET` as Sensitive too. [Vercel environment variables](https://vercel.com/docs/environment-variables), [Sensitive variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables).

All Gmail variables are server-only; none should have a `NEXT_PUBLIC_` prefix. Enable Preview or Development values only when you intend those environments to send real notifications. Keep credentials and tokens out of chat, screenshots, logs, and commits.

The helper loads `.env.local` from this checkout. Already exported shell variables take precedence, so remove conflicting Google configuration from the terminal environment before connecting.

The OAuth token and client must belong together. Changing `GMAIL_SENDER_EMAIL` does not authorize another mailbox. App Passwords apply to the SMTP method above; Gmail API requires these OAuth credentials.

### 4. Connect once and deploy

From this repository root, run:

```sh
npm run gmail:connect
```

Keep the command running and open the consent URL it prints in a browser on the same computer; it does not launch a browser automatically. Sign in as `GMAIL_SENDER_EMAIL`, review your app name, and grant sending and basic email identity permissions. Google redirects to the temporary localhost callback. The helper waits up to 15 minutes for approval. Leave it running until the production deployment finishes; use Ctrl+C to cancel and rerun the command to retry. It takes no command-line arguments.

The helper requests offline access, checks the returned sending scope and verified sender identity, writes the refresh token to ignored `.env.local` with owner-only permissions (`0600`), updates the production Vercel token without printing it, and deploys. It uses a random OAuth state and an S256 PKCE challenge. Google's discovery metadata publishes the authorization, token, and userinfo endpoints and supports S256. [Google endpoint and PKCE metadata](https://accounts.google.com/.well-known/openid-configuration).

A successful connection confirms authorization and sender identity. It does not test Gmail delivery or enable Gmail API for you. No message is sent by the connector. Complete the delivery check below after deployment; restart a running local dev server to load the saved token.

### Manual OAuth fallback

If you cannot use the local helper, add `https://developers.google.com/oauthplayground` as a second authorized redirect URI on the same Web client. Open [OAuth Playground](https://developers.google.com/oauthplayground/), enable **Use your own OAuth credentials**, and enter that client's ID and secret privately. Select **Google**, **Server-side**, **Offline**, and **Consent Screen**. Authorize `https://www.googleapis.com/auth/gmail.send` as the sender, exchange the code, and save the refresh token to `.env.local` and Vercel Production as Sensitive. Redeploy afterward. The website needs only `gmail.send`; the extra identity scopes are for the local helper's sender check.

Use your own credentials: tokens obtained with the Playground's shared credentials are revoked after 24 hours. Do not share token-bearing Playground links or copy the short-lived access token in place of the refresh token. [OAuth Playground settings](https://developers.google.com/oauthplayground/).

## Verify delivery after configuration

Submit a clearly labeled test signup through `/waitlist`, a tester application through `/become-a-tester`, or a full brief through `/run-a-test` with its required consent, yourself. Check that:

- The form shows success only when the configured Gmail transport confirms acceptance.
- The notification reaches your configured owner inbox; check Spam and filters if needed. Do not rely on a sender Sent copy as the waitlist record.
- The signup details in the notification are correct. No automatic message is sent to the signup address.
- For a test brief, all five fields and the `run-a-test` source appear in the same notification. The response confirms both `delivered: true` and `waitlisted: true`; the UI confirms waitlist registration without promising a booked test.
- In local development, removing required configuration or simulating a delivery failure produces an error rather than a successful registration.
- A phone-only or LinkedIn-only signup confirms without an email address. Tester applications have the subject “New Playground tester application” and include role, optional company/interests, and separate tester-opportunity consent.
- Saving a local brief works without submitting or joining the waitlist, including before selecting consent.

Gmail acceptance does not guarantee inbox placement or that the owner has read the message. Delivered notifications in the owner mailbox hold the signup and test-brief records; there is no separate database, subscriber management system, booking queue, or delivery queue. Apply your usual mailbox retention and access practices to these records.

Instance-local rate limits and retry suppression do not guarantee global deduplication or exactly-once delivery. A timeout can occur after Gmail accepts a message, so a retry may produce a duplicate. Restarts and multiple server instances can also lose local retry state. Add persistent storage and a queue if durable deduplication becomes necessary.

## Troubleshooting and renewal

| Symptom | Check |
| --- | --- |
| Intake unavailable | Sender and recipient are set, with either a valid App Password or all three OAuth credentials; redeploy after changes. |
| App Password option missing | Check 2-Step Verification and account security or organization restrictions; use OAuth if App Passwords are unavailable. |
| SMTP authentication fails | Use an App Password created by the configured sender, not an ordinary password or OAuth secret. A password change revokes App Passwords; create a new one and redeploy. |
| `redirect_uri_mismatch` | Register `http://localhost:8739/oauth/callback` on the same Web client; manual Playground setup uses its separate URI. |
| Local callback does not open | Use a browser on the same computer as the helper and keep port 8739 available. |
| Sender check fails | Authorize the same verified Google email configured as `GMAIL_SENDER_EMAIL`. |
| Vercel update or deployment fails | Check CLI sign-in, project access, and project link. A local token alone does not configure the deployed website. |
| Token exchange fails | Client ID, secret, and refresh token belong to the same client. |
| `invalid_grant` or delivery stops after a week | The grant may have expired in Testing mode. Publish appropriately and run the connector again. |
| Missing refresh token | Confirm Offline access and Consent Screen prompt, then repeat authorization. |
| Gmail permission error | Gmail API is enabled and the token was granted `gmail.send`. Workspace policies may require administrator approval. |
| Send succeeds but inbox is empty | Check recipient Spam, filters, and mailbox settings before resubmitting. |

Production refresh tokens can still stop working after revocation, long inactivity, certain password changes, or token-limit events. Run the connector again to renew the production token; update any other intended environments separately. [Google refresh-token expiration guidance](https://developers.google.com/identity/protocols/oauth2#expiration).
