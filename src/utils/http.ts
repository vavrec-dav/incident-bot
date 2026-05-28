export type JsonRequestOptions = {
  url: string;
  method: "POST" | "GET";
  headers?: Record<string, string>;
  body?: unknown;
  errorContext: string;
};

export async function sendJsonRequest<T>({
  url,
  method,
  headers,
  body,
  errorContext
}: JsonRequestOptions): Promise<{ data: T; status: number; rawBody: string }> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`${errorContext} failed with status ${response.status}: ${rawBody || "<empty response>"}`);
  }

  const data = rawBody ? (JSON.parse(rawBody) as T) : ({} as T);
  return { data, status: response.status, rawBody };
}
