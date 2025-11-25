/**
 * ESLint rule to enforce centralized queryKeys usage
 *
 * This rule detects hardcoded query/mutation keys and requires using
 * the centralized queryKeys factory from '@/lib/queryKeys'.
 *
 * BAD:
 *   useQuery({ queryKey: ['tasks', projectId], ... })
 *   useMutation({ mutationKey: ['createProject'], ... })
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
    },
    schema: [],
  },

  create(context) {
    return {
      Property(node) {
        // Check for queryKey or mutationKey properties
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
        }
      },
    };
  },
};
