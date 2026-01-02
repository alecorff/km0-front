import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule } from '@ngx-translate/core';
import { DurationPipe } from 'src/app/components/common/pipe/duration.pipe';
import { PacePipe } from 'src/app/components/common/pipe/pace.pipe';

@Component({
  selector: 'app-step-info',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    FormsModule,
    ReactiveFormsModule,
    PacePipe,
    DurationPipe
  ],
  templateUrl: './step-info.component.html',
  styleUrl: './step-info.component.css'
})
export class StepInfoComponent {

  @Input() step!: FormGroup;
  @Output() pickNumericValue = new EventEmitter<{ step: FormGroup; type: 'distance' | 'time' | 'pace' }>();
  @Output() remove = new EventEmitter<void>();

  onPick(type: 'distance' | 'time' | 'pace') {
    this.pickNumericValue.emit({ step: this.step, type });
  }

  onRemove() {
    this.remove.emit();
  }

  isDistance(): boolean {
    return this.step.value.type === 'distance';
  }

}
