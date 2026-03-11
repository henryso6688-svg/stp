import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { STP, Request } from './index';

const app = express();
const port = process.env.STP_PORT || 3000;
const host = process.env.STP_HOST || '0.0.0.0';

// Initialize STP framework
const stp = new STP({
  enableLogging: process.env.STP_ENABLE_LOGGING === 'true',
  strictValidation: process.env.STP_STRICT_VALIDATION === 'true',
  timeout: parseInt(process.env.STP_TIMEOUT || '30000')
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  const status = stp.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    framework: status.framework,
    departments: status.departments,
    ministries: status.ministries
  });
});

// STP status endpoint
app.get('/api/status', (req, res) => {
  res.json(stp.getStatus());
});

// Process request through all ministries
app.post('/api/process', async (req, res) => {
  try {
    const request: Request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: req.body.type || 'api.request',
      payload: req.body.payload || {},
      metadata: {
        ...req.body.metadata,
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }
    };

    console.log(`Processing request: ${request.id}, type: ${request.type}`);
    
    const results = await stp.process(request);
    
    res.json({
      requestId: request.id,
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Process request through specific ministry
app.post('/api/ministry/:ministryName/process', async (req, res) => {
  try {
    const ministryName = req.params.ministryName;
    
    const request: Request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: req.body.type || 'api.request',
      payload: req.body.payload || {},
      metadata: {
        ...req.body.metadata,
        clientIP: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }
    };

    console.log(`Processing request through ministry ${ministryName}: ${request.id}`);
    
    const result = await stp.processSingle(request, ministryName);
    
    res.json({
      requestId: request.id,
      ministry: ministryName,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing ministry request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get ministry-specific information
app.get('/api/ministry/:ministryName', (req, res) => {
  const ministryName = req.params.ministryName;
  const ministry = stp.getMinistry(ministryName);
  
  if (!ministry) {
    return res.status(404).json({
      success: false,
      error: `Ministry ${ministryName} not found`
    });
  }
  
  res.json({
    ministry: ministryName,
    name: ministry.name,
    description: ministry.description,
    timestamp: new Date().toISOString()
  });
});

// Get audit logs from Justice Ministry
app.get('/api/audit/logs', (req, res) => {
  const justiceMinistry = stp.getMinistry('justice');
  
  if (!justiceMinistry || !('getAuditLog' in justiceMinistry)) {
    return res.status(404).json({
      success: false,
      error: 'Justice ministry not available'
    });
  }
  
  const logs = (justiceMinistry as any).getAuditLog();
  res.json({
    success: true,
    logs,
    count: logs.length,
    timestamp: new Date().toISOString()
  });
});

// Get infrastructure status from Works Ministry
app.get('/api/infrastructure/status', async (req, res) => {
  const worksMinistry = stp.getMinistry('works');
  
  if (!worksMinistry) {
    return res.status(404).json({
      success: false,
      error: 'Works ministry not available'
    });
  }
  
  const request: Request = {
    id: `status_${Date.now()}`,
    type: 'infrastructure.check_status',
    payload: {},
    metadata: {
      action: 'check_status'
    }
  };
  
  const result = await stp.processSingle(request, 'works');
  
  res.json({
    success: result.success,
    data: result.data,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(port as number, host, () => {
  console.log('========================================');
  console.log('STP API Server Started');
  console.log('========================================');
  console.log(`Framework: ${stp.getStatus().framework}`);
  console.log(`Server: http://${host}:${port}`);
  console.log(`Health: http://${host}:${port}/health`);
  console.log(`Status: http://${host}:${port}/api/status`);
  console.log('========================================');
  console.log('Available endpoints:');
  console.log('  GET  /health                - Health check');
  console.log('  GET  /api/status            - STP framework status');
  console.log('  POST /api/process           - Process request through all ministries');
  console.log('  POST /api/ministry/:name/process - Process request through specific ministry');
  console.log('  GET  /api/ministry/:name    - Get ministry information');
  console.log('  GET  /api/audit/logs        - Get audit logs from Justice ministry');
  console.log('  GET  /api/infrastructure/status - Get infrastructure status from Works ministry');
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

export default app;