FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app

# Keep this image version aligned with @playwright/test in package.json.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]
