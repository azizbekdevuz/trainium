import { useState, useEffect } from 'react';

interface FormValidationOptions {
  requiredFields: string[];
  formId?: string;
}

export function useFormValidation({ requiredFields, formId }: FormValidationOptions) {
  const [isValid, setIsValid] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    const checkFormValidity = () => {
      if (!formId) return;

      const form = document.getElementById(formId) as HTMLFormElement;
      if (!form) return;

      const formData = new FormData(form);
      const missing: string[] = [];

      requiredFields.forEach(fieldName => {
        const value = formData.get(fieldName);
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          missing.push(fieldName);
        }
      });

      // Only update state if the values have actually changed
      setMissingFields(prev => {
        const hasChanged = prev.length !== missing.length || 
          !prev.every((field, index) => field === missing[index]);
        return hasChanged ? missing : prev;
      });
      
      setIsValid(prev => {
        const newValid = missing.length === 0;
        return prev !== newValid ? newValid : prev;
      });
    };

    // Check initially
    checkFormValidity();

    // Set up event listeners for form changes
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener('input', checkFormValidity);
      form.addEventListener('change', checkFormValidity);
      
      return () => {
        form.removeEventListener('input', checkFormValidity);
        form.removeEventListener('change', checkFormValidity);
      };
    }
  }, [requiredFields, formId]);

  return {
    isValid,
    missingFields,
    getValidationMessage: () => {
      if (isValid) return '';
      if (missingFields.length === 0) return '';
      
      const fieldNames = missingFields.map(field => {
        // Convert field names to readable format
        return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      });
      
      return `Please fill in: ${fieldNames.join(', ')}`;
    }
  };
}
