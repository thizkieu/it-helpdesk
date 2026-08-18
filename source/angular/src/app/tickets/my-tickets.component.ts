import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router';
import { ListService, PagedResultDto, CoreModule } from '@abp/ng.core';
import { ThemeSharedModule } from '@abp/ng.theme.shared';
import { TicketService, TicketDto } from '@proxy/tickets';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    CoreModule, 
    ThemeSharedModule, 
    NgxDatatableModule
  ], 
  providers: [ListService],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.scss']
})
export class MyTicketsComponent implements OnInit {
  list = inject(ListService);
  ticketService = inject(TicketService);
  
  data: PagedResultDto<TicketDto> = { items: [], totalCount: 0 };

  filters = {
    filterText: '',
    status: null as number | null
  };

  searchSubject = new Subject<string>();

  ngOnInit(): void {
    const streamCreator = (query: any) => {
      return this.ticketService.getList({
        ...query,
        filter: this.filters.filterText,
        status: this.filters.status
      });
    };

    this.list.hookToQuery(streamCreator).subscribe(res => {
      this.data = res;
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.list.get();
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.filters.filterText);
  }

  onFilterChange(): void {
    this.list.get();
  }
}