# Social login activation (Apple + Facebook)

Last updated: 2026-07-17

Elsewhere supports **Email**, **Google** (live), **Apple**, and **Facebook**.
Buttons appear only after the matching Supabase provider is enabled.

Supabase callback (same for every provider — copy exactly):

`https://kjrmtklvfecvzlhlzuaf.supabase.co/auth/v1/callback`

Elsewhere redirect allowlist must already include:

- `https://elsewhereplan.com/auth/callback`
- `https://www.elsewhereplan.com/auth/callback`
- `http://localhost:3000/auth/callback` (optional, local only)

Secrets stay in provider consoles + Supabase. Never commit them. Never put them in `NEXT_PUBLIC_*`.

---

## A. Apple — exact steps

### A1. Ownership record (do this first)

Write these down somewhere durable (password manager):

| Field | Value |
|-------|--------|
| Apple Developer account owner | |
| Apple Team ID | |
| Who rotates the Sign in with Apple key | |
| Next renewal / membership date | |

Do not enable Apple in Supabase until this row is filled.

### A2. Apple Developer Console

1. Open [Apple Developer](https://developer.apple.com/account) signed in as the owner.
2. **Certificates, Identifiers & Profiles**.
3. **Identifiers → +** → **App IDs** → continue.
   - Description: `Elsewhere`
   - Bundle ID: explicit, e.g. `com.elsewhereplan.web`
   - Enable **Sign In with Apple** → Continue → Register.
4. **Identifiers → +** → **Services IDs** → continue.
   - Description: `Elsewhere Web`
   - Identifier: e.g. `com.elsewhereplan.web.auth` (this becomes Supabase **Client ID**)
   - Enable **Sign In with Apple** → Configure:
     - Primary App ID: the App ID from step 3
     - Domains: `elsewhereplan.com` and `www.elsewhereplan.com`
     - Return URLs: paste the Supabase callback above
   - Save → Continue → Register.
5. **Keys → +**
   - Key Name: `Elsewhere Sign in with Apple`
   - Enable **Sign In with Apple** → Configure → select the App ID → Save
   - Continue → Register → **Download `.p8` once** → store offline
   - Record **Key ID** shown on the page.

### A3. Generate the Apple client secret

Supabase needs a JWT secret generated from the `.p8` key (Apple secrets expire; rotate before expiry, usually ≤ 6 months).

Use Apple’s documented JWT for Sign in with Apple (or Supabase’s Apple helper docs):

- `iss` = Team ID  
- `sub` = Services ID (Client ID)  
- `kid` = Key ID  
- Sign with the `.p8` private key  

Paste the resulting JWT into Supabase as **Secret**.

### A4. Supabase

1. Open [Apple provider](https://supabase.com/dashboard/project/kjrmtklvfecvzlhlzuaf/auth/providers)
2. Enable **Apple**
3. Client ID = Services ID (e.g. `com.elsewhereplan.web.auth`)
4. Secret = JWT from A3
5. Save

### A5. Verify

1. Deploy or wait for preview with the Facebook/Apple code changes.
2. Open `https://elsewhereplan.com/login`
3. **Continue with Apple** must appear.
4. Test: new Apple account, returning account, cancel mid-flow, logout, same-email link with existing password user if applicable.

---

## B. Facebook / Meta — exact steps

Supabase provider name is **`facebook`** (UI label: Facebook).

### B1. Meta Developer app

1. Open [Meta for Developers](https://developers.facebook.com/) as `brenden@elsewhereplan.com` (or the Business owner).
2. **My Apps → Create App**
   - Use case: **Authenticate and request data from users with Facebook Login** (or Consumer / Authenticate)
   - App name: `Elsewhere`
   - Contact email: `brenden@elsewhereplan.com`
3. In the app dashboard, add product **Facebook Login → Web** if not already added.
4. **Facebook Login → Settings**:
   - Valid OAuth Redirect URIs:  
     `https://kjrmtklvfecvzlhlzuaf.supabase.co/auth/v1/callback`
   - Save
5. **App settings → Basic**:
   - Copy **App ID** and **App Secret**
   - Add App Domains: `elsewhereplan.com`, `www.elsewhereplan.com`
   - Privacy Policy URL: `https://elsewhereplan.com/privacy`
   - Terms URL: `https://elsewhereplan.com/terms`
   - Site URL / Website (if asked): `https://elsewhereplan.com`
6. While developing, keep app in **Development** mode and add yourself + testers under **Roles**.
7. Before public Meta ads traffic: switch to **Live** and complete any App Review / Business verification Meta requires for public Facebook Login.

### B2. Supabase

1. Open [Facebook provider](https://supabase.com/dashboard/project/kjrmtklvfecvzlhlzuaf/auth/providers)
2. Enable **Facebook**
3. Paste App ID + App Secret
4. Save

### B3. Verify

1. Open `https://elsewhereplan.com/login` (after deploy of provider-list code)
2. **Continue with Facebook** must appear
3. Test with a Role tester: new account, returning, cancel, logout
4. Confirm Google + email still work

---

## C. After both are live

1. Confirm Site URL is still `https://elsewhereplan.com`
2. Confirm redirect allowlist still includes `/auth/callback`
3. Update handoff: Apple = live, Facebook = live, renewal owners recorded
4. Resume product work: **PH v1 MFA publish** per `PH_V1_ENTRY_STAY_RELEASE.md`, then the weekly “one thing before Sunday” action on the plan

Do not add more social providers after this.
