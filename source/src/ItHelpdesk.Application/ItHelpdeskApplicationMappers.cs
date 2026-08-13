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