# Fixture — category (a) secret leak (MUST be blocked)

This file intentionally contains an operational secret so the linter test can
assert that category (a) is detected and is NOT escapable.

The canonical AWS account is ***AWS-ACCOUNT*** and that must never ship publicly.

<!-- linter-allow: aws-account-canonical this escape must be IGNORED for cat-a -->
The canonical AWS account is ***AWS-ACCOUNT*** even with an escape attempt above.
