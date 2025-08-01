#!/bin/bash

# EmotionalChain Multi-Region Production Deployment Script
# Deploys validator nodes across AWS regions with proper bootstrap configuration

set -euo pipefail

# Configuration
REGIONS=("us-west-2" "eu-west-1" "ap-southeast-1")
NAMESPACE="emotionalchain-production"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REGISTRY="${REGISTRY:-ghcr.io/emotionalchain/validator}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if aws CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check if envsubst is installed
    if ! command -v envsubst &> /dev/null; then
        log_error "envsubst is not installed"
        exit 1
    fi
    
    # Validate AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi
    
    log_success "Prerequisites validated"
}

# Deploy database indexes
deploy_database_indexes() {
    local region=$1
    log_info "Deploying database indexes for region: $region"
    
    # Get RDS endpoint for the region
    local db_endpoint
    db_endpoint=$(aws rds describe-db-instances \
        --region "$region" \
        --query 'DBInstances[?DBName==`emotionalchain`].Endpoint.Address' \
        --output text)
    
    if [[ -z "$db_endpoint" ]]; then
        log_warning "No RDS instance found in $region, skipping index deployment"
        return 0
    fi
    
    # Execute index creation (requires psql to be available)
    if command -v psql &> /dev/null; then
        log_info "Executing database indexes..."
        PGPASSWORD="$DATABASE_PASSWORD" psql \
            -h "$db_endpoint" \
            -U "$DATABASE_USER" \
            -d emotionalchain \
            -f database/production-indexes.sql \
            -v ON_ERROR_STOP=1
        log_success "Database indexes deployed for $region"
    else
        log_warning "psql not available, database indexes need to be deployed manually"
    fi
}

# Update kubeconfig for region
update_kubeconfig() {
    local region=$1
    log_info "Updating kubeconfig for region: $region"
    
    aws eks update-kubeconfig \
        --region "$region" \
        --name "emotionalchain-$region" \
        --alias "emotionalchain-$region"
    
    # Verify cluster connectivity
    if kubectl cluster-info --context="emotionalchain-$region" &> /dev/null; then
        log_success "Connected to EKS cluster in $region"
    else
        log_error "Failed to connect to EKS cluster in $region"
        exit 1
    fi
}

# Deploy to single region
deploy_region() {
    local region=$1
    local is_primary=${2:-false}
    
    log_info "Starting deployment to region: $region"
    
    # Update kubeconfig
    update_kubeconfig "$region"
    
    # Set context
    kubectl config use-context "emotionalchain-$region"
    
    # Create namespace
    log_info "Creating namespace..."
    kubectl apply -f kubernetes/production/namespace.yaml
    
    # Deploy secrets (assuming they're already created via external secret management)
    log_info "Validating secrets..."
    if ! kubectl get secret emotionalchain-database -n "$NAMESPACE" &> /dev/null; then
        log_error "Database secrets not found in $region. Please deploy secrets first."
        exit 1
    fi
    
    # Deploy configuration
    log_info "Deploying configuration..."
    export REGION="$region"
    export IMAGE_FULL_TAG="$REGISTRY:$IMAGE_TAG"
    
    envsubst < kubernetes/production/configmap.yaml | kubectl apply -f -
    
    # Deploy storage classes
    log_info "Deploying storage classes..."
    kubectl apply -f kubernetes/production/storage-class.yaml
    
    # Deploy StatefulSet
    log_info "Deploying validator StatefulSet..."
    envsubst < kubernetes/production/statefulset.yaml | kubectl apply -f -
    
    # Deploy services
    log_info "Deploying services..."
    kubectl apply -f kubernetes/production/services.yaml
    
    # Deploy HPA
    log_info "Deploying HPA..."
    kubectl apply -f kubernetes/production/hpa.yaml
    
    # Deploy network policies
    log_info "Deploying network policies..."
    kubectl apply -f kubernetes/production/network-policy.yaml
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be ready..."
    kubectl rollout status statefulset/emotionalchain-validator \
        -n "$NAMESPACE" \
        --timeout=600s
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod \
        -l app.kubernetes.io/name=emotionalchain \
        -n "$NAMESPACE" \
        --timeout=300s
    
    # Verify deployment health
    verify_deployment_health "$region"
    
    log_success "Deployment completed for region: $region"
}

