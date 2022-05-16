#!/bin/bash
set -e

# Spins up a local SQL Server Express container and a container instance of 
# mssql-tools (aka sql-runner), then opens a terminal session with the the
# tools container so you can test your scripts. 
docker compose build
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker exec -it sql-runner bash