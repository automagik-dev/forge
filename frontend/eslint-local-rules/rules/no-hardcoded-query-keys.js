/**
 * ESLint rule to enforce centralized queryKeys usage
 *
 * This rule detects hardcoded query/mutation keys and requires using
 * the centralized queryKeys factory from '@/lib/queryKeys'.
 *
 * BAD:
 *   useQuery({ queryKey: ['tasks', projectId], ... })
 *   useMutation({ mutationKey: ['createProject'], ... })
 *   const taskAttemptKeys = { byTask: (id) => ['taskAttempts', id] }
 *   useQuery({ queryKey: taskAttemptKeys.byTask(id), ... })
 *
 * GOOD:
 *   useQuery({ queryKey: queryKeys.tasks.byProject(projectId), ... })
 *   useMutation({ mutationKey: queryKeys.mutations.projects.create, ... })
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce use of centralized queryKeys from @/lib/queryKeys',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/automagik-dev/forge/blob/main/frontend/src/lib/queryKeys.ts',
    },
    messages: {
      noHardcodedQueryKey:
        'Use centralized queryKeys from "@/lib/queryKeys" instead of hardcoded array. ' +
        'Found: {{ key }}. Import queryKeys and use the appropriate factory method.',
      noLocalKeyFactory:
        'Do not define local query key factories. Use centralized queryKeys from "@/lib/queryKeys". ' +
        'Found: {{ name }}. Add keys to queryKeys.ts instead.',
      useOnlyQueryKeys:
        'Use only the centralized "queryKeys" import for query/mutation keys. ' +
        'Found: {{ identifier }}. Import queryKeys from "@/lib/queryKeys".',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();
    const isQueryKeysFile = filename.endsWith('queryKeys.ts');

    return {
      // Rule 1: Catch hardcoded array literals in queryKey/mutationKey
      Property(node) {
        const keyName = node.key?.name || node.key?.value;
        if (keyName !== 'queryKey' && keyName !== 'mutationKey') return;

        // If value is an array literal, it's a violation
        if (node.value?.type === 'ArrayExpression') {
          const keyContent = context.getSourceCode().getText(node.value);
          context.report({
            node: node.value,
            messageId: 'noHardcodedQueryKey',
            data: { key: keyContent },
          });
          return;
        }

        // Rule 3: Catch non-queryKeys identifiers used for queryKey/mutationKey
        // e.g., queryKey: taskAttemptKeys.byTask(id) or queryKey: localKeys.something
        if (
          node.value?.type === 'CallExpression' ||
          node.value?.type === 'MemberExpression'
        ) {
          const rootIdentifier = getRootIdentifier(node.value);
          if (rootIdentifier && rootIdentifier !== 'queryKeys') {
            context.report({
              node: node.value,
              messageId: 'useOnlyQueryKeys',
              data: { identifier: rootIdentifier },
            });
          }
        }
      },

      // Rule 2: Catch local query key factory definitions
      // e.g., const taskAttemptKeys = { byTask: ... }
      VariableDeclarator(node) {
        if (isQueryKeysFile) return; // Allow in the canonical queryKeys.ts file

        const name = node.id?.name;
        if (!name) return;

        // Check if the variable name looks like a query keys factory
        const isKeyFactoryName =
          /[Kk]eys$/.test(name) && name !== 'queryKeys';

        if (isKeyFactoryName && node.init?.type === 'ObjectExpression') {
          context.report({
            node: node,
            messageId: 'noLocalKeyFactory',
            data: { name },
          });
        }
      },
    };
  },
};

/**
 * Get the root identifier from a MemberExpression or CallExpression
 * e.g., queryKeys.tasks.byProject(id) -> 'queryKeys'
 *       taskAttemptKeys.byTask(id) -> 'taskAttemptKeys'
 */
function getRootIdentifier(node) {
  if (!node) return null;

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'CallExpression') {
    return getRootIdentifier(node.callee);
  }

  if (node.type === 'MemberExpression') {
    return getRootIdentifier(node.object);
  }

  return null;
}
