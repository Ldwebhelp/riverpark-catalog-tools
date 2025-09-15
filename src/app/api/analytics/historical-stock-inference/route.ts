import { NextRequest, NextResponse } from 'next/server';
import { BigCommerceAPI, createBigCommerceClient } from '@/lib/bigcommerce-direct';

interface OrderProduct {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  date_created: string;
  name: string;
  sku: string;
}

interface SalesDataPoint {
  date: string;
  quantity: number;
  orders: number;
}

interface BaselinePattern {
  avgDailySales: number;
  avgWeeklySales: number;
  avgMonthlySales: number;
  seasonalFactors: { [key: string]: number };
  weeklyPattern: { [key: string]: number };
  salesVelocity: number;
}

interface InferredStockOutPeriod {
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  confidence: number;
  detectionMethod: string;
  reason: string;
  expectedSales: number;
  actualSales: number;
  salesGapPercentage: number;
}

class BigCommerceStockInferenceEngine {
  private api: BigCommerceAPI;

  constructor() {
    const client = createBigCommerceClient();
    if (!client) {
      throw new Error('BigCommerce API not configured');
    }
    this.api = client as BigCommerceAPI;
  }

  async fetchOrdersHistory(startDate: string, endDate: string): Promise<any[]> {
    try {
      const orders: any[] = [];
      let page = 1;
      const limit = 250; // Max per request
      let hasMore = true;

      while (hasMore) {
        const response = await this.api.getOrders({
          limit,
          page,
          min_date_created: startDate,
          max_date_created: endDate,
          sort: 'date_created:asc'
        });

        if (response.data && response.data.length > 0) {
          orders.push(...response.data);
          page++;

          // Check if we have more pages
          hasMore = response.data.length === limit;
        } else {
          hasMore = false;
        }

        // Rate limiting: Wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return orders;
    } catch (error) {
      console.error('Error fetching orders history:', error);
      throw new Error('Failed to fetch orders history');
    }
  }

  async fetchOrderProducts(orderIds: number[]): Promise<OrderProduct[]> {
    const products: OrderProduct[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (orderId) => {
        try {
          const response = await this.api.getOrderProducts(orderId);
          return response.data?.map((product: any) => ({
            ...product,
            order_id: orderId
          })) || [];
        } catch (error) {
          console.error(`Error fetching products for order ${orderId}:`, error);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      products.push(...batchResults.flat());

      // Rate limiting between batches
      if (i + batchSize < orderIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return products;
  }

  extractProductSales(orders: any[], orderProducts: OrderProduct[], productId: number, variantId?: number): SalesDataPoint[] {
    const salesMap = new Map<string, { quantity: number; orders: Set<number> }>();

    // Filter products for our target product/variant
    const relevantProducts = orderProducts.filter(product => {
      if (variantId) {
        return product.product_id === productId && product.variant_id === variantId;
      }
      return product.product_id === productId;
    });

    // Group sales by date
    relevantProducts.forEach(product => {
      const order = orders.find(o => o.id === product.order_id);
      if (!order) return;

      const dateKey = order.date_created.split('T')[0]; // Get YYYY-MM-DD

      if (!salesMap.has(dateKey)) {
        salesMap.set(dateKey, { quantity: 0, orders: new Set() });
      }

      const dayData = salesMap.get(dateKey)!;
      dayData.quantity += product.quantity;
      dayData.orders.add(product.order_id);
    });

    // Convert to array and sort by date
    const salesData: SalesDataPoint[] = Array.from(salesMap.entries())
      .map(([date, data]) => ({
        date,
        quantity: data.quantity,
        orders: data.orders.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return salesData;
  }

  calculateBaseline(salesData: SalesDataPoint[], startDate: string, endDate: string): BaselinePattern {
    if (salesData.length === 0) {
      return {
        avgDailySales: 0,
        avgWeeklySales: 0,
        avgMonthlySales: 0,
        seasonalFactors: {},
        weeklyPattern: {},
        salesVelocity: 0
      };
    }

    // Fill in missing dates with zero sales
    const filledData = this.fillMissingDates(salesData, startDate, endDate);

    // Calculate averages
    const totalSales = filledData.reduce((sum, day) => sum + day.quantity, 0);
    const avgDailySales = totalSales / filledData.length;
    const avgWeeklySales = avgDailySales * 7;
    const avgMonthlySales = avgDailySales * 30;

    // Calculate weekly pattern (Monday = 0, Sunday = 6)
    const weeklyPattern: { [key: string]: number } = {};
    const weeklyTotals = Array(7).fill(0);
    const weeklyCounts = Array(7).fill(0);

    filledData.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay();
      weeklyTotals[dayOfWeek] += day.quantity;
      weeklyCounts[dayOfWeek]++;
    });

    for (let i = 0; i < 7; i++) {
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i];
      weeklyPattern[dayName] = weeklyCounts[i] > 0 ? weeklyTotals[i] / weeklyCounts[i] : 0;
    }

    // Calculate seasonal factors (simplified)
    const seasonalFactors = this.calculateSeasonalFactors(filledData);

    // Calculate sales velocity (trend)
    const salesVelocity = this.calculateSalesVelocity(filledData);

    return {
      avgDailySales,
      avgWeeklySales,
      avgMonthlySales,
      seasonalFactors,
      weeklyPattern,
      salesVelocity
    };
  }

  fillMissingDates(salesData: SalesDataPoint[], startDate: string, endDate: string): SalesDataPoint[] {
    const result: SalesDataPoint[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const existingData = salesData.find(d => d.date === dateStr);

      result.push(existingData || {
        date: dateStr,
        quantity: 0,
        orders: 0
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  calculateSeasonalFactors(salesData: SalesDataPoint[]): { [key: string]: number } {
    const monthlyTotals: { [key: number]: number } = {};
    const monthlyCounts: { [key: number]: number } = {};

    salesData.forEach(day => {
      const month = new Date(day.date).getMonth();
      monthlyTotals[month] = (monthlyTotals[month] || 0) + day.quantity;
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const monthlyAverages: { [key: number]: number } = {};
    for (let month = 0; month < 12; month++) {
      monthlyAverages[month] = monthlyCounts[month] ? monthlyTotals[month] / monthlyCounts[month] : 0;
    }

    const overallAverage = Object.values(monthlyAverages).reduce((sum, avg) => sum + avg, 0) / 12;

    return {
      spring: (monthlyAverages[2] + monthlyAverages[3] + monthlyAverages[4]) / 3 / overallAverage || 1,
      summer: (monthlyAverages[5] + monthlyAverages[6] + monthlyAverages[7]) / 3 / overallAverage || 1,
      autumn: (monthlyAverages[8] + monthlyAverages[9] + monthlyAverages[10]) / 3 / overallAverage || 1,
      winter: (monthlyAverages[11] + monthlyAverages[0] + monthlyAverages[1]) / 3 / overallAverage || 1,
    };
  }

  calculateSalesVelocity(salesData: SalesDataPoint[]): number {
    if (salesData.length < 30) return 0;

    const firstMonth = salesData.slice(0, 30);
    const lastMonth = salesData.slice(-30);

    const firstMonthAvg = firstMonth.reduce((sum, day) => sum + day.quantity, 0) / 30;
    const lastMonthAvg = lastMonth.reduce((sum, day) => sum + day.quantity, 0) / 30;

    return lastMonthAvg - firstMonthAvg;
  }

  detectStockOutPeriods(salesData: SalesDataPoint[], baseline: BaselinePattern): InferredStockOutPeriod[] {
    const stockOutPeriods: InferredStockOutPeriod[] = [];

    if (baseline.avgDailySales === 0) {
      return stockOutPeriods; // No sales history to analyze
    }

    let currentGapStart: string | null = null;
    let consecutiveZeroDays = 0;
    const minGapDays = 7; // Minimum 7 days of zero sales to consider stock-out
    const confidenceThreshold = 0.6;

    for (let i = 0; i < salesData.length; i++) {
      const day = salesData[i];
      const dayOfWeek = new Date(day.date).getDay();
      const month = new Date(day.date).getMonth();
      const season = this.getSeason(month);

      // Calculate expected sales for this day
      const seasonalFactor = baseline.seasonalFactors[season] || 1;
      const expectedSales = baseline.avgDailySales * seasonalFactor;

      if (day.quantity === 0) {
        if (!currentGapStart) {
          currentGapStart = day.date;
          consecutiveZeroDays = 1;
        } else {
          consecutiveZeroDays++;
        }
      } else {
        // End of gap - analyze if it was likely a stock-out
        if (currentGapStart && consecutiveZeroDays >= minGapDays) {
          const gapEndDate = salesData[i - 1]?.date || day.date;
          const confidence = this.calculateStockOutConfidence(
            consecutiveZeroDays,
            expectedSales,
            baseline,
            currentGapStart,
            gapEndDate
          );

          if (confidence >= confidenceThreshold) {
            stockOutPeriods.push({
              startDate: currentGapStart,
              endDate: gapEndDate,
              durationDays: consecutiveZeroDays,
              confidence,
              detectionMethod: 'complete_sales_drop',
              reason: `${consecutiveZeroDays} consecutive days of zero sales with expected ${expectedSales.toFixed(1)} sales/day`,
              expectedSales: expectedSales * consecutiveZeroDays,
              actualSales: 0,
              salesGapPercentage: 100
            });
          }
        }

        currentGapStart = null;
        consecutiveZeroDays = 0;
      }
    }

    // Handle ongoing gap at end of data
    if (currentGapStart && consecutiveZeroDays >= minGapDays) {
      const expectedSales = baseline.avgDailySales;
      const confidence = this.calculateStockOutConfidence(
        consecutiveZeroDays,
        expectedSales,
        baseline,
        currentGapStart,
        null
      );

      if (confidence >= confidenceThreshold) {
        stockOutPeriods.push({
          startDate: currentGapStart,
          endDate: null,
          durationDays: null,
          confidence,
          detectionMethod: 'ongoing_sales_drop',
          reason: `Ongoing ${consecutiveZeroDays}+ days of zero sales`,
          expectedSales: expectedSales * consecutiveZeroDays,
          actualSales: 0,
          salesGapPercentage: 100
        });
      }
    }

    return stockOutPeriods;
  }

  getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  calculateStockOutConfidence(
    gapDays: number,
    expectedDailySales: number,
    baseline: BaselinePattern,
    startDate: string,
    endDate: string | null
  ): number {
    let confidence = 0.0;

    // Base confidence from gap length
    if (gapDays >= 30) confidence += 0.4;
    else if (gapDays >= 14) confidence += 0.3;
    else if (gapDays >= 7) confidence += 0.2;

    // Confidence from expected sales volume
    if (expectedDailySales > 1.0) confidence += 0.3;
    else if (expectedDailySales > 0.5) confidence += 0.2;
    else if (expectedDailySales > 0.1) confidence += 0.1;

    // Confidence from sales history consistency
    if (baseline.avgDailySales > 0.5) confidence += 0.2;
    else if (baseline.avgDailySales > 0.1) confidence += 0.1;

    // Penalty for very low baseline sales (might just be unpopular product)
    if (baseline.avgDailySales < 0.05) confidence -= 0.3;

    // Check for holiday periods (lower confidence)
    const isHolidayPeriod = this.isHolidayPeriod(startDate, endDate);
    if (isHolidayPeriod) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  isHolidayPeriod(startDate: string, endDate: string | null): boolean {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    // Check for UK holiday periods
    const holidayPeriods = [
      { start: '12-20', end: '01-05' }, // Christmas/New Year
      { start: '04-10', end: '04-20' }, // Easter period (approximate)
      { start: '08-01', end: '08-31' }, // Summer holidays
    ];

    return holidayPeriods.some(period => {
      // Simplified holiday detection
      const startMonth = start.getMonth() + 1;
      const startDay = start.getDate();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();

      return (startMonth === 12 && startDay >= 20) ||
             (endMonth === 1 && endDay <= 5) ||
             (startMonth === 8);
    });
  }

  async inferHistoricalStockOuts(
    productId: number,
    variantId: number | null,
    startDate: string,
    endDate: string
  ): Promise<{
    inferredStockOuts: InferredStockOutPeriod[];
    baseline: BaselinePattern;
    salesData: SalesDataPoint[];
    confidence: number;
    dataPoints: number;
  }> {
    try {
      // Fetch historical orders
      const orders = await this.fetchOrdersHistory(startDate, endDate);

      if (orders.length === 0) {
        throw new Error('No orders found in the specified date range');
      }

      // Extract order IDs and fetch products
      const orderIds = orders.map(order => order.id);
      const orderProducts = await this.fetchOrderProducts(orderIds);

      // Extract sales data for specific product
      const salesData = this.extractProductSales(orders, orderProducts, productId, variantId || undefined);

      // Calculate baseline patterns
      const baseline = this.calculateBaseline(salesData, startDate, endDate);

      // Detect stock-out periods
      const inferredStockOuts = this.detectStockOutPeriods(salesData, baseline);

      // Calculate overall confidence
      const overallConfidence = inferredStockOuts.length > 0
        ? inferredStockOuts.reduce((sum, period) => sum + period.confidence, 0) / inferredStockOuts.length
        : 0;

      return {
        inferredStockOuts,
        baseline,
        salesData,
        confidence: overallConfidence,
        dataPoints: salesData.length
      };
    } catch (error) {
      console.error('Error in stock inference:', error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, variantId, startDate, endDate } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Default to 2 years of history if not specified
    const defaultStartDate = startDate || new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const defaultEndDate = endDate || new Date().toISOString();

    const engine = new BigCommerceStockInferenceEngine();
    const result = await engine.inferHistoricalStockOuts(
      productId,
      variantId || null,
      defaultStartDate,
      defaultEndDate
    );

    return NextResponse.json({
      success: true,
      data: {
        productId,
        variantId: variantId || null,
        analysisRange: {
          startDate: defaultStartDate,
          endDate: defaultEndDate
        },
        ...result,
        metadata: {
          generatedAt: new Date().toISOString(),
          methodology: 'sales-gap-analysis',
          minGapDays: 7,
          confidenceThreshold: 0.6
        }
      }
    });

  } catch (error) {
    console.error('Historical stock inference error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze historical stock patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}