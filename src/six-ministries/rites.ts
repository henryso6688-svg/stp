import { Request, Response, Ministry } from '../core/types';

export interface ProtocolSpec {
  name: string;
  version: string;
  contentType: string;
  requiredHeaders: string[];
  allowedMethods: string[];
}

export interface TransformationRule {
  from: string;
  to: string;
  transform: (data: any) => any;
}

export class RitesMinistry implements Ministry {
  id = 'rites';
  name = '礼部 (Ministry of Rites)';
  description = 'API standardization, protocol conversion, and interface management';

  private protocols: Map<string, ProtocolSpec> = new Map();
  private transformations: TransformationRule[] = [];
  private formatValidators: Map<string, (data: any) => boolean> = new Map();

  constructor() {
    console.log(`${this.name} 初始化`);
    this.registerDefaultProtocols();
  }

  private registerDefaultProtocols(): void {
    this.registerProtocol({
      name: 'REST',
      version: '1.0',
      contentType: 'application/json',
      requiredHeaders: ['Content-Type', 'Accept'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    });

    this.registerProtocol({
      name: 'GraphQL',
      version: '2021',
      contentType: 'application/json',
      requiredHeaders: ['Content-Type'],
      allowedMethods: ['POST']
    });

    this.registerProtocol({
      name: 'gRPC',
      version: '1.0',
      contentType: 'application/grpc',
      requiredHeaders: ['Content-Type', 'grpc-encoding'],
      allowedMethods: ['POST']
    });
  }

  registerProtocol(protocol: ProtocolSpec): void {
    const key = `${protocol.name}_${protocol.version}`;
    this.protocols.set(key, protocol);
    console.log(`${this.name} 注册协议: ${protocol.name} v${protocol.version}`);
  }

  addTransformation(rule: TransformationRule): void {
    this.transformations.push(rule);
    console.log(`${this.name} 添加转换规则: ${rule.from} -> ${rule.to}`);
  }

  registerFormatValidator(format: string, validator: (data: any) => boolean): void {
    this.formatValidators.set(format, validator);
    console.log(`${this.name} 注册格式验证器: ${format}`);
  }

  validateProtocol(request: Request): boolean {
    const protocolName = request.metadata?.protocol || 'REST';
    const protocolVersion = request.metadata?.protocolVersion || '1.0';
    const key = `${protocolName}_${protocolVersion}`;
    
    const protocol = this.protocols.get(key);
    if (!protocol) {
      console.warn(`${this.name} 警告: 未注册的协议 ${key}`);
      return false;
    }

    const headers = request.metadata?.headers || {};
    for (const requiredHeader of protocol.requiredHeaders) {
      if (!headers[requiredHeader]) {
        console.warn(`${this.name} 警告: 缺少必需头 ${requiredHeader}`);
        return false;
      }
    }

    const method = request.metadata?.method || 'GET';
    if (!protocol.allowedMethods.includes(method)) {
      console.warn(`${this.name} 警告: 方法 ${method} 不允许用于协议 ${protocolName}`);
      return false;
    }

    return true;
  }

  transformData(data: any, fromFormat: string, toFormat: string): any {
    const transformation = this.transformations.find(
      rule => rule.from === fromFormat && rule.to === toFormat
    );

    if (transformation) {
      return transformation.transform(data);
    }

    if (fromFormat === 'JSON' && toFormat === 'XML') {
      return this.jsonToXml(data);
    } else if (fromFormat === 'XML' && toFormat === 'JSON') {
      return this.xmlToJson(data);
    }

    return data;
  }

  private jsonToXml(data: any): string {
    const convert = (obj: any, tag: string): string => {
      if (Array.isArray(obj)) {
        return obj.map(item => convert(item, 'item')).join('');
      } else if (typeof obj === 'object' && obj !== null) {
        const entries = Object.entries(obj);
        if (entries.length === 0) {
          return `<${tag}/>`;
        }
        const inner = entries.map(([key, value]) => convert(value, key)).join('');
        return `<${tag}>${inner}</${tag}>`;
      } else {
        return `<${tag}>${obj}</${tag}>`;
      }
    };

    return `<?xml version="1.0"?>${convert(data, 'root')}`;
  }

  private xmlToJson(xml: string): any {
    return { xml, converted: true, note: 'XML to JSON conversion placeholder' };
  }

  validateFormat(format: string, data: any): boolean {
    const validator = this.formatValidators.get(format);
    if (validator) {
      return validator(data);
    }

    switch (format) {
      case 'JSON':
        try {
          if (typeof data === 'string') {
            JSON.parse(data);
          } else {
            JSON.stringify(data);
          }
          return true;
        } catch {
          return false;
        }
      case 'XML':
        return typeof data === 'string' && data.includes('<?xml');
      default:
        return true;
    }
  }

  async handle(request: Request): Promise<Response> {
    console.log(`${this.name} 处理请求: ${request.id}`);

    const protocolValid = this.validateProtocol(request);
    if (!protocolValid) {
      return {
        id: request.id,
        success: false,
        error: '协议验证失败',
        metadata: {
          handledBy: this.id,
          handledAt: new Date().toISOString(),
          protocolValid: false
        }
      };
    }

    const inputFormat = request.metadata?.inputFormat || 'JSON';
    const outputFormat = request.metadata?.outputFormat || 'JSON';

    const formatValid = this.validateFormat(inputFormat, request.payload);
    if (!formatValid) {
      return {
        id: request.id,
        success: false,
        error: `格式验证失败: ${inputFormat}`,
        metadata: {
          handledBy: this.id,
          handledAt: new Date().toISOString(),
          formatValid: false,
          inputFormat
        }
      };
    }

    const transformedData = this.transformData(request.payload, inputFormat, outputFormat);

    return {
      id: request.id,
      success: true,
      data: {
        protocol: 'valid',
        format: {
          input: inputFormat,
          output: outputFormat,
          valid: true
        },
        transformed: transformedData !== request.payload,
        data: transformedData
      },
      metadata: {
        handledBy: this.id,
        handledAt: new Date().toISOString(),
        protocol: request.metadata?.protocol || 'REST',
        inputFormat,
        outputFormat
      }
    };
  }

  getRegisteredProtocols(): ProtocolSpec[] {
    return Array.from(this.protocols.values());
  }

  getTransformationRules(): TransformationRule[] {
    return [...this.transformations];
  }
}