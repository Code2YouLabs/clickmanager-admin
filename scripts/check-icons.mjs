import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { HtmlParser, parseTemplate } from '@angular/compiler';
import * as tabler from '@tabler/icons-angular';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src/app');
const registryPath = path.join(sourceRoot, 'shared/admin-tabler-icons.ts');

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

// Inspect Angular template ASTs, including inline templates and control-flow
// blocks. Dynamic values are also inspected in their TypeScript data sources.
export function templateIcons(template, file) {
  if (!template.includes('<i-tabler')) return { references: [], bindings: [] };
  const parsed = new HtmlParser().parse(template, file, { tokenizeBlocks: true });
  if (parsed.errors?.length) throw new Error(parsed.errors.map(error => error.toString()).join('\n'));
  const references = [];
  const bindings = [];
  function literals(expression) {
    if (!expression || typeof expression !== 'object') return;
    if (typeof expression.value === 'string' && expression.value) references.push({ name: expression.value, file });
    for (const key of ['ast', 'expressions', 'args', 'condition', 'trueExp', 'falseExp', 'left', 'right', 'receiver']) {
      const child = expression[key];
      if (Array.isArray(child)) child.forEach(literals);
      else literals(child);
    }
  }
  function visit(node) {
    if (node.name === 'i-tabler') {
      // Parse the icon element alone: unrelated bindings in legacy demo pages
      // must not prevent validation of their icon names.
      const opening = node.startSourceSpan.toString();
      const icon = parseTemplate(opening + (opening.endsWith('/>') ? '' : '</i-tabler>'), file);
      if (icon.errors?.length) throw new Error(icon.errors.map(error => error.toString()).join('\n'));
      const element = icon.nodes[0];
      for (const attribute of element.attributes ?? []) {
        if (attribute.name === 'name') references.push({ name: attribute.value, file });
      }
      for (const input of element.inputs ?? []) {
        if (input.name === 'name') {
          literals(input.value);
          bindings.push({ file, expression: input.value.source });
        }
      }
    }
    for (const key of ['children', 'branches', 'cases']) (node[key] ?? []).forEach(visit);
    if (node.empty) visit(node.empty);
  }
  parsed.rootNodes.forEach(visit);
  return { references, bindings };
}

export function typescriptIcons(source, file) {
  const references = [];
  const add = name => references.push({ name, file });
  const literal = node => {
    if (ts.isStringLiteralLike(node)) add(node.text);
    else ts.forEachChild(node, literal);
  };
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ['icon', 'iconName'].includes(node.name.getText(source).replace(/['"]/g, '')) && ts.isStringLiteralLike(node.initializer)) {
      add(node.initializer.text);
    }
    if (ts.isMethodDeclaration(node) && /icon|icone/i.test(node.name.getText(source)) && node.body) {
      function returns(child) {
        if (ts.isVariableDeclaration(child) && child.initializer && ts.isObjectLiteralExpression(child.initializer)) {
          for (const property of child.initializer.properties) {
            if (ts.isPropertyAssignment(property)) literal(property.initializer);
          }
        } else if (ts.isReturnStatement(child) && child.expression) literal(child.expression);
        else ts.forEachChild(child, returns);
      }
      returns(node.body);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return references;
}

export function scanIcons() {
  const references = [];
  const bindings = [];
  const sources = new Map();
  const dynamicSources = new Set([
    'layouts/full/vertical/sidebar/sidebar-data.ts',
    'pages/apps/email/listing/categories.ts',
    'pages/apps/contact-list/listing/categories.ts',
  ].map(file => path.join(sourceRoot, file)));
  for (const file of filesIn(sourceRoot)) {
    if (file.endsWith('.spec.ts') || file.includes('/code/')) continue;
    if (file.endsWith('.html')) {
      const result = templateIcons(fs.readFileSync(file, 'utf8'), file);
      references.push(...result.references);
      bindings.push(...result.bindings);
      if (result.bindings.length) dynamicSources.add(file.replace(/\.html$/, '.ts'));
    } else if (file.endsWith('.ts')) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      sources.set(file, source);
      function visit(node) {
        if (ts.isPropertyAssignment(node) && node.name.getText(source) === 'template' && ts.isStringLiteralLike(node.initializer)) {
          const result = templateIcons(node.initializer.text, file);
          references.push(...result.references);
          bindings.push(...result.bindings);
          if (result.bindings.length) dynamicSources.add(file);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  for (const file of dynamicSources) {
    const source = sources.get(file);
    if (!source) throw new Error(`Dynamic icon source missing: ${file}`);
    references.push(...typescriptIcons(source, file));
  }
  return { references, bindings };
}

export function validateIcons(references, selectedNames) {
  const errors = [];
  for (const { name, file } of references) {
    const symbol = 'Icon' + name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    if (!tabler[symbol]?.nodes) errors.push(`${file}: unknown Tabler icon "${name}"`);
    else if (selectedNames && !selectedNames.has(name)) errors.push(`${file}: "${name}" is not in admin-tabler-icons.ts; run npm run icons:sync`);
  }
  return [...new Set(errors)];
}

function main() {
  const { references, bindings } = scanIcons();
  const names = [...new Set(references.map(reference => reference.name))].sort();
  const errors = validateIcons(references);
  if (errors.length) throw new Error(errors.join('\n'));
  if (process.argv.includes('--write')) {
    const symbols = names.map(name => 'Icon' + name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(''));
    fs.writeFileSync(registryPath, `// Generated by npm run icons:sync from templates and dynamic icon sources.\n// Named imports keep unused Tabler definitions out of the application bundle.\nimport {\n  ${symbols.join(',\n  ')},\n  type TablerIcon,\n} from '@tabler/icons-angular';\n\nconst selectedIcons: TablerIcon[] = [\n  ${symbols.join(',\n  ')},\n];\n\nexport const ADMIN_TABLER_ICONS: ReadonlyMap<string, TablerIcon> = new Map(\n  selectedIcons.map(icon => [icon.name, icon])\n);\n`);
  }
  const registry = ts.createSourceFile(registryPath, fs.readFileSync(registryPath, 'utf8'), ts.ScriptTarget.Latest, true);
  const selectedNames = new Set();
  for (const statement of registry.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    for (const item of statement.importClause?.namedBindings?.elements ?? []) {
      const icon = tabler[item.name.text];
      if (icon?.nodes) selectedNames.add(icon.name);
    }
  }
  const missing = validateIcons(references, selectedNames);
  if (missing.length) throw new Error(missing.join('\n'));
  console.log(`Validated ${references.length} icon references, ${names.length} selected icons and ${bindings.length} dynamic template bindings.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
