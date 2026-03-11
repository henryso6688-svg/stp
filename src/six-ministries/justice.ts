import { Request, Response, Ministry } from '../core/types';

export interface ErrorPattern {
  id: string;
  pattern: RegExp | string;
  category: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  suggestion?: string;
}

export interface AuditLogEntry {
  id: string;
  requestId: string;
  timestamp: Date;
  action: string;
  userId?: string;
  resource?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  check: (log: AuditLogEntry) => boolean;
}

export class JusticeMinistry implements Ministry {
  id = 'justice';
  name = '刑部 (Ministry of Justice)';
  description = 'Error handling, auditing, logging, and compliance';

  private errorPatterns: ErrorPattern[] = [];
  private auditLog: AuditLogEntry[] = [];
  private complianceRules: ComplianceRule[] = [];
  private errorStats: Map<string, { count: number; lastOccurred: Date }> = new Map();

  constructor() {
    console.log(`${this.name} 初始化`);
    this.registerDefaultErrorPatterns();
    this.registerDefaultComplianceRules();
  }

  private registerDefaultErrorPatterns(): void {
    this.addErrorPattern({
      id: 'auth_failure',
      pattern: /(authentication failed|invalid token|unauthorized)/i,
      category: 'Authentication',
      severity: 'error',
      suggestion: '检查认证令牌和权限设置'
    });

    this.addErrorPattern({
      id: 'validation_error',
      pattern: /(validation failed|invalid input|missing required)/i,
      category: 'Validation',
      severity: 'warning',
      suggestion: '验证输入数据格式和必填字段'
    });

    this.addErrorPattern({
      id: 'rate_limit',
      pattern: /(rate limit|too many requests)/i,
      category: 'Rate Limiting',
      severity: 'warning',
      suggestion: '调整请求频率或联系管理员增加配额'
    });

    this.addErrorPattern({
      id: 'server_error',
      pattern: /(internal server error|server unavailable)/i,
      category: 'Server',
      severity: 'critical',
      suggestion: '检查服务器状态和日志'
    });
  }

  private registerDefaultComplianceRules(): void {
    this.addComplianceRule({
      id: 'data_access_log',
      name: '数据访问记录',
      description: '所有数据访问操作必须记录',
      check: (log) => {
        return log.action.includes('data.access') && !!log.userId && !!log.resource;
      }
    });

    this.addComplianceRule({
      id: 'error_reporting',
      name: '错误报告',
      description: '所有错误必须被记录和分类',
      check: (log) => {
        return !log.success && !!log.error;
      }
    });

    this.addComplianceRule({
      id: 'audit_trail',
      name: '审计追踪',
      description: '关键操作必须包含完整审计信息',
      check: (log) => {
        const criticalActions = ['user.delete', 'data.modify', 'config.change'];
        if (criticalActions.includes(log.action)) {
          return !!log.userId && !!log.timestamp && !!log.metadata;
        }
        return true;
      }
    });
  }

  addErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.push(pattern);
    console.log(`${this.name} 添加错误模式: ${pattern.id} (${pattern.category})`);
  }

  addComplianceRule(rule: ComplianceRule): void {
    this.complianceRules.push(rule);
    console.log(`${this.name} 添加合规规则: ${rule.name}`);
  }

  logAudit(entry: AuditLogEntry): void {
    this.auditLog.push(entry);
    
    if (!entry.success && entry.error) {
      this.analyzeError(entry.error);
    }

    this.checkCompliance(entry);
    
    console.log(`${this.name} 审计记录: ${entry.requestId} - ${entry.action} - ${entry.success ? '成功' : '失败'}`);
  }

  private analyzeError(error: string): void {
    for (const pattern of this.errorPatterns) {
      const regex = typeof pattern.pattern === 'string' 
        ? new RegExp(pattern.pattern, 'i') 
        : pattern.pattern;
      
      if (regex.test(error)) {
        const statsKey = `${pattern.category}:${pattern.id}`;
        const stats = this.errorStats.get(statsKey) || { count: 0, lastOccurred: new Date() };
        stats.count++;
        stats.lastOccurred = new Date();
        this.errorStats.set(statsKey, stats);
        
        console.log(`${this.name} 错误分析: ${pattern.category} - ${pattern.id} (${pattern.severity})`);
        if (pattern.suggestion) {
          console.log(`${this.name} 建议: ${pattern.suggestion}`);
        }
        break;
      }
    }
  }

  private checkCompliance(entry: AuditLogEntry): void {
    for (const rule of this.complianceRules) {
      const compliant = rule.check(entry);
      if (!compliant) {
        console.warn(`${this.name} 合规警告: ${rule.name} - ${rule.description}`);
        console.warn(`${this.name} 违规记录: ${entry.requestId} - ${entry.action}`);
      }
    }
  }

  handleError(error: Error, request: Request): Response {
    const errorMessage = error.message;
    const auditEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      timestamp: new Date(),
      action: 'error.handling',
      userId: request.metadata?.userId,
      resource: request.metadata?.resource,
      success: false,
      error: errorMessage,
      metadata: {
        stack: error.stack,
        requestType: request.type,
        handledBy: this.id
      }
    };

    this.logAudit(auditEntry);

    return {
      id: request.id,
      success: false,
      error: errorMessage,
      metadata: {
        handledBy: this.id,
        handledAt: new Date().toISOString(),
        errorCategory: this.classifyError(errorMessage),
        auditLogged: true
      }
    };
  }

  private classifyError(error: string): string {
    for (const pattern of this.errorPatterns) {
      const regex = typeof pattern.pattern === 'string' 
        ? new RegExp(pattern.pattern, 'i') 
        : pattern.pattern;
      
      if (regex.test(error)) {
        return pattern.category;
      }
    }
    
    return 'Unknown';
  }

  async handle(request: Request): Promise<Response> {
    console.log(`${this.name} 处理请求: ${request.id}`);

    const auditEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestId: request.id,
      timestamp: new Date(),
      action: request.type,
      userId: request.metadata?.userId,
      resource: request.metadata?.resource,
      success: true,
      metadata: {
        handledBy: this.id,
        requestPayload: request.payload
      }
    };

    this.logAudit(auditEntry);

    return {
      id: request.id,
      success: true,
      data: {
        audit: {
          logged: true,
          entryId: auditEntry.id,
          timestamp: auditEntry.timestamp.toISOString()
        },
        compliance: {
          checked: true,
          rules: this.complianceRules.length
        }
      },
      metadata: {
        handledBy: this.id,
        handledAt: new Date().toISOString(),
        auditEntryId: auditEntry.id
      }
    };
  }

  getAuditLog(filter?: { userId?: string; success?: boolean; startDate?: Date; endDate?: Date }): AuditLogEntry[] {
    let filtered = [...this.auditLog];

    if (filter) {
      if (filter.userId) {
        filtered = filtered.filter(entry => entry.userId === filter.userId);
      }
      if (filter.success !== undefined) {
        filtered = filtered.filter(entry => entry.success === filter.success);
      }
      if (filter.startDate) {
        filtered = filtered.filter(entry => entry.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(entry => entry.timestamp <= filter.endDate!);
      }
    }

    return filtered;
  }

  getErrorStats(): Map<string, { count: number; lastOccurred: Date }> {
    return new Map(this.errorStats);
  }

  getComplianceViolations(): Array<{ rule: ComplianceRule; entry: AuditLogEntry }> {
    const violations: Array<{ rule: ComplianceRule; entry: AuditLogEntry }> = [];
    
    for (const entry of this.auditLog) {
      for (const rule of this.complianceRules) {
        if (!rule.check(entry)) {
          violations.push({ rule, entry });
        }
      }
    }
    
    return violations;
  }
}