import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validator that checks if the input date is in the past compared to today.
 * Setting the time to midnight (00:00:00) ensures date-only comparisons are correct.
 */
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Don't validate empty values, that's the job of Validators.required
    }

    const inputDate = new Date(control.value);
    if (isNaN(inputDate.getTime())) {
      return { invalidDate: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a date comparison object at local midnight
    const compareDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    if (compareDate < today) {
      return { pastDate: true };
    }

    return null;
  };
}
