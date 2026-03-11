import { Request, Response, Ministry } from '../core/types';

export interface ServiceInfo {
  id: string;
  name: string;
  endpoint: string;
  capacity: number;
  currentLoad: number;
  health: 'healthy' | 'degraded' | 'unhealthy';
}

export class PersonnelMinistry implements Ministry {
  id = 'personnel';
  name = '吏部 (Ministry of Personnel)';
  description = 'Service discovery, load balancing, and resource allocation';

  private services: Map<string, ServiceInfo> = new Map();
  private loadBalancingStrategy: 'round-robin' | 'least-connections' | 'random' = 'round-robin';
  private roundRobinIndex: number = 0;

  constructor() {
    console.log(`${this.name} 初始化`);
  }

  registerService(service: ServiceInfo): void {
    this.services.set(service.id, service);
    console.log(`${this.name} 注册服务: ${service.name} (${service.id})`);
  }

  unregisterService(serviceId: string): void {
    this.services.delete(serviceId);
    console.log(`${this.name} 注销服务: ${serviceId}`);
  }

  updateServiceHealth(serviceId: string, health: ServiceInfo['health']): void {
    const service = this.services.get(serviceId);
    if (service) {
      service.health = health;
      console.log(`${this.name} 更新服务健康状态: ${serviceId} -> ${health}`);
    }
  }

  updateServiceLoad(serviceId: string, load: number): void {
    const service = this.services.get(serviceId);
    if (service) {
      service.currentLoad = load;
    }
  }

  private selectService(): ServiceInfo | null {
    const healthyServices = Array.from(this.services.values())
      .filter(service => service.health === 'healthy');

    if (healthyServices.length === 0) {
      return null;
    }

    switch (this.loadBalancingStrategy) {
      case 'round-robin':
        const service = healthyServices[this.roundRobinIndex % healthyServices.length];
        this.roundRobinIndex++;
        return service;
      
      case 'least-connections':
        return healthyServices.reduce((prev, curr) => 
          prev.currentLoad < curr.currentLoad ? prev : curr
        );
      
      case 'random':
        return healthyServices[Math.floor(Math.random() * healthyServices.length)];
      
      default:
        return healthyServices[0];
    }
  }

  setLoadBalancingStrategy(strategy: 'round-robin' | 'least-connections' | 'random'): void {
    this.loadBalancingStrategy = strategy;
    console.log(`${this.name} 设置负载均衡策略: ${strategy}`);
  }

  async handle(request: Request): Promise<Response> {
    console.log(`${this.name} 处理请求: ${request.id}`);

    const selectedService = this.selectService();
    
    if (!selectedService) {
      return {
        id: request.id,
        success: false,
        error: '没有可用的健康服务',
        metadata: {
          handledBy: this.id,
          handledAt: new Date().toISOString(),
          serviceAvailable: false
        }
      };
    }

    this.updateServiceLoad(selectedService.id, selectedService.currentLoad + 1);

    const result = {
      id: request.id,
      success: true,
      data: {
        service: {
          id: selectedService.id,
          name: selectedService.name,
          endpoint: selectedService.endpoint
        },
        loadBalancingStrategy: this.loadBalancingStrategy,
        timestamp: new Date().toISOString()
      },
      metadata: {
        handledBy: this.id,
        handledAt: new Date().toISOString(),
        serviceId: selectedService.id,
        serviceName: selectedService.name
      }
    };

    this.updateServiceLoad(selectedService.id, selectedService.currentLoad - 1);

    return result;
  }

  getServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  getServiceCount(): number {
    return this.services.size;
  }
}