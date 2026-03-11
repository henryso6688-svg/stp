import { Request, Response, Ministry } from '../core/types';

export interface SecurityRule {
  name: string;
  check: (request: Request) => boolean | Promise<boolean>;
  action: 'allow' | 'deny' | 'log';
}

export interface RateLimitRule {
  key: string;
  limit: number;
  window: number;
}

export interface ThreatDetection {
  pattern: RegExp | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'block' | 'throttle';
}

export class WarMinistry implements Ministry {
  id = 'war';
  name = '兵部 (Ministry of War)';
  description = 'Security, defense, rate limiting, and threat protection';

  private securityRules: SecurityRule[] = [];
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();
  private rateLimitRules: RateLimitRule[] = [];
  private threatDetections: ThreatDetection[] = [];
  private blockedIPs: Set<string> = new Set();
  private attackLog: Array<{
    timestamp: Date;
    requestId: string;
    threat: string;
    severity: string;
    action: string;
  }> = [];

  constructor() {
    console.log(`${this.name} 初始化`);
    this.setDefaultSecurityRules();
    this.setDefaultThreatDetections();
  }

  private setDefaultSecurityRules(): void {
    this.addSecurityRule({
      name: 'Require API Key',
      check: (request) => {
        const apiKey = request.metadata?.headers?.['x-api-key'] || request.metadata?.apiKey;
        return !!apiKey;
      },
      action: 'deny'
    });

    this.addSecurityRule({
      name: 'Require HTTPS',
      check: (request) => {
        const protocol = request.metadata?.protocol || '';
        return protocol.toLowerCase() === 'https';
      },
      action: 'log'
    });
  }

  private setDefaultThreatDetections(): void {
    this.addThreatDetection({
      pattern: /(\b)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)(\b)/i,
      severity: 'high',
      action: 'block'
    });

    this.addThreatDetection({
      pattern: /(<script|javascript:|onload=|onerror=)/i,
      severity: 'critical',
      action: 'block'
    });

    this.addThreatDetection({
      pattern: /(\.\.\/|\.\.\\|\/etc\/|\/bin\/)/,
      severity: 'high',
      action: 'block'
    });
  }

  addSecurityRule(rule: SecurityRule): void {
    this.securityRules.push(rule);
    console.log(`${this.name} 添加安全规则: ${rule.name}`);
  }

  addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.push(rule);
    console.log(`${this.name} 添加速率限制规则: ${rule.key} = ${rule.limit}/${rule.window}ms`);
  }

  addThreatDetection(detection: ThreatDetection): void {
    this.threatDetections.push(detection);
    console.log(`${this.name} 添加威胁检测: ${detection.pattern} (${detection.severity})`);
  }

  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    console.log(`${this.name} 封锁IP: ${ip}`);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    console.log(`${this.name} 解除封锁IP: ${ip}`);
  }

  private checkSecurityRules(request: Request): boolean {
    for (const rule of this.securityRules) {
      const passed = rule.check(request);
      
      if (!passed && rule.action === 'deny') {
        console.log(`${this.name} 安全规则拒绝: ${rule.name}`);
        return false;
      }
      
      if (!passed && rule.action === 'log') {
        console.log(`${this.name} 安全规则警告: ${rule.name}`);
      }
    }
    
    return true;
  }

  private checkRateLimit(request: Request): boolean {
    const clientIP = request.metadata?.clientIP || 'unknown';
    const now = Date.now();

    for (const rule of this.rateLimitRules) {
      const key = rule.key === 'ip' ? clientIP : request.metadata?.[rule.key] || 'default';
      const rateLimitKey = `${rule.key}:${key}`;
      
      let rateLimit = this.rateLimits.get(rateLimitKey);
      
      if (!rateLimit || rateLimit.resetAt < now) {
        rateLimit = { count: 0, resetAt: now + rule.window };
        this.rateLimits.set(rateLimitKey, rateLimit);
      }
      
      if (rateLimit.count >= rule.limit) {
        console.log(`${this.name} 速率限制: ${rateLimitKey} 超过限制`);
        return false;
      }
      
      rateLimit.count++;
    }
    
    return true;
  }

  private checkThreats(request: Request): { threat: string; severity: string; action: string } | null {
    const clientIP = request.metadata?.clientIP || 'unknown';
    
    if (this.blockedIPs.has(clientIP)) {
      return {
        threat: 'Blocked IP',
        severity: 'high',
        action: 'block'
      };
    }

    const requestString = JSON.stringify(request).toLowerCase();
    
    for (const detection of this.threatDetections) {
      const pattern = typeof detection.pattern === 'string' 
        ? new RegExp(detection.pattern, 'i') 
        : detection.pattern;
      
      if (pattern.test(requestString)) {
        return {
          threat: `Threat detected: ${detection.pattern}`,
          severity: detection.severity,
          action: detection.action
        };
      }
    }
    
    return null;
  }

  async handle(request: Request): Promise<Response> {
    console.log(`${this.name} 处理请求: ${request.id}`);

    const securityPassed = this.checkSecurityRules(request);
    if (!securityPassed) {
      return {
        id: request.id,
        success: false,
        error: '安全规则检查失败',
        metadata: {
          handledBy: this.id,
          handledAt: new Date().toISOString(),
          securityPassed: false
        }
      };
    }

    const rateLimitPassed = this.checkRateLimit(request);
    if (!rateLimitPassed) {
      return {
        id: request.id,
        success: false,
        error: '速率限制超过',
        metadata: {
          handledBy: this.id,
          handledAt: new Date().toISOString(),
          rateLimitPassed: false
        }
      };
    }

    const threat = this.checkThreats(request);
    if (threat) {
      this.attackLog.push({
        timestamp: new Date(),
        requestId: request.id,
        threat: threat.threat,
        severity: threat.severity,
        action: threat.action
      });

      if (threat.action === 'block') {
        const clientIP = request.metadata?.clientIP;
        if (clientIP) {
          this.blockIP(clientIP);
        }

        return {
          id: request.id,
          success: false,
          error: `威胁检测: ${threat.threat}`,
          metadata: {
            handledBy: this.id,
            handledAt: new Date().toISOString(),
            threatDetected: true,
            threat: threat.threat,
            severity: threat.severity,
            action: threat.action
          }
        };
      }
    }

    return {
      id: request.id,
      success: true,
      data: {
        security: 'passed',
        rateLimit: 'passed',
        threats: threat ? 'detected' : 'none',
        protection: 'active'
      },
      metadata: {
        handledBy: this.id,
        handledAt: new Date().toISOString(),
        securityPassed: true,
        rateLimitPassed: true,
        threatDetected: !!threat
      }
    };
  }

  getAttackLog() {
    return [...this.attackLog];
  }

  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }

  getSecurityRules(): SecurityRule[] {
    return [...this.securityRules];
  }
}