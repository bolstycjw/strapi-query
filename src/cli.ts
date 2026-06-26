#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { generateSchemaFromGraphQl, graphQlIntrospectionQuery } from './graphql.js';
import type { GenerateSchemaNullability } from './graphql.js';
import { readStrapiSchemaFiles } from './strapi-schema-files.js';
import { generateSchemaFromStrapiSchemas } from './strapi-schema.js';

interface CliOptions {
  graphql?: string;
  graphqlUrl?: string;
  strapiSchemas: string[];
  out?: string;
  token?: string;
  headers: Record<string, string>;
  importFrom?: string;
  schemaName?: string;
  nullability?: GenerateSchemaNullability;
  help?: boolean;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  const sourceCount = [options.graphql, options.graphqlUrl, options.strapiSchemas.length > 0]
    .filter(Boolean)
    .length;

  if (sourceCount === 0) {
    throw new Error('Pass --graphql <file>, --graphql-url <url>, or --strapi-schema <file-or-directory>.');
  }

  if (sourceCount > 1) {
    throw new Error('Pass only one schema source.');
  }

  const output = options.strapiSchemas.length > 0
    ? generateSchemaFromStrapiSchemas(await readStrapiSchemaFiles(options.strapiSchemas), {
      ...(options.importFrom ? { importFrom: options.importFrom } : {}),
      ...(options.schemaName ? { schemaExportName: options.schemaName } : {})
    })
    : generateSchemaFromGraphQl(
      options.graphql
        ? JSON.parse(await readFile(options.graphql, 'utf8'))
        : await fetchGraphQlIntrospection(options),
      {
        ...(options.importFrom ? { importFrom: options.importFrom } : {}),
        ...(options.schemaName ? { schemaExportName: options.schemaName } : {}),
        ...(options.nullability ? { nullability: options.nullability } : {})
      }
    );

  if (options.out) {
    await writeFile(options.out, output);
    return;
  }

  process.stdout.write(output);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { headers: {}, strapiSchemas: [] };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    switch (arg) {
      case 'generate':
        break;
      case '--graphql':
        options.graphql = readValue(args, ++index, arg);
        break;
      case '--graphql-url':
        options.graphqlUrl = readValue(args, ++index, arg);
        break;
      case '--strapi-schema':
        options.strapiSchemas.push(readValue(args, ++index, arg));
        break;
      case '--out':
        options.out = readValue(args, ++index, arg);
        break;
      case '--token':
        options.token = readValue(args, ++index, arg);
        break;
      case '--header': {
        const header = readValue(args, ++index, arg);
        const separator = header.indexOf(':');
        if (separator === -1) {
          throw new Error(`Invalid --header value "${header}". Expected "Name: Value".`);
        }

        options.headers[header.slice(0, separator).trim()] = header.slice(separator + 1).trim();
        break;
      }
      case '--import-from':
        options.importFrom = readValue(args, ++index, arg);
        break;
      case '--schema-name':
        options.schemaName = readValue(args, ++index, arg);
        break;
      case '--nullability':
        options.nullability = parseNullability(readValue(args, ++index, arg));
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function parseNullability(value: string): GenerateSchemaNullability {
  if (value === 'optimistic' || value === 'graphql') {
    return value;
  }

  throw new Error(`Invalid --nullability value "${value}". Expected "optimistic" or "graphql".`);
}

function readValue(args: string[], index: number, flag: string) {
  const value = args[index];
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

async function fetchGraphQlIntrospection(options: CliOptions) {
  if (!options.graphqlUrl) {
    throw new Error('Missing --graphql-url.');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  if (options.token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(options.graphqlUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: graphQlIntrospectionQuery() })
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch GraphQL introspection: ${response.status} ${response.statusText}`);
  }

  const body = await response.json() as { errors?: unknown };
  if (body.errors) {
    throw new Error(`GraphQL introspection returned errors: ${JSON.stringify(body.errors)}`);
  }

  return body;
}

function usage() {
  return `Usage:
  strapi-query generate --graphql ./graphql-introspection.json --out ./src/strapi-schema.ts
  strapi-query generate --graphql-url https://cms.example.com/graphql --token $STRAPI_TOKEN --out ./src/strapi-schema.ts
  strapi-query generate --strapi-schema ./src --out ./src/strapi-schema.ts

Options:
  --graphql <file>       Read a GraphQL introspection JSON result from disk.
  --graphql-url <url>    Fetch GraphQL introspection from an endpoint.
  --strapi-schema <path> Read Strapi schema JSON files from a file or directory. May be repeated.
  --out <file>           Write generated TypeScript to a file. Defaults to stdout.
  --token <token>        Bearer token for --graphql-url.
  --header "Name: Val"   Extra fetch header for --graphql-url. May be repeated.
  --import-from <name>   Import helpers from this module. Defaults to strapi-query.
  --schema-name <name>   Exported schema constant name. Defaults to schema.
  --nullability <mode>   Field nullability mode: optimistic or graphql. Defaults to optimistic.
`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
