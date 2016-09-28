#!/bin/bash
status=2
PG_HOST="beacon_db"
PG_PORT="5432"
while [ "$status" -ne 0 ]; do
    sleep 5
    PGPASSWORD=r783qjkldDsiu \
        psql -U microaccounts_dev -h ${PG_HOST} -p ${PG_PORT} -d elixir_beacon_dev -c "SELECT 1" > /dev/null
    # nc -z ${PG_HOST} ${PG_PORT}
    status=$?
    echo $?
done
java -jar /tmp/elixirbeacon-service.jar --spring.profiles.active=dev
