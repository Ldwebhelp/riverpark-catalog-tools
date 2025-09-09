/**
 * Real BigCommerce API Client
 * Connects to actual BigCommerce store data - NO MOCK DATA
 */

export interface BigCommerceConfig {
  storeHash: string;
  clientId: string;
  accessToken: string;
  apiUrl?: string;
}

export interface BigCommerceCategory {
  id: number;
  parent_id: number;
  name: string;
  description: string;
  views: number;
  sort_order: number;
  page_title: string;
  meta_keywords: string[];
  meta_description: string;
  layout_file: string;
  is_visible: boolean;
  search_keywords: string;
  default_product_sort: string;
  image_url: string;
  custom_url: {
    url: string;
    is_customized: boolean;
  };
}

export interface BigCommerceProductImage {
  id: number;
  product_id: number;
  image_file: string;
  is_thumbnail: boolean;
  sort_order: number;
  description: string;
  image_url: string;
  url_zoom: string;
  url_standard: string;
  url_thumbnail: string;
  url_tiny: string;
  date_modified: string;
}

export interface BigCommerceProductReal {
  id: number;
  name: string;
  type: 'physical' | 'digital';
  sku: string;
  description: string;
  weight: number;
  width: number;
  depth: number;
  height: number;
  price: number;
  cost_price: number;
  retail_price: number;
  sale_price: number;
  map_price: number;
  tax_class_id: number;
  product_tax_code: string;
  calculated_price: number;
  categories: number[];
  brand_id: number;
  option_set_id: number;
  option_set_display: string;
  inventory_level: number;
  inventory_warning_level: number;
  inventory_tracking: string;
  reviews_rating_sum: number;
  reviews_count: number;
  total_sold: number;
  fixed_cost_shipping_price: number;
  is_free_shipping: boolean;
  is_visible: boolean;
  is_featured: boolean;
  related_products: number[];
  warranty: string;
  bin_picking_number: string;
  layout_file: string;
  upc: string;
  mpn: string;
  gtin: string;
  search_keywords: string;
  availability: string;
  availability_description: string;
  gift_wrapping_options_type: string;
  gift_wrapping_options_list: number[];
  sort_order: number;
  condition: string;
  is_condition_shown: boolean;
  order_quantity_minimum: number;
  order_quantity_maximum: number;
  page_title: string;
  meta_keywords: string[];
  meta_description: string;
  date_created: string;
  date_modified: string;
  view_count: number;
  preorder_release_date: string;
  preorder_message: string;
  is_preorder_only: boolean;
  is_price_hidden: boolean;
  price_hidden_label: string;
  custom_url: {
    url: string;
    is_customized: boolean;
  };
  base_variant_id: number;
  open_graph_type: string;
  open_graph_title: string;
  open_graph_description: string;
  open_graph_use_meta_description: boolean;
  open_graph_use_product_name: boolean;
  open_graph_use_image: boolean;
  brand: {
    id: number;
    name: string;
  };
  images: BigCommerceProductImage[];
  primary_image: BigCommerceProductImage;
  videos: any[];
  custom_fields: Array<{
    id: number;
    name: string;
    value: string;
  }>;
  bulk_pricing_rules: any[];
  variants: any[];
  options: any[];
  modifiers: any[];
}

export interface BigCommerceApiResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
      links: {
        previous?: string;
        current: string;
        next?: string;
      };
    };
  };
}

export class BigCommerceClient {
  private config: BigCommerceConfig;
  private baseUrl: string;

  constructor(config: BigCommerceConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || `https://api.bigcommerce.com/stores/${config.storeHash}/v3`;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'X-Auth-Token': this.config.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    // Add X-Auth-Client header if clientId is provided
    if (this.config.clientId) {
      headers['X-Auth-Client'] = this.config.clientId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`BigCommerce API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`BigCommerce API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all category trees from BigCommerce (modern approach)
   */
  async getCategoryTrees(): Promise<{ data: Array<{ id: number; name: string; channel_ids: number[] }> }> {
    return this.makeRequest<{ data: Array<{ id: number; name: string; channel_ids: number[] }> }>(
      `/catalog/trees`
    );
  }

  /**
   * Get categories from a specific category tree
   */
  async getCategoriesFromTree(treeId: number, depth?: number): Promise<{ data: BigCommerceCategory[] }> {
    const depthParam = depth ? `?depth=${depth}` : '';
    return this.makeRequest<{ data: BigCommerceCategory[] }>(
      `/catalog/trees/${treeId}/categories${depthParam}`
    );
  }

  /**
   * Get all categories from BigCommerce (fallback for legacy support)
   */
  async getCategories(page = 1, limit = 250): Promise<BigCommerceApiResponse<BigCommerceCategory>> {
    return this.makeRequest<BigCommerceApiResponse<BigCommerceCategory>>(
      `/catalog/categories?page=${page}&limit=${limit}&include_fields=id,parent_id,name,description,is_visible,sort_order`
    );
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryId: number | string, 
    page = 1, 
    limit = 50,
    includeVariants = false
  ): Promise<BigCommerceApiResponse<BigCommerceProductReal>> {
    const includeFields = [
      'id', 'name', 'type', 'sku', 'description', 'price', 'sale_price', 
      'inventory_level', 'is_visible', 'categories', 'brand_id', 'images',
      'custom_fields', 'date_created', 'date_modified'
    ].join(',');

    // Correct parameter format: categories should be just categories, not categories:in
    const params = new URLSearchParams({
      categories: categoryId.toString(),
      page: page.toString(),
      limit: limit.toString(),
      include_fields: includeFields,
    });

    if (includeVariants) {
      params.append('include', 'variants,images');
    } else {
      params.append('include', 'images');
    }

    return this.makeRequest<BigCommerceApiResponse<BigCommerceProductReal>>(
      `/catalog/products?${params.toString()}`
    );
  }

  /**
   * Get all products with optional filtering
   */
  async getProducts(
    page = 1, 
    limit = 50, 
    filters: { 
      categoryId?: number;
      isVisible?: boolean;
      keyword?: string;
      brandId?: number;
    } = {}
  ): Promise<BigCommerceApiResponse<BigCommerceProductReal>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      include: 'images,custom_fields',
    });

