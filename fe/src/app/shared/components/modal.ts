import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  template: `
    <div class="bd" (click)="closed.emit()">
      <div class="box" [style.max-width.px]="width()" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="hd"><h2>{{ title() }}</h2><button class="x" (click)="closed.emit()" aria-label="Đóng">✕</button></div>
        <div class="bodyc"><ng-content /></div>
        <div class="ft"><ng-content select="[footer]" /></div>
      </div>
    </div>`,
  styles: `
    .bd { position: fixed; inset: 0; background: rgba(40, 20, 80, .45); display: grid; place-items: center; z-index: 100; padding: 16px; }
    .box { background: #fff; border-radius: 16px; width: 100%; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
    .hd { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); h2 { margin: 0; } }
    .x { border: 0; background: none; font-size: 18px; cursor: pointer; color: var(--muted); }
    .bodyc { padding: 20px; overflow: auto; } .ft { display: flex; justify-content: flex-end; gap: 8px; padding: 0 20px 16px; }
    .ft:empty { display: none; }`,
})
export class ModalComponent {
  title = input('');
  width = input(560);
  closed = output<void>();
}
