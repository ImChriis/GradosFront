import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyNumbers]',
  standalone: true
})
export class OnlyNumbersDirective {
  // Teclas permitidas (Borrar, Tab, Enter, Esc, Flechas)
  private navigationKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'
  ];

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // 1. Permitir teclas de navegación
    if (this.navigationKeys.indexOf(event.key) > -1) {
      return;
    }

    // 2. Bloquear si no es un número (0-9)
    // Usamos una expresión regular simple para solo dígitos
    const isNumber = /^[0-9]$/.test(event.key);

    if (!isNumber) {
      event.preventDefault(); // Evita que el carácter se escriba
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    // 3. Bloquear también si intentan pegar algo que no sean números
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text');
    
    if (pastedText && !/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
}
