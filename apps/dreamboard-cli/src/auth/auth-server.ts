import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import type { Session } from "@supabase/supabase-js";
import { spawn } from "node:child_process";

type CliAuthPayload = {
  token?: Session["access_token"];
  refreshToken?: Session["refresh_token"];
  state?: string;
};

type CliAuthResult = {
  token: Session["access_token"];
  refreshToken: Session["refresh_token"] | null;
};

export async function startCliAuthServer(
  state: string,
  timeoutMs: number,
): Promise<{
  port: number;
  waitForToken: Promise<CliAuthResult>;
  close: () => void;
}> {
  let resolveToken: (token: CliAuthResult) => void;
  let rejectToken: (error: Error) => void;

  const waitForToken = new Promise<CliAuthResult>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });

  let server: ReturnType<typeof createServer> | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 10; attempt++) {
    const portCandidate = 49152 + Math.floor(Math.random() * 16383);
    try {
      server = createServer(
        async (request: IncomingMessage, response: ServerResponse) => {
          try {
            await handleAuthRequest(request, response, state, resolveToken!);
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to handle auth callback.";
            writeCorsResponse(request, response, 500, message);
          }
        },
      );
      await new Promise<void>((resolve, reject) => {
        server!.once("error", reject);
        server!.listen(portCandidate, "127.0.0.1", () => {
          server!.off("error", reject);
          resolve();
        });
      });
      break;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Failed to start auth server");
    }
  }

  if (!server) {
    const error =
      lastError ?? new Error("Failed to start auth callback server.");
    rejectToken!(error);
    throw error;
  }

  const timer = setTimeout(() => {
    rejectToken!(new Error("Login timed out."));
    server?.close();
  }, timeoutMs);

  waitForToken.finally(() => clearTimeout(timer));

  return {
    port: portCandidateFromServer(server),
    waitForToken,
    close: () => server?.close(),
  };
}

function portCandidateFromServer(
  server: ReturnType<typeof createServer>,
): number {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Auth callback server did not expose a bound port.");
  }
  return address.port;
}

async function handleAuthRequest(
  request: IncomingMessage,
  response: ServerResponse,
  state: string,
  resolveToken: (token: CliAuthResult) => void,
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

  if (request.method === "OPTIONS") {
    writeCorsResponse(request, response, 204, "");
    return;
  }

  if (requestUrl.pathname === "/cli-auth" && request.method === "POST") {
    const text = await readRequestBody(request);
    let payload: CliAuthPayload | null = null;
    try {
      payload = JSON.parse(text) as CliAuthPayload;
    } catch {
      payload = null;
    }

    const token = payload?.token;
    const refreshToken = payload?.refreshToken;
    const receivedState = payload?.state;
    if (!token || receivedState !== state) {
      writeCorsResponse(request, response, 400, "Invalid auth payload");
      return;
    }

    resolveToken({ token, refreshToken: refreshToken ?? null });
    response.once("finish", () => {
      response.socket?.server?.close();
    });
    writeCorsResponse(request, response, 200, "OK");
    return;
  }

  writeCorsResponse(request, response, 200, "Dreamboard CLI auth server");
}

function writeCorsResponse(
  request: IncomingMessage,
  response: ServerResponse,
  statusCode: number,
  body: string,
): void {
  const origin = request.headers.origin ?? "*";
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(body);
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string[];
  if (platform === "darwin") {
    command = ["open", url];
  } else if (platform === "win32") {
    command = ["cmd", "/c", "start", "", url];
  } else {
    command = ["xdg-open", url];
  }
  const child = spawn(command[0], command.slice(1), {
    stdio: "ignore",
    detached: true,
  });
  child.unref();
}
