import { CommonModule } from '@angular/common';
import { Component, Inject  } from '@angular/core';
import { ToastrService } from 'src/app/services/toastr.service';
import { MaterialModule } from '../../../material.module';


@Component({
    selector: 'app-form-toastr',
    templateUrl: './form-toastr.component.html',
    imports: [MaterialModule, CommonModule]
})
export class AppFormToastrComponent {
  constructor(private toastr: ToastrService) {}

  showSuccess() {
    this.toastr.success('You are awesome!', 'Success!');
  }

  showError() {
    this.toastr.error('This is not good!', 'Oops!');
  }

  showWarning() {
    this.toastr.warning('You are being warned.', 'Alert!');
  }

  showInfo() {
    this.toastr.info('Just some information for you.');
  }
}
