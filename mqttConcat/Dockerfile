# Use official Node.js image as the base image
FROM node:16-slim

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Define environment variables (placeholders here, to be set via k3s or .env file)
ENV ISSUER=your-issuer
ENV TOKEN_ENDPOINT=your-token-endpoint
ENV CLIENT_ID=your-client-id
ENV OIDCPASSWORD=your-password
ENV OIDCUSERNAME=your-username

# Command to start the application
CMD ["node", "app.js"]
