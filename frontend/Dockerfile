FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Next.js necesita esta URL al compilar el código que ejecutará el navegador.
ENV NEXT_PUBLIC_API_URL=http://localhost:3001/api
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
