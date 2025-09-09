# 🔧 Vercel Environment Variables Setup

## 🚨 **Critical: Configure These in Vercel Dashboard**

### **1. riverpark-catalyst-fresh Environment Variables**

**Go to**: https://vercel.com/lindsays-projects-068df8e9/frontend/settings/environment-variables

**Add these variables:**

```bash
OPENAI_API_KEY=your-openai-api-key-from-local-env

# BigCommerce Configuration  
BIGCOMMERCE_STOREFRONT_TOKEN=your-storefront-token-from-local-env
BIGCOMMERCE_CHANNEL_ID=1
BIGCOMMERCE_ACCESS_TOKEN=your-access-token-from-local-env
BIGCOMMERCE_API_URL=https://api.bigcommerce.com/stores/your-store-hash/v3/

# Store Configuration
BIGCOMMERCE_STORE_HASH=your-store-hash
BIGCOMMERCE_CUSTOMER_IMPERSONATION_TOKEN=your-customer-token-from-local-env
```

**⚠️ Important**: Copy the actual values from your local `.env.local` file - do not use the placeholder text above.

### **2. riverpark-catalog-tools Environment Variables**

**Go to**: https://vercel.com/lindsays-projects-068df8e9/riverpark-catalog-tools/settings/environment-variables

**Add these variables:**

```bash
# AI Service Configuration
AI_SERVICE_URL=https://frontend-35r6r54pn-lindsays-projects-068df8e9.vercel.app
AI_REQUEST_TIMEOUT=30000

# BigCommerce API Configuration
BIGCOMMERCE_STORE_URL=https://api.bigcommerce.com/stores/your-store-hash
BIGCOMMERCE_ACCESS_TOKEN=your-access-token-from-local-env
BIGCOMMERCE_CLIENT_ID=your-client-id-from-local-env

# Additional Config
BIGCOMMERCE_API_URL=https://api.bigcommerce.com/stores/your-store-hash/v3/
BIGCOMMERCE_STOREFRONT_TOKEN=your-storefront-token-from-local-env
```

**⚠️ Important**: Copy the actual values from your local `.env.local` file - do not use the placeholder text above.

## 🚀 **Deployment Steps**

### **Step 1: Add Environment Variables**
1. Visit the Vercel dashboard links above
2. Go to Settings → Environment Variables  
3. Add all the variables listed for each project
4. Set them for **Production, Preview, and Development** environments

### **Step 2: Redeploy Both Projects**
After adding the environment variables:

```bash
# Redeploy riverpark-catalyst-fresh
cd /Users/lindsay/GitHub/riverpark-catalyst-fresh/frontend
vercel deploy --prod --yes

# Redeploy riverpark-catalog-tools  
cd /Users/lindsay/GitHub/riverpark-catalog-tools
vercel deploy --prod --yes
```

### **Step 3: Update Local Configuration (Optional)**
Update your local `.env.local` to match production:

```bash
# Add to catalog-tools .env.local
AI_SERVICE_URL=https://frontend-35r6r54pn-lindsays-projects-068df8e9.vercel.app
```

## ✅ **Verification Steps**

1. **Test AI Backend**: Visit `https://frontend-35r6r54pn-lindsays-projects-068df8e9.vercel.app/test/ai-species`
2. **Test Catalog Tools**: Visit `https://riverpark-catalog-tools-9ajcnvurt-lindsays-projects-068df8e9.vercel.app/ai-species`
3. **Check Connections**: Use the "Test Connections" button in the AI Species Generator

## 🎯 **Expected Results**

After configuring environment variables:
- ✅ AI Species Generator loads BigCommerce products
- ✅ OpenAI integration works for real species generation
- ✅ Cross-system communication between both apps
- ✅ No more "BigCommerce configuration is missing" errors

## 🔧 **Troubleshooting**

If issues persist:
1. Check Vercel function logs in the dashboard
2. Verify all environment variables are set correctly
3. Ensure both projects are using the latest deployment
4. Test the `/api/health` endpoints on both systems

**Once configured, your revolutionary AI system will be fully operational! 🤖🚀**