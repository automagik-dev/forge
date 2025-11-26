import { useMemo, useEffect, useState } from 'react';
import Form from '@rjsf/core';
import { RJSFValidationError } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { shadcnTheme } from './rjsf';
// Using custom shadcn/ui widgets instead of @rjsf/shadcn theme

type ExecutorType =
  | 'AMP'
  | 'CLAUDE_CODE'
  | 'GEMINI'
  | 'CODEX'
  | 'CURSOR_AGENT'
  | 'COPILOT'
  | 'OPENCODE'
  | 'QWEN_CODE';

// Form data type for executor configurations - dynamic based on schema
type ExecutorFormData = Record<string, unknown>;

interface ExecutorConfigFormProps {
  executor: ExecutorType;
  value: ExecutorFormData;
  onSubmit?: (formData: ExecutorFormData) => void;
  onChange?: (formData: ExecutorFormData) => void;
  onSave?: (formData: ExecutorFormData) => Promise<void>;
  disabled?: boolean;
  isSaving?: boolean;
  isDirty?: boolean;
}

import schemas from 'virtual:executor-schemas';

export function ExecutorConfigForm({
  executor,
  value,
  onSubmit,
  onChange,
  onSave,
  disabled = false,
  isSaving = false,
  isDirty = false,
}: ExecutorConfigFormProps) {
  const [formData, setFormData] = useState(value || {});
  const [validationErrors, setValidationErrors] = useState<
    RJSFValidationError[]
  >([]);

  const schema = useMemo(() => {
    return schemas[executor];
  }, [executor]);

  useEffect(() => {
    setFormData(value || {});
    setValidationErrors([]);
  }, [value, executor]);

  const handleChange = ({ formData: newFormData }: { formData?: ExecutorFormData }) => {
    if (newFormData === undefined) return;
    setFormData(newFormData);
    if (onChange) {
      onChange(newFormData);
    }
  };

  const handleSubmit = async ({ formData: submitData }: { formData?: ExecutorFormData }) => {
    if (submitData === undefined) return;
    setValidationErrors([]);
    if (onSave) {
      await onSave(submitData);
    } else if (onSubmit) {
      onSubmit(submitData);
    }
  };

  const handleError = (errors: RJSFValidationError[]) => {
    setValidationErrors(errors);
  };

  if (!schema) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Schema not found for executor type: {executor}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6">
          {/* RJSF beta has complex generic types; use any-typed Form to avoid deep type errors */}
          <Form
            schema={schema}
            formData={formData}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={handleChange as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={handleSubmit as any}
            onError={handleError}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            validator={validator as any}
            disabled={disabled}
            liveValidate
            showErrorList={false}
            widgets={shadcnTheme.widgets}
            templates={shadcnTheme.templates}
          >
            {onSave && (
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={!isDirty || validationErrors.length > 0 || isSaving}
                >
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Configuration
                </Button>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>
                  {error.property}: {error.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
