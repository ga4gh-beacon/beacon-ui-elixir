FROM node:5
ARG UI_BUILD_ENV=docker
ARG UI_BUILD_APP=beacon

RUN apt-get -y update && \
    apt-get -y upgrade && \
    apt-get -y install \
        apt-utils \
        apache2 \
        git

ENV APACHE_LOCK_DIR=/var/lock
ENV APACHE_PID_FILE=/var/run/apache.pid
ENV APACHE_RUN_USER=www-data
ENV APACHE_RUN_GROUP=www-data
ENV APACHE_LOG_DIR=/var/log/apache2

RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY src ./src
COPY scripts ./scripts
COPY package.json .
RUN npm install

WORKDIR /opt/app/src/js
RUN npm install

WORKDIR /opt/app
RUN node scripts/gulpbatch.js --env=docker --app=beacon
RUN npm uninstall

COPY conf/apache2/beacon_docker.conf ./beacon_docker.conf
RUN sed -e "s/__UI_BUILD_APP__/beacon/g" ./beacon_docker.conf |\
    sed -e "s/__UI_BUILD_ENV__/docker/g" > \
    /etc/apache2/sites-available/beacon_docker.conf

RUN a2enmod headers && \
    a2ensite beacon_docker && \
    a2dissite 000-default
RUN rm -Rf beacon_docker.conf \
    src \
    scripts \
    node_modules \
    package.json
RUN apt-get -y remove git apt-utils && \
    apt-get -y clean && \
    apt-get -y autoremove

CMD ["apache2", "-D", "FOREGROUND"]
