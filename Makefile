SERVICE=beacon-ui

.PHONE: all build up down exec log

build:
	docker build -t elixir/$(SERVICE) .

up:
	docker run -d \
	       --name $(SERVICE) \
	       -p "6080:80" \
               elixir/$(SERVICE)

down:
	-docker kill $(SERVICE)
	docker rm $(SERVICE)

exec:
	@docker exec -it $(SERVICE) bash

log:
	@docker logs -f $(SERVICE)

