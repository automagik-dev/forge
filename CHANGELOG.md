# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Migration guide for v0.7.3 with accurate analytics, Node.js, and installation instructions

### Fixed
- Git hooks now run fast unit tests instead of slow package validation tests
- Pre-push hook properly detects git hook context via GIT_DIR environment variable
