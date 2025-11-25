import type { RJSFFormTemplateProps } from '@/types/rjsf';

export const FormTemplate = (props: RJSFFormTemplateProps) => {
  const { children } = props;

  return <div className="w-full">{children}</div>;
};
