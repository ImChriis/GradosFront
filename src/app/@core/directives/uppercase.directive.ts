import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]'
})
export class UppercaseDirective {
  private ngControl = inject(NgControl);

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const upper = target.value.toUpperCase();
    target.value = upper;
    this.ngControl.control?.setValue(upper, { emitEvent: false });
    target.setSelectionRange(start!, end!);
  }
}
