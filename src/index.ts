import { Secretariat } from './three-departments/secretariat';
import { Chancellery } from './three-departments/chancellery';
import { DepartmentOfStateAffairs } from './three-departments/state-affairs';
import { PersonnelMinistry } from './six-ministries/personnel';
import { RevenueMinistry } from './six-ministries/revenue';
import { RitesMinistry } from './six-ministries/rites';
import { WarMinistry } from './six-ministries/war';
import { JusticeMinistry } from './six-ministries/justice';
import { WorksMinistry } from './six-ministries/works';

import { Request, Response, STPConfig, Ministry } from './core/types';

export * from './core/types';
export * from './three-departments/secretariat';
export * from './three-departments/chancellery';
export * from './three-departments/state-affairs';
export * from './six-ministries/personnel';
export * from './six-ministries/revenue';
export * from './six-ministries/rites';
export * from './six-ministries/war';
export * from './six-ministries/justice';
export * from './six-ministries/works';

export class STP {
  private secretariat: Secretariat;
  private chancellery: Chancellery;
  private stateAffairs: DepartmentOfStateAffairs;
  
  private ministries: Map<string, Ministry> = new Map();
  private config: STPConfig;

  constructor(config: STPConfig = {}) {
    this.config = {
      enableLogging: true,
      strictValidation: false,
      timeout: 30000,
      ...config
    };

    console.log('STP 框架初始化...');
    console.log('创建三省...');

    this.secretariat = new Secretariat();
    this.chancellery = new Chancellery();
    this.stateAffairs = new DepartmentOfStateAffairs();

    this.initializeDefaultMinistries();

    console.log('STP 框架初始化完成');
    console.log(`六部已注册: ${Array.from(this.ministries.keys()).join(', ')}`);
  }

  private initializeDefaultMinistries(): void {
    console.log('初始化六部...');

    const personnel = new PersonnelMinistry();
    const revenue = new RevenueMinistry();
    const rites = new RitesMinistry();
    const war = new WarMinistry();
    const justice = new JusticeMinistry();
    const works = new WorksMinistry();

    this.registerMinistry('personnel', personnel);
    this.registerMinistry('revenue', revenue);
    this.registerMinistry('rites', rites);
    this.registerMinistry('war', war);
    this.registerMinistry('justice', justice);
    this.registerMinistry('works', works);

    this.stateAffairs.setRouting('api.*', ['personnel', 'rites', 'war', 'justice']);
    this.stateAffairs.setRouting('billing.*', ['revenue', 'justice']);
    this.stateAffairs.setRouting('infrastructure.*', ['works', 'justice']);
    this.stateAffairs.setRouting('security.*', ['war', 'justice']);
    this.stateAffairs.setRouting('*', ['personnel', 'rites', 'war', 'justice']);
  }

  registerMinistry(name: string, ministry: Ministry): void {
    this.ministries.set(name, ministry);
    this.stateAffairs.registerMinistry(name, ministry);
    console.log(`STP 注册部门: ${name} - ${ministry.name}`);
  }

  getMinistry(name: string): Ministry | undefined {
    return this.ministries.get(name);
  }

  setSecretariatPolicy(policy: any): void {
    this.secretariat.addPolicy(policy);
  }

  addValidationRule(rule: any): void {
    this.chancellery.addValidationRule(rule);
  }

  addAuthorizationRule(rule: any): void {
    this.chancellery.addAuthorizationRule(rule);
  }

  async process(request: Request): Promise<Response[]> {
    const startTime = Date.now();
    console.log(`\n=== STP 开始处理请求: ${request.id} ===`);

    try {
      console.log('\n[中书省阶段]');
      const formulatedRequest = await this.secretariat.receive(request);

      console.log('\n[门下省阶段]');
      const reviewedRequest = await this.chancellery.review(formulatedRequest);

      console.log('\n[尚书省阶段]');
      const results = await this.stateAffairs.execute(reviewedRequest);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`\n=== STP 处理完成: ${request.id} ===`);
      console.log(`总耗时: ${duration}ms`);
      console.log(`处理部门数: ${results.length}`);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      console.log(`成功: ${successCount}, 失败: ${failureCount}`);

      return results;

    } catch (error) {
      console.error(`\n=== STP 处理失败: ${request.id} ===`);
      console.error('错误:', error instanceof Error ? error.message : String(error));

      const justiceMinistry = this.ministries.get('justice') as JusticeMinistry;
      if (justiceMinistry) {
        const errorResponse = justiceMinistry.handleError(
          error instanceof Error ? error : new Error(String(error)),
          request
        );
        return [errorResponse];
      }

      return [{
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          handledBy: 'stp',
          handledAt: new Date().toISOString(),
          processingFailed: true
        }
      }];
    }
  }

  async processSingle(request: Request, ministryName: string): Promise<Response> {
    const ministry = this.ministries.get(ministryName);
    if (!ministry) {
      return {
        id: request.id,
        success: false,
        error: `部门 ${ministryName} 未找到`,
        metadata: {
          handledBy: 'stp',
          handledAt: new Date().toISOString()
        }
      };
    }

    console.log(`STP 直接处理请求: ${request.id} -> ${ministryName}`);
    return await ministry.handle(request);
  }

  getStatus(): any {
    return {
      framework: 'STP - Three Departments and Six Ministries',
      departments: {
        secretariat: 'active',
        chancellery: 'active',
        state_affairs: 'active'
      },
      ministries: Array.from(this.ministries.keys()),
      registeredMinistries: this.stateAffairs.getRegisteredMinistries(),
      config: this.config
    };
  }

  getSecretariat(): Secretariat {
    return this.secretariat;
  }

  getChancellery(): Chancellery {
    return this.chancellery;
  }

  getStateAffairs(): DepartmentOfStateAffairs {
    return this.stateAffairs;
  }
}

export default STP;