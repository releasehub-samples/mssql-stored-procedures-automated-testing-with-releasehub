#!/bin/bash
set -e

docker compose -f docker-compose.yml -f docker-compose.local.yml up -d

docker exec -it sql-runner bash