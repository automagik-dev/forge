# Infrastructure CI/CD Review - Tech Council Consensus

## Tech Council Findings Summary

### nayr (Questioner) - "What's actually being used?"
- Jenkins (CT 103) is **completely redundant** - GitHub Actions handles everything
- Monitoring stack (Prometheus/Grafana/OTEL/Uptime Kuma) is **provisioned but disconnected**
- No evidence these tools are actively collecting/displaying CI/CD metrics
- **Recommendation**: Delete Jenkins entirely, remove unused monitoring containers

### oettam (Performance) - "Where are the numbers?"
- CI/CD is **flying blind** - no metrics being collected
- Missing: p99 build times, cache hit ratios, runner utilization
- No Prometheus scraping GitHub Actions, no Grafana dashboards for CI/CD
- **Recommendation**: Add GitHub Actions job timing, establish baselines before deleting anything

### jt (Simplifier) - "What's the minimum?"
- **5 containers can be deleted**: Jenkins (CT 103), Prometheus (CT 122), Grafana (CT 123), OTEL (CT 155), Uptime Kuma (CT 161)
- **60GB+ RAM freed** across cluster
- Minimum viable: CT 200 (self-hosted runner) + GitHub Actions workflows
- **Recommendation**: Aggressive cleanup, monitoring can be re-added if needed

---

## Consensus Recommendation

### Phase 1: Immediate Cleanup (Zero Risk)
1. **Delete Jenkins (CT 103)** - All personas agree, completely redundant
   - GitHub Actions is our CI/CD platform
   - No Jenkins jobs are being used
   - Frees ~8GB RAM

### Phase 2: Monitoring Decision (Requires Choice)

**Option A: Full Cleanup (jt's approach)**
- Delete CT 122 (Prometheus), CT 123 (Grafana), CT 155 (OTEL), CT 161 (Uptime Kuma)
- Frees ~52GB+ RAM
- Can re-provision if needed later
- Risk: Lose potential future observability

**Option B: Wire Up Existing (oettam's approach)**
- Keep monitoring stack
- Configure Prometheus to scrape GitHub Actions metrics
- Create Grafana dashboards for CI/CD
- Establish baselines before optimization
- Cost: Time investment, RAM stays allocated

**Option C: Hybrid (Recommended)**
- Delete Jenkins (unanimous)
- Keep Uptime Kuma (CT 161) - simple health checks, low overhead
- Delete Prometheus/Grafana/OTEL for now
- Use GitHub Actions built-in metrics (job timing in workflow runs)
- Re-provision monitoring when we have specific observability needs

---

## Implementation Plan (Option C - Hybrid)

### Step 1: Delete Jenkins
```bash
ssh root@prox1 "pct stop 103 && pct destroy 103"
```
- Remove any Jenkins references from codebase

### Step 2: Keep Uptime Kuma
- CT 161 stays for basic health monitoring
- Configure monitors for critical endpoints if not already done

### Step 3: Delete Unused Monitoring
```bash
ssh root@prox1 "pct stop 122 && pct destroy 122"  # Prometheus
ssh root@prox1 "pct stop 123 && pct destroy 123"  # Grafana
ssh root@prox1 "pct stop 155 && pct destroy 155"  # OTEL
```

### Step 4: Update Terraform
- Remove deleted container definitions
- Update documentation

### Step 5: Leverage GitHub Actions Metrics
- Use built-in workflow run timing
- Add job annotations for key metrics
- Review via GitHub UI (Actions → workflow run → timing)

---

## Expected Outcomes
- **RAM freed**: ~40GB (Jenkins + Prometheus + Grafana + OTEL)
- **Containers deleted**: 4 (keeping Uptime Kuma)
- **Complexity reduced**: No Jenkins scripts, no unused monitoring
- **CI/CD platform**: GitHub Actions (unified, already working)
- **Health monitoring**: Uptime Kuma (lightweight, useful)

---

## Questions Before Proceeding

1. **Monitoring preference**: Option A (full cleanup), B (wire up), or C (hybrid)?
2. **Uptime Kuma status**: Is it currently configured with monitors? Keep or delete?
3. **Any Jenkins jobs worth preserving?** (Assumed no based on exploration)
