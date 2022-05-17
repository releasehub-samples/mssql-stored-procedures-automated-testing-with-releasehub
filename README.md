# Using Release to test version-controlled Stored Procedures in on-demand, ephemeral SQL Server Environments

:warning: This Readme is a work in process, a bit messy, but I will clean it up!

This project demonstrates how you can use Release ([https://releasehub.com](https://ReleaseHub)) to run automated tests of your MS SQL stored procedures against an on-demand, ephemeral SQL Server database instance seeded with your own, real data in _your_ AWS or GCP cloud account. Once you've set up your environment blueprint, testing is as simple as pushing your changes to a branch and opening a pull request (or an API, CLI, or click in the UI).

Even if you're not using SQL Server (or AWS, GCP, or Release), this project may still be useful as the genera patterns are widely applicable. 

## Architecture Overview

An overview of this project's architecture is below: 

![](docs/diagram.svg)

1. **Your repository:** From left to right, everything first starts with your code in a GitHub, BitBucket, or GitLab repository:

    * `*.sql files` - any number of *.sql* file(s), arranged in any manner you like. These can include both DDL such as `CREATE TABLE` or `CREATE PROCEDURE`, as well as DML scripts to test whether your schema and procedures operate as expected. 

    * `run-tests.sh`- a script that first runs your included DDL to create your stored procedures, as well as executing additional test scripts to determine whether your procedures work as expected. These scripts and commands are executed against either the ephemeral container database or RDS / CloudSQL datbase you choose to attach. 

    * `database` - [optional] container image of Microsoft SQL Server. Note that we don't actually include a Dockerfile for this image... we simply reference the official `mcr.microsoft.com/mssql/server:2019-CU15-ubuntu-20.04` image and configure it using environment variables in our the Docker Compose file. This is an **optional** requirement, as you could instead use a Release Instant Dataset for a real Amazon RDS database. This project will demonstrate both options. 

    * `docker-compose.yaml` - A Docker Compose file that may be used to run your containers locally. Note that you should instead use `run-local.sh` when running locally because this will merge `docker-compose.local.yml` into the default `docker-compose.yml`, which slightly alters the way the containers are brought up to aid in local testing. 

    * `.release.yaml` - though not shown in the diagram, this repo contains a `.release.yaml` that contains pointers to a Release Application Template (i.e. `.release/application_template`) and `.release/environment_variables.yaml` that Release will use as your default tempalte when first creating a new Release application from this repo. Refer to the [GitOps](#gitops) section of this guide for more detail.

1. **RDS Snapshot** - this is an RDS snapshot of a pre-seeded mock "production" database and will act as the source snapshot for Release Instant Datasets for RDS, later shown in this demo. While not shown in this diagram, the `rds-cdk/` directory contains an AWS CDK project that creates a brand new RDS MSSQL datbase then issues a few SQL commands to create a `ReleaseDemo` database that contains a `users` table with three dummy rows to represent pre-seeded data. For details, refer to [Source RDS snapshots](#souce_rds_snapshots)l

1. **Release Application Template** - this is your "blueprint" for your ephemeral environments; it's a simple YAML that looks very similar to a real compose file and tells Release how, where, and when to instantiate, update, or tear down your environment resources. By default, you only edit this file through the UI, CLI, or API... though enabling your account-wide [GitOps](#gitops) feature will instead allow you to completely control this file through code.

With the prerequisities above out of your way, your developers are now able to create an ephemeral (or permanent) Release environment by simply opening a properly-labeled pull requests, clicking in the UI, or issuing an API or CI request.

Release monitors your repo for activity and, when it sees a matching event type, will instruct the Release Control Plane (running in Release's cloud account) ti carry out your instructions.



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