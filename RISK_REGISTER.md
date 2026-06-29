# Expat Atlas — Risk Register

**Last updated:** 2026-06-29  
**Review cadence:** Weekly during build; monthly post-launch

| ID | Risk | Likelihood | Impact | Mitigation | Owner | Status |
|----|------|------------|--------|------------|-------|--------|
| R01 | **Legal liability** — users treat planning info as legal/immigration advice | High | Critical | Universal disclaimers; never use "qualify/approved"; professional referral CTAs; `requires_professional_review` flag | Product + Legal review | Open |
| R02 | **Outdated visa/source data** causes user harm | High | Critical | Source verification system; last-verified dates; user report flow; admin review queue; no scraping-only truth | Engineering | Open |
| R03 | **Fake trust** — implied verified partners or sponsors | Medium | Critical | Partner status enum; demo labels; empty states; no invented real names | Product | Open |
| R04 | **Sensitive document breach** (passport scans) | Low (MVP) | Critical | MVP: metadata-only checklist; no file upload; document vault deferred | Engineering | Mitigated (MVP scope) |
| R05 | **Housing/rental scams** via future listings | Medium | High | Education-first; scam checklist; verified-only listings later; no fake inventory | Product | Open |
| R06 | **Property purchase facilitation** without licensed professionals | Medium | Critical | Education hub only; no transactions; mandatory legal review warnings | Product | Open |
| R07 | **Insurance misrepresentation** — selling without license | Low | High | Affiliate links only; no direct sales; pre-existing condition warnings | Product | Open |
| R08 | **AI Coach hallucination** on visa/legal facts | High | Critical | MVP: rules-based mock; future: RAG + cite claims; refuse final authority | Engineering | Open |
| R09 | **Community safety** — harassment, unsafe matching | Medium | High | Waitlist/cohorts first; moderation queue; report/block; no random 1:1 matching in MVP | Product | Open |
| R10 | **GDPR/privacy** — relocation data sensitivity | Medium | High | Privacy policy; consent; export/delete; minimal data collection; RLS | Engineering | Open |
| R11 | **Performance** — landing animations hurt Core Web Vitals | Medium | Medium | Lazy load 3D; reduced-motion; perf budget in CI | Engineering | Open |
| R12 | **Monetization trust erosion** — sponsored content looks editorial | Medium | High | Sponsored badges; separate ranking; disclosure on every slot | Product | Open |
| R13 | **Affiliate conflict of interest** | Medium | Medium | Label all affiliate links; editorial independence in scoring | Product | Open |
| R14 | **Admin account compromise** | Low | Critical | RBAC; audit log; MFA for admin (post-MVP); service role server-only | Engineering | Open |
| R15 | **Stripe/payment compliance** | Low (MVP) | Medium | Abstract checkout; no live keys until terms ready | Engineering | Deferred |
| R16 | **Dev environment gap** — no Node/Git on machine | High | Medium | Document setup; winget install with admin approval | DevOps | Open |
| R17 | **Single-founder bottleneck** on source verification | High | High | Seed with "needs review"; prioritize top 3 countries; community reports | Operations | Open |
| R18 | **Tax advice implication** for digital nomads | Medium | High | "Consult tax professional"; no residency determinations | Product | Open |
| R19 | **Accessibility lawsuits / exclusion** | Medium | Medium | WCAG AA; axe in CI; keyboard nav | Engineering | Open |
| R20 | **Vendor lock-in** (Supabase/Vercel) | Low | Medium | Drizzle ORM; standard Postgres; portable monorepo | Engineering | Accepted |

---

## Risk Response Playbook

### If outdated visa info is reported
1. Auto-flag related `source_claims`
2. Hide or downgrade confidence until admin review
3. Log in `admin_audit_logs`
4. Notify users who saved affected visa (future)

### If partner impersonation attempted
1. `pending_verification` only until credential check
2. Never show as "verified" without admin action
3. Reject + audit trail

### If AI Coach ships before RAG
1. Block factual visa/legal answers
2. Redirect to Visa Compass + official sources only

---

## Pre-Launch Checklist

- [ ] Legal disclaimer reviewed (template counsel)
- [ ] Privacy policy + Terms of Service drafted
- [ ] All seed data marked demo/needs review
- [ ] No verified partner without real verification
- [ ] Admin MFA plan documented
- [ ] Incident response contact defined
