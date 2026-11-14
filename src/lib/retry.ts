/**
 * 跨境访问 Appwrite 时会偶发 ECONNRESET / 超时，这里做有限次退避重试。
 */
export async function withRetry<T>(
  task: () => Promise<T>,
  attempts = 3,
  delayMs = 400,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      const status = (error as { code?: number }).code;
      if (typeof status === "number" && status >= 400 && status < 500) {
        throw error;
      }
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
