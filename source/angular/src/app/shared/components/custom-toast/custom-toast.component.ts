import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomToastService } from '../../services/custom-toast.service';

@Component({
    selector: 'app-custom-toast',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './custom-toast.component.html',
    styleUrls: ['./custom-toast.component.scss']
})
export class CustomToastComponent {
    constructor(public toastService: CustomToastService) { }
}