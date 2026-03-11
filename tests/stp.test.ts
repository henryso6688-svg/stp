import { STP } from '../src/index';
import { Request } from '../src/core/types';

describe('STP Framework', () => {
  let stp: STP;

  beforeEach(() => {
    stp = new STP({ enableLogging: false });
  });

  test('应该正确初始化STP框架', () => {
    expect(stp).toBeDefined();
    const status = stp.getStatus();
    expect(status.framework).toBe('STP - Three Departments and Six Ministries');
    expect(status.departments.secretariat).toBe('active');
    expect(status.departments.chancellery).toBe('active');
    expect(status.departments.state_affairs).toBe('active');
    expect(status.ministries).toContain('personnel');
    expect(status.ministries).toContain('revenue');
    expect(status.ministries).toContain('rites');
    expect(status.ministries).toContain('war');
    expect(status.ministries).toContain('justice');
    expect(status.ministries).toContain('works');
  });

  test('应该处理基本请求', async () => {
    const request: Request = {
      id: 'test_request_001',
      type: 'api.test',
      payload: { test: 'data' },
      metadata: {
        userId: 'test_user',
        clientIP: '127.0.0.1',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-key'
        }
      }
    };

    const results = await stp.process(request);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    const successResults = results.filter(r => r.success);
    expect(successResults.length).toBeGreaterThan(0);
  });

  test('应该直接调用单个部门', async () => {
    const request: Request = {
      id: 'single_ministry_request',
      type: 'infrastructure.check_status',
      payload: {},
      metadata: {
        action: 'check_status'
      }
    };

    const result = await stp.processSingle(request, 'works');
    
    expect(result).toBeDefined();
    expect(result.id).toBe(request.id);
    expect(result.success).toBe(true);
    expect(result.metadata?.handledBy).toBe('works');
  });

  test('应该返回未找到部门的错误', async () => {
    const request: Request = {
      id: 'invalid_ministry_request',
      type: 'test',
      payload: {},
      metadata: {}
    };

    const result = await stp.processSingle(request, 'nonexistent');
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到');
  });

  test('应该获取部门实例', () => {
    const personnel = stp.getMinistry('personnel');
    const revenue = stp.getMinistry('revenue');
    const rites = stp.getMinistry('rites');
    
    expect(personnel).toBeDefined();
    expect(revenue).toBeDefined();
    expect(rites).toBeDefined();
    expect(personnel?.id).toBe('personnel');
    expect(revenue?.id).toBe('revenue');
    expect(rites?.id).toBe('rites');
  });

  test('应该获取三省实例', () => {
    const secretariat = stp.getSecretariat();
    const chancellery = stp.getChancellery();
    const stateAffairs = stp.getStateAffairs();
    
    expect(secretariat).toBeDefined();
    expect(chancellery).toBeDefined();
    expect(stateAffairs).toBeDefined();
  });
});