interface FormTemplateProps {
  children: React.ReactNode;
}

export const FormTemplate = (props: FormTemplateProps) => {
  const { children } = props;

  return <div className="w-full">{children}</div>;
};
