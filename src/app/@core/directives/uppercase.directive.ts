import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]'
})
export class UppercaseDirective {
  // private ngControl = inject(NgControl);

  // @HostListener('input', ['$event'])
  // onInput(event: Event) {
  //   const target = event.target as HTMLInputElement;
  //   const start = target.selectionStart;
  //   const end = target.selectionEnd;
  //   const upper = target.value.toUpperCase();
  //   target.value = upper;
  //   this.ngControl.control?.setValue(upper, { emitEvent: false });
  //   target.setSelectionRange(start!, end!);
  // }

  private ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    
    const upper = target.value.toUpperCase();
    
    // 1. Actualizamos el valor visual en el DOM
    target.value = upper;

    // 2. Si existe un control de Angular Forms, actualizamos el modelo
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(upper, { emitEvent: false });
    }

    // 3. Restauramos la posición del cursor (evita que el cursor salte al final)
    target.setSelectionRange(start, end);
  }
}
