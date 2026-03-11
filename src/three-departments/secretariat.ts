import { Request, Response, Policy, Rule } from '../core/types';

export class Secretariat {
  private policies: Policy[] = [];
  private rules: Rule[] = [];

  constructor(policies: Policy[] = []) {
    this.policies = policies;
  }

  addPolicy(policy: Policy): void {
    this.policies.push(policy);
  }

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  async formulatePolicy(request: Request): Promise<Request> {
    let processedRequest = { ...request };

    for (const policy of this.policies) {
      for (const rule of policy.rules) {
        if (rule.condition(processedRequest)) {
          processedRequest = await rule.action(processedRequest);
        }
      }
    }

    for (const rule of this.rules) {
      if (rule.condition(processedRequest)) {
        processedRequest = await rule.action(processedRequest);
      }
    }

    processedRequest.metadata = {
      ...processedRequest.metadata,
      formulatedBy: 'secretariat',
      formulatedAt: new Date().toISOString(),
      policiesApplied: this.policies.map(p => p.name)
    };

    return processedRequest;
  }

  async receive(request: Request): Promise<Request> {
    console.log(`中书省收到请求: ${request.id}, 类型: ${request.type}`);
    
    const formulatedRequest = await this.formulatePolicy(request);
    
    console.log(`中书省制定政策完成: ${request.id}`);
    return formulatedRequest;
  }
}