    if (filters.categoryId) {
      params.append('categories:in', filters.categoryId.toString());
    }
    
    if (filters.isVisible !== undefined) {
      params.append('is_visible', filters.isVisible.toString());
    }

    if (filters.keyword) {
      params.append('keyword', filters.keyword);
    }

    if (filters.brandId) {
      params.append('brand_id', filters.brandId.toString());
    }

    const includeFields = [
      'id', 'name', 'type', 'sku', 'description', 'price', 'sale_price', 
      'inventory_level', 'is_visible', 'categories', 'brand_id', 'images',
      'custom_fields', 'date_created', 'date_modified', 'brand'
    ].join(',');
    
    params.append('include_fields', includeFields);

    return this.makeRequest<BigCommerceApiResponse<BigCommerceProductReal>>(
      `/catalog/products?${params.toString()}`
    );
  }

  /**
   * Get category tree with subcategories
   */
  async getCategoryTree(): Promise<BigCommerceCategory[]> {
    const allCategories: BigCommerceCategory[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getCategories(page, 250);
      allCategories.push(...response.data);
      
      hasMore = response.meta.pagination.current_page < response.meta.pagination.total_pages;
      page++;
    }

    return allCategories;
  }

  /**
   * Get products from category and all subcategories
   */
  async getProductsFromCategoryAndSubcategories(
    categoryId: number,
    page = 1,
    limit = 50
  ): Promise<{
    products: BigCommerceProductReal[];
    pagination: any;
    categoryTree: BigCommerceCategory[];
  }> {
    // Get all categories to build tree
    const allCategories = await this.getCategoryTree();
    
    // Find subcategories
    const findSubcategories = (parentId: number): number[] => {
      const subcategories = allCategories
        .filter(cat => cat.parent_id === parentId)
        .map(cat => cat.id);
      
      const allSubs = [...subcategories];
      subcategories.forEach(subId => {
        allSubs.push(...findSubcategories(subId));
      });
      
      return allSubs;
    };

    const categoryIds = [categoryId, ...findSubcategories(categoryId)];
    
    // Get products from all categories
    const response = await this.makeRequest<BigCommerceApiResponse<BigCommerceProductReal>>(
      `/catalog/products?categories:in=${categoryIds.join(',')}&page=${page}&limit=${limit}&include=images,custom_fields&include_fields=id,name,type,sku,description,price,sale_price,inventory_level,is_visible,categories,brand_id,images,custom_fields,date_created,date_modified`
    );

    return {
      products: response.data,
      pagination: response.meta.pagination,
      categoryTree: allCategories.filter(cat => categoryIds.includes(cat.id))
    };
  }

  /**
   * Search products
   */
  async searchProducts(keyword: string, page = 1, limit = 50): Promise<BigCommerceApiResponse<BigCommerceProductReal>> {
    return this.getProducts(page, limit, { keyword, isVisible: true });
  }
}

// Factory function to create BigCommerce client from environment variables
export function createBigCommerceClient(): BigCommerceClient | null {
  const accessToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  const apiUrl = process.env.BIGCOMMERCE_API_URL;
  
  // Extract store hash from API URL if provided, otherwise derive from standard format
  let storeHash = '';
  if (apiUrl) {
    const match = apiUrl.match(/stores\/([^\/]+)\/v3/);
    if (match) {
      storeHash = match[1];
    }
  }

  if (!accessToken) {
    console.warn('BigCommerce API credentials not found in environment variables. Please set BIGCOMMERCE_ACCESS_TOKEN.');
    return null;
  }

  if (!storeHash && !apiUrl) {
    console.warn('BigCommerce API URL or store hash not configured. Please set BIGCOMMERCE_API_URL.');
    return null;
  }

  return new BigCommerceClient({
    storeHash,
    clientId: '', // Not needed for API access with access token
    accessToken,
    apiUrl,
  });
}