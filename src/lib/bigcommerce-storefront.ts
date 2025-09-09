/**
 * BigCommerce Storefront GraphQL API Client
 * Uses GraphQL for frontend queries - NOT Management API REST endpoints
 */

export interface BigCommerceStorefrontConfig {
  storefrontToken: string;
  channelId: string;
  apiUrl?: string;
}

export interface StorefrontProduct {
  entityId: number;
  name: string;
  sku: string;
  description: string;
  prices: {
    price: {
      value: number;
      currencyCode: string;
    };
    salePrice?: {
      value: number;
      currencyCode: string;
    };
  };
  defaultImage?: {
    url: string;
    altText: string;
  };
  categories: {
    edges: Array<{
      node: {
        entityId: number;
        name: string;
        path: string;
      };
    }>;
  };
  inventory: {
    aggregated?: {
      availableToSell: number;
    };
  };
}

export interface StorefrontCategory {
  entityId: number;
  name: string;
  path: string;
  description: string;
  image?: {
    url: string;
    altText: string;
  };
  children: {
    edges: Array<{
      node: StorefrontCategory;
    }>;
  };
}

export interface StorefrontProductsResponse {
  data: {
    site: {
      products: {
        edges: Array<{
          node: StorefrontProduct;
        }>;
        pageInfo: {
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string;
          endCursor: string;
        };
      };
    };
  };
}

export interface StorefrontCategoriesResponse {
  data: {
    site: {
      categoryTree: Array<StorefrontCategory>;
    };
  };
}

export class BigCommerceStorefrontClient {
  private config: BigCommerceStorefrontConfig;
  private graphqlUrl: string;

  constructor(config: BigCommerceStorefrontConfig) {
    this.config = config;
    this.graphqlUrl = config.apiUrl || 'https://store-nzocnvfw4r-sswdpfbpaa.mybigcommerce.com/graphql';
  }

  private async makeGraphQLRequest<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    console.log(`Making BigCommerce GraphQL request to: ${this.graphqlUrl}`);
    console.log('Query:', query.substring(0, 200) + '...');
    console.log('Variables:', variables);

    const headers = {
      'Authorization': `Bearer ${this.config.storefrontToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    console.log('Request headers:', { ...headers, 'Authorization': '[REDACTED]' });

    try {
      const response = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      console.log(`BigCommerce GraphQL response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`BigCommerce GraphQL Error Response:`, errorText);
        throw new Error(`BigCommerce GraphQL Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL Errors:', data.errors);
        throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors)}`);
      }

      console.log(`BigCommerce GraphQL success`);
      
      return data;
    } catch (error) {
      console.error(`BigCommerce GraphQL request failed:`, error);
      throw error;
    }
  }

  /**
   * Get products with optional filtering
   */
  async getProducts(
    first: number = 50, 
    after?: string,
    filters: {
      categoryEntityId?: number;
      searchTerm?: string;
    } = {}
  ): Promise<StorefrontProductsResponse> {
    const query = `
      query GetProducts($first: Int!, $after: String, $categoryEntityId: Int, $searchTerm: String) {
        site {
          products(first: $first, after: $after, filters: { categoryEntityId: $categoryEntityId, searchSubQuery: { searchTerm: $searchTerm } }) {
            edges {
              node {
                entityId
                name
                sku
                description
                prices {
                  price {
                    value
                    currencyCode
                  }
                  salePrice {
                    value
                    currencyCode
                  }
                }
                defaultImage {
                  url(width: 300, height: 300)
                  altText
                }
                categories {
                  edges {
                    node {
                      entityId
                      name
                      path
                    }
                  }
                }
                inventory {
                  aggregated {
                    availableToSell
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      }
    `;

    const variables: Record<string, any> = { first };
    
    if (after) variables.after = after;
    if (filters.categoryEntityId) variables.categoryEntityId = filters.categoryEntityId;
    if (filters.searchTerm) variables.searchTerm = filters.searchTerm;

    return this.makeGraphQLRequest<StorefrontProductsResponse>(query, variables);
  }

  /**
   * Get category tree
   */
  async getCategoryTree(): Promise<StorefrontCategoriesResponse> {
    const query = `
      query GetCategoryTree {
        site {
          categoryTree {
            entityId
            name
            path
            description
            image {
              url(width: 200, height: 200)
              altText
            }
            children {
              edges {
                node {
                  entityId
                  name
                  path
                  description
                  children {
                    edges {
                      node {
                        entityId
                        name
                        path
                        description
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    return this.makeGraphQLRequest<StorefrontCategoriesResponse>(query);
  }

  /**
   * Search products
   */
  async searchProducts(searchTerm: string, first: number = 50, after?: string): Promise<StorefrontProductsResponse> {
    return this.getProducts(first, after, { searchTerm });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryEntityId: number, first: number = 50, after?: string): Promise<StorefrontProductsResponse> {
    return this.getProducts(first, after, { categoryEntityId });
  }
}

// Factory function to create BigCommerce Storefront client from environment variables
export function createStorefrontClient(): BigCommerceStorefrontClient | null {
  const storefrontToken = process.env.BIGCOMMERCE_STOREFRONT_TOKEN;
  const channelId = process.env.BIGCOMMERCE_CHANNEL_ID || '1';

  if (!storefrontToken) {
    console.warn('BigCommerce Storefront API credentials not found. Please set BIGCOMMERCE_STOREFRONT_TOKEN.');
    return null;
  }

  return new BigCommerceStorefrontClient({
    storefrontToken,
    channelId,
  });
}