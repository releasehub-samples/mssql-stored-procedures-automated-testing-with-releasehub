#!/bin/bash
set -e

CURRENT_USER=$(whoami)
echo "Running as user: $CURRENT_USER"
echo

echo "### SQL SERVER PROCEDURE TESTING STARTED ###"
echo "--------------------------------------------"
echo "Release environment ID = ${RELEASE_ENV_ID}"
echo

function runSqlFile {
    local sqlFile=$1
    /opt/mssql-tools/bin/sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASS -i $sqlFile
}

echo '[UPDATING STORED PROCEDURES]'
echo ----------------------------------------
for filename in ./stored_procs/*.sql; do
  echo "[SQL: $filename]"
  runSqlFile $filename
  echo Done.
  echo
done

echo '[RUNNING TESTS]'
echo ----------------------------------------
for filename in ./tests/*.sql; do
  echo "[TEST: $filename]"
  runSqlFile $filename
  echo Done.
  echo
done

