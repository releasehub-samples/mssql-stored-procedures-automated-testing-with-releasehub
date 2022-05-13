# Using Release to test stored procedures with ephemeral Microsoft SQL Server databases



docker-compose up -d














## Setup

1. [Install the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)

1. From your local terminal or [AWS CloudShell](https://aws.amazon.com/cloudshell/), run `cdk bootstrap`

1. [Optional] - Install Azure Data Studio 

1. [Optional] - Install `jq`

1. `docker-compose run --rm sql-runner` or `docker-compose exec sql-runner sh`

1. After launching the CDK stack, retrieve the password by going to AWS Secrets Manager and finding the secret with a name that looks similar to `ReleaseMssqlStoredProcedure-B3vQAKPudkrT`.

1. If running Docker Compose locally to test, the username is `sa` and password is `Pass@word`.
## Acknowledgements

* https://github.com/karlospn/deploy-dotnet-lambda-with-aws-cdk

* https://www.mytecbits.com/internet/python/execute-sql-server-stored-procedure