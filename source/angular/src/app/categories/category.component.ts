import {
    FormGroup,
    FormBuilder,
    Validators,
    FormsModule,
    ReactiveFormsModule
} from '@angular/forms';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {
    ListService,
    PagedResultDto,
    LocalizationPipe,
    PermissionDirective,
    AutofocusDirective
} from '@abp/ng.core';
import {
    ConfirmationService,
    Confirmation,
    NgxDatatableDefaultDirective,
    NgxDatatableListDirective,
    ModalCloseDirective,
    ModalComponent,
    ToasterService
} from '@abp/ng.theme.shared';

// LƯU Ý: Chỉnh lại đường dẫn proxy này nếu thư mục proxy của bạn chứa thêm /it-helpdesk/
import { CategoryDto, CategoryService } from '../proxy/categories';

@Component({
    selector: 'app-category',
    templateUrl: './category.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgxDatatableModule,
        NgbDropdownModule,
        ModalComponent,
        AutofocusDirective,
        NgxDatatableListDirective,
        NgxDatatableDefaultDirective,
        PermissionDirective,
        ModalCloseDirective,
        LocalizationPipe
    ],
    providers: [ListService],
})
export class CategoryComponent implements OnInit {
    public readonly list = inject(ListService);
    private categoryService = inject(CategoryService);
    private fb = inject(FormBuilder);
    private confirmation = inject(ConfirmationService);
    private toaster = inject(ToasterService);

    category = { items: [], totalCount: 0 } as PagedResultDto<CategoryDto>;
    selectedCategory = {} as CategoryDto;
    form!: FormGroup;
    isModalOpen = false;

    ngOnInit() {
        const categoryStreamCreator = (query: any) => this.categoryService.getList(query);

        this.list.hookToQuery(categoryStreamCreator).subscribe((response: PagedResultDto<CategoryDto>) => {
            this.category = response;
        });
    }

    createCategory() {
        this.selectedCategory = {} as CategoryDto;
        this.buildForm();
        this.isModalOpen = true;
    }

    editCategory(id: number) {
        this.categoryService.get(id).subscribe((category: CategoryDto) => {
            this.selectedCategory = category;
            this.buildForm();
            this.isModalOpen = true;
        });
    }

    delete(id: number, name: string) {
        this.confirmation.warn('::AreYouSureToDelete', '::AreYouSure').subscribe(status => {
            if (status === Confirmation.Status.confirm) {
                this.categoryService.delete(id).subscribe(() => {
                    this.list.get();
                    this.toaster.success('Xóa danh mục thành công!');
                });
            }
        });
    }

    buildForm() {
        this.form = this.fb.group({
            code: [this.selectedCategory.code || '', Validators.required],
            name: [this.selectedCategory.name || '', Validators.required],
            isActive: [this.selectedCategory.isActive ?? true],
            parentId: [this.selectedCategory.parentId || null],
            defaultTeamId: [this.selectedCategory.defaultTeamId || null],
        });
    }

    save() {
        if (this.form.invalid) {
            return;
        }

        const requestData = this.form.value;

        let request = this.categoryService.create(requestData);
        if (this.selectedCategory.id) {
            request = this.categoryService.update(this.selectedCategory.id, requestData);
        }

        request.subscribe(() => {
            this.isModalOpen = false;
            this.form.reset();
            this.list.get();
            this.toaster.success('Lưu danh mục thành công!');
        });
    }
}