docker build -t wecom-callback -f Dockerfile --no-cache .
docker rm -f wecom
docker run -d -p 3009:3000 --restart=unless-stopped --env-file .env --name wecom wecom-callback:latest
docker image prune -f
