import { STP } from '../src/index';

async function main() {
  console.log('=== STP 基本使用示例 ===\n');

  const stp = new STP({
    enableLogging: true,
    strictValidation: false,
    timeout: 10000
  });

  console.log('STP 状态:', stp.getStatus());

  const request = {
    id: 'req_123456',
    type: 'api.user.login',
    payload: {
      username: 'user@example.com',
      password: 'securepassword123'
    },
    metadata: {
      userId: 'user_001',
      clientIP: '192.168.1.100',
      protocol: 'HTTPS',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-api-key-123'
      },
      resource: 'api.call',
      amount: 1
    }
  };

  console.log('\n=== 发送测试请求 ===');
  console.log('请求ID:', request.id);
  console.log('请求类型:', request.type);
  console.log('用户ID:', request.metadata.userId);

  try {
    const results = await stp.process(request);
    
    console.log('\n=== 处理结果 ===');
    results.forEach((result, index) => {
      console.log(`\n结果 ${index + 1}:`);
      console.log('  成功:', result.success);
      console.log('  处理部门:', result.metadata?.handledBy);
      if (result.error) {
        console.log('  错误:', result.error);
      }
      if (result.data) {
        console.log('  数据:', JSON.stringify(result.data, null, 2));
      }
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`\n=== 汇总 ===`);
    console.log(`总响应数: ${results.length}`);
    console.log(`成功: ${successCount}, 失败: ${failureCount}`);

  } catch (error) {
    console.error('处理过程中出错:', error);
  }

  console.log('\n=== 直接调用单个部门示例 ===');
  
  const singleRequest = {
    id: 'req_single_001',
    type: 'infrastructure.check_status',
    payload: {},
    metadata: {
      action: 'check_status'
    }
  };

  const worksResult = await stp.processSingle(singleRequest, 'works');
  console.log('工部响应:', {
    success: worksResult.success,
    data: worksResult.data
  });

  console.log('\n=== 获取审计日志 ===');
  const justiceMinistry = stp.getMinistry('justice');
  if (justiceMinistry && 'getAuditLog' in justiceMinistry) {
    const auditLog = (justiceMinistry as any).getAuditLog();
    console.log(`审计日志条目数: ${auditLog.length}`);
    if (auditLog.length > 0) {
      console.log('最新审计条目:', {
        requestId: auditLog[0].requestId,
        action: auditLog[0].action,
        success: auditLog[0].success,
        timestamp: auditLog[0].timestamp
      });
    }
  }

  console.log('\n=== 示例完成 ===');
}

main().catch(console.error);