FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3001

ENV CHOKIDAR_USEPOLLING=true

CMD ["sh", "-c", "if [ ! -d node_modules ]; then npm install --no-audit --no-fund; fi; npm run dev -- --host 0.0.0.0 --port 3001"]