# Verify deployment health
verify_deployment_health() {
    local region=$1
    log_info "Verifying deployment health for region: $region"
    
    # Check pod status
    local pod_count
    pod_count=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=emotionalchain --no-headers | wc -l)
    
    if [[ $pod_count -lt 3 ]]; then
        log_error "Expected at least 3 pods, found $pod_count"
        return 1
    fi
    
    # Check service endpoints
    local service_endpoints
    service_endpoints=$(kubectl get endpoints emotionalchain-validator-headless -n "$NAMESPACE" -o jsonpath='{.subsets[0].addresses[*].ip}' | wc -w)
    
    if [[ $service_endpoints -lt 3 ]]; then
        log_error "Expected at least 3 service endpoints, found $service_endpoints"
        return 1
    fi
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    kubectl run health-check-$$-$RANDOM \
        --image=curlimages/curl \
        --rm -i --restart=Never \
        -n "$NAMESPACE" \
        -- curl -f http://emotionalchain-api.emotionalchain-production.svc.cluster.local/health
    
    log_success "Health verification passed for region: $region"
}

# Configure inter-region connectivity
configure_inter_region_connectivity() {
    log_info "Configuring inter-region connectivity..."
    
    # Get external LoadBalancer IPs for each region
    declare -A region_ips
    
    for region in "${REGIONS[@]}"; do
        kubectl config use-context "emotionalchain-$region"
        
        local external_ip
        external_ip=$(kubectl get service emotionalchain-validator-p2p \
            -n "$NAMESPACE" \
            -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || \
            kubectl get service emotionalchain-validator-p2p \
            -n "$NAMESPACE" \
            -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
        
        if [[ -n "$external_ip" ]]; then
            region_ips["$region"]="$external_ip"
            log_info "Region $region external endpoint: $external_ip"
        else
            log_warning "Could not determine external IP for region $region"
        fi
    done
    
    # Update bootstrap configurations with inter-region peers
    for region in "${REGIONS[@]}"; do
        kubectl config use-context "emotionalchain-$region"
        
        log_info "Updating bootstrap configuration for $region..."
        
        # Create updated bootstrap config with other regions' IPs
        local bootstrap_peers=""
        for other_region in "${REGIONS[@]}"; do
            if [[ "$other_region" != "$region" ]] && [[ -n "${region_ips[$other_region]:-}" ]]; then
                bootstrap_peers="$bootstrap_peers\"/ip4/${region_ips[$other_region]}/tcp/8000\","
            fi
        done
        
        # Remove trailing comma
        bootstrap_peers="${bootstrap_peers%,}"
        
        # Update ConfigMap
        kubectl patch configmap "emotionalchain-bootstrap-$region" \
            -n "$NAMESPACE" \
            --type='merge' \
            -p="{\"data\":{\"bootstrap_peers.json\":\"{\\\"region\\\":\\\"$region\\\",\\\"regional_peers\\\":[$bootstrap_peers]}\"}}"
        
        # Restart StatefulSet to pick up new configuration
        kubectl rollout restart statefulset/emotionalchain-validator -n "$NAMESPACE"
    done
    
    log_success "Inter-region connectivity configured"
}

# Run post-deployment tests
run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    # Test consensus across regions
    kubectl config use-context "emotionalchain-us-west-2"
    
    log_info "Testing consensus functionality..."
    kubectl run consensus-test-$$-$RANDOM \
        --image="$REGISTRY:$IMAGE_TAG" \
        --rm -i --restart=Never \
        -n "$NAMESPACE" \
        -- npm run test:consensus
    
    log_info "Testing P2P connectivity..."
    kubectl run p2p-test-$$-$RANDOM \
        --image="$REGISTRY:$IMAGE_TAG" \
        --rm -i --restart=Never \
        -n "$NAMESPACE" \
        -- npm run test:p2p-connectivity
    
    log_success "Post-deployment tests completed"
}

# Main deployment function
main() {
    log_info "Starting EmotionalChain multi-region deployment"
    log_info "Regions: ${REGIONS[*]}"
    log_info "Image: $REGISTRY:$IMAGE_TAG"
    
    # Validate prerequisites
    validate_prerequisites
    
    # Deploy to each region
    for i in "${!REGIONS[@]}"; do
        local region="${REGIONS[$i]}"
        local is_primary=false
        
        # First region is primary
        if [[ $i -eq 0 ]]; then
            is_primary=true
        fi
        
        # Deploy database indexes
        deploy_database_indexes "$region"
        
        # Deploy to region
        deploy_region "$region" "$is_primary"
        
        log_success "Region $region deployment completed"
        
        # Short pause between regions
        sleep 30
    done
    
    # Configure inter-region connectivity
    configure_inter_region_connectivity
    
    # Run post-deployment tests
    run_post_deployment_tests
    
    log_success "Multi-region deployment completed successfully!"
    
    # Display deployment summary
    echo ""
    echo "=== DEPLOYMENT SUMMARY ==="
    for region in "${REGIONS[@]}"; do
        kubectl config use-context "emotionalchain-$region"
        echo "Region: $region"
        kubectl get pods -n "$NAMESPACE" -o wide
        echo ""
    done
}

# Handle script interruption
cleanup() {
    log_warning "Deployment interrupted"
    exit 1
}

trap cleanup INT TERM

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi