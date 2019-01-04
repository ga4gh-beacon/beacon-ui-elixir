# Dockerfile mostly based on egacrg/beacon
FROM debian:latest
MAINTAINER Alfred Gil <alfred.gil@crg.eu>
RUN apt-get clean -y; \
    apt-get update -y -qq; \
    apt-get install -y --no-install-recommends -q wget netcat postgresql-client
RUN mkdir /usr/java
WORKDIR /usr/java
RUN wget --no-cookies --no-check-certificate --header "Cookie: gpw_e24=http%3a%2F%2Fwww.oracle.com%2Ftechnetwork%2Fjava%2Fjavase%2Fdownloads%2Fjdk8-downloads-2133151.html; oraclelicense=accept-securebackup-cookie;" "https://download.oracle.com/otn-pub/java/jdk/8u191-b12/2787e4a523244c269598db4e85c51e0c/jdk-8u191-linux-x64.tar.gz" &&\
    tar -xzvf jdk-8u191-linux-x64.tar.gz &&\
    rm jdk-8u191-linux-x64.tar.gz
 
ENV PATH /usr/java/jdk1.8.0_191/bin:$PATH

RUN apt-get -y install maven git  || \
    apt-get -y update && apt-get -y install maven git
WORKDIR /tmp
RUN git clone https://github.com/elixirhub/human-data-beacon.git
RUN sed -i 's#allowed\.origins=.*$#allowed.origins=*#' /tmp/human-data-beacon/elixir_beacon/src/main/resources/META-INF/corsFilter.properties
RUN sed -i 's#^\s*datasource.elixirbeacon.url=.*$#datasource.elixirbeacon.url=jdbc\\:postgresql\\://beacon_db\\:5432/elixir_beacon_dev#g' \
    /tmp/human-data-beacon/elixir_beacon/src/main/resources/application-dev.properties
RUN grep datasource.elixirbeacon.url /tmp/human-data-beacon/elixir_beacon/src/main/resources/application-dev.properties

WORKDIR /tmp/human-data-beacon/elixir_core
RUN mvn clean compile jar:jar && mvn install

WORKDIR /tmp/human-data-beacon/elixir_beacon
RUN mvn clean compile package -Dspring.profiles.active="dev" -Dmaven.test.skip=true

RUN cp /tmp/human-data-beacon/elixir_beacon/target/elixir-beacon-0.3.jar /tmp/elixirbeacon-service.jar
RUN rm -rf /tmp/human-data-beacon/
RUN apt-get -y remove git maven wget && apt-get -y autoremove

COPY beacon.sh /tmp
EXPOSE 9075
CMD /bin/sh /tmp/beacon.sh
