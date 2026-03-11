export interface Request {
  id: string;
  type: string;
  payload: any;
  metadata?: Record<string, any>;
}

export interface Response {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface Policy {
  id: string;
  name: string;
  rules: Rule[];
}

export interface Rule {
  id: string;
  condition: (request: Request) => boolean;
  action: (request: Request) => Promise<Request>;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  handle(request: Request): Promise<Response>;
}

export enum Department {
  SECRETARIAT = 'secretariat',
  CHANCELLERY = 'chancellery',
  STATE_AFFAIRS = 'state_affairs'
}

export interface STPConfig {
  enableLogging?: boolean;
  strictValidation?: boolean;
  timeout?: number;
  ministries?: Record<string, Ministry>;
}