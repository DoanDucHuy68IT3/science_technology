import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CameraAiComponent} from './camera-ai';

describe('CameraAiComponent', () => {
  let component: CameraAiComponent;
  let fixture: ComponentFixture<CameraAiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraAiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraAiComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
