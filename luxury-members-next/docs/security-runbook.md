# Security Runbook

## Incident Severity
- P0: Active data breach or payment compromise.
- P1: Privilege escalation or account takeover vector.
- P2: Security misconfiguration without active exploitation.

## Immediate Actions
1. Triage and classify severity.
2. Restrict affected endpoints or rotate secrets.
3. Capture forensic logs and audit timeline.
4. Notify internal incident owner and legal/compliance contact.
5. Patch, validate, and redeploy with monitoring.

## Recovery Checks
- Confirm exploit path is blocked.
- Confirm no unauthorized admin actions remain active.
- Validate payment integrity and reconciliation state.
- Verify user session invalidation where needed.

## Postmortem
- Root cause summary.
- Impacted users and systems.
- Remediation timeline.
- Prevention action items with owners.
