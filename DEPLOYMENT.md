# Demo Widget Deployment Summary

## Deployment Complete ✅

The demo widget has been successfully deployed to the Kubernetes cluster in the default namespace.

### Deployment Details

**Cluster:** dev-lxtp-eks-pealtamo (us-west-2)  
**Namespace:** default  
**Replicas:** 2 (both healthy)  
**Image:** 715841348893.dkr.ecr.us-west-2.amazonaws.com/demo-widget:latest

### Access Information

**ALB Endpoint:** https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com  
**Custom Domain:** demo-widget.dev.lxtp.chegg.services (DNS not yet configured)  

**Note:** To access via the ALB directly, you must include the Host header:
```bash
curl -H "Host: demo-widget.dev.lxtp.chegg.services" https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/health
```

### Available Endpoints

- **Health Check:** `/health`
- **Widget Bundle:** `/widget/widget.iife.js`
- **Widget CSS:** `/widget/widget.css`
- **JWKS Endpoint:** `/.well-known/jwks.json`
- **Feedback API:** `/api/feedback` (protected)

### Kubernetes Resources Created

1. **Deployment:** `demo-widget-backend`
   - 2 replicas
   - Resource limits: 256Mi memory, 200m CPU
   - Health probes configured

2. **Service:** `demo-widget-backend-service`
   - Type: ClusterIP
   - Port: 3002

3. **Ingress:** `demo-widget-ingress`
   - ALB ingress class
   - HTTPS with ACM certificate
   - HTTP to HTTPS redirect
   - Host: demo-widget.dev.lxtp.chegg.services

### Using the Widget in Other Applications

To embed the widget in another application:

```html
<div id="widget-container"></div>
<script src="https://demo-widget.dev.lxtp.chegg.services/widget/widget.iife.js"></script>
<script>
  window.MyWidget.init({
    targetId: 'widget-container',
    accessToken: userAccessToken,
    idToken: userIdToken,
    theme: 'light',
    onEvent: (event) => {
      console.log('Widget event:', event);
    }
  });
</script>
```

**For apps running in the VPC (Kubernetes, EC2, etc.):**
```html
<script src="https://demo-widget.dev.lxtp.chegg.services/widget/widget.iife.js"></script>
```

**For external/local development (must include Host header):**
```bash
curl -H "Host: demo-widget.dev.lxtp.chegg.services" \
  https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/widget/widget.iife.js
```

### DNS Configuration ✅

DNS records have been created in Route 53:

**Private Zone (VPC internal access):** Z07714343OE4YKWM5NO7F
**Public Zone:** Z06717322LWA7P3DOSUUM

**CNAME Record:**
```
demo-widget.dev.lxtp.chegg.services -> k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com
```

**Note:** The `dev.lxtp.chegg.services` domain is an **internal-only domain**. It resolves:
- ✅ From within AWS VPCs (where your applications run)
- ❌ Not from the public internet

This is the same pattern as other services like `mmrag-dev.dev.lxtp.chegg.services`.

For internal applications, use:
```
https://demo-widget.dev.lxtp.chegg.services/widget/widget.iife.js
```

For external/local development, use the ALB hostname directly:
```
https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/widget/widget.iife.js
```
(with Host header: `demo-widget.dev.lxtp.chegg.services`)

### Verification

All endpoints tested and working:

```bash
# Health check
curl -H "Host: demo-widget.dev.lxtp.chegg.services" \
  https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/health
# Response: {"status":"healthy","service":"widget-backend"}

# Widget bundle (truncated)
curl -H "Host: demo-widget.dev.lxtp.chegg.services" \
  https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/widget/widget.iife.js
# Response: (function() { "use strict"; ... })

# JWKS endpoint
curl -H "Host: demo-widget.dev.lxtp.chegg.services" \
  https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/.well-known/jwks.json
# Response: {"keys":[{"kty":"RSA","n":"u36ru-...","e":"AQAB","kid":"demo-key-1","use":"sig","alg":"RS256"}]}
```

### Target Health

Both pods are healthy and registered with the ALB:
- Target 1: 100.64.4.81:3002 (us-west-2a) - healthy
- Target 2: 100.64.23.195:3002 (us-west-2c) - healthy

### Next Steps

1. **Configure DNS** - Add CNAME record for demo-widget.dev.lxtp.chegg.services
2. **Test from another app** - Embed the widget in your application
3. **Monitor** - Check pod logs and metrics:
   ```bash
   kubectl logs -f deployment/demo-widget-backend -n default
   kubectl get pods -n default -l app=demo-widget-backend
   ```

### Files Created

- `/Users/mgardner/Development/tinker/demo-widget/Dockerfile` - Multi-stage Docker build
- `/Users/mgardner/Development/tinker/demo-widget/k8s/deployment.yaml` - Kubernetes deployment
- `/Users/mgardner/Development/tinker/demo-widget/k8s/service.yaml` - Kubernetes service
- `/Users/mgardner/Development/tinker/demo-widget/k8s/ingress.yaml` - ALB ingress configuration
- `/Users/mgardner/Development/tinker/demo-widget/shared/src/auth-constants.ts` - Updated URLs to deployed endpoint

### ECR Repository

**Repository:** demo-widget  
**URI:** 715841348893.dkr.ecr.us-west-2.amazonaws.com/demo-widget  
**Latest Tag:** latest (linux/amd64)

