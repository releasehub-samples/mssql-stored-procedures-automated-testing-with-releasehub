#!/bin/bash
set -e

CURRENT_USER=$(whoami)
echo "Running in container as user: $CURRENT_USER"
echo

echo "### SQL SERVER PROCEDURE TESTING STARTED ###"
echo "--------------------------------------------"
echo "Environment ID = ${RELEASE_ENV_ID}"
echo "Database host: ${DB_HOST}"
echo "Database user: ${DB_USER}"
echo

function runSqlFiles {
  local sql_dir=$1
  local title=$2
  echo "[$title]"
  echo ----------------------------------------
  for filename in $sql_dir; do
    echo "RUNNING $filename:"
    /opt/mssql-tools/bin/sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASS -i $filename
    echo ---
    echo
  done
}

runSqlFiles "./setup/*.sql"         "SETTING UP DATABASE"
runSqlFiles "./stored_procs/*.sql"  "CREATING STORED PROCEDURES"
runSqlFiles "./tests/*.sql"         "RUNNING TESTS"
