import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { RealtimeService } from '../../core/services/realtime.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="shell">
      <app-sidebar />
      <div class="main"><app-header /><main><router-outlet /></main></div>
    </div>`,
  styles: `.shell { display: flex; min-height: 100vh; } .main { flex: 1; min-width: 0; display: flex; flex-direction: column; } main { flex: 1; }`,
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private rt = inject(RealtimeService);
  private settings = inject(SettingsService);

  ngOnInit(): void {
    this.settings.load().subscribe(); // nạp ngưỡng cảnh báo dùng chung
    this.rt.connect();
  }
  ngOnDestroy(): void {
    this.rt.disconnect();
  }
}
