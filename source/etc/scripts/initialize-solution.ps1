abp install-libs

cd src/ItHelpdesk.DbMigrator && dotnet run && cd -


cd src/ItHelpdesk.HttpApi.Host && dotnet dev-certs https -v -ep openiddict.pfx -p config.auth_server_default_pass_phrase 



exit 0