// API Route Types
export interface NextAPIRequest extends Request {
  json(): Promise<any>;
}

export interface NextAPIResponse {
  status(code: number): NextAPIResponse;
  json(body: any): Response;
}
