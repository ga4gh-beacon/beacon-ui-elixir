# Elixir Beacon Web User Interface

This repository includes the source code for the web frontend of the Elixir Beacon backend, already published at the repository of the [Elixir hub's human-data-beacon](https://github.com/elixirhub/human-data-beacon). The frontend complies with the API specification v1.0.1.

This repository also contains the source code to build and run a _dockerized_ version of the front-end of the Elixir Beacon. A back-end is required to be running (on localhost:9075).

For conveniency, we provide a Makefile containing shorthands for the docker commands to execute.

	make build

The build process may take a while.

After the build has successfully finished, you can instanciate a container:

	make up

Now you should be able to point your browser to http://localhost:6080/ and use the beacon frontend. You can perform test searches from the sample dataset.

## Tear it down

	make down
