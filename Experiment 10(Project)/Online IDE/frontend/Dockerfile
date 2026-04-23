FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for better layer caching
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Run the build command (generates the /dist folder)
RUN npm run build

# STAGE 2: The "Delivery" Stage
# We use 'scratch' or 'alpine' because we don't need Node anymore.
# We just need a way to hold the files for the shared volume.
FROM alpine:latest

# Create the directory where the volume is mounted
WORKDIR /app/dist

# Copy the build output from the first stage
COPY --from=builder /app/dist .

# This container doesn't need to stay running. 
# Once it copies files to the volume, it can exit.
CMD ["echo", "Frontend build complete. Files are in the shared volume."]