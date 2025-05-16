FROM nginx:latest

ARG WEB_PATH

COPY $WEB_PATH /usr/share/nginx/html
