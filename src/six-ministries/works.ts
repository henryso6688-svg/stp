import { Request, Response, Ministry } from '../core/types';

export interface ResourceSpec {
  id: string;
  name: string;
  type: 'compute' | 'storage' | 'network' | 'database';
  capacity: number;
  allocated: number;
  unit: string;
  status: 'available' | 'allocated' | 'maintenance' | 'failed';
}

export interface InfrastructureMetric {
  timestamp: Date;
  resourceId: string;
  usage: number;
  availability: number;
  latency?: number;
}

export interface MaintenanceSchedule {
  id: string;
  resourceId: string;
  startTime: Date;
  endTime: Date;
  description: string;
  impact: 'none' | 'degraded' | 'outage';
}

export class WorksMinistry implements Ministry {
  id = 'works';
  name = '工部 (Ministry of Works)';
  description = 'Infrastructure, resource provisioning, and maintenance';

  private resources: Map<string, ResourceSpec> = new Map();
  private metrics: InfrastructureMetric[] = [];
  private maintenanceSchedules: MaintenanceSchedule[] = [];
  private provisioningQueue: Array<{
    requestId: string;
    resourceType: string;
    capacity: number;
    timestamp: Date;
  }> = [];

  constructor() {
    console.log(`${this.name} 初始化`);
    this.initializeDefaultResources();
  }

  private initializeDefaultResources(): void {
    this.registerResource({
      id: 'cpu_pool_1',
      name: 'CPU计算池',
      type: 'compute',
      capacity: 100,
      allocated: 0,
      unit: 'cores',
      status: 'available'
    });

    this.registerResource({
      id: 'memory_pool_1',
      name: '内存池',
      type: 'compute',
      capacity: 1024,
      allocated: 0,
      unit: 'GB',
      status: 'available'
    });

    this.registerResource({
      id: 'storage_pool_1',
      name: '存储池',
      type: 'storage',
      capacity: 10000,
      allocated: 0,
      unit: 'GB',
      status: 'available'
    });

    this.registerResource({
      id: 'network_pool_1',
      name: '网络带宽池',
      type: 'network',
      capacity: 1000,
      allocated: 0,
      unit: 'Mbps',
      status: 'available'
    });

    console.log(`${this.name} 初始化默认资源池`);
  }

  registerResource(resource: ResourceSpec): void {
    this.resources.set(resource.id, resource);
    console.log(`${this.name} 注册资源: ${resource.name} (${resource.id})`);
  }

