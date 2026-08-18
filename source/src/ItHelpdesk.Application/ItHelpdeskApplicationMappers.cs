using AutoMapper;
using ItHelpdesk.Books;
using ItHelpdesk.LocalizationManagement.Languages;
using ItHelpdesk.LocalizationManagement.LanguageTexts;
using ItHelpdesk.Provider;
using ItHelpdesk.SysMasterLists;
using Riok.Mapperly.Abstractions;
using Volo.Abp.Mapperly;

namespace ItHelpdesk;

#region Books
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskBookToBookDtoMapper : MapperBase<Book, BookDto>
{
    public override partial BookDto Map(Book source);

    public override partial void Map(Book source, BookDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateBookDtoToBookMapper : MapperBase<CreateUpdateBookDto, Book>
{
    public override partial Book Map(CreateUpdateBookDto source);

    public override partial void Map(CreateUpdateBookDto source, Book destination);
}
#endregion

#region Languages
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskLanguageToLanguageDtoMapper : MapperBase<Language, LanguageDto>
{
    public override partial LanguageDto Map(Language source);

    public override partial void Map(Language source, LanguageDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateLanguageDtoToLanguageMapper : MapperBase<CreateUpdateLanguageDto, Language>
{
    public override partial Language Map(CreateUpdateLanguageDto source);

    public override partial void Map(CreateUpdateLanguageDto source, Language destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskInputLanguageDtoToLanguageRequestMapper : MapperBase<InputLanguageDto, LanguageRequest>
{
    public override partial LanguageRequest Map(InputLanguageDto source);

    public override partial void Map(InputLanguageDto source, LanguageRequest destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskLanguageQueryResponseToLanguageDtoMapper : MapperBase<LanguageQueryResponse, LanguageDto>
{
    public override partial LanguageDto Map(LanguageQueryResponse source);

    public override partial void Map(LanguageQueryResponse source, LanguageDto destination);
}
#endregion

#region LanguageTexts
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskLanguageTextToLanguageTextDtoMapper : MapperBase<LanguageText, LanguageTextDto>
{
    public override partial LanguageTextDto Map(LanguageText source);

    public override partial void Map(LanguageText source, LanguageTextDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateLanguageTextDtoToLanguageTextMapper : MapperBase<CreateUpdateLanguageTextDto, LanguageText>
{
    public override partial LanguageText Map(CreateUpdateLanguageTextDto source);

    public override partial void Map(CreateUpdateLanguageTextDto source, LanguageText destination);
}
#endregion

#region SysMasterLists
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdesk_GetSysMasterListInput_To_SysMasterListRequest_Mapper : MapperBase<GetSysMasterListInput, SysMasterListRequest>
{
    public override partial SysMasterListRequest Map(GetSysMasterListInput source);

    public override partial void Map(GetSysMasterListInput source, SysMasterListRequest destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdesk_PageSysMasterListQueryResponse_To_SysMasterListDto_Mapper : MapperBase<PageSysMasterListQueryResponse, SysMasterListDto>
{
    public override partial SysMasterListDto Map(PageSysMasterListQueryResponse source);

    public override partial void Map(PageSysMasterListQueryResponse source, SysMasterListDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdesk_InfoSysMasterListQueryResponse_To_SysMasterListDto_Mapper : MapperBase<InfoSysMasterListQueryResponse, SysMasterListDto>
{
    public override partial SysMasterListDto Map(InfoSysMasterListQueryResponse source);

    public override partial void Map(InfoSysMasterListQueryResponse source, SysMasterListDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdesk_SysMasterListQueryResponse_To_SysMasterListDto_Mapper : MapperBase<SysMasterListQueryResponse, SysMasterListDto>
{
    public override partial SysMasterListDto Map(SysMasterListQueryResponse source);

    public override partial void Map(SysMasterListQueryResponse source, SysMasterListDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdesk_CreateUpdateSysMasterListDto_To_SysMasterListInsertOrUpdateRequest_Mapper : MapperBase<CreateUpdateSysMasterListDto, SysMasterListInsertOrUpdateRequest>
{
    public override partial SysMasterListInsertOrUpdateRequest Map(CreateUpdateSysMasterListDto source);

    public override partial void Map(CreateUpdateSysMasterListDto source, SysMasterListInsertOrUpdateRequest destination);
}
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdesk_DeleteSysMasterListDto_To_SysMasterListDeleteRequest_Mapper : MapperBase<DeleteSysMasterListDto, SysMasterListDeleteRequest>
{
    public override partial SysMasterListDeleteRequest Map(DeleteSysMasterListDto source);

    public override partial void Map(DeleteSysMasterListDto source, SysMasterListDeleteRequest destination);
}
#endregion
#region Categories
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCategoryToCategoryDtoMapper : MapperBase<Categories.Category, Categories.CategoryDto>
{
    public override partial Categories.CategoryDto Map(Categories.Category source);
    public override partial void Map(Categories.Category source, Categories.CategoryDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateCategoryDtoToCategoryMapper : MapperBase<Categories.CreateUpdateCategoryDto, Categories.Category>
{
    public override partial Categories.Category Map(Categories.CreateUpdateCategoryDto source);
    public override partial void Map(Categories.CreateUpdateCategoryDto source, Categories.Category destination);
}
#endregion

#region Services
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskServiceToServiceDtoMapper : MapperBase<Services.Service, Services.ServiceDto>
{
    public override partial Services.ServiceDto Map(Services.Service source);
    public override partial void Map(Services.Service source, Services.ServiceDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateServiceDtoToServiceMapper : MapperBase<Services.CreateUpdateServiceDto, Services.Service>
{
    public override partial Services.Service Map(Services.CreateUpdateServiceDto source);
    public override partial void Map(Services.CreateUpdateServiceDto source, Services.Service destination);
}
#endregion

#region Priorities
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskPriorityToPriorityDtoMapper : MapperBase<Priorities.Priority, Priorities.PriorityDto>
{
    public override partial Priorities.PriorityDto Map(Priorities.Priority source);
    public override partial void Map(Priorities.Priority source, Priorities.PriorityDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdatePriorityDtoToPriorityMapper : MapperBase<Priorities.CreateUpdatePriorityDto, Priorities.Priority>
{
    public override partial Priorities.Priority Map(Priorities.CreateUpdatePriorityDto source);
    public override partial void Map(Priorities.CreateUpdatePriorityDto source, Priorities.Priority destination);
}
#endregion

#region Teams
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskTeamToTeamDtoMapper : MapperBase<Teams.Team, Teams.TeamDto>
{
    public override partial Teams.TeamDto Map(Teams.Team source);
    public override partial void Map(Teams.Team source, Teams.TeamDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateTeamDtoToTeamMapper : MapperBase<Teams.CreateUpdateTeamDto, Teams.Team>
{
    public override partial Teams.Team Map(Teams.CreateUpdateTeamDto source);
    public override partial void Map(Teams.CreateUpdateTeamDto source, Teams.Team destination);
}
#endregion
#region Tickets
[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskTicketToTicketDtoMapper : MapperBase<Tickets.Ticket, Tickets.TicketDto>
{
    public override partial Tickets.TicketDto Map(Tickets.Ticket source);
    public override partial void Map(Tickets.Ticket source, Tickets.TicketDto destination);
}

[Mapper(RequiredMappingStrategy = RequiredMappingStrategy.Target)]
public partial class ItHelpdeskCreateUpdateTicketDtoToTicketMapper : MapperBase<Tickets.CreateUpdateTicketDto, Tickets.Ticket>
{
    public override partial Tickets.Ticket Map(Tickets.CreateUpdateTicketDto source);
    public override partial void Map(Tickets.CreateUpdateTicketDto source, Tickets.Ticket destination);
}
#endregion