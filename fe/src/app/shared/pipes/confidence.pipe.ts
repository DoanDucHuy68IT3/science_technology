import { Pipe, PipeTransform } from '@angular/core';

/** 0.9432 -> "94%" */
@Pipe({ name: 'confidence' })
export class ConfidencePipe implements PipeTransform {
  transform(v: number | null | undefined): string {
    return v == null ? '—' : `${Math.round(v * 100)}%`;
  }
}
