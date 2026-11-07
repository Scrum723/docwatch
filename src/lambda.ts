/**
 * AWS Lambda + Function URL entry for DOC Watch MCP.
 */
import serverless from "serverless-http";
import { app } from "./lambdaApp.js";

export const handler = serverless(app, {
  binary: false,
});
