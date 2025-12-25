FROM node:18-alpine

WORKDIR /app

# Install system dependencies for audio export
RUN apk add --no-cache \
    ffmpeg \
    fluidsynth \
    fluid-soundfont

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]

