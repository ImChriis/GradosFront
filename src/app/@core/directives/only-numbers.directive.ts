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

    // Permitir atajos (Ctrl/Cmd + V, C, X, A, Z)
    if (event.ctrlKey || event.metaKey) {
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
    // 3. Si lo pegado trae algo que no sean números (espacios, puntos, saltos
    // de línea al copiar de una tabla), se pegan solo los dígitos
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') ?? '';
    const digits = pastedText.replace(/\D/g, '');

    if (digits !== pastedText) {
      event.preventDefault();
      // insertText dispara el evento input, así el formulario reactivo se entera
      if (digits) document.execCommand('insertText', false, digits);
    }
  }
}
