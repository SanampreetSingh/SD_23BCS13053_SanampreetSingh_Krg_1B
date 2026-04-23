# Use a lightweight Node.js environment
FROM node:20-alpine

# Install 'shadow' to manage groups and 'docker-cli' if you want 
# to run raw docker commands from inside for debugging
RUN apk add --no-cache shadow docker-cli

# Create the working directory
WORKDIR /app

# Copy dependency files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your source code
COPY . .

# EXPOSE is documentation that Nginx uses to find our port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]