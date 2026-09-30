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

import { createHash } from 'node:crypto';

const sha256 = (v) => createHash('sha256').update(v).digest('hex');

// SHA-256 of: the canonical account, the cross-account Bedrock proxy account,
// and a synthetic canary (123456789012) used only by the test fixture.
const ACCOUNT_HASHES = new Set([
  '0c3436e6ea3352b39923240150a3fc956baa14e89d9c0ed23f995dedff694f9a',
  '4a3eec417b60abfdf8e3db6ca9dc198d8d99a7d04c2f7d0e818a2cc8785bb3b5',
  '2a33349e7e606a8ad2e30e3c84521f9377450cf09083e162e0a9b1480ce0f972',
]);

export const CATEGORY = 'a';
export const CATEGORY_LABEL = 'operational-secret';

export const rules = [
  {
    id: 'aws-account-number',
    description: 'Kvendra AWS account number (canonical or cross-account proxy)',
    // Matched by SHA-256 so this public file never embeds the account numbers
    // themselves. Any 12-digit run whose hash is in ACCOUNT_HASHES blocks.
    regex: { test: (line) => (line.match(/\b\d{12}\b/g) || []).some((n) => ACCOUNT_HASHES.has(sha256(n))) },
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
