using System;
using System.Linq;
using System.Threading.Tasks;
using ItHelpdesk.Categories;
using ItHelpdesk.Permissions;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace ItHelpdesk.Categories
{
    public class CategoryAppService : CrudAppService<
        Category,
        CategoryDto,
        long,
        GetCategoryListInput,
        CreateUpdateCategoryDto,
        CreateUpdateCategoryDto>,
        ICategoryAppService
    {
        public CategoryAppService(IRepository<Category, long> repository) : base(repository)
        {
            GetPolicyName = ItHelpdeskPermissions.Categories.Default;
            GetListPolicyName = ItHelpdeskPermissions.Categories.Default;
            CreatePolicyName = ItHelpdeskPermissions.Categories.Create;
            UpdatePolicyName = ItHelpdeskPermissions.Categories.Edit;
            DeletePolicyName = ItHelpdeskPermissions.Categories.Delete;
        }

        protected override async Task<IQueryable<Category>> CreateFilteredQueryAsync(GetCategoryListInput input)
        {
            return (await base.CreateFilteredQueryAsync(input))
                .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                    x => x.Code.Contains(input.Filter) || x.Name.Contains(input.Filter));
        }
    }
}