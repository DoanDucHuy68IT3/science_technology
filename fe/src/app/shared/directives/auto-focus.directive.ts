import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[appAutoFocus]' })
export class AutoFocusDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  ngAfterViewInit(): void {
    setTimeout(() => this.el.nativeElement.focus());
  }
}
