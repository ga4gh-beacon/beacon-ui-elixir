#/bin/bash
set -e
echo "Creating beacon sample dataset"
PGPASSWORD=r783qjkldDsiu \
    psql -U microaccounts_dev elixir_beacon_dev <<-EOSQL
        INSERT INTO beacon_dataset
        (id, description, access_type, reference_genome, size)
        VALUES
        ('EGAD00000000028', 'dataset_description', 'PUBLIC', 'grch37', 34114);
EOSQL
echo "Created beacon schema"

echo "Loading sample data..."
cat /tmp/EGAD00000000028.SNPs | \
    PGPASSWORD=r783qjkldDsiu \
        psql -U microaccounts_dev elixir_beacon_dev -c \
            "COPY beacon_data_table(dataset_id,chromosome,position,alternate) FROM STDIN USING DELIMITERS ';' CSV"
echo "Loaded sample data."

rm /tmp/EGAD00000000028.SNPs
