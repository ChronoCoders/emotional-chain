# EmotionalChain Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying EmotionalChain to production across multiple AWS regions with high availability, security, and performance optimization.

## Prerequisites

### Infrastructure Requirements

- **AWS Account** with appropriate permissions
- **EKS Clusters** in target regions (us-west-2, eu-west-1, ap-southeast-1)
- **RDS PostgreSQL** instances with read replicas
- **VPC** with proper subnets and security groups
- **Load Balancers** for external P2P connectivity
- **S3 Buckets** for backup and logs
- **Route53** for DNS management

### Tool Requirements

- `kubectl` v1.28+
- `aws` CLI v2.0+
- `docker` v20.0+
- `helm` v3.0+ (optional)
- `envsubst` (gettext package)

### Access Requirements

- AWS IAM roles with EKS, RDS, and S3 permissions
- Kubernetes RBAC configured
- Container registry access (GitHub Container Registry)

## Pre-Deployment Setup

### 1. Database Index Deployment

**Critical**: Deploy optimized indexes before application deployment to prevent blocking operations.

```bash
# Execute production indexes on each regional database
psql -h <rds-endpoint> -U <username> -d emotionalchain -f database/production-indexes.sql
```

### 2. Secrets Management

Create Kubernetes secrets in each cluster:

```bash
# Database credentials
kubectl create secret generic emotionalchain-database \
  --namespace=emotionalchain-production \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/emotionalchain" \
  --from-literal=PGUSER="emotionalchain_user" \
  --from-literal=PGPASSWORD="secure_password" \
  --from-literal=PGHOST="emotionalchain-prod.cluster-xyz.us-west-2.rds.amazonaws.com" \
  --from-literal=PGPORT="5432" \
  --from-literal=PGDATABASE="emotionalchain"

# Encryption keys
kubectl create secret generic emotionalchain-encryption \
  --namespace=emotionalchain-production \
  --from-literal=DEVICE_MASTER_KEY="$(openssl rand -base64 32)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=CONSENSUS_SIGNING_KEY="$(openssl rand -base64 32)"

# P2P networking keys
kubectl create secret generic emotionalchain-p2p \
  --namespace=emotionalchain-production \
  --from-literal=P2P_PRIVATE_KEY="$(openssl rand -base64 32)"
```

### 3. Container Registry Setup

Build and push production images:

```bash
# Build production image
docker build -t ghcr.io/emotionalchain/validator:v1.0.0 .

# Push to registry
docker push ghcr.io/emotionalchain/validator:v1.0.0
```

## Deployment Process

### Automated Multi-Region Deployment

Use the provided deployment script:

```bash
# Set environment variables
export IMAGE_TAG="v1.0.0"
export REGISTRY="ghcr.io/emotionalchain/validator"

# Execute multi-region deployment
chmod +x scripts/deploy-multi-region.sh
./scripts/deploy-multi-region.sh
```

### Manual Region-by-Region Deployment

For controlled deployment:

```bash
# Deploy to primary region (us-west-2)
kubectl config use-context emotionalchain-us-west-2
kubectl apply -f kubernetes/production/

# Verify primary region health
kubectl get pods -n emotionalchain-production
kubectl logs -f statefulset/emotionalchain-validator -n emotionalchain-production

# Deploy to secondary regions
kubectl config use-context emotionalchain-eu-west-1
kubectl apply -f kubernetes/production/

kubectl config use-context emotionalchain-ap-southeast-1
kubectl apply -f kubernetes/production/
```

## Configuration Details

### Resource Allocation

**Per Validator Pod**:
- CPU: 500m request, 1000m limit
- Memory: 1Gi request, 2Gi limit
- Storage: 100Gi SSD per validator
- Network: 1Gbps minimum bandwidth

**Cluster Requirements**:
- Node type: c5.xlarge or m5.xlarge minimum
- 3+ nodes per region for HA
- Auto-scaling enabled (3-10 nodes)

### Networking Configuration

**P2P Networking**:
- TCP Port 8000: Direct P2P connections
- TCP Port 8001: WebSocket connections for browsers
- UDP Port 19302: STUN for WebRTC NAT traversal

**Security Groups**:
```
Inbound Rules:
- Port 8000/tcp from 0.0.0.0/0 (P2P bootstrap)
- Port 8001/tcp from 0.0.0.0/0 (WebSocket)
- Port 3000/tcp from VPC CIDR (API)
- Port 9090/tcp from monitoring subnet (metrics)

Outbound Rules:
- All ports to 0.0.0.0/0 (internet access)
- Port 5432/tcp to RDS subnet (database)
```

### Storage Configuration

**Persistent Volumes**:
- Storage Class: `gp3-encrypted`
- IOPS: 3,000 baseline
- Throughput: 250 MB/s
- Encryption: AES-256 at rest

**Backup Strategy**:
- Database: Automated snapshots every 6 hours
- Blockchain data: S3 sync every hour
- Configuration: GitOps with ArgoCD

## Monitoring Setup

### Prometheus Configuration

Deploy monitoring stack:

```bash
# Create monitoring namespace
kubectl create namespace emotionalchain-monitoring

# Deploy Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace emotionalchain-monitoring \
  --values monitoring/prometheus-values.yaml

# Import Grafana dashboards
kubectl create configmap emotionalchain-dashboards \
  --from-file=monitoring/grafana/ \
  --namespace=emotionalchain-monitoring
```

### Alert Configuration

```bash
# Deploy alerting rules
kubectl apply -f monitoring/alerts/emotionalchain-alerts.yml
```

### Key Metrics to Monitor

