# Threat Model

## Assets
- User identity data
- Session tokens
- Payment state and reconciliation data
- Admin permission state
- Audit event streams

## Threat Actors
- External attackers (credential stuffing, exploitation)
- Malicious insiders with limited roles
- Automated abuse bots

## Top Threats
- Credential stuffing and brute-force attacks
- Session theft and replay
- Privilege escalation through API misuse
- Payment webhook spoofing
- Dispute and reconciliation workflow tampering
- Data exfiltration via weak export or logs

## Mitigations in Place
- Strong password policy and hash storage
- Distributed rate limiting
- Email verification gate
- RBAC checks + admin middleware
- Webhook signature validation
- Same-origin checks on mutating routes
- Audit log persistence and external sink support
- SIEM webhook event emission for job/auth signals

## Remaining Mitigations
- Managed secrets vault and rotation automation
- Full WAF/bot-management integration
- Continuous anomaly scoring pipeline
- Independent pentest and recurring red-team exercises
