import { Request, Response } from '../core/types';

export interface ValidationRule {
  name: string;
  validate: (request: Request) => boolean | Promise<boolean>;
  errorMessage?: string;
}

export interface AuthorizationRule {
  name: string;
  authorize: (request: Request) => boolean | Promise<boolean>;
  errorMessage?: string;
}

export class Chancellery {
  private validationRules: ValidationRule[] = [];
  private authorizationRules: AuthorizationRule[] = [];
  private auditLog: Array<{ requestId: string; action: string; timestamp: Date; result: boolean }> = [];

  constructor(
    validationRules: ValidationRule[] = [],
    authorizationRules: AuthorizationRule[] = []
  ) {
    this.validationRules = validationRules;
    this.authorizationRules = authorizationRules;
  }

  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  addAuthorizationRule(rule: AuthorizationRule): void {
    this.authorizationRules.push(rule);
  }

  private logAudit(requestId: string, action: string, result: boolean): void {
    this.auditLog.push({
      requestId,
      action,
      timestamp: new Date(),
      result
    });
  }

  async validate(request: Request): Promise<boolean> {
    console.log(`门下省开始验证请求: ${request.id}`);
    
    for (const rule of this.validationRules) {
      const isValid = await rule.validate(request);
      if (!isValid) {
        console.log(`门下省验证失败: ${rule.name} - ${rule.errorMessage || '验证未通过'}`);
        this.logAudit(request.id, `validation_failed_${rule.name}`, false);
        return false;
      }
    }

    this.logAudit(request.id, 'validation_passed', true);
    return true;
  }

  async authorize(request: Request): Promise<boolean> {
    console.log(`门下省开始授权请求: ${request.id}`);
    
    for (const rule of this.authorizationRules) {
      const isAuthorized = await rule.authorize(request);
      if (!isAuthorized) {
        console.log(`门下省授权失败: ${rule.name} - ${rule.errorMessage || '授权被拒绝'}`);
        this.logAudit(request.id, `authorization_failed_${rule.name}`, false);
        return false;
      }
    }

    this.logAudit(request.id, 'authorization_passed', true);
    return true;
  }

  async review(request: Request): Promise<Request> {
    console.log(`门下省开始审查请求: ${request.id}`);

    const isValid = await this.validate(request);
    if (!isValid) {
      throw new Error(`门下省审查失败: 请求 ${request.id} 验证未通过`);
    }

    const isAuthorized = await this.authorize(request);
    if (!isAuthorized) {
      throw new Error(`门下省审查失败: 请求 ${request.id} 授权被拒绝`);
    }

    const reviewedRequest = {
      ...request,
      metadata: {
        ...request.metadata,
        reviewedBy: 'chancellery',
        reviewedAt: new Date().toISOString(),
        validationPassed: true,
        authorizationPassed: true
      }
    };

    this.logAudit(request.id, 'review_completed', true);
    console.log(`门下省审查完成: ${request.id}`);
    
    return reviewedRequest;
  }

  getAuditLog() {
    return [...this.auditLog];
  }
}