**Consensus Metrics**:
- `emotionalchain_consensus_success_total`: Consensus success rate
- `emotionalchain_consensus_round_duration_seconds`: Round duration
- `emotionalchain_active_validators_total`: Active validator count

**Performance Metrics**:
- `emotionalchain_database_query_duration_seconds`: Database performance
- `emotionalchain_cache_hit_rate`: Cache efficiency
- `emotionalchain_memory_usage_bytes`: Memory utilization

**Security Metrics**:
- `emotionalchain_byzantine_failures_total`: Byzantine attack detection
- `emotionalchain_security_alerts_total`: Security incidents
- `emotionalchain_biometric_authenticity_score`: Biometric validation

## Security Hardening

### Network Security

**Network Policies**: Implemented to restrict inter-pod communication
**TLS Encryption**: All internal communication uses TLS 1.3
**Firewall Rules**: Restrictive security groups with minimal access

### Data Protection

**Encryption at Rest**: All data encrypted with AES-256
**Encryption in Transit**: TLS 1.3 for all network communication
**Key Management**: Secrets rotated every 90 days

### Access Control

**RBAC**: Role-based access control for all resources
**Pod Security**: Non-root containers with read-only filesystems
**Network Isolation**: Dedicated VPCs with no internet gateways for sensitive components

## Operational Procedures

### Health Checks

**Liveness Probe**: `/health` endpoint every 30 seconds
**Readiness Probe**: `/ready` endpoint every 15 seconds
**Startup Probe**: 12 attempts with 10-second intervals

### Scaling Operations

**Horizontal Scaling**:
```bash
# Scale validators
kubectl scale statefulset emotionalchain-validator --replicas=5 -n emotionalchain-production
```

**Vertical Scaling**:
```bash
# Update resource limits
kubectl patch statefulset emotionalchain-validator -n emotionalchain-production \
  --patch='{"spec":{"template":{"spec":{"containers":[{"name":"validator","resources":{"limits":{"cpu":"2000m","memory":"4Gi"}}}]}}}}'
```

### Backup and Recovery

**Database Backup**:
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier emotionalchain-prod \
  --db-snapshot-identifier emotionalchain-manual-$(date +%Y%m%d-%H%M%S)
```

**Blockchain Data Backup**:
```bash
# Sync to S3
kubectl exec -it emotionalchain-validator-0 -n emotionalchain-production -- \
  aws s3 sync /app/data s3://emotionalchain-backup-$(date +%Y%m%d)/
```

### Incident Response

**Consensus Failure**:
1. Check validator participation rate
2. Verify biometric device connectivity
3. Examine Byzantine failure alerts
4. Restart affected validators if necessary

**Network Partition**:
1. Verify inter-region connectivity
2. Check LoadBalancer health
3. Validate DNS resolution
4. Restart P2P networking if needed

**Performance Degradation**:
1. Check database query performance
2. Verify cache hit rates
3. Monitor resource utilization
4. Scale resources if necessary

## Troubleshooting

### Common Issues

**Pod Startup Failures**:
```bash
# Check pod logs
kubectl logs -f pod/emotionalchain-validator-0 -n emotionalchain-production

# Describe pod for events
kubectl describe pod/emotionalchain-validator-0 -n emotionalchain-production
```

**Database Connection Issues**:
```bash
# Test database connectivity
kubectl run db-test --image=postgres:15-alpine --rm -it --restart=Never -n emotionalchain-production -- \
  psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT version();"
```

**P2P Connectivity Problems**:
```bash
# Check service endpoints
kubectl get endpoints emotionalchain-validator-p2p -n emotionalchain-production

# Test external connectivity
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n emotionalchain-production -- \
  curl -v telnet://<external-ip>:8000
```

### Performance Tuning

**Database Optimization**:
- Monitor slow queries with `pg_stat_statements`
- Adjust `shared_buffers` and `effective_cache_size`
- Optimize connection pooling parameters

**Application Tuning**:
- Adjust cache TTL values based on hit rates
- Optimize consensus timeout parameters
- Scale validator processing threads

**Infrastructure Optimization**:
- Use dedicated instances for high-performance workloads
- Enable enhanced networking for better throughput
- Optimize EBS volume configuration for IOPS

## Maintenance Windows

### Planned Maintenance

**Monthly**: Security patches and minor updates
**Quarterly**: Major version upgrades and performance optimization
**Annually**: Infrastructure review and capacity planning

### Update Procedures

**Rolling Updates**:
```bash
# Update image version
kubectl set image statefulset/emotionalchain-validator \
  validator=ghcr.io/emotionalchain/validator:v1.1.0 \
  -n emotionalchain-production

# Monitor rollout
kubectl rollout status statefulset/emotionalchain-validator -n emotionalchain-production
```

**Blue-Green Deployment**:
```bash
# Use CI/CD pipeline for zero-downtime deployments
# See .github/workflows/deploy-production.yml
```

## Disaster Recovery

### Backup Strategy

**Database**: Cross-region automated backups
**Application State**: S3 replication across regions
**Configuration**: GitOps with automated restore capability

### Recovery Procedures

**Regional Failure**:
1. Promote read replica to primary
2. Update DNS to redirect traffic
3. Scale remaining regions to handle load
4. Restore failed region from backups

**Complete Disaster**:
1. Deploy new infrastructure using IaC
2. Restore database from latest snapshot
3. Sync blockchain data from S3 backups
4. Validate network consensus before opening to public

This production deployment guide ensures EmotionalChain operates with enterprise-grade reliability, security, and performance across multiple regions.