import { Request, Response, Ministry } from '../core/types';

export interface Quota {
  resource: string;
  limit: number;
  used: number;
  period: 'daily' | 'monthly' | 'yearly';
  resetAt: Date;
}

export interface BillingRecord {
  id: string;
  requestId: string;
  userId: string;
  resource: string;
  amount: number;
  cost: number;
  timestamp: Date;
}

export class RevenueMinistry implements Ministry {
  id = 'revenue';
  name = '户部 (Ministry of Revenue)';
  description = 'Billing, quota management, and resource accounting';

  private quotas: Map<string, Quota> = new Map();
  private billingRecords: BillingRecord[] = [];
  private rates: Map<string, number> = new Map();

  constructor() {
    console.log(`${this.name} 初始化`);
    this.setDefaultRates();
  }

  private setDefaultRates(): void {
    this.rates.set('api.call', 0.01);
    this.rates.set('storage.mb', 0.001);
    this.rates.set('compute.second', 0.05);
    this.rates.set('bandwidth.mb', 0.002);
  }

  setRate(resource: string, rate: number): void {
    this.rates.set(resource, rate);
    console.log(`${this.name} 设置费率: ${resource} = ${rate}`);
  }

  setQuota(userId: string, resource: string, limit: number, period: Quota['period'] = 'monthly'): void {
    const quotaId = `${userId}:${resource}`;
    const resetAt = this.calculateResetDate(period);
    
    this.quotas.set(quotaId, {
      resource,
      limit,
      used: 0,
      period,
      resetAt
    });

    console.log(`${this.name} 设置配额: ${userId} - ${resource} = ${limit}/${period}`);
  }

  private calculateResetDate(period: Quota['period']): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      case 'yearly':
        return new Date(now.getFullYear() + 1, 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
  }

  checkQuota(userId: string, resource: string, amount: number = 1): boolean {
    const quotaId = `${userId}:${resource}`;
    const quota = this.quotas.get(quotaId);

    if (!quota) {
      return true;
    }

    if (quota.resetAt < new Date()) {
      quota.used = 0;
      quota.resetAt = this.calculateResetDate(quota.period);
    }

    return quota.used + amount <= quota.limit;
  }

  recordUsage(userId: string, requestId: string, resource: string, amount: number = 1): void {
    const quotaId = `${userId}:${resource}`;
    const quota = this.quotas.get(quotaId);

    if (quota) {
      if (quota.resetAt < new Date()) {
        quota.used = 0;
        quota.resetAt = this.calculateResetDate(quota.period);
      }
      quota.used += amount;
    }

    const rate = this.rates.get(resource) || 0;
    const cost = amount * rate;

    const billingRecord: BillingRecord = {
      id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId,
      userId,
      resource,
      amount,
      cost,
      timestamp: new Date()
    };

    this.billingRecords.push(billingRecord);
    console.log(`${this.name} 记录使用: ${userId} - ${resource} x${amount} = $${cost.toFixed(4)}`);
  }

  async handle(request: Request): Promise<Response> {
    console.log(`${this.name} 处理请求: ${request.id}`);

    const userId = request.metadata?.userId || 'anonymous';
    const resource = request.metadata?.resource || 'api.call';
    const amount = request.metadata?.amount || 1;

    const hasQuota = this.checkQuota(userId, resource, amount);
    
    if (!hasQuota) {
      return {
        id: request.id,
        success: false,
        error: '配额不足',
        metadata: {
          handledBy: this.id,
          handledAt: new Date().toISOString(),
          userId,
          resource,
          amount,
          quotaExceeded: true
        }
      };
    }

    this.recordUsage(userId, request.id, resource, amount);

    const rate = this.rates.get(resource) || 0;
    const cost = amount * rate;

    return {
      id: request.id,
      success: true,
      data: {
        billing: {
          userId,
          resource,
          amount,
          rate,
          cost,
          timestamp: new Date().toISOString()
        },
        quota: {
          hasQuota: true,
          resource,
          amountUsed: amount
        }
      },
      metadata: {
        handledBy: this.id,
        handledAt: new Date().toISOString(),
        userId,
        resource,
        amount,
        cost
      }
    };
  }

  getBillingRecords(userId?: string): BillingRecord[] {
    if (userId) {
      return this.billingRecords.filter(record => record.userId === userId);
    }
    return [...this.billingRecords];
  }

  getQuota(userId: string, resource: string): Quota | undefined {
    return this.quotas.get(`${userId}:${resource}`);
  }

  getTotalRevenue(): number {
    return this.billingRecords.reduce((total, record) => total + record.cost, 0);
  }
}