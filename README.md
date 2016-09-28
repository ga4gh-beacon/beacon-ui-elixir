# Elixir Beacon Web User Interface

## Introduction

This repository includes the source code for the web frontend of the Elixir Beacon backend, already published at the repository of the [Elixir hub's human-data-beacon](https://github.com/elixirhub/human-data-beacon). The frontend complies with the API specification v0.3.

This repository also contains the source code to build and run a _dockerized_ version of the full stack of the Elixir Beacon. Read below for more details.

## License

This software is licensed under a **Apache 2.0 license**. Please, refer to the LICENSE file content to verify this, as it's the primary source for that information.

## Terms of Service page

As you'll realize, the beacon frontend includes a Terms of Service (ToS) link, which points to a ToS text already included. This is a sample text that has been kept as a sample, and in no way it has legal purposes as far as it's not being backed by your institution.

If you plan to publicly expose such frontend, please, consider to adapt this text to your own purposes and making public the institution that gives support to your project. The owners and maintainers of this repository decline any responsibility or liability for the bad usage of this repository and for not adapting such text to each specific purpose.

## Dockerized version

In case that you don't know what Docker is or how to get it, you can check out the information at the [Docker website](https://www.docker.com/) and at the [docker-compose documentation section](https://docs.docker.com/compose/).

The current installation has been tested with:

* Ubuntu Linux 16.04
* docker v1.12.1
* docker-compose v1.6.2

If you find any issue by building the images with your current version of Docker, try to get the newest version of both software packages.

If the previous approach doesn't solve the issue, you can create an issue so that we can share the solution with all the community.

Also, if you've got to build those containers in a different environment, please, let us know if it worked and if you needed to perform changes in the current configuration.

### Full build

This repository already contains a Dockerfile to create a standalone container, and a docker-compose configuration. The build process may take a while, and in short we'll provide a DockerHub-based build.

After getting installed Docker and docker-compose, the only instruction that needs to be executed is, from the project root:

```bash
docker-compose -f deploy/beacon/docker-compose-beacon.yml build
```
This process may take a while, as it involves the full creation of three containers:

* Beacon backend, placed at: [Elixir hub's human-data-beacon](https://github.com/elixirhub/human-data-beacon)
* PostgreSQL container which stores the data. See the [chapter below](#database-contents-outside-of-the-calendar) to store the data outside the container.
* Beacon frontend (this repository).

This process also involves the database creation and the insertion of the sample data.

### Database contents outside of the container

The current implementation stores the data inside of the container itself. This approach eases the deployment in whatever environment, but it may not be the strategy that you want to follow. If this is your case, create a directory in your host computer and attach a volume in docker-compose. You can follow the instructions explained at the [Docker compose reference documentation](https://docs.docker.com/compose/compose-file/#volumes-volume-driver).

### Troubleshooting Docker and Docker-compose

In some cases you may want to rebuild all the images again. If you try it and it fails, it may be caused because the previous images' cache are interferring in the new builds, specially regarding the creation of the beacon_db container.

If this is your case, then you can perform some cleanup operations in your host machine by following the next steps.

**Be carefull with the following steps, as they may remove images and containers that are already in use**. If you're not sure of bulk executing the commands below, please, remove them manually looking for the beacon beacon_db and beacon_ui keywords.

#### Docker images cleanup

```bash
$ docker rmi $(docker images -a -q -f dangling=true)
```

#### Docker containers cleanup
```bash
$ docker rm $(docker ps -aq)
```

## Development and contributions

The Beacon frontend has been developed on top of AngularJS v1.4.9.  The dependencies for angular and other required modules are handled via NPM and the package.json file placed at the src/js/ folder.

**Before changing any file in the repository, please, take into account that all the files have been configured to work in a specific docker environment, and that whatever change in them may break such build process.**

Also, if you would like to contribute to the source code, the best way to do so is by forking the repository and performing Pull Requests on Github. This is a sample implementation of the frontend to expose the Beacon API implementation, but if you think that there's a missing feature or you find interesting to add a new one, create an issue to discuss it with the community.


### Project dependencies

The project includes two separated package.json files:

* /package.json at the root folder, handling the modules required for building the target source.
* /src/js/package.json, handling AngularJS dependencies and other javascript modules.

Please, take a look at it and review whether the dependencies and their corresponding versions fit into your development environment. If so, you can run ```npm install``` in both folders.

### Key files

First of all, you can make a copy of the **index.bea.docker.html** file (i.e. copy to index.bea.local.html). This file contains the references to the whole application and configurations required, so by creating new copies of the index file, you can start to build the frontend for whichever deployment environment you want.

The second important file is **js/app/config.beacon.docker.js**. Following the example above, you should copy it to **config.beacon.local.js**. Then, you can change the reference of this JS file into index.bea.local.html. so that:

```html
<script type="text/javascript" src="js/app/config.beacon.docker.js"></script>

```

Becomes:
```html
<script type="text/javascript" src="js/app/config.beacon.local.js"></script>
```

Now, you can open config.beacon.local.js with your preferred text editor and look at the 'Config' constant:

```json
{
    "application": "beacon",
    "loginType": "requester",
    "useMocks": false,
    "authenticate": true,
    "debug": true,
    "view_dir": "partials/",

    "API": {
        "protocol": "http",
        "host": "127.0.0.1",
        "port": "9075",
        "path": "/elixirbeacon/v03",
        "beacon": "/beacon",
        "info": ""
    },

    "loginState": "authz.panel",
    "loggedInState": "authz.panel",
    "forbiddenState": "authz.panel",

    "acl": {
        "enable": false,
        "defaultStateRoles": ["ROLE_ADMIN", "ROLE_REQUESTER"]
    },

}

```
Specifically, check the API part, this is where the beacon is configured to point to the beacon portal.  By setting this, the environment change is done. All the remaining configuration options are more angular-centric and will not be explained in detail, but if you want to perform some changes and need some help, please, don't hesitate to contact us.

### Build process

You can keep developing and running the application while browsing the index.beacon.docker.html file in a browser (having previously configured an http server that serves it). But when deploying, and in order to serve the fairly big amount of JS files that are involved in Angular and the Beacon, you may want to serve them with as less server hits as possible.

This is the purpose of two scripts placed into the /scripts/ folder: gulpfile.js and gulpbatch.js. Those are fairly standard build files developed using gulp. The main difference between them is that gulpfile.js is developed taking into account to build continuosly after any change in some key folders of the project, while gulpbatch.js is designed to work as a single batch build process, in environments like Jenkins or any other non-interactive build tool.

To use them, and after performing ```npm install``` from the project root folder, you can execute:

```bash
$ nodejs scripts/gulpfile.js --app=beacon --env=docker
```

Please note that nodejs may be named simply _node_ in your environment.

This will generate (among a fairly big amount of debug output) the folder build/beacon_docker/, that should contain:

```
.../beacon_docker/
.../beacon_docker/index.html
.../beacon_docker/js/app-{hash}.js
.../beacon_docker/js/templates.js
.../beacon_docker/img/...
.../beacon_docker/fonts/...
.../beacon_docker/css/combined-{hash}.css
```

Two things should be noted here:

* The script keeps running after having built the files. It's watching for changes in the source code: if you modify any file inside of the src/js/ folder, you'll notice that it builds again. If you don't want this behavior, you can use gulpbatch.js.
* The script accepts two configuration parameters. I you would like to define your own build environment and apps, you can check the content of the scripts/apps.js file, which contains the configuration for each available app and environment. Feel free to edit it for your own purposes.

### Execution

This repository already contains a sample Apache file placed at **conf/beacon_docker.conf** (which is already used into the Dockerfile).

All you need in order to run the beacon in an HTTP server is to point to the index.html file, and it seamlessly loads everything needed to run. So you can build the application in a specific environment and then deploy it into an external server.

In order to do so, the main requirement is to configure the endpoint of the beacon backend server, as explained above. As far as you are experienced on Docker/Docker-compose, you can tweak any of the components of the application stack.

