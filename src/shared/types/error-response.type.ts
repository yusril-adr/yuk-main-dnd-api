export type TErrorDebug = {
  name: string;
  message: string;
  stack?: string;
  // Postgres error code and detail, when the error came from the database.
  code?: string;
  detail?: string;
};

export type TErrorResponse = {
  statusCode: number;
  message: unknown;
  error: string;
  // Only present when APP_DEBUG=true, and never for plain HttpExceptions.
  debug?: TErrorDebug;
};
