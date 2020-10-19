import { IncomingMessage, ServerResponse } from 'http';

interface NextRpcContext {
  req?: IncomingMessage;
  res?: ServerResponse;
}

export function getContext(): NextRpcContext;
