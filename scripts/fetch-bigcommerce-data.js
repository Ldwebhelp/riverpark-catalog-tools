#!/usr/bin/env node

/**
 * Fetch Real BigCommerce Data Script
 * Fetches actual products and categories from BigCommerce API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// BigCommerce API Configuration
const STORE_HASH = 'nzocnvfw4r';
const ACCESS_TOKEN = '809gesokicafds538s3xy5qegwa9fy0';
const API_BASE = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3`;

/**
 * Make API request to BigCommerce Management API
 */
function makeApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.bigcommerce.com',
      port: 443,
      path: `/stores/${STORE_HASH}/v3${endpoint}`,
      method: 'GET',
      headers: {
        'X-Auth-Token': ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsed, null, 2)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Fetch all categories from BigCommerce
 */
async function fetchCategories() {
  console.log('📂 Fetching categories from BigCommerce...');
  
  try {
    const response = await makeApiRequest('/catalog/categories?limit=250');
    const categories = response.data || [];
    
    console.log(`✅ Found ${categories.length} categories`);
    return categories.map(cat => ({
      id: cat.id,
      parent_id: cat.parent_id,
      name: cat.name,
      description: cat.description || '',
      is_visible: cat.is_visible,
      sort_order: cat.sort_order,
      children: [] // Will be populated by hierarchy building
    }));
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    return [];
  }
}

/**
 * Fetch all products from BigCommerce
 */
async function fetchProducts() {
  console.log('🛒 Fetching products from BigCommerce...');
  
  try {
    const response = await makeApiRequest('/catalog/products?limit=250');
    const products = response.data || [];
    
    console.log(`✅ Found ${products.length} products`);
    return products.map(prod => ({
      id: prod.id,
      name: prod.name,
      type: prod.type,
      sku: prod.sku,
      description: prod.description || '',
      price: prod.price,
      sale_price: prod.sale_price || 0,
      inventory_level: prod.inventory_level || 0,
      is_visible: prod.is_visible,
      categories: prod.categories || [],
      brand_id: prod.brand_id,
      images: (prod.images || []).map(img => ({
        url: img.url_standard,
        altText: img.description || prod.name
      })),
      primary_image: prod.images && prod.images.length > 0 ? {
        url: prod.images[0].url_standard,
        altText: prod.images[0].description || prod.name
      } : null,
      date_modified: prod.date_modified,
      date_created: prod.date_created
    }));
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    return [];
  }
}

/**
 * Build category hierarchy
 */
function buildCategoryHierarchy(categories) {
  const categoryMap = new Map();
  const rootCategories = [];

  // Create map of all categories
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Build hierarchy
  categories.forEach(cat => {
    if (cat.parent_id === 0) {
      rootCategories.push(categoryMap.get(cat.id));
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(categoryMap.get(cat.id));
      }
    }
  });

  return rootCategories;
}

/**
 * Update database.ts with real data
 */
async function updateDatabaseFile(categories, products) {
  console.log('📝 Updating database.ts with real data...');
  
  const databasePath = path.join(__dirname, '../src/lib/database.ts');
  let content = fs.readFileSync(databasePath, 'utf8');
  
  // Replace products data
  const productsJson = JSON.stringify(products, null, 6);
  content = content.replace(
    /const realProducts: BigCommerceProduct\[\] = \[[\s\S]*?\];/,
    `const realProducts: BigCommerceProduct[] = ${productsJson};`
  );
  
  // Replace categories data
  const categoriesJson = JSON.stringify(categories, null, 6);
  content = content.replace(
    /const realCategories: BigCommerceCategory\[\] = \[[\s\S]*?\];/,
    `const realCategories: BigCommerceCategory[] = ${categoriesJson};`
  );
  
  fs.writeFileSync(databasePath, content);
  console.log('✅ Database updated with real BigCommerce data');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Fetching real BigCommerce data...\n');
    
    // Fetch data from BigCommerce
    const [categories, products] = await Promise.all([
      fetchCategories(),
      fetchProducts()
    ]);
    
    // Build category hierarchy
    const hierarchicalCategories = buildCategoryHierarchy(categories);
    
    // Update database file
    await updateDatabaseFile(hierarchicalCategories, products);
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
    console.log('   ✅ Real BigCommerce data loaded successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fetch BigCommerce data:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };