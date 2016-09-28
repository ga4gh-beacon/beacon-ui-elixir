FROM library/postgres:9.4.9

RUN localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8
MAINTAINER Mario Alberich <mario.alberich@crg.eu>
RUN apt-get clean -y; \
    apt-get update -y -qq

ENV LANG "C.UTF-8"
ENV LC_ALL "C.UTF-8"

WORKDIR /
RUN mkdir -p /docker-entrypoint-initdb.d
COPY initdb.sh    /docker-entrypoint-initdb.d/000-initdb.sh
COPY load_data.sh /docker-entrypoint-initdb.d/001-load_data.sh

WORKDIR /tmp
COPY elixir_beacon_db_schema.sql /tmp/
COPY EGAD00000000028.SNPs /tmp/
