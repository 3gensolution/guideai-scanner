import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

/**
 * Make an error-recovered AST safe to traverse.
 *
 * `errorRecovery: true` lets the parser accept a file that redeclares a
 * binding — `const anyThing = …` twice in one scope — and record it as a
 * recovered error instead of throwing. Babel's *traversal* is stricter: the
 * moment it builds scope it re-checks collisions and throws
 * `Duplicate declaration "x"`, outside whatever try/catch guards the parse.
 *
 * That turns one sloppy file in a customer's repo into a dead scan: the
 * process exits and every route already extracted is discarded. Real
 * codebases ship these — the bundler tolerates them, so nobody notices — and
 * a scanner that refuses to read a project until its source is clean is not
 * one anybody can run.
 *
 * So the offending declarators are renamed before traversal. Only the exact
 * positions Babel flagged are touched, which leaves the legal case — the same
 * name declared in two different scopes — alone. The names are internal to
 * this parse and never reach output; elements are keyed off JSX, not
 * identifiers.
 */
export function neutralizeDuplicateBindings(ast: any): void {
  const positions = new Set<number>();
  for (const error of ast?.errors ?? []) {
    if (error?.reasonCode !== 'VarRedeclaration') continue;
    const pos = error.pos ?? error.loc?.index;
    if (typeof pos === 'number') positions.add(pos);
  }
  if (positions.size === 0) return;

  let counter = 0;
  const rename = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(rename);
      return;
    }
    const id = node.type === 'VariableDeclarator' ? node.id : undefined;
    if (
      id &&
      id.type === 'Identifier' &&
      typeof id.start === 'number' &&
      positions.has(id.start)
    ) {
      id.name = `${id.name}$dup${++counter}`;
    }
    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
      const child = node[key];
      if (child && typeof child === 'object') rename(child);
    }
  };
  rename(ast.program ?? ast);
}

export function resolveSourceImport(from: string, specifier: string, rootDir?: string): string | undefined {
  const base = specifier.startsWith('.') ? path.resolve(path.dirname(from), specifier)
    : rootDir && specifier.startsWith('@/') ? path.resolve(rootDir, 'src', specifier.slice(2)) : undefined;
  if (!base) return undefined;
  return [base, ...['.tsx', '.jsx', '.ts', '.js', '/index.tsx', '/index.jsx', '/index.ts', '/index.js'].map(ext => base + ext)]
    .find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

export interface TabOwner { tab: string; tab_group: string }
export interface TabDefinition extends TabOwner { state: string; key: string }

// Only explicit equality gates prove ownership. Names/heading similarity do not.
export function tabOwnerForPath(nodePath: any, definitions: TabDefinition[]): TabOwner | undefined {
  let child = nodePath;
  for (let parent = child.parentPath; parent; child = parent, parent = parent.parentPath) {
    const node = parent.node;
    const test = node.type === 'LogicalExpression' && node.operator === '&&' && child.key === 'right'
      ? node.left : node.type === 'ConditionalExpression' && child.key === 'consequent' ? node.test : undefined;
    if (!test || test.type !== 'BinaryExpression' || !['===', '=='].includes(test.operator)) continue;
    const state = test.left.type === 'Identifier' ? test.left : test.right.type === 'Identifier' ? test.right : undefined;
    const value = test.left.type === 'StringLiteral' ? test.left : test.right.type === 'StringLiteral' ? test.right : undefined;
    const matches = definitions.filter(def => def.state === state?.name && def.key === value?.value);
    if (matches.length === 1) return { tab: matches[0].tab, tab_group: matches[0].tab_group };
  }
  return undefined;
}

export function collectTabDefinitions(ast: any, route: string, component: string): TabDefinition[] {
  const arrays = new Map<string, any>();
  traverse(ast, { VariableDeclarator(p) { if (p.node.id.type === 'Identifier') arrays.set(p.node.id.name, p.node.init); } });
  const unwrap = (n: any): any => n && ['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(n.type) ? unwrap(n.expression) : n;
  const itemsOf = (n: any): any[] => {
    n = unwrap(n);
    if (n?.type === 'Identifier') n = unwrap(arrays.get(n.name));
    return n?.type === 'ArrayExpression' ? n.elements.filter((e: any) => e?.type === 'ObjectExpression').map((e: any) =>
      Object.fromEntries(e.properties.filter((p: any) => p.type === 'ObjectProperty' && p.value.type === 'StringLiteral').map((p: any) => [p.key.name || p.key.value, p.value.value]))) : [];
  };
  const definitions: TabDefinition[] = [];
  traverse(ast, { JSXOpeningElement(p) {
    const attrs = p.node.attributes;
    const expr = (name: string): any => {
      const a: any = attrs.find((a: any) => a.type === 'JSXAttribute' && a.name.name === name);
      return a?.value?.type === 'JSXExpressionContainer' ? a.value.expression : undefined;
    };
    const name = p.node.name.type === 'JSXIdentifier' ? p.node.name.name : '';
    if (/^(Tabs?|TabGroup|TabList)$/i.test(name)) {
      const state = expr('activeKey') || expr('value') || expr('activeTab') || expr('selectedKey');
      if (state?.type !== 'Identifier') return;
      for (const item of itemsOf(expr('tabs') || expr('items') || expr('options'))) {
        const key = item.key || item.value || item.id;
        const label = item.label || item.text || item.title || item.name;
        if (key && label) definitions.push({ state: state.name, key, tab: label, tab_group: `tabs:${route}:${component}:${state.name}` });
      }
    }
    // Native role=tab buttons generated from a static list.
    const role: any = attrs.find((a: any) => a.type === 'JSXAttribute' && a.name.name === 'role');
    const selected = expr('aria-selected');
    if (role?.value?.value !== 'tab' || selected?.type !== 'BinaryExpression') return;
    const state = selected.left.type === 'Identifier' ? selected.left : selected.right.type === 'Identifier' ? selected.right : undefined;
    const member = selected.left.type === 'MemberExpression' ? selected.left : selected.right.type === 'MemberExpression' ? selected.right : undefined;
    const call = p.findParent((q: any) => q.node.type === 'CallExpression' && q.node.callee.type === 'MemberExpression' && q.node.callee.property.name === 'map');
    if (!state || !member || !call) return;
    for (const item of itemsOf(call.node.callee.object)) {
      const key = item[member.property.name];
      const label = item.label || item.text || item.title || item.name;
      if (key && label) definitions.push({ state: state.name, key, tab: label, tab_group: `tabs:${route}:${component}:${state.name}` });
    }
  } });
  return definitions;
}

export function renderedSourceImports(file: string, route: string, rootDir: string): Array<{ file: string; owner?: TabOwner }> {
  let ast;
  try {
    ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx', 'typescript'], errorRecovery: true });
    neutralizeDuplicateBindings(ast);
  }
  catch { return []; }
  const imports = new Map<string, string>();
  traverse(ast, { ImportDeclaration(p) {
    const resolved = resolveSourceImport(file, p.node.source.value, rootDir);
    if (resolved) for (const spec of p.node.specifiers) imports.set(spec.local.name, resolved);
  } });
  const definitions = collectTabDefinitions(ast, route, path.basename(file, path.extname(file)));
  const result: Array<{ file: string; owner?: TabOwner }> = [];
  traverse(ast, { JSXOpeningElement(p) {
    if (p.node.name.type !== 'JSXIdentifier') return;
    const imported = imports.get(p.node.name.name);
    if (imported) result.push({ file: imported, owner: tabOwnerForPath(p, definitions) });
  } });
  return result;
}
