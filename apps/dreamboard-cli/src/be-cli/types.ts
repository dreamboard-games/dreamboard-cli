export type BeCliArgDefinition = {
  type: "string" | "boolean" | "enum";
  description: string;
  alias?: string | string[];
  default?: string | boolean;
  options?: string[];
  multiple?: boolean;
};

export type BeCliApiResult = {
  data?: unknown;
  error?: unknown;
  response?: Response;
};

export type BeCliErrorInfo = {
  kind: "api" | "assertion" | "cli";
  message: string;
  details?: unknown;
};

export type BeCliEnvelope = {
  ok: boolean;
  operation: string;
  status: number | null;
  data: unknown | null;
  error: BeCliErrorInfo | null;
};

export type BeCliRequestContext = {
  args: Record<string, unknown>;
  body: unknown;
};

export type BeCliBodyFileMode = "forbidden" | "required";

export type BeCliOperationDefinition = {
  resource: string;
  action: string;
  description: string;
  requiresAuth?: boolean;
  bodyFileMode?: BeCliBodyFileMode;
  args?: Record<string, BeCliArgDefinition>;
  buildRequest: (context: BeCliRequestContext) => Record<string, unknown>;
  invoke: (request: Record<string, unknown>) => Promise<BeCliApiResult>;
};
