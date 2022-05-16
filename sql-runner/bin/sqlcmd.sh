#!/bin/bash
set -e

# Shortcut for interactive sqlcmd session:
/opt/mssql-tools/bin/sqlcmd -S $DB_HOST -U $DB_USER -P $DB_PASS