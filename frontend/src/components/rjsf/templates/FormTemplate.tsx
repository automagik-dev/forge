import type { PropsWithChildren } from 'react';

export const FormTemplate = ({ children }: PropsWithChildren): JSX.Element => {
  return <div className="w-full">{children}</div>;
};
