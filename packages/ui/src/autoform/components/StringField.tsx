import React from 'react';
import { AutoFormFieldProps } from '@autoform/react';
import { Input } from 's/components/ui/input';

export const StringField: React.FC<AutoFormFieldProps> = ({ inputProps, error, id }) => (
  <Input id={id} className={error ? 'border-destructive' : ''} {...inputProps} />
);