  allocateResource(resourceId: string, amount: number): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      console.warn(`${this.name} 警告: 资源 ${resourceId} 不存在`);
      return false;
    }

    if (resource.status !== 'available') {
      console.warn(`${this.name} 警告: 资源 ${resourceId} 状态为 ${resource.status}`);
      return false;
    }

    if (resource.allocated + amount > resource.capacity) {
      console.warn(`${this.name} 警告: 资源 ${resourceId} 容量不足 (${resource.allocated + amount} > ${resource.capacity})`);
      return false;
    }

    resource.allocated += amount;
    if (resource.allocated === resource.capacity) {
      resource.status = 'allocated';
    }

    console.log(`${this.name} 分配资源: ${resourceId} - ${amount}${resource.unit}`);
    return true;
  }

  releaseResource(resourceId: string, amount: number): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      console.warn(`${this.name} 警告: 资源 ${resourceId} 不存在`);
      return false;
    }

    if (resource.allocated < amount) {
      console.warn(`${this.name} 警告: 释放量超过已分配量 (${amount} > ${resource.allocated})`);
      return false;
    }

    resource.allocated -= amount;
    if (resource.allocated < resource.capacity && resource.status === 'allocated') {
      resource.status = 'available';
    }

    console.log(`${this.name} 释放资源: ${resourceId} - ${amount}${resource.unit}`);
    return true;
  }

  scheduleMaintenance(schedule: MaintenanceSchedule): void {
    this.maintenanceSchedules.push(schedule);
    
    const resource = this.resources.get(schedule.resourceId);
    if (resource) {
      resource.status = 'maintenance';
    }

    console.log(`${this.name} 安排维护: ${schedule.resourceId} - ${schedule.description}`);
  }

  recordMetric(metric: InfrastructureMetric): void {
    this.metrics.push(metric);
  }

  provisionResource(requestId: string, resourceType: string, capacity: number): string | null {
    const availableResources = Array.from(this.resources.values())
      .filter(resource => 
        resource.type === resourceType && 
        resource.status === 'available' &&
        resource.capacity - resource.allocated >= capacity
      )
      .sort((a, b) => (b.capacity - b.allocated) - (a.capacity - a.allocated));

    if (availableResources.length === 0) {
      this.provisioningQueue.push({
        requestId,
        resourceType,
        capacity,
        timestamp: new Date()
      });
      console.log(`${this.name} 资源不足，加入队列: ${requestId} - ${resourceType} x${capacity}`);
      return null;
    }

    const selectedResource = availableResources[0];
    this.allocateResource(selectedResource.id, capacity);
    
    return selectedResource.id;
  }

  async handle(request: Request): Promise<Response> {
    console.log(`${this.name} 处理请求: ${request.id}`);

    const action = request.metadata?.action || 'check_status';
    const resourceType = request.metadata?.resourceType;
    const capacity = request.metadata?.capacity || 1;

    switch (action) {
      case 'provision':
        if (!resourceType) {
          return {
            id: request.id,
            success: false,
            error: '缺少 resourceType 参数',
            metadata: {
              handledBy: this.id,
              handledAt: new Date().toISOString()
            }
          };
        }

        const provisionedResourceId = this.provisionResource(request.id, resourceType, capacity);
        
        if (!provisionedResourceId) {
          return {
            id: request.id,
            success: false,
            error: '资源暂时不可用，已加入队列',
            metadata: {
              handledBy: this.id,
              handledAt: new Date().toISOString(),
              queued: true,
              queuePosition: this.provisioningQueue.length
            }
          };
        }

        return {
          id: request.id,
          success: true,
          data: {
            provisioned: true,
            resourceId: provisionedResourceId,
            resourceType,
            capacity,
            timestamp: new Date().toISOString()
          },
          metadata: {
            handledBy: this.id,
            handledAt: new Date().toISOString(),
            resourceId: provisionedResourceId
          }
        };

      case 'release':
        const resourceId = request.metadata?.resourceId;
        if (!resourceId) {
          return {
            id: request.id,
            success: false,
            error: '缺少 resourceId 参数',
            metadata: {
              handledBy: this.id,
              handledAt: new Date().toISOString()
            }
          };
        }

        const released = this.releaseResource(resourceId, capacity);
        
        return {
          id: request.id,
          success: released,
          data: {
            released,
            resourceId,
            capacity,
            timestamp: new Date().toISOString()
          },
          metadata: {
            handledBy: this.id,
            handledAt: new Date().toISOString(),
            resourceId
          }
        };

      case 'check_status':
      default:
        const resources = Array.from(this.resources.values());
        const totalCapacity = resources.reduce((sum, r) => sum + r.capacity, 0);
        const totalAllocated = resources.reduce((sum, r) => sum + r.allocated, 0);
        const utilization = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

        const maintenanceSchedules = this.maintenanceSchedules
          .filter(s => s.endTime > new Date())
          .map(s => ({
            resourceId: s.resourceId,
            description: s.description,
            impact: s.impact,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString()
          }));

        return {
          id: request.id,
          success: true,
          data: {
            infrastructure: {
              totalResources: resources.length,
              totalCapacity,
              totalAllocated,
              utilization: utilization.toFixed(2) + '%',
              availableResources: resources.filter(r => r.status === 'available').length,
              maintenanceSchedules: maintenanceSchedules.length
            },
            queue: {
              pending: this.provisioningQueue.length
            }
          },
          metadata: {
            handledBy: this.id,
            handledAt: new Date().toISOString()
          }
        };
    }
  }

  getResources(): ResourceSpec[] {
    return Array.from(this.resources.values());
  }

  getResourceUtilization(resourceId: string): number {
    const resource = this.resources.get(resourceId);
    if (!resource || resource.capacity === 0) {
      return 0;
    }
    return (resource.allocated / resource.capacity) * 100;
  }

  getProvisioningQueue() {
    return [...this.provisioningQueue];
  }

  getMaintenanceSchedules(): MaintenanceSchedule[] {
    return [...this.maintenanceSchedules];
  }
}