/**
 * Content linter — category (a): OPERATIONAL SECRETS.
 *
 * These patterns must NEVER appear on the public kvendra.dev site. A match is
 * always blocking and can NEVER be escaped with a linter-allow comment (see
 * index.mjs). Source of policy: ADR-KVD-A24AB7 (content policy) + AC-6(a).
 *
 * Each rule: { id, description, regex }. The regex is matched per-line.
 *
 * NOTE: these patterns are intentionally written so they do not themselves
 * embed the live secret values where avoidable; where a literal value is the
 * detection target (e.g. an AWS account number) it is expressed digit-class so
 * this file does not become a leak vector of its own.
 */

export const CATEGORY = 'a';
export const CATEGORY_LABEL = 'operational-secret';

export const rules = [
  {
    id: 'aws-account-canonical',
    description: 'Kvendra canonical AWS account number',
    // ***AWS-ACCOUNT***
    regex: /\b***AWS-ACCOUNT***\b/,
  },
  {
    id: 'aws-account-wo-proxy',
    description: 'Cross-account Bedrock proxy AWS account number',
    // ***AWS-ACCOUNT***
    regex: /\b***AWS-ACCOUNT***\b/,
  },
  {
    id: 'vault-profile-aws',
    description: 'AWS vault profile id (aws.kvendra.*)',
    regex: /\baws\.kvendra\.[a-z0-9._-]+/i,
  },
  {
    id: 'vault-profile-github',
    description: 'GitHub vault profile id (github.kvendraai.*)',
    regex: /\bgithub\.kvendraai\.[a-z0-9._-]+/i,
  },
  {
    id: 'cognito-userpool-id',
    description: 'Cognito UserPool id (region_xxxxxxxxx)',
    regex: /\b[a-z]{2}-[a-z]+-\d_[A-Za-z0-9]{8,}\b/,
  },
  {
    id: 'cloudfront-distribution-id',
    description: 'CloudFront distribution id (E + 13 base32 chars)',
    regex: /\bE[0-9A-Z]{13}\b/,
  },
  {
    id: 'route53-zone-id',
    description: 'Route 53 hosted zone id (Z + base32)',
    regex: /\bZ[0-9A-Z]{12,}\b/,
  },
  {
    id: 'abs-path-users',
    description: 'Absolute local workspace path (/Users/...)',
    regex: /\/Users\/[A-Za-z0-9._-]+/,
  },
  {
    id: 'kvendra-home-path',
    description: 'Local vault home path (~/.kvendra)',
    regex: /~\/\.kvendra\b/,
  },
];
