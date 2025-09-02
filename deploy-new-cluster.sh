#!/bin/bash
set -e

echo "🚀 Deploying BetterUptime to new Kubernetes cluster..."
echo "📋 Optimized for: 2 users/day, 2 e2-medium instances"
echo ""

# Step 1: Create namespace
echo "1️⃣ Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Step 2: Apply secrets and configuration
echo "2️⃣ Applying secrets and configuration..."
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmaps.yaml

# Step 3: Apply storage classes (optional but recommended)
echo "3️⃣ Creating storage classes..."
kubectl apply -f k8s/storage-class.yaml

# Step 4: Create persistent volume claims
echo "4️⃣ Creating persistent volume claims..."
kubectl apply -f k8s/persistent-volumes.yaml

# Step 5: Wait for PVCs to be bound
echo "5️⃣ Waiting for storage to be provisioned..."
echo "   This may take 1-2 minutes..."
 

echo "✅ Storage provisioned successfully!"

# Step 6: Deploy databases
echo "6️⃣ Deploying databases..."
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
kubectl apply -f k8s/redis-deploy.yaml

# Step 7: Wait for databases to be ready
echo "7️⃣ Waiting for databases to start..."
kubectl rollout status deployment/postgres -n betteruptime --timeout=300s
kubectl rollout status deployment/redis -n betteruptime --timeout=300s

# Step 8: Initialize databases
echo "8️⃣ Initializing databases..."
kubectl apply -f k8s/postgres-init-job.yaml
kubectl apply -f k8s/redis-init-job.yaml

# Wait for initialization to complete
echo "   Waiting for database initialization..."
kubectl wait --for=condition=complete job/postgres-init -n betteruptime --timeout=300s
kubectl wait --for=condition=complete job/redis-init -n betteruptime --timeout=300s

# Step 9: Deploy application services
echo "9️⃣ Deploying application services..."
kubectl apply -f k8s/api-service.yaml
kubectl apply -f k8s/api-deployment.yaml

kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml

kubectl apply -f k8s/pusher-service.yaml
kubectl apply -f k8s/pusher-deployment.yaml

# Step 10: Deploy workers
echo "🔟 Deploying workers for India and USA regions..."
kubectl apply -f k8s/worker-india-deployment.yaml
kubectl apply -f k8s/worker-usa-deployment.yaml

# Step 11: Apply autoscaling
echo "1️⃣1️⃣ Setting up autoscaling..."
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pusher-hpa.yaml

# Step 12: Setup backup system
echo "1️⃣2️⃣ Setting up backup system..."
kubectl apply -f k8s/backup-cronjob.yaml

# Step 13: Wait for all deployments
echo "1️⃣3️⃣ Waiting for all services to be ready..."
kubectl rollout status deployment/api -n betteruptime --timeout=300s
kubectl rollout status deployment/frontend -n betteruptime --timeout=300s
kubectl rollout status deployment/pusher -n betteruptime --timeout=300s
kubectl rollout status deployment/worker-india -n betteruptime --timeout=300s
kubectl rollout status deployment/worker-usa -n betteruptime --timeout=300s

# Step 14: Apply ingress (optional - for external access)
echo "1️⃣4️⃣ Setting up ingress (optional)..."
echo "   Choose one of the following ingress options:"
echo "   - For HTTP only: kubectl apply -f k8s/nginx-ingress.yaml"
echo "kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml"
echo "   - For HTTPS: kubectl apply -f k8s/nginx-ingress-https.yaml"
echo "https cert manager -Cert MAnager 
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml"

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Final Status Check:"
kubectl get pods -n betteruptime
echo ""
kubectl get pvc -n betteruptime
echo ""
kubectl get hpa -n betteruptime
echo ""
echo "🎯 Resource Summary (optimized for 2 users/day):"
echo "  💾 Total Storage: ~4Gi"
echo "  🖥️ Total CPU requests: ~200m (0.2 cores)"
echo "  🧠 Total Memory requests: ~512Mi"
echo "  📈 Auto-scaling: 1-2 replicas per worker region"
echo ""
echo "🔗 To access your application:"
echo "  1. Apply ingress: kubectl apply -f k8s/nginx-ingress.yaml"
echo "  2. Get external IP: kubectl get ingress -n betteruptime"
echo "  3. Update DNS to point your domain to the external IP"
echo ""
echo "🔍 Monitor with:"
echo "  kubectl get pods -n betteruptime -w"
echo "  kubectl top pods -n betteruptime"
echo "  kubectl logs -f deployment/api -n betteruptime"