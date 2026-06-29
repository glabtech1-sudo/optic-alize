export interface ArchFile {
  name: string;
  path: string;
  language: 'dart' | 'typescript' | 'sql' | 'json';
  content: string;
  description: string;
  module: string;
  layer: 'domain' | 'data' | 'presentation' | 'backend' | 'database';
  type: 'entity' | 'model' | 'repository' | 'provider' | 'route' | 'middleware' | 'controller' | 'service' | 'schema' | 'ws';
}

export interface TableDefinition {
  name: string;
  description: string;
  isTenantSpecific: boolean;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
  policies: {
    name: string;
    action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    roles: string[];
    using: string;
    description: string;
  }[];
}

export interface WebSocketEvent {
  event: string;
  direction: 'client-to-server' | 'server-to-client';
  payload: string;
  description: string;
  handlerContext: string;
}
