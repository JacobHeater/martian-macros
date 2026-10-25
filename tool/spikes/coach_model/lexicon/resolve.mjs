// MM-617: lets Node run the app's TypeScript, whose relative imports have no extension (Vite resolves them in the app).
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (!specifier.startsWith('.') || error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    return next(specifier + '.ts', context);
  }
}`),
);
