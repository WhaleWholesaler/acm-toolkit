FROM node:20-alpine
WORKDIR /app
COPY server.js .
ENV PORT=8787 DATA_DIR=/data
EXPOSE 8787
VOLUME ["/data"]
CMD ["node", "server.js"]
