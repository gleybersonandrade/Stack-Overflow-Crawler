# Stack Overflow Crawler

Stack Overflow crawler and code linter.

## Running

First, create the database with the model in DB folder, then run the following commands in order:

### Crawler

```
node crawler.js --language=<language> --sort=<newest,featured,frequent,votes,active> --init=<beginning page> --end=<final page> --size=<page size> --timeout=<timeout>
```

or

```
node crawler.js --url=<question url> --timeout=<timeout>
```

### Populate

```
node populate.js --language=<language>
```

## Auxiliar commands

Prepare database to receive data:

```
sudo docker run --name MySQL -e MYSQL_ROOT_PASSWORD=<password> -p 3306:3306 -d mysql:latest
docker exec -it MySQL bash
mysql -u root -p
ALTER USER root IDENTIFIED WITH mysql_native_password BY '<password>';
```