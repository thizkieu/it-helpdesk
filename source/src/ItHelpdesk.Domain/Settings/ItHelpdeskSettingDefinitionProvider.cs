using Volo.Abp.Settings;

namespace ItHelpdesk.Settings;

public class ItHelpdeskSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(ItHelpdeskSettings.MySetting1));
    }
}
