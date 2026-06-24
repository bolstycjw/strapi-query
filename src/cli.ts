#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { generateSchemaFromGraphQl, graphQlIntrospectionQuery } from './graphql.js';

const defaultOutputPath = 'src/generated/strapi-schema.ts';

interface CliOptions {
  graphql?: string;
  graphqlUrl?: string;
  out?: string;
  token?: string;
  headers: Record<string, string>;
  importFrom?: string;
  schemaName?: string;
  help?: boolean;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  if (!options.graphql && !options.graphqlUrl) {
    throw new Error('Pass --graphql <file> or --graphql-url <url>.');
  }

  if (options.graphql && options.graphqlUrl) {
    throw new Error('Pass only one of --graphql or --graphql-url.');
  }

  const document = options.graphql
    ? JSON.parse(await readFile(options.graphql, 'utf8'))
    : await fetchGraphQlIntrospection(options);
  const output = generateSchemaFromGraphQl(document, {
    ...(options.importFrom ? { importFrom: options.importFrom } : {}),
    ...(options.schemaName ? { schemaExportName: options.schemaName } : {})
  });
  const outputPath = options.out ?? defaultOutputPath;

  if (outputPath === '-') {
    process.stdout.write(output);
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { headers: {} };

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
  strapi-query generate --graphql-url https://cms.example.com/graphql --token $STRAPI_TOKEN
  strapi-query generate --graphql ./graphql-introspection.json --out ./src/generated/strapi-schema.ts

Options:
  --graphql <file>       Read a GraphQL introspection JSON result from disk.
  --graphql-url <url>    Fetch GraphQL introspection from an endpoint.
  --out <file>           Write generated TypeScript to a file. Defaults to ${defaultOutputPath}. Use - for stdout.
  --token <token>        Bearer token for --graphql-url.
  --header "Name: Val"   Extra fetch header for --graphql-url. May be repeated.
  --import-from <name>   Import helpers from this module. Defaults to strapi-query.
  --schema-name <name>   Exported schema constant name. Defaults to schema.
`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
