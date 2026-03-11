import { Request, Response, Ministry } from '../core/types';

export class DepartmentOfStateAffairs {
  private ministries: Map<string, Ministry> = new Map();
  private routingTable: Map<string, string[]> = new Map();

  constructor() {}

  registerMinistry(name: string, ministry: Ministry): void {
    this.ministries.set(name, ministry);
    console.log(`尚书省注册部门: ${name} - ${ministry.description}`);
  }

  setRouting(routePattern: string, ministryNames: string[]): void {
    this.routingTable.set(routePattern, ministryNames);
    console.log(`尚书省设置路由: ${routePattern} -> ${ministryNames.join(', ')}`);
  }

  private routeRequest(request: Request): string[] {
    const requestType = request.type;
    
    for (const [pattern, ministries] of this.routingTable.entries()) {
      if (this.matchesPattern(requestType, pattern)) {
        return ministries;
      }
    }

    return Array.from(this.ministries.keys());
  }

  private matchesPattern(requestType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(requestType);
    }
    return requestType === pattern;
  }

  async distribute(request: Request): Promise<Response[]> {
    console.log(`尚书省开始分发请求: ${request.id}`);
    
    const ministryNames = this.routeRequest(request);
    const results: Response[] = [];

    for (const ministryName of ministryNames) {
      const ministry = this.ministries.get(ministryName);
      if (!ministry) {
        console.warn(`尚书省警告: 部门 ${ministryName} 未注册`);
        continue;
      }

      try {
        console.log(`尚书省分发到 ${ministryName}: ${request.id}`);
        const result = await ministry.handle(request);
        results.push(result);
        console.log(`尚书省收到 ${ministryName} 响应: ${request.id} - ${result.success ? '成功' : '失败'}`);
      } catch (error) {
        console.error(`尚书省处理错误: ${ministryName} 处理请求 ${request.id} 时出错`, error);
        results.push({
          id: request.id,
          success: false,
          error: `${ministryName} 处理失败: ${error instanceof Error ? error.message : String(error)}`,
          metadata: {
            handledBy: ministryName,
            handledAt: new Date().toISOString(),
            error: true
          }
        });
      }
    }

    console.log(`尚书省分发完成: ${request.id}, 处理了 ${results.length} 个部门`);
    
    return results;
  }

  async execute(request: Request): Promise<Response[]> {
    const distributedRequest = {
      ...request,
      metadata: {
        ...request.metadata,
        distributedBy: 'state_affairs',
        distributedAt: new Date().toISOString()
      }
    };

    return await this.distribute(distributedRequest);
  }

  getRegisteredMinistries(): string[] {
    return Array.from(this.ministries.keys());
  }

  getMinistry(name: string): Ministry | undefined {
    return this.ministries.get(name);
  }
}