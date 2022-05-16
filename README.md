# Ephemeral SQL Server Test Environments

## Initial Setup

1. [Install the AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_install)

1. [Install .Net 6 Core](https://dotnet.microsoft.com/en-us/download)

1. [Install Powershell](https://docs.microsoft.com/en-us/powershell/scripting/install/installing-powershell)

1. [Optional] - [Install Azure Data Studio](https://docs.microsoft.com/en-us/sql/azure-data-studio/download-azure-data-studio?view=sql-server-ver15) if you want a GUI to connect directly to a MSSQL database.

1. [Optional] - Install `jq` (makes it easier to parse certain one-time info, later on)

1. From your local terminal or [AWS CloudShell](https://aws.amazon.com/cloudshell/), run `cdk bootstrap`

### Test locally

First, complete [initial setup](#initial_setup). Then: 

1. Run `./run-local.sh`, which will: 
    1. Use Docker Compose to spin up an empty, local MS SQL Server Express container.
    1. Spin up a mssql-tools container, which contains everything in the `sql-runner` directory. 
    1. Open an interactive terminal with the `sql-runner` container. 

1. Once connected to the tools container, you can: 
    1. run `./run-tests.sh` to simulate the automated job we will in Release.
    1. run `./bin/sqlcmd.sh` to execute arbitrary sql against the local database container.
    1. run any other commands you like. 
## Acknowledgements

* https://github.com/karlospn/deploy-dotnet-lambda-with-aws-cdk